// LlamaStudioAIService (spec §22). Same architecture rule as the learner-side
// LlamaAIService: deterministic engines/data decide WHAT, this decides HOW to
// talk about it — and every method has a working fallback with zero API key.
//
// Curriculum/Lesson Kit generation deliberately draws on the REAL, already-
// imported MOF content (test_questions/flashcards, 8 real exam topics) for
// its deterministic path rather than inventing placeholder text — the
// "AI proposal" is genuinely grounded even when Gemini is unavailable.

import { callGemini, matchesShape } from '../geminiClient.js';
import { retrieveKnowledge, getChunkSource, pickBestMatchingChunk, getCourseChunks } from '../knowledgeBase.js';
import { assembleRescueTrail, getConceptPair } from '../engines/rescueTrail.js';
import { AI_TASKS } from '../aiConfig.js';
import { validateCurriculumProposal, validateGoalOnlyCurriculumProposal, validateInterventionProposal, validateGeneratedQuestion, validateGeneratedFlashcard, validateGeneratedKnowledge } from '../aiValidation.js';
import { withGenerationCache, withCacheControl } from '../aiCache.js';

function studioCallGemini(systemInstruction, userMessage, task, db, timeoutMs) {
  return callGemini(systemInstruction, userMessage, { task, db, label: 'StudioAIService', timeoutMs });
}

// Finds a real approved source chunk for a topic (spec §8 — generated content
// must be grounded, never left with an empty citation list). Uses the same
// RAG retrieval as the learner chat over the already-approved knowledge base.
async function findSourceChunkForTopic(db, topic) {
  const bareTopic = topic.replace(/^\d+\.\s*/, '');
  const retrieved = await retrieveKnowledge(db, bareTopic, 1);
  if (retrieved.length === 0) return null;
  const doc = await getChunkSource(db, retrieved[0].document_id);
  return { chunkId: retrieved[0].chunk_id, sourceTitle: doc?.title || 'Giáo trình MOF', sourceVersion: '1.0' };
}

const STUDIO_PERSONALITY_RULES = `Bạn là "Llama" trong Llama Studio — trợ giảng AI cho trainer, không phải learner. Giọng điệu: nhẹ nhàng, thân thiện, thông minh, hơi tinh nghịch, trưởng thành hơn Llama học viên. Bạn hỗ trợ trainer, không đánh giá hay phán xét trainer.
Quy tắc bắt buộc:
- Chỉ tiếng Việt, câu 5-30 từ (trừ nội dung chuyên môn cần dài hơn).
- Tối đa 1 câu đùa mỗi tin nhắn, KHÔNG đùa trong nội dung pháp lý/bảo hiểm.
- KHÔNG thay đổi sự kiện/số liệu/pháp lý được cung cấp — chỉ đổi giọng văn.
- Không dùng quá nhiều emoji.`;

// ── Curriculum generation ───────────────────────────────────────────────

// The 8 real exam topics already in the DB, grouped into a sensible camp
// structure matching the spec's own example journey (Base Camp → Summit).
const DEFAULT_CAMP_GROUPING = [
  { title: 'Base Camp: Kiến thức chung về bảo hiểm', topics: ['1. Kiến thức chung & quản trị rủi ro', '3. Nguyên tắc & phân loại bảo hiểm'] },
  { title: 'Camp 1: Pháp luật kinh doanh bảo hiểm', topics: ['2. Thuật ngữ & chủ thể hợp đồng', '6. Hợp đồng bảo hiểm & pháp luật'] },
  { title: 'Camp 2: Sản phẩm bảo hiểm nhân thọ & sức khỏe', topics: ['4. Bảo hiểm nhân thọ cơ bản', '5. Bảo hiểm sức khỏe'] },
  { title: 'Camp 3: Quyền, nghĩa vụ & đạo đức hành nghề', topics: ['7. Đại lý, đạo đức, quyền & nghĩa vụ', '8. Tình huống tổng hợp'] }
];

/**
 * @param {import('sqlite').Database} db
 * @param {{ preferredCamps?: number, targetDurationMinutes?: number }} input
 */
export async function generateCurriculum(db, input = {}) {
  const { result, cached } = await withGenerationCache(
    db,
    { taskType: AI_TASKS.GENERATE_CURRICULUM, normalizedInput: JSON.stringify({ preferredCamps: input.preferredCamps || 4, targetDurationMinutes: input.targetDurationMinutes || null }), model: 'deterministic-build' },
    () => buildCurriculumProposal(db, input)
  );
  if (!cached) {
    const check = validateCurriculumProposal(result, result.lessons.flatMap((l) => l.sourceChunkIds));
    if (!check.valid) console.warn('generateCurriculum: proposal failed validation (kept anyway, deterministic build should never fail this):', check.errors);
  }
  return result;
}

