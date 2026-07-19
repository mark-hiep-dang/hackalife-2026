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

export async function retrieveKnowledge(db, message, limit = 5) {
  const ftsQuery = buildFtsQuery(message);
  if (!ftsQuery) return [];
  try {
    return await db.all(
      `SELECT chunk_id, document_id, content, bm25(knowledge_chunks_fts) as score
       FROM knowledge_chunks_fts WHERE knowledge_chunks_fts MATCH ? ORDER BY score LIMIT ?`,
      [ftsQuery, limit]
    );
  } catch (err) {
    console.warn('Knowledge retrieval failed:', err.message);
    return [];
  }
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

export async function storeDocument(db, title, sourceType, text, userId) {
  const chunks = chunkText(text);
  if (chunks.length === 0) throw new Error('Không trích xuất được nội dung từ tài liệu.');

  const doc = await db.run(
    'INSERT INTO knowledge_documents (title, source_type, uploaded_by) VALUES (?, ?, ?)',
    [title, sourceType, userId]
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
