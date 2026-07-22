// LlamaStudioAIService (spec §22). Same architecture rule as the learner-side
// LlamaAIService: deterministic engines/data decide WHAT, this decides HOW to
// talk about it — and every method has a working fallback with zero API key.
//
// Curriculum/Lesson Kit generation deliberately draws on the REAL, already-
// imported MOF content (test_questions/flashcards, 8 real exam topics) for
// its deterministic path rather than inventing placeholder text — the
// "AI proposal" is genuinely grounded even when Gemini is unavailable.

import { callGemini, matchesShape } from '../geminiClient.js';
import { retrieveKnowledge, getChunkSource, pickBestMatchingChunk, getCourseChunks, getCourseDocumentMap, getChunksByIds } from '../knowledgeBase.js';
import { assembleRescueTrail, getConceptPair } from '../engines/rescueTrail.js';
import { AI_TASKS } from '../aiConfig.js';
import {
  validateCurriculumProposal, validateInterventionProposal, validateGeneratedQuestion, validateGeneratedFlashcard, validateGeneratedKnowledge,
  validateCourseBlueprint, validateLessonTitle, sanitizeLessonTitle, validateCourseInput, FLASHCARD_TYPES
} from '../aiValidation.js';
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
    AI_TASKS.GENERATE_CURRICULUM, db, 45000
  );
  if (raw) proposal.summary = raw.trim();

  // Only cache a result that actually used AI — caching a fallback-only
  // attempt would lock in the fallback for this fingerprint even after a
  // transient Gemini failure clears up.
  return withCacheControl(proposal, !!raw);
}

// ── Course Blueprint generation — structure only, one Gemini call ──────────
// Replaces the old generateCurriculumFromPrompt/GoalOnly + per-lesson-per-
// chunk bucketing. That pipeline resent every chunk's full text on every
// call and had no cap on camps/lessons-per-camp, which is how a 40-chunk
// upload turned into 40 disorganized, wildly-uneven-granularity lessons with
// titles lifted verbatim from mid-sentence. This version:
//   1. Grounds itself in the course's compact document map (short previews,
//      real chunk ids) instead of raw chunk text — one call, not resent per
//      lesson later.
//   2. Asks for a Blueprint ONLY: title/outcomes/camps/lessons — never
//      lesson content, quizzes, or flashcards (those stay a separate,
//      per-lesson, on-demand generation in routes.js's kit/generate).
//   3. Enforces (then validates) max 6 camps and 2-5 lessons/camp.
//   4. Every lesson title is sanitized and validated against the title
//      rules (4-12 words, <=80 chars, no ellipsis, not a classroom
//      instruction, not lifted verbatim from source) before it ever reaches
//      a trainer.
// Nothing here is persisted — routes.js's blueprint/confirm route does that
// only once the trainer has reviewed the preview.
/**
 * @param {import('sqlite').Database} db
 * @param {{ courseId: number, courseTitle?: string, prompt?: string, preferredCamps?: number }} input
 * @returns {Promise<{ title: string, outcomes: string[], camps: {title:string}[], lessons: object[], usedSource: 'bank'|'document'|'prompt', usedAI: boolean }>}
 */
export async function generateCourseBlueprint(db, { courseId, courseTitle = '', prompt = '', preferredCamps = 4 }) {
  const cappedCamps = Math.max(1, Math.min(preferredCamps || 4, MAX_BLUEPRINT_CAMPS));
  const docMap = await getCourseDocumentMap(db, courseId);
  const approvedChunkIds = docMap.map((e) => e.chunkId);

  // Never call Gemini on a request too vague to ground a real curriculum in —
  // "Tạo khóa học" with no document produces a random/generic course no
  // matter how the prompt below is engineered; reject before spending a call.
  const inputCheck = validateCourseInput({ hasReadableDocument: docMap.length > 0, description: prompt });
  if (!inputCheck.valid) {
    const err = new Error(inputCheck.errors[0]);
    err.code = 'VAGUE_INPUT';
    throw err;
  }

  if (docMap.length === 0) return generateBlueprintFromGoalOnly(db, { courseTitle, prompt, preferredCamps: cappedCamps });

  const mapText = docMap.map((e) => `[chunk ${e.chunkId}] ${e.preview}`).join('\n');
  const goalLine = prompt?.trim()
    ? `Mục tiêu khóa học của trainer: "${prompt.trim()}"`
    : 'Trainer chưa mô tả mục tiêu cụ thể — hãy tự đề xuất một lộ trình hợp lý bao trùm toàn bộ tài liệu.';

  const { result } = await withGenerationCache(
    db,
    { taskType: AI_TASKS.GENERATE_CURRICULUM, sourceChunkIds: approvedChunkIds, normalizedInput: JSON.stringify({ prompt: prompt?.trim() || '', preferredCamps: cappedCamps }), model: 'blueprint' },
    async () => {
      const raw = await studioCallGemini(
        STUDIO_PERSONALITY_RULES + '\n' + BLUEPRINT_JSON_SHAPE,
        `Đây là bản đồ rút gọn tài liệu khóa học (mỗi dòng một đoạn, đánh số [chunk N]):\n${mapText}\n\n${goalLine}\n\n${BLUEPRINT_INSTRUCTIONS(cappedCamps)}`,
        AI_TASKS.GENERATE_CURRICULUM, db, 45000
      );
      const blueprint = parseAndRepairBlueprint(raw, courseTitle, approvedChunkIds);
      return withCacheControl({ blueprint, usedAI: !!blueprint }, !!blueprint);
    }
  );

  const blueprint = result.blueprint || buildBlueprintBucketFallback(courseTitle, docMap, cappedCamps);
  return { ...blueprint, usedSource: 'document', usedAI: result.usedAI };
}