async function buildCurriculumProposal(db, input = {}) {
  const grouping = DEFAULT_CAMP_GROUPING.slice(0, Math.max(1, Math.min(input.preferredCamps || 4, DEFAULT_CAMP_GROUPING.length)));
  // Fold any leftover topics into the last camp so nothing gets dropped if
  // preferredCamps < 4.
  if (grouping.length < DEFAULT_CAMP_GROUPING.length) {
    const covered = new Set(grouping.flatMap((g) => g.topics));
    const leftover = DEFAULT_CAMP_GROUPING.flatMap((g) => g.topics).filter((t) => !covered.has(t));
    grouping[grouping.length - 1] = { ...grouping[grouping.length - 1], topics: [...grouping[grouping.length - 1].topics, ...leftover] };
  }

  const camps = [];
  const lessons = [];
  let lessonId = 1;

  for (let campIndex = 0; campIndex < grouping.length; campIndex++) {
    const { title, topics } = grouping[campIndex];
    const camp = { id: campIndex + 1, title, orderIndex: campIndex };
    camps.push(camp);

    for (const topic of topics) {
      const questionCount = await db.get('SELECT COUNT(*) c FROM test_questions WHERE topic = ?', [topic]);
      const totalQuestionCount = await db.get('SELECT COUNT(*) c FROM test_questions');
      const examWeight = totalQuestionCount.c ? Math.round((questionCount.c / totalQuestionCount.c) * 100) / 100 : 0.1;
      const source = await findSourceChunkForTopic(db, topic);

      lessons.push({
        id: lessonId++,
        title: topic.replace(/^\d+\.\s*/, ''),
        description: `Nội dung trọng tâm về ${topic.replace(/^\d+\.\s*/, '').toLowerCase()}.`,
        campId: camp.id,
        learningOutcome: `Học viên hiểu và vận dụng được kiến thức về ${topic.replace(/^\d+\.\s*/, '').toLowerCase()}.`,
        skillIds: [campIndex + 1],
        prerequisiteLessonIds: campIndex > 0 && lessons.length > 0 ? [lessons[lessons.length - 1]?.id].filter(Boolean) : [],
        estimatedMinutes: 20,
        difficulty: 'Trung bình',
        recommendedActivities: ['micro-lesson', 'flashcard', 'mcq'],
        examWeight,
        sourceChunkIds: source ? [source.chunkId] : [],
        sourceTitle: source?.sourceTitle,
        sourceVersion: source?.sourceVersion,
        status: 'AI_DRAFT',
        topic
      });
    }
  }

  const competencies = grouping.map((g, i) => ({ id: i + 1, name: g.title.replace(/^(Base Camp|Camp \d+):\s*/, '') }));
  const skills = competencies.map((c) => ({ id: c.id, competencyId: c.id, name: c.name }));
  const learningOutcomes = lessons.map((l) => ({ id: l.id, skillId: l.skillIds[0], description: l.learningOutcome }));

  const proposal = {
    summary: `Khóa học được chia thành ${camps.length} camp dựa trên ${lessons.length} chủ đề trọng tâm của kỳ thi MOF.`,
    competencies, skills, learningOutcomes, camps, lessons
  };

  const raw = await studioCallGemini(
    STUDIO_PERSONALITY_RULES + '\nViết lại phần "summary" bằng giọng Llama Studio, giữ nguyên số camp/chặng, không thêm bớt thông tin. Chỉ trả về đoạn văn.',
    `Tóm tắt: ${proposal.summary}`,
    AI_TASKS.GENERATE_CURRICULUM, db
  );
  if (raw) proposal.summary = raw.trim();

  // Only cache a result that actually used AI — caching a fallback-only
  // attempt would lock in the fallback for this fingerprint even after a
  // transient Gemini failure clears up.
  return withCacheControl(proposal, !!raw);
}

// ── Course-specific curriculum generation, grounded in the trainer's own
// uploaded source material + stated goal — NOT the fixed 8-MOF-topic bank
// above. A source document isn't required: with no upload, Llama generates
// straight from the trainer's goal prompt using its own domain knowledge
// (generateCurriculumFromGoalOnly below); only when there's neither a
// document nor a prompt does this fall back to the deterministic MOF bank,
// so a course is never left with an empty roadmap.
/**
 * @param {import('sqlite').Database} db
 * @param {{ courseId: number, prompt?: string, preferredCamps?: number }} input
 * @returns {Promise<{ summary: string, camps: object[], lessons: object[], usedSource: 'bank'|'document'|'prompt' }>}
 */
