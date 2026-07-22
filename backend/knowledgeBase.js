// Knowledge base / RAG retrieval — extracted from server.js so the existing
// "Hỏi Llama" chat retrieval logic can be reused by LlamaAIService.answerQuestion
// for contextual Ask Llama, without duplicating it (spec §16/§17).

// A line that's just a page number/marker ("12", "Trang 12", "Page 12/40",
// "- 12 -") carries no teachable content — left in, it either becomes its
// own noise paragraph or gets welded onto whatever paragraph follows it.
const PAGE_MARKER_RE = /^\s*(page|trang)?\s*\.?\s*\d{1,4}(\s*[/-]\s*\d{1,4})?\s*\.?\s*$|^\s*[-–—_]{1,3}\s*\d{1,4}\s*[-–—_]{1,3}\s*$/i;

// Running headers/footers ("Giáo trình đại lý bảo hiểm — 2024", a chapter
// name repeated on every page, ©/confidentiality boilerplate) show up as the
// exact same short line recurring many times through a long document. A
// single occurrence is legitimate content; the same short line 3+ times is
// page furniture, not something a lesson should ever be grounded in or
// (worse) have literally become its title.
function stripRunningHeadersFooters(lines, minRepeats = 3) {
  const counts = new Map();
  for (const line of lines) {
    const key = line.trim();
    if (key.length < 3 || key.length > 120) continue; // headers/footers are short
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const repeated = new Set([...counts.entries()].filter(([, c]) => c >= minRepeats).map(([key]) => key));
  if (repeated.size === 0) return lines;
  return lines.filter((line) => !repeated.has(line.trim()));
}

// Strips page-number lines, repeated header/footer lines, and stray null
// bytes (some PDF extractors leave a few behind) before the text is ever
// chunked — upstream of every downstream use (RAG chat, curriculum/blueprint
// generation, lesson content generation), so cleanup happens exactly once
// per upload rather than being re-derived (or re-sent to Gemini) every time.
export function cleanDocumentText(rawText) {
  const lines = (rawText || '').replace(/\u0000/g, '').split(/\r\n|\r|\n/);
  const withoutPageMarkers = lines.filter((line) => !PAGE_MARKER_RE.test(line.trim()));
  return stripRunningHeadersFooters(withoutPageMarkers, 3).join('\n');
}

// ── Document section classification (Lesson extraction/generation only) ────
// A trainer's uploaded giáo án mixes teachable material with things that
// must never become a Lesson on their own: instructions aimed at the
// trainer, group/class activities, exercises, illustrative examples, and
// administrative boilerplate (cover page, TOC, program objectives). Only
// LESSON_HEADING/CORE_KNOWLEDGE/SUBTOPIC content may define a Lesson.
export const SECTION_TYPES = {
  LESSON_HEADING: 'LESSON_HEADING',
  CORE_KNOWLEDGE: 'CORE_KNOWLEDGE',
  SUBTOPIC: 'SUBTOPIC',
  EXAMPLE: 'EXAMPLE',
  TRAINER_INSTRUCTION: 'TRAINER_INSTRUCTION',
  CLASS_ACTIVITY: 'CLASS_ACTIVITY',
  EXERCISE: 'EXERCISE',
  ADMINISTRATIVE: 'ADMINISTRATIVE'
};

export const LESSON_ELIGIBLE_TYPES = new Set([SECTION_TYPES.LESSON_HEADING, SECTION_TYPES.CORE_KNOWLEDGE, SECTION_TYPES.SUBTOPIC]);

// A document that already numbers its own lessons ("Bài 1", "Chương 2",
// "Module 3"...) has effectively already done the Lesson-extraction work —
// Mode A reuses that structure instead of asking Gemini to invent a new one.
export const LESSON_HEADING_RE = /^(bài|chủ đề|lesson|module|chương)\s*\d+/i;
const TRAINER_INSTRUCTION_RE = /(yêu cầu học viên|trainer cần|giảng viên (?:cần|hướng dẫn)|hướng dẫn giảng viên|học viên thực hiện|mỗi nhóm)/i;
const CLASS_ACTIVITY_RE = /(hoạt động lớp học|thảo luận nhóm|chia nhóm|làm việc nhóm|hoạt động nhóm)/i;
const EXERCISE_RE = /(^|\s)(bài tập|thực hành[:\s]|câu hỏi thực hành|luyện tập)/i;
const EXAMPLE_RE = /(ví dụ[:\s]|ví dụ minh họa)/i;
const ADMINISTRATIVE_RE = /(giáo án đào tạo|mục tiêu chương trình|mục lục|table of contents|phiên bản tài liệu|đơn vị biên soạn|^©|bản quyền)/i;

/** Classifies one paragraph/chunk-preview of an uploaded document into one
 * of SECTION_TYPES. Heuristic and deterministic (no AI call) — used to
 * decide what may ground a Lesson (LESSON_ELIGIBLE_TYPES) and what must be
 * kept out of Gemini's blueprint prompt entirely (instructions/activities/
 * exercises/examples/admin content). */
export function classifyDocSection(text) {
  const t = (text || '').trim();
  if (!t) return SECTION_TYPES.ADMINISTRATIVE;
  if (LESSON_HEADING_RE.test(t)) return SECTION_TYPES.LESSON_HEADING;
  if (ADMINISTRATIVE_RE.test(t)) return SECTION_TYPES.ADMINISTRATIVE;
  if (TRAINER_INSTRUCTION_RE.test(t)) return SECTION_TYPES.TRAINER_INSTRUCTION;
  if (CLASS_ACTIVITY_RE.test(t)) return SECTION_TYPES.CLASS_ACTIVITY;
  if (EXERCISE_RE.test(t)) return SECTION_TYPES.EXERCISE;
  if (EXAMPLE_RE.test(t)) return SECTION_TYPES.EXAMPLE;
  // A very short fragment with no sentence-like structure reads as a
  // leftover table-of-contents/administrative line, not real content.
  if (t.length < 12) return SECTION_TYPES.ADMINISTRATIVE;
  return SECTION_TYPES.CORE_KNOWLEDGE;
}

/** Entries (chunkId/preview pairs, e.g. from buildDocumentMap) whose preview
 * starts with an explicit Lesson heading ("Bài 1", "Chương 2"...) — signals
 * the document already defines its own Lesson structure (Mode A). */
export function detectLessonHeadings(entries) {
  return entries.filter((e) => LESSON_HEADING_RE.test((e.preview || '').trim()));
}

export function chunkText(text, maxLen = 700) {
  const cleaned = cleanDocumentText(text);
  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    // A real Lesson heading ("Bài 1: Tổng quan ILP") is often short enough
    // to fall under the general noise-filter length — always keep it
    // through so Mode-A heading detection has something to find.
    .filter((p) => p.length > 30 || LESSON_HEADING_RE.test(p));

  // Exact-duplicate paragraphs (a disclaimer, a boilerplate notice, a
  // classroom instruction repeated per topic) waste chunk budget and can
  // themselves get pulled in as a lesson's "content" multiple times over.
  const seen = new Set();
  const deduped = paragraphs.filter((p) => {
    const key = p.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const chunks = [];
  let current = '';
  for (const p of deduped) {
    if (current && (current.length + p.length + 1) > maxLen) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? `${current} ${p}` : p;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

// Compact stand-in for a document's full text — one short preview line per
// chunk, tagged with that chunk's real id. Course-blueprint generation grounds
// itself in this map (a few KB total) instead of resending every chunk's
// full content on every generation call, which is where most of the wasted
// token spend in the old flow came from.
const DOC_MAP_PREVIEW_LEN = 100;
export function buildDocumentMap(chunkRows) {
  return chunkRows.map((c) => ({
    chunkId: c.id,
    preview: c.content.length > DOC_MAP_PREVIEW_LEN ? `${c.content.slice(0, DOC_MAP_PREVIEW_LEN).trim()}…` : c.content
  }));
}

// multer/busboy decodes the multipart Content-Disposition "filename" header as
// latin1 (per the multipart spec, which is technically ASCII-only), so a
// non-ASCII filename's real UTF-8 bytes come through as mojibake — each byte
// re-interpreted as its own Latin-1 codepoint. Undo that single mis-decode by
// reinterpreting the string's char codes as latin1 bytes and re-decoding them
// as UTF-8, then normalize to NFC so composed accents render correctly.
export function decodeUploadedFilename(name) {
  try {
    return Buffer.from(name, 'latin1').toString('utf8').normalize('NFC');
  } catch (err) {
    return name;
  }
}

// Builds a permissive FTS5 MATCH query (prefix-match each word, OR'd together)
// from free-text user input, since raw chat messages aren't valid FTS5 syntax.
export function buildFtsQuery(message) {
  const words = message
    .toLowerCase()
    .replace(/["*:^]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  if (words.length === 0) return null;
  return words.map((w) => `"${w}"*`).join(' OR ');
}

// AI usage audit §8: only ever retrieve from documents the trainer has
// approved — a chunk from an unapproved/draft upload must never reach a
// generation prompt. Also excludes course-scoped uploads (course_id IS NOT
// NULL): those are only ever used to ground that specific course's own
// curriculum/content generation (see getCourseChunks below), never the
// shared learner-facing "Hỏi Llama" chat or Trainer Copilot — otherwise a
// syllabus uploaded for one course could leak into unrelated answers.
export async function retrieveKnowledge(db, message, limit = 5) {
  const ftsQuery = buildFtsQuery(message);
  if (!ftsQuery) return [];
  try {
    return await db.all(
      `SELECT knowledge_chunks_fts.chunk_id as chunk_id, knowledge_chunks_fts.document_id as document_id,
              knowledge_chunks_fts.content as content, bm25(knowledge_chunks_fts) as score
       FROM knowledge_chunks_fts
       JOIN knowledge_documents d ON knowledge_chunks_fts.document_id = d.id
       WHERE knowledge_chunks_fts MATCH ? AND d.approved = 1 AND d.course_id IS NULL
       ORDER BY score LIMIT ?`,
      [ftsQuery, limit]
    );
  } catch (err) {
    console.warn('Knowledge retrieval failed:', err.message);
    return [];
  }
}

// Full-course retrieval (not keyword-matched) — used when a trainer wants AI
// to structure a curriculum from everything they've uploaded for THIS
// course. Scoped by course_id alone (not an "approved" gate): a document
// uploaded to a course is only ever read back for that same course's own
// generation, so the trainer's act of uploading it here already is the
// review step — the generated camps/lessons still go through their own
// AI_DRAFT → APPROVED → PUBLISHED review before reaching a learner.
export async function getCourseChunks(db, courseId) {
  return db.all(
    `SELECT c.* FROM knowledge_chunks c
     JOIN knowledge_documents d ON c.document_id = d.id
     WHERE d.course_id = ?
     ORDER BY c.document_id, c.chunk_index`,
    [courseId]
  );
}

// Exactly the chunks a Course Blueprint already cited for one specific
// lesson (lesson.source_chunk_ids) — used for per-lesson content generation
// so a lesson's prompt is grounded only in what that lesson is actually
// about, instead of resending the whole course's document text.
export async function getChunksByIds(db, chunkIds) {
  if (!Array.isArray(chunkIds) || chunkIds.length === 0) return [];
  const placeholders = chunkIds.map(() => '?').join(',');
  return db.all(
    `SELECT * FROM knowledge_chunks WHERE id IN (${placeholders}) ORDER BY document_id, chunk_index`,
    chunkIds
  );
}

// The compact grounding for course-blueprint generation: every document's
// stored doc_map (falling back to building one on the fly for documents
// uploaded before this column existed), merged in document order and capped
// so a course with many/large uploads still produces one bounded prompt
// instead of scaling unboundedly with document count.
const COURSE_DOC_MAP_MAX_ENTRIES = 120;
export async function getCourseDocumentMap(db, courseId) {
  const docs = await db.all(
    'SELECT id, title, doc_map FROM knowledge_documents WHERE course_id = ? ORDER BY created_at',
    [courseId]
  );
  const entries = [];
  for (const doc of docs) {
    let docMap = null;
    if (doc.doc_map) { try { docMap = JSON.parse(doc.doc_map); } catch { docMap = null; } }
    if (!docMap) {
      const chunkRows = await db.all('SELECT id, content FROM knowledge_chunks WHERE document_id = ? ORDER BY chunk_index', [doc.id]);
      docMap = buildDocumentMap(chunkRows);
    }
    for (const entry of docMap) entries.push({ ...entry, documentTitle: doc.title });
    if (entries.length >= COURSE_DOC_MAP_MAX_ENTRIES) break;
  }
  return entries.slice(0, COURSE_DOC_MAP_MAX_ENTRIES);
}

function tokenize(text) {
  return new Set(
    (text || '')
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 2)
  );
}

// BM25 ranks on the WHOLE chunk (question + answer text), which means a
// topically-adjacent-but-differently-answering chunk can outrank the chunk
// that actually answers the question (e.g. "tính từ ngày nào" vs "là bao
// nhiêu ngày" — both about the same topic, different questions). This
// re-ranks retrieved chunks by how much the user's message actually overlaps
// with each chunk's own embedded "Câu hỏi:" text, which is a much sharper
// relevance signal than raw BM25 over the combined text. Deterministic, no
// LLM — used by the fallback path so it stays trustworthy with no API key.
export function pickBestMatchingChunk(retrieved, message) {
  if (retrieved.length === 0) return null;
  const queryTokens = tokenize(message);
  if (queryTokens.size === 0) return { chunk: retrieved[0], score: 0 };

  let best = retrieved[0];
  let bestScore = -1;
  for (const chunk of retrieved) {
    const qMatch = chunk.content.match(/Câu hỏi:\s*(.+?)(?:\s*Trả lời:|$)/s);
    const questionText = qMatch ? qMatch[1] : chunk.content;
    const chunkTokens = tokenize(questionText);
    let overlap = 0;
    for (const t of queryTokens) if (chunkTokens.has(t)) overlap++;
    const score = overlap / queryTokens.size;
    if (score > bestScore) {
      bestScore = score;
      best = chunk;
    }
  }
  return { chunk: best, score: bestScore };
}

// Looks up the source document title for a retrieved chunk, so grounded
// answers can cite "Source title" + "chunk index" (spec §16).
export async function getChunkSource(db, documentId) {
  const doc = await db.get('SELECT id, title, source_type FROM knowledge_documents WHERE id = ?', [documentId]);
  return doc || null;
}

// `courseId`/`approved` (spec: Studio document uploads) default to null/1 —
// unchanged behavior for the existing learner-chat upload/paste call sites,
// which don't pass them. A Studio-originated upload passes `approved: 0`
// so a trainer must explicitly review it before it's usable for RAG/generation
// (same gate `retrieveKnowledge` already enforces on the `approved` column).
export async function storeDocument(db, title, sourceType, text, userId, { courseId = null, approved = 1 } = {}) {
  const chunks = chunkText(text);
  if (chunks.length === 0) throw new Error('Không trích xuất được nội dung từ tài liệu.');

  const doc = await db.run(
    'INSERT INTO knowledge_documents (title, source_type, uploaded_by, course_id, approved) VALUES (?, ?, ?, ?, ?)',
    [title, sourceType, userId, courseId, approved ? 1 : 0]
  );
  const documentId = doc.lastID;

  const chunkRows = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = await db.run(
      'INSERT INTO knowledge_chunks (document_id, chunk_index, content) VALUES (?, ?, ?)',
      [documentId, i, chunks[i]]
    );
    await db.run(
      'INSERT INTO knowledge_chunks_fts (content, chunk_id, document_id) VALUES (?, ?, ?)',
      [chunks[i], chunk.lastID, documentId]
    );
    chunkRows.push({ id: chunk.lastID, content: chunks[i] });
  }
  // Computed once here rather than on every later generation call —
  // getCourseDocumentMap just reads this back.
  await db.run('UPDATE knowledge_documents SET doc_map = ? WHERE id = ?', [JSON.stringify(buildDocumentMap(chunkRows)), documentId]);
  return { documentId, chunkCount: chunks.length };
}