// No source document uploaded for this course — generate the blueprint from
// the trainer's goal prompt alone, using Gemini's own insurance-domain
// knowledge (no chunks to cite, so sourceChunkIds stay empty throughout).
// Only ever called once generateCourseBlueprint's validateCourseInput guard
// has confirmed the prompt is a real, non-vague description — falls back to
// the deterministic MOF bank only if the AI call/response itself fails.
async function generateBlueprintFromGoalOnly(db, { courseTitle = '', prompt = '', preferredCamps = 4 }) {
  const raw = await studioCallGemini(
    STUDIO_PERSONALITY_RULES + '\n' + BLUEPRINT_JSON_SHAPE,
    `Trainer chưa tải tài liệu nguồn nào cho khóa học này. Mục tiêu khóa học: "${prompt.trim()}"\n\nDựa vào kiến thức chuyên môn bảo hiểm của bạn và mục tiêu trên, ${BLUEPRINT_INSTRUCTIONS(preferredCamps)}`,
    AI_TASKS.GENERATE_CURRICULUM, db, 45000
  );
  const blueprint = parseAndRepairBlueprint(raw, courseTitle, []);
  if (blueprint) return { ...blueprint, usedSource: 'prompt', usedAI: true };

  return { ...adaptLegacyCurriculumToBlueprint(await generateCurriculum(db, { preferredCamps }), courseTitle), usedSource: 'bank', usedAI: false };
}

const MAX_BLUEPRINT_CAMPS = 6;
const BLUEPRINT_JSON_SHAPE = 'Trả lời DUY NHẤT bằng JSON: {"title": string, "outcomes": [string], "camps": [{"title": string}], "lessons": [{"title": string, "summary": string, "learningOutcome": string, "campIndex": number, "estimatedMinutes": number, "difficulty": string, "prerequisiteIndexes": [number], "sourceChunkIds": [number]}]}';

// Shared by the full blueprint prompt and the single-camp regenerate prompt
// below — the lesson-title rules are the one thing that must never drift
// between the two call sites.
const LESSON_RULES_TEXT = `- title của mỗi lesson: 4-12 từ, TỐI ĐA 80 ký tự, MỘT chủ đề duy nhất, KHÔNG chép nguyên câu dài từ tài liệu, KHÔNG dùng hướng dẫn lớp học (vd "Yêu cầu học viên...", "Hoạt động lớp học...") làm tên, KHÔNG kết thúc bằng dấu "...".
- summary: tóm tắt 1-2 câu chặng học đó dạy gì (không phải nội dung bài giảng đầy đủ).
- sourceChunkIds: các [chunk N] thực sự liên quan (bỏ trống nếu không có tài liệu nguồn).
- difficulty chỉ dùng "Dễ", "Trung bình" hoặc "Khó".`;

const BLUEPRINT_INSTRUCTIONS = (maxCamps) => `đề xuất một Course Blueprint (CHỈ cấu trúc khóa học, KHÔNG soạn nội dung bài giảng/câu hỏi/flashcard):
- title: tên khóa học ngắn gọn.
- outcomes: 3-5 mục tiêu tổng quát học viên đạt được sau khóa học.
- Tối đa ${maxCamps} camp (campIndex bắt đầu từ 0), mỗi camp chỉ nên có 2-5 chặng học (lesson) — chọn chủ đề/khái niệm NỔI BẬT và quan trọng nhất, không cần liệt kê mọi chi tiết.
${LESSON_RULES_TEXT}
- prerequisiteIndexes: chỉ số trong mảng lessons (bắt đầu từ 0) của (các) chặng PHẢI học trước chặng này, nếu có — CHỈ được tham chiếu chặng có chỉ số NHỎ HƠN chặng hiện tại.`;

// Parses one Gemini blueprint response, sanitizes every lesson title, and
// repairs the two structural issues worth auto-fixing (too many camps; a
// lesson pointing past MAX_BLUEPRINT_CAMPS) before running the full
// validator. Returns null (never throws) on anything unrecoverable, so the
// caller always has a deterministic fallback to reach for.
function parseAndRepairBlueprint(raw, courseTitle, approvedChunkIds) {
  if (!raw) return null;
  let parsed;
  try { parsed = JSON.parse(stripJsonFence(raw)); } catch { return null; }
  if (!matchesShape({ title: 'string' }, parsed) || !Array.isArray(parsed.camps) || !Array.isArray(parsed.lessons)) return null;

  let camps = parsed.camps.map((c) => ({ title: (c.title || '').trim() || 'Camp' }));
  if (camps.length > MAX_BLUEPRINT_CAMPS) camps = camps.slice(0, MAX_BLUEPRINT_CAMPS);

  const lessonCountByCamp = new Map();
  const lessons = (parsed.lessons || []).map((l) => {
    const campIndex = Math.max(0, Math.min(typeof l.campIndex === 'number' ? l.campIndex : 0, camps.length - 1));
    const n = (lessonCountByCamp.get(campIndex) || 0) + 1;
    lessonCountByCamp.set(campIndex, n);

    let title = sanitizeLessonTitle(l.title);
    if (!validateLessonTitle(title).valid) title = `${camps[campIndex]?.title || 'Camp'} – Phần ${n}`;

    return {
      title,
      summary: (l.summary || l.description || '').trim(),
      learningOutcome: l.learningOutcome || `Học viên hiểu và vận dụng được kiến thức về ${title.toLowerCase()}.`,
      campIndex,
      estimatedMinutes: typeof l.estimatedMinutes === 'number' && l.estimatedMinutes > 0 ? l.estimatedMinutes : 20,
      difficulty: ['Dễ', 'Trung bình', 'Khó'].includes(l.difficulty) ? l.difficulty : 'Trung bình',
      prerequisiteIndexes: Array.isArray(l.prerequisiteIndexes) ? l.prerequisiteIndexes.filter((n2) => typeof n2 === 'number') : [],
      // With no uploaded document there are no real chunks to cite — force
      // empty rather than trust whatever chunk numbers the model invented,
      // so a goal-only course never carries a fabricated source citation.
      sourceChunkIds: approvedChunkIds.length === 0
        ? []
        : (Array.isArray(l.sourceChunkIds) ? l.sourceChunkIds.filter((id) => typeof id === 'number') : [])
    };
  });

  const blueprint = {
    title: (parsed.title || courseTitle || '').trim() || 'Khóa học mới',
    outcomes: Array.isArray(parsed.outcomes) ? parsed.outcomes.filter((o) => typeof o === 'string' && o.trim()) : [],
    camps, lessons
  };

  const check = validateCourseBlueprint(blueprint, approvedChunkIds);
  if (!check.valid) {
    console.warn('generateCourseBlueprint: AI proposal failed validation, using deterministic fallback:', check.errors);
    return null;
  }
  return blueprint;
}