export async function generateCurriculumFromPrompt(db, { courseId, prompt = '', preferredCamps = 4 }) {
  const chunks = await getCourseChunks(db, courseId);
  if (chunks.length === 0) {
    return generateCurriculumFromGoalOnly(db, { prompt, preferredCamps });
  }

  const sourceChunkIds = chunks.map((c) => c.id);
  const sourceText = chunks.map((c) => c.content).join('\n\n').slice(0, 8000);
  const grounding = `CHỈ dựa trên đoạn tài liệu bên dưới, TUYỆT ĐỐI không bịa thêm nội dung ngoài đoạn này.\n\nTài liệu:\n${sourceText}`;
  const goalLine = prompt?.trim()
    ? `Mục tiêu khóa học của trainer: "${prompt.trim()}"`
    : 'Trainer chưa mô tả mục tiêu cụ thể — hãy tự đề xuất một lộ trình hợp lý bao trùm toàn bộ tài liệu.';

  const raw = await studioCallGemini(
    STUDIO_PERSONALITY_RULES + '\nTrả lời DUY NHẤT bằng JSON: {"summary": string, "camps": [{"title": string}], "lessons": [{"title": string, "description": string, "campIndex": number, "estimatedMinutes": number, "difficulty": string, "learningOutcome": string}]}',
    `${grounding}\n\n${goalLine}\n\nDựa vào tài liệu và mục tiêu trên, đề xuất lộ trình gồm tối đa ${preferredCamps} camp (campIndex bắt đầu từ 0) và các chặng học (lesson) hợp lý trong mỗi camp. difficulty chỉ dùng "Dễ", "Trung bình" hoặc "Khó".`,
    AI_TASKS.GENERATE_CURRICULUM, db, 15000
  );

  let proposal = null;
  if (raw) {
    try {
      const parsed = JSON.parse(stripJsonFence(raw));
      if (matchesShape({ summary: 'string' }, parsed) && Array.isArray(parsed.camps) && Array.isArray(parsed.lessons)) {
        const camps = parsed.camps.map((c, i) => ({ id: i + 1, title: c.title, orderIndex: i }));
        const lessons = parsed.lessons.map((l, i) => {
          const camp = camps[l.campIndex] || camps[0];
          return {
            id: i + 1,
            title: l.title,
            description: l.description || '',
            campId: camp?.id,
            learningOutcome: l.learningOutcome || `Học viên hiểu và vận dụng được kiến thức về ${(l.title || '').toLowerCase()}.`,
            skillIds: camp ? [camp.id] : [],
            prerequisiteLessonIds: [],
            estimatedMinutes: typeof l.estimatedMinutes === 'number' && l.estimatedMinutes > 0 ? l.estimatedMinutes : 20,
            difficulty: ['Dễ', 'Trung bình', 'Khó'].includes(l.difficulty) ? l.difficulty : 'Trung bình',
            recommendedActivities: ['micro-lesson', 'flashcard', 'mcq'],
            examWeight: parsed.lessons.length ? Math.round((1 / parsed.lessons.length) * 100) / 100 : 0.1,
            sourceChunkIds,
            sourceTitle: 'Tài liệu trainer tải lên',
            sourceVersion: '1.0',
            status: 'AI_DRAFT'
          };
        });
        proposal = { summary: parsed.summary, camps, lessons };
      }
    } catch (err) { /* falls through to the deterministic chunk-bucket fallback below */ }
  }

  if (proposal) {
    const check = validateCurriculumProposal(proposal, sourceChunkIds);
    if (!check.valid) {
      console.warn('generateCurriculumFromPrompt: AI proposal failed validation, using chunk-bucket fallback:', check.errors);
      proposal = null;
    }
  }

  if (!proposal) proposal = buildChunkBucketProposal(chunks, preferredCamps);

  return { ...proposal, usedSource: 'document' };
}

