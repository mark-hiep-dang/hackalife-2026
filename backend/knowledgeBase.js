// Knowledge base / RAG retrieval — extracted from server.js so the existing
// "Hỏi Llama" chat retrieval logic can be reused by LlamaAIService.answerQuestion
// for contextual Ask Llama, without duplicating it (spec §16/§17).

export function chunkText(text, maxLen = 700) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 30);

  const chunks = [];
  let current = '';
  for (const p of paragraphs) {
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

  for (let i = 0; i < chunks.length; i++) {
    const chunk = await db.run(
      'INSERT INTO knowledge_chunks (document_id, chunk_index, content) VALUES (?, ?, ?)',
      [documentId, i, chunks[i]]
    );
    await db.run(
      'INSERT INTO knowledge_chunks_fts (content, chunk_id, document_id) VALUES (?, ?, ?)',
      [chunks[i], chunk.lastID, documentId]
    );
  }
  return { documentId, chunkCount: chunks.length };
}