// Reshapes the legacy deterministic MOF-bank curriculum (id/campId-keyed,
// pre-dates the Blueprint's index-based referencing) into blueprint shape,
// for the no-document/no-prompt fallback path only.
function adaptLegacyCurriculumToBlueprint(legacy, courseTitle) {
  const campIndexById = new Map(legacy.camps.map((c, i) => [c.id, i]));
  return {
    title: courseTitle || 'Khóa học mới',
    outcomes: [legacy.summary],
    camps: legacy.camps.map((c) => ({ title: c.title })),
    lessons: legacy.lessons.map((l) => ({
      title: l.title, summary: l.description, learningOutcome: l.learningOutcome,
      campIndex: campIndexById.get(l.campId) ?? 0, estimatedMinutes: l.estimatedMinutes, difficulty: l.difficulty,
      prerequisiteIndexes: [], sourceChunkIds: l.sourceChunkIds || []
    }))
  };
}

// Zero-AI fallback — buckets the course's document-map entries into camps
// then lessons (respecting the same 6-camp / 2-5-lessons-per-camp caps as
// the AI path) so there's always a working, genuinely-grounded result even
// with no API key or an invalid AI response. Titles are stubbed from the
// first entry in each lesson's bucket; the trainer is expected to rename
// them via the existing camp/lesson edit UI.
function splitIntoBuckets(arr, bucketCount) {
  if (arr.length === 0 || bucketCount <= 0) return [];
  const perBucket = Math.ceil(arr.length / bucketCount);
  const buckets = [];
  for (let i = 0; i < bucketCount; i++) {
    const bucket = arr.slice(i * perBucket, (i + 1) * perBucket);
    if (bucket.length > 0) buckets.push(bucket);
  }
  return buckets;
}

function buildBlueprintBucketFallback(courseTitle, docMap, preferredCamps) {
  const campCount = Math.max(1, Math.min(preferredCamps, MAX_BLUEPRINT_CAMPS, docMap.length || 1));
  const campBuckets = splitIntoBuckets(docMap, campCount);
  const camps = campBuckets.map((_, i) => ({ title: `Phần ${i + 1}` }));
  const lessons = [];
  campBuckets.forEach((entries, campIndex) => {
    const lessonCount = Math.max(2, Math.min(5, entries.length || 2));
    for (const bucket of splitIntoBuckets(entries, lessonCount)) {
      const stub = sanitizeLessonTitle(bucket[0].preview.replace(/…$/, '')) || `${camps[campIndex].title} – Phần ${lessons.length + 1}`;
      lessons.push({
        title: stub,
        summary: bucket.map((e) => e.preview).join(' ').slice(0, 200),
        learningOutcome: `Học viên nắm được nội dung: ${stub}`,
        campIndex,
        estimatedMinutes: 15,
        difficulty: 'Trung bình',
        prerequisiteIndexes: [],
        sourceChunkIds: bucket.map((e) => e.chunkId)
      });
    }
  });
  return {
    title: courseTitle || 'Khóa học mới',
    outcomes: [`Học viên nắm được các nội dung chính trong tài liệu đã tải lên.`],
    camps, lessons
  };
}

// ── Targeted regeneration — one Camp or one Lesson, not the whole course ───
// A trainer unhappy with a single camp's lessons (or one lesson's framing)
// shouldn't have to nuke and rebuild the entire blueprint to fix it. Both
// reuse the same document map + lesson-title rules as the full blueprint
// call, just scoped narrower.
/**
 * @param {import('sqlite').Database} db
 * @param {{ courseId: number, campTitle: string, prompt?: string }} input
 * @returns {Promise<{ lessons: object[], usedAI: boolean }>}
 */