// No source document uploaded for this course — generate the roadmap from
// the trainer's goal prompt alone, using Gemini's own insurance-domain
// knowledge (no chunks to cite, so this is validated with the lighter
// validateGoalOnlyCurriculumProposal instead of the citation-requiring one
// above). Falls back to the deterministic MOF bank only if there's no usable
// prompt either, or the AI call/response fails — never left empty.
async function generateCurriculumFromGoalOnly(db, { prompt = '', preferredCamps = 4 }) {
  if (!prompt?.trim()) {
    return { ...(await generateCurriculum(db, { preferredCamps })), usedSource: 'bank' };
  }

  const raw = await studioCallGemini(
    STUDIO_PERSONALITY_RULES + '\nTrả lời DUY NHẤT bằng JSON: {"summary": string, "camps": [{"title": string}], "lessons": [{"title": string, "description": string, "campIndex": number, "estimatedMinutes": number, "difficulty": string, "learningOutcome": string}]}',
    `Trainer chưa tải tài liệu nguồn nào cho khóa học này. Mục tiêu khóa học: "${prompt.trim()}"\n\nDựa vào kiến thức chuyên môn bảo hiểm của bạn và mục tiêu trên, đề xuất lộ trình gồm tối đa ${preferredCamps} camp (campIndex bắt đầu từ 0) và các chặng học (lesson) hợp lý trong mỗi camp. difficulty chỉ dùng "Dễ", "Trung bình" hoặc "Khó".`,
    AI_TASKS.GENERATE_CURRICULUM, db, 15000
  );

  let proposal = null;
  if (raw) {
    try {
      const parsed = JSON.parse(stripJsonFence(raw));
      if (matchesShape({ summary: 'string' }, parsed) && Array.isArray(parsed.camps) && Array.isArray(parsed.lessons)) {
        const camps = parsed.camps.map((c, i) => ({ id: i + 1, title: c.title, orderIndex: i }));
        const lessons = parsed.lessons.map((l, i) => {
          const camp = camps[l.campIndex] || camps[0];
          return {
            id: i + 1,
            title: l.title,
            description: l.description || '',
            campId: camp?.id,
            learningOutcome: l.learningOutcome || `Học viên hiểu và vận dụng được kiến thức về ${(l.title || '').toLowerCase()}.`,
            skillIds: camp ? [camp.id] : [],
            prerequisiteLessonIds: [],
            estimatedMinutes: typeof l.estimatedMinutes === 'number' && l.estimatedMinutes > 0 ? l.estimatedMinutes : 20,
            difficulty: ['Dễ', 'Trung bình', 'Khó'].includes(l.difficulty) ? l.difficulty : 'Trung bình',
            recommendedActivities: ['micro-lesson', 'flashcard', 'mcq'],
            examWeight: parsed.lessons.length ? Math.round((1 / parsed.lessons.length) * 100) / 100 : 0.1,
            sourceChunkIds: [],
            sourceTitle: 'Do Llama đề xuất dựa trên mục tiêu khóa học (chưa có tài liệu nguồn)',
            sourceVersion: '1.0',
            status: 'AI_DRAFT'
          };
        });
        proposal = { summary: parsed.summary, camps, lessons };
      }
    } catch (err) { /* falls through to the MOF-bank fallback below */ }
  }

  if (proposal) {
    const check = validateGoalOnlyCurriculumProposal(proposal);
    if (!check.valid) {
      console.warn('generateCurriculumFromGoalOnly: AI proposal failed validation, using MOF-bank fallback:', check.errors);
      proposal = null;
    }
  }

  if (!proposal) return { ...(await generateCurriculum(db, { preferredCamps })), usedSource: 'bank' };

  return { ...proposal, usedSource: 'prompt' };
}

// Zero-AI fallback for prompt+document generation — buckets the trainer's
// own approved chunks into camps/lessons directly, so there's always a
// working, genuinely-grounded (never fabricated) result even with no API
// key or an invalid AI response. Titles are stubbed from the chunk text;
// the trainer is expected to rename them via the new camp/lesson edit UI.
function buildChunkBucketProposal(chunks, preferredCamps) {
  const campCount = Math.max(1, Math.min(preferredCamps, chunks.length));
  const perCamp = Math.ceil(chunks.length / campCount);
  const camps = [];
  const lessons = [];
  let lessonId = 1;
  for (let i = 0; i < campCount; i++) {
    const campChunks = chunks.slice(i * perCamp, (i + 1) * perCamp);
    if (campChunks.length === 0) continue;
    const camp = { id: camps.length + 1, title: `Phần ${camps.length + 1}`, orderIndex: camps.length };
    camps.push(camp);
    for (const chunk of campChunks) {
      const stub = chunk.content.replace(/\s+/g, ' ').trim().slice(0, 50);
      lessons.push({
        id: lessonId++,
        title: stub + (chunk.content.length > 50 ? '…' : ''),
        description: chunk.content.slice(0, 200),
        campId: camp.id,
        learningOutcome: `Học viên nắm được nội dung: ${stub}`,
        skillIds: [camp.id],
        prerequisiteLessonIds: [],
        estimatedMinutes: 15,
        difficulty: 'Trung bình',
        recommendedActivities: ['micro-lesson', 'flashcard', 'mcq'],
        examWeight: 0.1,
        sourceChunkIds: [chunk.id],
        sourceTitle: 'Tài liệu trainer tải lên',
        sourceVersion: '1.0',
        status: 'AI_DRAFT'
      });
    }
  }
  return {
    summary: `Llama đã chia tài liệu bạn tải lên thành ${camps.length} camp và ${lessons.length} chặng học — hãy đổi tên lại cho phù hợp nhé!`,
    camps, lessons
  };
}

// ── Lesson Kit generation — pulls REAL content for the lesson's mapped topic ──
// AI usage audit: deliberately makes ZERO Gemini calls. Flashcards/questions
// are pulled from the trainer-approved exam bank rather than AI-generated —
// fabricating new insurance-exam questions carries real legal/accuracy risk
// that a same-shot AI call can't safely absorb, and the existing bank is
// already higher-quality and already approved. The microLesson/memoryTips
// copy is template text, not a separate AI call, per "do not add AI merely
// to make the product appear more AI-powered" — template copy already reads
// fine and errors here would only be a style nit, not worth the API cost.

/**
 * @param {import('sqlite').Database} db
 * @param {{ topic: string, lessonTitle: string }} input
 */
export async function generateLessonKit(db, { topic, lessonTitle }) {
  const flashcards = await db.all('SELECT * FROM flashcards WHERE topic = ? ORDER BY RANDOM() LIMIT 5', [topic]);
  const easy = await db.all(`SELECT * FROM test_questions WHERE topic = ? AND difficulty = 'Dễ' ORDER BY RANDOM() LIMIT 2`, [topic]);
  const medium = await db.all(`SELECT * FROM test_questions WHERE topic = ? AND difficulty = 'Trung bình' ORDER BY RANDOM() LIMIT 2`, [topic]);
  const hard = await db.all(`SELECT * FROM test_questions WHERE topic = ? AND difficulty = 'Khó' ORDER BY RANDOM() LIMIT 2`, [topic]);
  const scenario = await db.get(`SELECT * FROM test_questions WHERE topic = ? AND question LIKE '%Tình huống%' ORDER BY RANDOM() LIMIT 1`, [topic]);
  const checkpoint = await db.get(`SELECT * FROM test_questions WHERE topic = ? ORDER BY RANDOM() LIMIT 1`, [topic]);
  const source = await findSourceChunkForTopic(db, topic);
  const sourceChunkIds = source ? [source.chunkId] : [];

  // Every question already carries its own real citation (test_questions.source,
  // e.g. "Giáo trình đại lý bảo hiểm cơ bản... - Viện Phát triển bảo hiểm Việt Nam"),
  // which is more specific than the generic RAG document title — prefer it.
  const formatQ = (q, cognitiveLevel) => q && {
    questionText: q.question,
    options: [q.optA, q.optB, q.optC, q.optD].filter(Boolean),
    correctOption: ['A', 'B', 'C', 'D'].indexOf(q.answer),
    explanation: q.explanation,
    difficulty: q.difficulty,
    cognitiveLevel,
    sourceChunkIds,
    sourceTitle: q.source || source?.sourceTitle || 'Giáo trình MOF',
    sourceVersion: source?.sourceVersion || '1.0',
    expectedResponseTimeMs: 45000
  };

  const microLesson = `Nội dung cốt lõi của "${lessonTitle}": ${flashcards[0]?.back || flashcards[0]?.front || 'Xem chi tiết trong tài liệu đã duyệt.'}`;

  const kit = {
    microLesson,
    flashcards: flashcards.map((f) => ({ front: f.front, back: f.back, keyword: f.keyword, sourceChunkIds, sourceTitle: source?.sourceTitle || 'Giáo trình MOF', sourceVersion: source?.sourceVersion || '1.0' })),
    easyQuestions: easy.map((q) => formatQ(q, 'Ghi nhớ')),
    mediumQuestions: medium.map((q) => formatQ(q, 'Hiểu')),
    hardQuestions: hard.map((q) => formatQ(q, 'Phân tích')),
    scenario: scenario ? formatQ(scenario, 'Vận dụng') : null,
    checkpoint: checkpoint ? formatQ(checkpoint, 'Hiểu') : null,
    memoryTips: flashcards.slice(0, 2).map((f) => `Ghi nhớ "${f.keyword || f.front}" bằng cách liên hệ tình huống thực tế.`)
  };

  return kit;
}

// ── Document-grounded generation — the trainer's own uploaded giáo án ──
// Unlike generateLessonKit above (zero AI calls, samples the pre-approved
// exam bank), this makes REAL Gemini calls — but only ever against a
// specific document the trainer uploaded and approved themselves, with
// every prompt instructed to use nothing but that text. Every result lands
// as an AI_DRAFT studio_content_item, going through the exact same
// approve/edit/reject review queue as everything else — nothing here is
// ever auto-approved or auto-published (see routes.js's publish bridge,
// which only ever touches APPROVED items).
function stripJsonFence(raw) {
  return raw.replace(/```json|```/g, '').trim();
}

/**
 * @param {import('sqlite').Database} db
 * @param {{ lessonId: number, documentId: number, documentTitle: string }} input
 */