export async function regenerateCampLessons(db, { courseId, campTitle, prompt = '' }) {
  const docMap = await getCourseDocumentMap(db, courseId);
  const approvedChunkIds = docMap.map((e) => e.chunkId);
  const mapText = docMap.length ? `Bản đồ rút gọn tài liệu khóa học:\n${docMap.map((e) => `[chunk ${e.chunkId}] ${e.preview}`).join('\n')}` : 'Khóa học này chưa có tài liệu nguồn — dùng kiến thức chuyên môn bảo hiểm của bạn.';
  const noteLine = prompt?.trim() ? `Ghi chú thêm từ trainer: "${prompt.trim()}"` : '';

  const raw = await studioCallGemini(
    STUDIO_PERSONALITY_RULES + '\nTrả lời DUY NHẤT bằng JSON: {"lessons": [{"title": string, "summary": string, "learningOutcome": string, "estimatedMinutes": number, "difficulty": string, "sourceChunkIds": [number]}]}',
    `${mapText}\n\nCamp hiện tại: "${campTitle}".\n${noteLine}\n\nĐề xuất lại 2-5 chặng học (lesson) MỚI cho RIÊNG camp này (không đụng đến các camp khác):\n${LESSON_RULES_TEXT}`,
    AI_TASKS.GENERATE_CURRICULUM, db, 45000
  );

  let lessons = null;
  if (raw) {
    try {
      const parsed = JSON.parse(stripJsonFence(raw));
      if (Array.isArray(parsed?.lessons) && parsed.lessons.length > 0) {
        lessons = parsed.lessons.map((l) => {
          let title = sanitizeLessonTitle(l.title);
          if (!validateLessonTitle(title).valid) title = `${campTitle} – ${sanitizeLessonTitle(l.summary || l.title || 'Chặng học')}`;
          return {
            title,
            summary: (l.summary || '').trim(),
            learningOutcome: l.learningOutcome || `Học viên hiểu và vận dụng được kiến thức về ${title.toLowerCase()}.`,
            estimatedMinutes: typeof l.estimatedMinutes === 'number' && l.estimatedMinutes > 0 ? l.estimatedMinutes : 20,
            difficulty: ['Dễ', 'Trung bình', 'Khó'].includes(l.difficulty) ? l.difficulty : 'Trung bình',
            sourceChunkIds: Array.isArray(l.sourceChunkIds) ? l.sourceChunkIds.filter((id) => approvedChunkIds.length === 0 || approvedChunkIds.includes(id)) : []
          };
        });
        if (lessons.length < 2 || lessons.length > 5) lessons = null; // out of range — fall back rather than silently violate the cap
      }
    } catch { /* falls through to the deterministic fallback below */ }
  }

  if (lessons) return { lessons, usedAI: true };

  // Deterministic fallback: bucket the whole course's document map into 2-5
  // stub lessons for this camp, same shape as buildBlueprintBucketFallback.
  const lessonCount = Math.max(2, Math.min(5, docMap.length || 2));
  const buckets = splitIntoBuckets(docMap, lessonCount);
  const fallbackLessons = (buckets.length ? buckets : [[]]).map((bucket, i) => {
    const stub = bucket.length ? sanitizeLessonTitle(bucket[0].preview.replace(/…$/, '')) : `${campTitle} – Phần ${i + 1}`;
    return {
      title: stub || `${campTitle} – Phần ${i + 1}`,
      summary: bucket.map((e) => e.preview).join(' ').slice(0, 200),
      learningOutcome: `Học viên nắm được nội dung: ${stub}`,
      estimatedMinutes: 15,
      difficulty: 'Trung bình',
      sourceChunkIds: bucket.map((e) => e.chunkId)
    };
  });
  return { lessons: fallbackLessons, usedAI: false };
}

/**
 * @param {import('sqlite').Database} db
 * @param {{ courseId: number, lessonTitle: string, campTitle: string, prompt?: string }} input
 * @returns {Promise<{ lesson: object, usedAI: boolean }>}
 */