export async function generateContentFromDocument(db, { lessonId, documentId, documentTitle }) {
  const chunks = await db.all('SELECT * FROM knowledge_chunks WHERE document_id = ? ORDER BY chunk_index', [documentId]);
  if (chunks.length === 0) throw new Error('Tài liệu chưa có nội dung để tạo.');

  const sourceChunkIds = chunks.map((c) => c.id);
  // Bounded window rather than the whole document — keeps the prompt a
  // reasonable size regardless of how long the uploaded file is.
  const sourceText = chunks.map((c) => c.content).join('\n\n').slice(0, 6000);
  const grounding = `CHỈ dựa trên đoạn tài liệu bên dưới, TUYỆT ĐỐI không bịa thêm nội dung/số liệu/pháp lý ngoài đoạn này.\n\nTài liệu:\n${sourceText}`;

  let knowledge = null;
  const knowledgeRaw = await studioCallGemini(
    STUDIO_PERSONALITY_RULES + '\nTrả lời DUY NHẤT bằng JSON: {"title": string, "body": string}',
    `${grounding}\n\nTóm tắt đoạn tài liệu trên thành một khối kiến thức cốt lõi (3-6 câu) cho học viên ôn tập, kèm tiêu đề ngắn.`,
    AI_TASKS.GENERATE_KNOWLEDGE_SUMMARY, db
  );
  if (knowledgeRaw) {
    try {
      const parsed = JSON.parse(stripJsonFence(knowledgeRaw));
      if (matchesShape({ title: 'string', body: 'string' }, parsed) && validateGeneratedKnowledge(parsed).valid) knowledge = parsed;
    } catch (err) { /* skip — no knowledge block this round */ }
  }

  let flashcards = [];
  const flashcardsRaw = await studioCallGemini(
    STUDIO_PERSONALITY_RULES + '\nTrả lời DUY NHẤT bằng JSON: {"flashcards": [{"front": string, "back": string, "keyword": string}]}',
    `${grounding}\n\nTạo 3-5 flashcard (mặt trước là thuật ngữ/câu hỏi ngắn, mặt sau là câu trả lời) từ đoạn tài liệu trên.`,
    AI_TASKS.GENERATE_FLASHCARDS, db
  );
  if (flashcardsRaw) {
    try {
      const parsed = JSON.parse(stripJsonFence(flashcardsRaw));
      if (Array.isArray(parsed.flashcards)) flashcards = parsed.flashcards.filter((f) => validateGeneratedFlashcard(f).valid);
    } catch (err) { /* skip */ }
  }

  let mcqs = [];
  const mcqRaw = await studioCallGemini(
    STUDIO_PERSONALITY_RULES + '\nTrả lời DUY NHẤT bằng JSON: {"questions": [{"questionText": string, "options": [string, string, string, string], "correctOption": number, "explanation": string}]}',
    `${grounding}\n\nTạo 2-3 câu hỏi trắc nghiệm 4 đáp án (correctOption là chỉ số 0-3) từ đoạn tài liệu trên, chỉ dùng thông tin có trong tài liệu.`,
    AI_TASKS.GENERATE_MCQ_FROM_SOURCE, db, 12000
  );
  if (mcqRaw) {
    try {
      const parsed = JSON.parse(stripJsonFence(mcqRaw));
      if (Array.isArray(parsed.questions)) mcqs = parsed.questions.filter((q) => validateGeneratedQuestion(q).valid);
    } catch (err) { /* skip */ }
  }

  let scenario = null;
  const scenarioRaw = await studioCallGemini(
    STUDIO_PERSONALITY_RULES + '\nTrả lời DUY NHẤT bằng JSON: {"questionText": string, "options": [string, string, string, string], "correctOption": number, "explanation": string}',
    `${grounding}\n\nTạo MỘT câu hỏi tình huống thực tế (áp dụng kiến thức) 4 đáp án từ đoạn tài liệu trên.`,
    AI_TASKS.GENERATE_COMPLEX_SCENARIO, db, 12000
  );
  if (scenarioRaw) {
    try {
      const parsed = JSON.parse(stripJsonFence(scenarioRaw));
      if (validateGeneratedQuestion(parsed).valid) scenario = parsed;
    } catch (err) { /* skip */ }
  }

  const insertItem = (type, fields, title) => db.run(
    `INSERT INTO studio_content_items
       (lesson_id, content_type, title, question_text, options, correct_option, explanation, difficulty, cognitive_level, front, back, keyword, source_chunk_ids, source_title, source_version, status, ai_generated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AI_DRAFT', 1)`,
    [lessonId, type, title || null, fields.questionText || null, JSON.stringify(fields.options || []), fields.correctOption ?? null,
      fields.explanation || null, 'Trung bình', 'Hiểu', fields.front || null, fields.back || null, fields.keyword || null,
      JSON.stringify(sourceChunkIds), documentTitle || 'Tài liệu tải lên', '1.0']
  );

  if (knowledge) await insertItem('knowledge', { questionText: knowledge.body }, knowledge.title);
  for (const f of flashcards) await insertItem('flashcard', f);
  for (const q of mcqs) await insertItem('mcq', q);
  if (scenario) await insertItem('scenario', scenario);

  return {
    itemCount: (knowledge ? 1 : 0) + flashcards.length + mcqs.length + (scenario ? 1 : 0),
    generatedKnowledge: !!knowledge, generatedFlashcards: flashcards.length, generatedQuestions: mcqs.length, generatedScenario: !!scenario
  };
}

// ── Explanations, fixes, rewrites (LLM-assisted, deterministic fallback) ──

export async function explainCurriculumDecision({ lessonTitle, campTitle, prerequisiteTitle, examWeight }, db) {
  const fallback = prerequisiteTitle
    ? `"${lessonTitle}" nằm trong ${campTitle} vì cần hoàn thành "${prerequisiteTitle}" trước, và chiếm khoảng ${Math.round((examWeight || 0.1) * 100)}% trọng số đề thi.`
    : `"${lessonTitle}" được xếp vào ${campTitle} vì đây là nền tảng cần học trước, chiếm khoảng ${Math.round((examWeight || 0.1) * 100)}% trọng số đề thi.`;
  const raw = await studioCallGemini(STUDIO_PERSONALITY_RULES, `Giải thích ngắn gọn bằng giọng Llama Studio vì sao lại sắp xếp như sau (giữ nguyên sự kiện): ${fallback}`, AI_TASKS.EXPLAIN_METRIC, db);
  return { explanation: raw?.trim() || fallback };
}

// Routes simple wording fixes to the light model and structurally-significant
// ones (BLOCKER/WARNING — missing outcomes, missing sources, etc.) to the
// main model, per audit §2.3's complexity split.
export async function suggestQualityFix(issue, db) {
  const FIX_TEMPLATES = {
    COVERAGE: 'Thêm câu hỏi hoặc tình huống để kiểm tra mục tiêu học tập này.',
    ASSESSMENT: 'Thêm câu hỏi tình huống hoặc vận dụng để cân bằng lại bộ câu hỏi.',
    EXPERIENCE: 'Chia nhỏ chặng học hoặc thêm hoạt động ôn tập ngắt quãng.',
    GOVERNANCE: 'Duyệt lại nội dung AI Draft hoặc cập nhật phiên bản nguồn tài liệu.'
  };
  const fallback = FIX_TEMPLATES[issue.category] || 'Xem lại nội dung này cùng Llama.';
  const task = ['BLOCKER', 'WARNING'].includes(issue.severity) ? AI_TASKS.SUGGEST_COMPLEX_QUALITY_FIX : AI_TASKS.EXPLAIN_METRIC;
  const raw = await studioCallGemini(STUDIO_PERSONALITY_RULES, `Vấn đề: "${issue.message}". Đề xuất 1 câu ngắn gọn cách khắc phục, giữ nguyên bản chất vấn đề: ${fallback}`, task, db);
  return { suggestion: raw?.trim() || fallback };
}

export async function suggestQuestionRewrite({ questionText, flags = [] }, db) {
  let fallback = questionText;
  if (flags.includes('WORDING_TOO_LONG')) fallback = questionText.split('.')[0] + '?';
  else if (flags.includes('NEGATIVE_WORDING_RISK')) fallback = questionText.replace(/không đúng|KHÔNG đúng/gi, 'sai');
  else fallback = questionText;
  const raw = await studioCallGemini(
    STUDIO_PERSONALITY_RULES + '\nKHÔNG được đổi ý nghĩa pháp lý của câu hỏi, chỉ diễn đạt lại cho rõ ràng hơn.',
    `Viết lại câu hỏi sau cho rõ ràng, ngắn gọn hơn, giữ nguyên đáp án đúng: "${questionText}"`,
    AI_TASKS.REWRITE_QUESTION, db
  );
  return { rewrittenText: raw?.trim() || fallback };
}

// ── Intervention (Rescue Expedition) — reuses the learner-side Rescue Trail engine ──

export async function generateIntervention(db, { topic, mistakeType, learnerCount, durationMinutes = 10 }) {
  const { result } = await withGenerationCache(
    db,
    { taskType: AI_TASKS.GENERATE_RESCUE_EXPEDITION, normalizedInput: JSON.stringify({ topic, mistakeType, durationMinutes }) },
    () => buildInterventionProposal(db, { topic, mistakeType, learnerCount, durationMinutes })
  );
  const check = validateInterventionProposal(result);
  if (!check.valid) console.warn('generateIntervention: proposal failed validation:', check.errors);
  return result;
}

async function buildInterventionProposal(db, { topic, mistakeType, learnerCount, durationMinutes = 10 }) {
  const trail = await assembleRescueTrail(db, { topic, mistakeType });
  const conceptPair = trail.conceptPair || getConceptPair(topic);
  const title = conceptPair ? `${conceptPair.left.name} và ${conceptPair.right.name} — ai chịu trách nhiệm?` : `Chặng cứu hộ: ${topic.replace(/^\d+\.\s*/, '')}`;

  const fallback = {
    title,
    trainerSummary: `${learnerCount} học viên đang nhầm lẫn ở "${topic.replace(/^\d+\.\s*/, '')}" với lỗi kiểu "${mistakeType}". Llama đề xuất một chặng cứu hộ ${durationMinutes} phút.`,
    learnerIntroduction: 'Có vẻ hai khái niệm này đang mặc nhầm áo. Llama đổi lại giúp bạn nhé.',
    successCriteria: 'Học viên trả lời đúng câu checkpoint và phân biệt được hai khái niệm dễ nhầm.'
  };

  // Note: only aggregated learner count + mistake type + topic go to the
  // model — never individual learner names/IDs (audit §12).
  const raw = await studioCallGemini(
    STUDIO_PERSONALITY_RULES + '\nTrả lời DUY NHẤT bằng JSON: {"trainerSummary": string, "learnerIntroduction": string}',
    `Tạo tóm tắt cho trainer và lời giới thiệu cho học viên về chặng cứu hộ "${title}", chủ đề "${topic}", ${learnerCount} học viên bị ảnh hưởng, thời lượng ${durationMinutes} phút.`,
    AI_TASKS.GENERATE_RESCUE_EXPEDITION, db
  );
  let trainerSummary = fallback.trainerSummary;
  let learnerIntroduction = fallback.learnerIntroduction;
  if (raw) {
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      if (matchesShape({ trainerSummary: 'string', learnerIntroduction: 'string' }, parsed)) {
        ({ trainerSummary, learnerIntroduction } = parsed);
      }
    } catch (err) { /* keep fallback */ }
  }

  return withCacheControl({
    title,
    trainerSummary,
    learnerIntroduction,
    conceptComparison: conceptPair,
    flashcard: trail.flashcard,
    easierQuestion: trail.easierQuestion,
    similarQuestion: trail.similarQuestion,
    scenarioQuestion: trail.checkpointQuestion,
    checkpoint: trail.checkpointQuestion,
    durationMinutes,
    successCriteria: fallback.successCriteria
  }, !!raw);
}