export async function regenerateLessonDetails(db, { courseId, lessonTitle, campTitle, prompt = '' }) {
  const docMap = await getCourseDocumentMap(db, courseId);
  const approvedChunkIds = docMap.map((e) => e.chunkId);
  const mapText = docMap.length ? `Bản đồ rút gọn tài liệu khóa học:\n${docMap.map((e) => `[chunk ${e.chunkId}] ${e.preview}`).join('\n')}` : 'Khóa học này chưa có tài liệu nguồn — dùng kiến thức chuyên môn bảo hiểm của bạn.';
  const noteLine = prompt?.trim() ? `Ghi chú thêm từ trainer: "${prompt.trim()}"` : '';

  const raw = await studioCallGemini(
    STUDIO_PERSONALITY_RULES + '\nTrả lời DUY NHẤT bằng JSON: {"title": string, "summary": string, "learningOutcome": string, "estimatedMinutes": number, "difficulty": string, "sourceChunkIds": [number]}',
    `${mapText}\n\nCamp: "${campTitle}". Chặng học hiện tại: "${lessonTitle}".\n${noteLine}\n\nĐề xuất lại MỘT chặng học thay thế cho riêng chặng này (không tạo thêm chặng khác):\n${LESSON_RULES_TEXT}`,
    AI_TASKS.GENERATE_CURRICULUM, db, 45000
  );

  if (raw) {
    try {
      const parsed = JSON.parse(stripJsonFence(raw));
      if (matchesShape({ title: 'string' }, parsed)) {
        let title = sanitizeLessonTitle(parsed.title);
        if (!validateLessonTitle(title).valid) title = lessonTitle; // keep the existing title rather than save a bad one
        return {
          lesson: {
            title,
            summary: (parsed.summary || '').trim(),
            learningOutcome: parsed.learningOutcome || `Học viên hiểu và vận dụng được kiến thức về ${title.toLowerCase()}.`,
            estimatedMinutes: typeof parsed.estimatedMinutes === 'number' && parsed.estimatedMinutes > 0 ? parsed.estimatedMinutes : 20,
            difficulty: ['Dễ', 'Trung bình', 'Khó'].includes(parsed.difficulty) ? parsed.difficulty : 'Trung bình',
            sourceChunkIds: Array.isArray(parsed.sourceChunkIds) ? parsed.sourceChunkIds.filter((id) => approvedChunkIds.length === 0 || approvedChunkIds.includes(id)) : []
          },
          usedAI: true
        };
      }
    } catch { /* falls through to the no-op fallback below */ }
  }

  // No usable AI response — return the lesson unchanged rather than
  // replacing it with a worse guess.
  return { lesson: { title: lessonTitle, summary: '', learningOutcome: '', estimatedMinutes: 20, difficulty: 'Trung bình', sourceChunkIds: [] }, usedAI: false };
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
 * @param {{ topic: string, lessonTitle: string, genFlashcards?: boolean, genQuiz?: boolean }} input
 */
export async function generateLessonKit(db, { topic, lessonTitle, genFlashcards = true, genQuiz = true }) {
  const flashcards = genFlashcards ? await db.all('SELECT * FROM flashcards WHERE topic = ? ORDER BY RANDOM() LIMIT 5', [topic]) : [];
  const easy = genQuiz ? await db.all(`SELECT * FROM test_questions WHERE topic = ? AND difficulty = 'Dễ' ORDER BY RANDOM() LIMIT 2`, [topic]) : [];
  const medium = genQuiz ? await db.all(`SELECT * FROM test_questions WHERE topic = ? AND difficulty = 'Trung bình' ORDER BY RANDOM() LIMIT 2`, [topic]) : [];
  const hard = genQuiz ? await db.all(`SELECT * FROM test_questions WHERE topic = ? AND difficulty = 'Khó' ORDER BY RANDOM() LIMIT 2`, [topic]) : [];
  const scenario = genQuiz ? await db.get(`SELECT * FROM test_questions WHERE topic = ? AND question LIKE '%Tình huống%' ORDER BY RANDOM() LIMIT 1`, [topic]) : null;
  const checkpoint = genQuiz ? await db.get(`SELECT * FROM test_questions WHERE topic = ? ORDER BY RANDOM() LIMIT 1`, [topic]) : null;
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

// Shared grounding prefix for every document-sourced Gemini call (lesson
// content AND curriculum generation) — uploaded giáo án files routinely
// carry a cover page, table of contents, or administrative boilerplate
// ahead of the actual teachable material; without this instruction the
// model treats all of it as equally important, diluting (or truncating out,
// once the 6-8k char window fills up) the content that actually matters.
function buildCoreContentGrounding(sourceText) {
  return `CHỈ dựa trên đoạn tài liệu bên dưới, TUYỆT ĐỐI không bịa thêm nội dung/số liệu/pháp lý ngoài đoạn này. Tài liệu có thể có phần mở đầu, mục lục, hoặc thông tin hành chính không phục vụ giảng dạy — BỎ QUA các phần đó, chỉ khai thác khái niệm, quy định, số liệu CHÍNH mà học viên cần học.\n\nTài liệu:\n${sourceText}`;
}

/**
 * @param {import('sqlite').Database} db
 * @param {{ lessonId: number, documentId: number, documentTitle: string, genKnowledge?: boolean, genFlashcards?: boolean, genQuiz?: boolean }} input
 */
export async function generateContentFromDocument(db, { lessonId, documentId, documentTitle, genKnowledge = true, genFlashcards = true, genQuiz = true }) {
  const chunks = await db.all('SELECT * FROM knowledge_chunks WHERE document_id = ? ORDER BY chunk_index', [documentId]);
  if (chunks.length === 0) throw new Error('Tài liệu chưa có nội dung để tạo.');

  const sourceChunkIds = chunks.map((c) => c.id);
  // Bounded window rather than the whole document — keeps the prompt a
  // reasonable size regardless of how long the uploaded file is.
  const sourceText = chunks.map((c) => c.content).join('\n\n').slice(0, 6000);
  const grounding = buildCoreContentGrounding(sourceText);

  return generateGroundedLessonContent(db, { lessonId, grounding, sourceChunkIds, sourceTitle: documentTitle || 'Tài liệu tải lên', genKnowledge, genFlashcards, genQuiz });
}

function parseJSONSafe(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

// Same four-call shape as generateContentFromDocument, generalized over
// where the grounding text/source citation come from — used both for a
// specific uploaded document (above) and for lessons with no document at
// all (below), so neither path duplicates the Gemini-calling logic.
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const VALID_DIFFICULTIES = ['Dễ', 'Trung bình', 'Khó'];
const VALID_COGNITIVE_LEVELS = ['Ghi nhớ', 'Hiểu', 'Phân tích', 'Vận dụng'];
const INSUFFICIENT_SOURCE_MESSAGE = 'Không đủ nội dung nguồn để tạo Lesson này.';

// A knowledge block's introduction/sections/keyTakeaways come back as
// structured JSON but studio_content_items has no separate columns for them
// — the existing question_text column already renders as free-form
// whitespace-pre-wrap text in ContentLibrary and is already editable as a
// plain textarea, so folding the structure into one formatted string reuses
// that UI as-is.
function formatKnowledgeBody(knowledge, sourceTitle) {
  const sectionText = knowledge.sections.map((s) => `${s.heading.trim()}\n${s.body.trim()}`).join('\n\n');
  const takeaways = knowledge.keyTakeaways.filter((s) => typeof s === 'string' && s.trim());
  const takeawayText = takeaways.length ? `\n\nĐiểm cần nhớ:\n${takeaways.map((k) => `• ${k.trim()}`).join('\n')}` : '';
  const intro = knowledge.introduction?.trim() ? `${knowledge.introduction.trim()}\n\n` : '';
  return `${intro}${sectionText}${takeawayText}\n\nNguồn: ${sourceTitle}`;
}

const normDifficulty = (d) => (VALID_DIFFICULTIES.includes(d) ? d : 'Trung bình');
const normCognitiveLevel = (c) => (VALID_COGNITIVE_LEVELS.includes(c) ? c : 'Hiểu');
const normFlashcardType = (t) => (FLASHCARD_TYPES.includes(t) ? t : 'Term');

/**
 * @param {import('sqlite').Database} db
 * @param {{
 *   lessonId: number, grounding: string, sourceChunkIds: number[], sourceTitle: string,
 *   learningOutcomeId?: number|null,
 *   genKnowledge?: boolean, genFlashcards?: boolean, genQuiz?: boolean, randomizeQuestions?: boolean,
 *   quizCount?: number, flashcardCount?: number,
 *   existingFlashcardFronts?: string[], existingQuestionTexts?: string[],
 *   callGeminiFn?: typeof studioCallGemini
 * }} input
 */
async function generateGroundedLessonContent(db, {
  lessonId, grounding, sourceChunkIds, sourceTitle, learningOutcomeId = null,
  genKnowledge = true, genFlashcards = true, genQuiz = true, randomizeQuestions = false,
  quizCount = 3, flashcardCount = 5,
  existingFlashcardFronts = [], existingQuestionTexts = [],
  // Test seam only — production code always uses the real studioCallGemini;
  // tests inject a canned responder so quiz/flashcard persistence+linking
  // can be proven deterministically without a live Gemini call/API key.
  callGeminiFn = studioCallGemini
}) {
  let knowledge = null;
  let knowledgeInsufficient = false;
  if (genKnowledge) {
    const knowledgeRaw = await callGeminiFn(
      STUDIO_PERSONALITY_RULES + '\nTrả lời DUY NHẤT bằng JSON: {"title": string, "introduction": string, "sections": [{"heading": string, "body": string}], "keyTakeaways": [string], "insufficientSource": boolean}',
      `${grounding}\n\nViết Kiến thức cốt lõi cho chặng học này, dành cho đại lý bảo hiểm MỚI, bằng tiếng Việt rõ ràng, đơn giản:\n` +
      `- Một đoạn giới thiệu ngắn (introduction).\n` +
      `- 2-4 phần kiến thức nhỏ (sections), mỗi phần có tiêu đề + đoạn văn NGẮN.\n` +
      `- 3-5 điểm cần nhớ (keyTakeaways).\n` +
      `- Tổng độ dài khoảng 250-500 từ.\n` +
      `- CHỈ tập trung vào mục tiêu học tập của chặng này, không lặp lại cùng một ý, không nội dung động viên chung chung, không chép nguyên đoạn văn nguồn, không đưa hướng dẫn lớp học/bài tập không liên quan vào đây.\n` +
      `- Giải thích thuật ngữ chuyên môn một cách đơn giản; chỉ dùng ví dụ ngắn nếu thực sự giúp hiểu rõ hơn hơn.\n` +
      `- Nếu đoạn tài liệu bên trên KHÔNG đủ thông tin để soạn bài học này, trả về insufficientSource: true và ĐỪNG tự bịa thêm kiến thức bảo hiểm không có trong tài liệu.`,
      AI_TASKS.GENERATE_KNOWLEDGE_SUMMARY, db, 12000
    );
    if (knowledgeRaw) {
      try {
        const parsed = JSON.parse(stripJsonFence(knowledgeRaw));
        if (parsed?.insufficientSource === true) {
          knowledgeInsufficient = true;
        } else if (matchesShape({ title: 'string' }, parsed) && validateGeneratedKnowledge(parsed).valid) {
          knowledge = parsed;
        }
      } catch (err) { /* skip — no knowledge block this round */ }
    }
  }

  let flashcards = [];
  if (genFlashcards) {
    const avoidLine = existingFlashcardFronts.length
      ? `\n\nCác thẻ đã có (KHÔNG lặp lại khái niệm tương tự): ${existingFlashcardFronts.join('; ')}`
      : '';
    const flashcardsRaw = await callGeminiFn(
      STUDIO_PERSONALITY_RULES + '\nTrả lời DUY NHẤT bằng JSON: {"flashcards": [{"front": string, "back": string, "type": "Term"|"Concept"|"Rule"|"Comparison"|"ProcessStep"|"Exception"}]}',
      `${grounding}\n\nChọn ra các khái niệm/thuật ngữ CHÍNH (mỗi thẻ đúng MỘT điểm kiến thức, không phải một câu hỏi trắc nghiệm dài) rồi tạo đúng ${flashcardCount} flashcard theo dạng phù hợp với type:\n` +
      `- Term → Definition (thuật ngữ → định nghĩa)\n- Concept → Meaning (khái niệm → ý nghĩa)\n- Rule → Explanation (quy tắc → giải thích)\n` +
      `- Comparison → Key difference (so sánh → điểm khác biệt chính)\n- Process step → Description (bước quy trình → mô tả)\n- Exception → When it applies (ngoại lệ → khi nào áp dụng)\n` +
      `front thường dưới 12 từ, back khoảng 20-70 từ, KHÔNG được là câu hỏi kiểu "Hãy giải thích toàn bộ...". Không trùng lặp nội dung giữa các thẻ.${avoidLine}`,
      AI_TASKS.GENERATE_FLASHCARDS, db, 12000
    );
    if (flashcardsRaw) {
      try {
        const parsed = JSON.parse(stripJsonFence(flashcardsRaw));
        if (Array.isArray(parsed.flashcards)) flashcards = parsed.flashcards.filter((f) => validateGeneratedFlashcard(f).valid).slice(0, flashcardCount);
      } catch (err) { /* skip */ }
    }
  }

  let mcqs = [];
  let scenario = null;
  if (genQuiz) {
    // One call for both MCQs and the scenario question (rather than two
    // separate Gemini round-trips) — the free-tier quota for the main model
    // is tight enough (as low as ~20 requests/day on this project's key)
    // that halving quiz-generation's request count meaningfully changes
    // whether a trainer can use "Generate Quiz" more than once or twice
    // before hitting a 429 and silently getting nothing back.
    const includeScenario = quizCount >= 2;
    const mcqCount = includeScenario ? quizCount - 1 : quizCount;
    const scenarioLine = includeScenario ? ' VÀ một câu hỏi tình huống thực tế áp dụng kiến thức (scenario, cũng 4 đáp án)' : '';
    const avoidLine = existingQuestionTexts.length
      ? `\n\nCác câu hỏi đã có (KHÔNG lặp lại nội dung tương tự): ${existingQuestionTexts.join('; ')}`
      : '';
    const quizRaw = await callGeminiFn(
      STUDIO_PERSONALITY_RULES + '\nTrả lời DUY NHẤT bằng JSON: {"questions": [{"questionText": string, "options": [string, string, string, string], "correctOption": number, "explanation": string, "difficulty": "Dễ"|"Trung bình"|"Khó", "cognitiveLevel": "Ghi nhớ"|"Hiểu"|"Phân tích"|"Vận dụng"}], "scenario": {"questionText": string, "options": [string, string, string, string], "correctOption": number, "explanation": string, "difficulty": string, "cognitiveLevel": string}}',
      `${grounding}\n\nTạo đúng ${mcqCount} câu hỏi trắc nghiệm 4 đáp án (questions, correctOption là chỉ số 0-3, kèm mức độ khó difficulty và loại nhận thức cognitiveLevel cho mỗi câu)${scenarioLine} từ đoạn tài liệu trên, chỉ dùng thông tin có trong tài liệu.\n` +
      `Kết hợp cả câu ghi nhớ (Ghi nhớ), câu hiểu khái niệm (Hiểu), và câu vận dụng đơn giản (Vận dụng) — không để tất cả câu cùng một mức độ. Mọi phương án sai phải hợp lý (không hiển nhiên sai), chỉ đúng một phương án. Không lặp lại câu hỏi.${avoidLine}`,
      AI_TASKS.GENERATE_MCQ_FROM_SOURCE, db, 45000
    );
    if (quizRaw) {
      try {
        const parsed = JSON.parse(stripJsonFence(quizRaw));
        if (Array.isArray(parsed.questions)) mcqs = parsed.questions.filter((q) => validateGeneratedQuestion(q).valid).slice(0, mcqCount);
        if (includeScenario && parsed.scenario && validateGeneratedQuestion(parsed.scenario).valid) scenario = parsed.scenario;
      } catch (err) { /* skip */ }
    }
  }

  if (randomizeQuestions && mcqs.length > 1) shuffleInPlace(mcqs);

  const insertItem = (type, fields, title) => db.run(
    `INSERT INTO studio_content_items
       (lesson_id, content_type, title, question_text, options, correct_option, explanation, difficulty, cognitive_level, front, back, keyword, source_chunk_ids, source_title, source_version, learning_outcome_id, status, ai_generated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AI_DRAFT', 1)`,
    [lessonId, type, title || null, fields.questionText || null, JSON.stringify(fields.options || []), fields.correctOption ?? null,
      fields.explanation || null, normDifficulty(fields.difficulty), normCognitiveLevel(fields.cognitiveLevel), fields.front || null, fields.back || null, fields.keyword || fields.type || null,
      JSON.stringify(sourceChunkIds || []), sourceTitle || 'Tài liệu tải lên', '1.0', learningOutcomeId]
  );

  // Only clear a content type's previous AI_DRAFT items once its regeneration
  // actually produced something valid — a failed/empty Gemini response must
  // leave the trainer's last successful drafts untouched (retry-safe), and
  // APPROVED/PUBLISHED/TRAINER_EDITING items are never touched regardless
  // (see routes.js's content-item edit action, which moves an edited item
  // out of AI_DRAFT precisely so a regenerate can never clobber it).
  const replaceDraftsOfType = (types) => db.run(
    `DELETE FROM studio_content_items WHERE lesson_id = ? AND status = 'AI_DRAFT' AND content_type IN (${types.map(() => '?').join(',')})`,
    [lessonId, ...types]
  );

  if (knowledge) {
    await replaceDraftsOfType(['knowledge']);
    await insertItem('knowledge', { questionText: formatKnowledgeBody(knowledge, sourceTitle || 'Tài liệu tải lên') }, knowledge.title);
  }
  if (flashcards.length > 0) {
    await replaceDraftsOfType(['flashcard']);
    for (const f of flashcards) await insertItem('flashcard', { ...f, keyword: normFlashcardType(f.type) });
  }
  if (mcqs.length > 0 || scenario) {
    await replaceDraftsOfType(['mcq', 'scenario']);
    for (const q of mcqs) await insertItem('mcq', q);
    if (scenario) await insertItem('scenario', scenario);
  }

  return {
    itemCount: (knowledge ? 1 : 0) + flashcards.length + mcqs.length + (scenario ? 1 : 0),
    generatedKnowledge: !!knowledge, generatedFlashcards: flashcards.length, generatedQuestions: mcqs.length, generatedScenario: !!scenario,
    knowledgeInsufficient, knowledgeInsufficientMessage: knowledgeInsufficient ? INSUFFICIENT_SOURCE_MESSAGE : null,
    quizFailed: genQuiz && mcqs.length === 0 && !scenario,
    flashcardsFailed: genFlashcards && flashcards.length === 0
  };
}

// Lessons from a course with no uploaded source document at all (the common
// case for courses built via the AI course-goal wizard) — grounds Gemini in
// the lesson's own title/description plus the course's stated goal instead
// of source text, so "Generate AI content" always produces something rather
// than erroring.
/**
 * @param {import('sqlite').Database} db
 * @param {{ lessonId: number, lessonTitle: string, lessonDescription?: string, courseGoal?: string, learningOutcomeId?: number|null, genKnowledge?: boolean, genFlashcards?: boolean, genQuiz?: boolean }} input
 */
export async function generateContentFromLessonGoal(db, {
  lessonId, lessonTitle, lessonDescription, courseGoal, learningOutcomeId = null,
  genKnowledge = true, genFlashcards = true, genQuiz = true, randomizeQuestions = false,
  quizCount = 3, flashcardCount = 5, existingFlashcardFronts = [], existingQuestionTexts = [], callGeminiFn = undefined
}) {
  const contextLines = [
    `Chủ đề bài học: "${lessonTitle}"`,
    lessonDescription && `Mô tả bài học: ${lessonDescription}`,
    courseGoal && `Bối cảnh khóa học: ${courseGoal}`
  ].filter(Boolean).join('\n');
  const grounding = `${contextLines}\n\nKhông có tài liệu nguồn cụ thể cho bài học này — hãy dùng kiến thức chuyên môn bảo hiểm của bạn, giữ nội dung chính xác và bám sát chủ đề bài học trên.`;

  return generateGroundedLessonContent(db, {
    lessonId, grounding, sourceChunkIds: [], sourceTitle: 'Do Llama đề xuất (chưa có tài liệu nguồn)', learningOutcomeId,
    genKnowledge, genFlashcards, genQuiz, randomizeQuestions, quizCount, flashcardCount, existingFlashcardFronts, existingQuestionTexts,
    ...(callGeminiFn ? { callGeminiFn } : {})
  });
}

// The single entry point for "generate this lesson's content kit" — scopes
// grounding to exactly this lesson's own outcome + the source chunks its
// Course Blueprint actually cited (never the whole course's chunks/document),
// per the "send only the Lesson outcomes and relevant source chunks, not the
// full uploaded document" requirement. Falls back to the goal-only grounding
// for lessons with no cited chunks (e.g. built without an uploaded document).
/**
 * @param {import('sqlite').Database} db
 * @param {{ lessonId: number, contentType?: 'all'|'knowledge'|'flashcard'|'quiz', callGeminiFn?: Function }} input
 */
export async function generateContentForLesson(db, { lessonId, contentType = 'all', callGeminiFn = undefined }) {
  const lesson = await db.get(
    `SELECT l.*, c.course_id, co.gen_flashcards, co.gen_quiz, co.randomize_questions, co.learning_goal,
            co.quiz_count_per_lesson, co.flashcard_count_per_lesson, lo.description AS learning_outcome_text
     FROM studio_lessons l
     JOIN studio_camps c ON l.camp_id = c.id
     JOIN studio_courses co ON c.course_id = co.id
     LEFT JOIN studio_learning_outcomes lo ON lo.id = l.learning_outcome_id
     WHERE l.id = ?`,
    [lessonId]
  );
  if (!lesson) throw new Error('Không tìm thấy chặng học');

  const genKnowledge = contentType === 'all' || contentType === 'knowledge';
  const genFlashcards = contentType === 'all' ? !!lesson.gen_flashcards : contentType === 'flashcard';
  const genQuiz = contentType === 'all' ? !!lesson.gen_quiz : contentType === 'quiz';
  const randomizeQuestions = !!lesson.randomize_questions;
  const quizCount = lesson.quiz_count_per_lesson || 3;
  const flashcardCount = lesson.flashcard_count_per_lesson || 5;

  const sourceChunkIds = parseJSONSafe(lesson.source_chunk_ids, []);

  // Existing drafts/approved items for this lesson, passed back into the
  // prompt so a regenerate doesn't just produce near-duplicates of what's
  // already there (see spec: "Avoid duplicates").
  const existingFlashcardFronts = genFlashcards
    ? (await db.all(`SELECT front FROM studio_content_items WHERE lesson_id = ? AND content_type = 'flashcard'`, [lessonId])).map((r) => r.front).filter(Boolean)
    : [];
  const existingQuestionTexts = genQuiz
    ? (await db.all(`SELECT question_text FROM studio_content_items WHERE lesson_id = ? AND content_type IN ('mcq', 'scenario')`, [lessonId])).map((r) => r.question_text).filter(Boolean)
    : [];

  const opts = {
    lessonId: lesson.id, learningOutcomeId: lesson.learning_outcome_id,
    genKnowledge, genFlashcards, genQuiz, randomizeQuestions, quizCount, flashcardCount,
    existingFlashcardFronts, existingQuestionTexts,
    ...(callGeminiFn ? { callGeminiFn } : {})
  };

  let result;
  if (Array.isArray(sourceChunkIds) && sourceChunkIds.length > 0) {
    const chunks = await getChunksByIds(db, sourceChunkIds);
    const sourceText = chunks.map((c) => c.content).join('\n\n').slice(0, 6000);
    const outcomeLine = lesson.learning_outcome_text ? `\n\nMục tiêu học tập của chặng học này: ${lesson.learning_outcome_text}` : '';
    const grounding = buildCoreContentGrounding(sourceText) + outcomeLine;
    result = await generateGroundedLessonContent(db, { ...opts, grounding, sourceChunkIds, sourceTitle: 'Tài liệu khóa học' });
  } else {
    result = await generateContentFromLessonGoal(db, {
      ...opts, lessonTitle: lesson.title, lessonDescription: lesson.description, courseGoal: lesson.learning_goal
    });
  }

  await db.run("UPDATE studio_lessons SET status = 'READY_FOR_REVIEW' WHERE id = ?", [lesson.id]);
  return result;
}

// Batch orchestration for the whole course — runs right after the trainer
// confirms the Course Blueprint (wizard's "Start building this course with
// AI" flow), generating every lesson's content in one pass instead of
// requiring a manual per-lesson click. A single lesson's failure (Gemini
// error, timeout, etc.) is caught and recorded per-lesson; it never aborts
// the loop and never touches content already saved for other lessons, so a
// trainer can retry just the failed lesson afterward via the same
// per-lesson generateContentForLesson/kit-generate call.
/**
 * @param {import('sqlite').Database} db
 * @param {{ courseId: number, contentType?: 'all'|'knowledge'|'flashcard'|'quiz', callGeminiFn?: Function }} input
 */
export async function generateContentForCourse(db, { courseId, contentType = 'all', callGeminiFn = undefined }) {
  const lessons = await db.all(
    `SELECT l.id, l.title FROM studio_lessons l JOIN studio_camps c ON l.camp_id = c.id
     WHERE c.course_id = ? ORDER BY c.order_index, l.order_index`,
    [courseId]
  );
  const results = [];
  for (const lesson of lessons) {
    try {
      const result = await generateContentForLesson(db, { lessonId: lesson.id, contentType, callGeminiFn });
      results.push({ lessonId: lesson.id, lessonTitle: lesson.title, success: true, ...result });
    } catch (err) {
      results.push({ lessonId: lesson.id, lessonTitle: lesson.title, success: false, error: err.message });
    }
  }
  return { results, successCount: results.filter((r) => r.success).length, failureCount: results.filter((r) => !r.success).length };
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
  const raw = await studioCallGemini(STUDIO_PERSONALITY_RULES, `Vấn đề: "${issue.message}". Đề xuất 1 câu ngắn gọn cách khắc phục, giữ nguyên bản chất vấn đề: ${fallback}`, task, db, 45000);
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
    AI_TASKS.GENERATE_RESCUE_EXPEDITION, db, 45000
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