// ── Insight summaries ─────────────────────────────────────────────────────

export async function summarizeMockExamInsight({ averageScore, changeFromPrevious, weakestTopic, passRate }, db) {
  const changeText = changeFromPrevious ? (changeFromPrevious > 0 ? `tăng ${changeFromPrevious} điểm` : `giảm ${Math.abs(changeFromPrevious)} điểm`) : null;
  const fallback = `Điểm trung bình cả lớp là ${averageScore}, tỷ lệ đạt ngưỡng khoảng ${passRate}%.${changeText ? ` So với lần trước, điểm ${changeText}.` : ''}${weakestTopic ? ` Phần "${weakestTopic}" vẫn còn vài tảng đá trơn.` : ''}`;
  const raw = await studioCallGemini(STUDIO_PERSONALITY_RULES, `Viết lại nhận xét sau bằng giọng Llama Studio, giữ nguyên số liệu: "${fallback}"`, AI_TASKS.SUMMARIZE_INSIGHT, db);
  return { summary: raw?.trim() || fallback };
}

export async function summarizeLearnerInsight({ learnerName, latestScore, trend, weakestTopic, commonMistakeType }, db) {
  const trendText = { improving: 'đang cải thiện dần', declining: 'đang giảm dần', plateauing: 'đang chững lại', high_stable: 'ổn định ở mức cao', inconsistent: 'chưa ổn định', insufficient_data: 'chưa đủ dữ liệu' }[trend] || 'chưa đủ dữ liệu';
  const fallback = `${learnerName} có điểm gần nhất là ${latestScore}, xu hướng ${trendText}.${weakestTopic ? ` Phần yếu nhất là "${weakestTopic}"${commonMistakeType ? `, lỗi thường gặp: ${commonMistakeType}` : ''}.` : ''}`;
  const raw = await studioCallGemini(STUDIO_PERSONALITY_RULES, `Viết lại nhận xét sau bằng giọng Llama Studio, giữ nguyên số liệu: "${fallback}"`, AI_TASKS.SUMMARIZE_INSIGHT, db);
  return { summary: raw?.trim() || fallback };
}

// ── Trainer Copilot — grounded Q&A reusing the same RAG retrieval ─────────

export async function answerTrainerQuestion(db, { message, context = {} }) {
  const retrievalQuery = context.topic ? `${message} ${context.topic}` : message;
  const retrieved = await retrieveKnowledge(db, retrievalQuery, 6);
  const bestMatch = pickBestMatchingChunk(retrieved, message);

  const MIN_RELEVANCE = 0.25;
  if (retrieved.length === 0 || !bestMatch || bestMatch.score < MIN_RELEVANCE) {
    return {
      answer: 'Llama chưa có đủ tài liệu đã duyệt để trả lời chắc chắn câu này.',
      sources: [],
      grounded: false
    };
  }

  const sources = [];
  for (const r of retrieved) {
    const doc = await getChunkSource(db, r.document_id);
    if (doc && !sources.some((s) => s.documentId === doc.id)) sources.push({ documentId: doc.id, title: doc.title, updatedAt: doc.created_at });
  }

  const contextBlock = retrieved.map((r, i) => `[Đoạn ${i + 1}] ${r.content}`).join('\n\n');
  // Always TRAINER_COPILOT_SIMPLE: this path only answers grounded questions
  // from existing sources, never triggers generation — TRAINER_COPILOT_COMPLEX
  // would apply if the Copilot grows an actual "generate X from this chat"
  // action, which it doesn't have yet (it can only answer, never write data).
  const raw = await studioCallGemini(
    `${STUDIO_PERSONALITY_RULES}\nBạn trả lời câu hỏi của TRAINER (không phải học viên) CHỈ dựa trên tài liệu đã duyệt bên dưới. Không bịa thông tin.\n\n${contextBlock}`,
    message,
    AI_TASKS.TRAINER_COPILOT_SIMPLE, db
  );
  if (raw) return { answer: raw.trim(), sources, grounded: true };

  const best = bestMatch.chunk.content;
  const answerMatch = best.match(/Trả lời:\s*(.+)$/s);
  return { answer: answerMatch ? answerMatch[1].trim() : best, sources, grounded: true };
}
