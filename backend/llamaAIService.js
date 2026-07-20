// LlamaAIService (spec §17): the ONLY place an LLM is called from this feature.
// The deterministic engines (mastery/mistakeDNA/priority/summitReadiness/
// dailyExpedition) decide WHAT to study; this service only decides HOW Llama
// talks about it. Every method has a deterministic fallback that runs with no
// API key at all, and every LLM call is timeout-guarded and schema-checked —
// if anything goes wrong, the core flow continues using the fallback.

import { retrieveKnowledge, getChunkSource, pickBestMatchingChunk } from './knowledgeBase.js';
import { callGemini as callGeminiShared } from './geminiClient.js';
import { AI_TASKS } from './aiConfig.js';

function callGemini(systemInstruction, userMessage, task, db) {
  return callGeminiShared(systemInstruction, userMessage, { task, db, label: 'LlamaAIService' });
}

const PERSONALITY_RULES = `Bạn là "Llama" — bạn đồng hành học tập vui nhộn, tinh nghịch vừa phải, thân thiện, hay khích lệ. Nói chuyện tự nhiên như bạn bè, thỉnh thoảng xưng "Llama" ở ngôi thứ nhất. Không phải chatbot hành chính, không phải báo cáo AI.
Quy tắc bắt buộc:
- Chỉ tiếng Việt, câu ngắn 5–25 từ (trừ khi giải thích kiến thức cần dài hơn).
- Tối đa 1 câu đùa/chơi chữ mỗi tin nhắn, không ép joke vào mọi câu.
- Không chế giễu người dùng khi họ sai. Không tạo cảm giác tội lỗi khi mất streak. Không hứa chắc chắn sẽ thi đỗ.
- KHÔNG được thay đổi, thêm bớt, hay làm sai lệch bất kỳ sự kiện/số liệu/pháp lý nào được cung cấp — chỉ được đổi giọng văn, không đổi nội dung.
- Không dùng quá nhiều emoji (tối đa 1-2 mỗi tin nhắn).`;

/**
 * Rewrites the deterministic priority-engine explanation in Llama's voice.
 * @param {{ focusTopicLabel: string, deterministicExplanation: string, dailyMinutes: number }} input
 */
export async function explainExpedition({ focusTopicLabel, deterministicExplanation, dailyMinutes }, db) {
  const raw = await callGemini(
    PERSONALITY_RULES,
    `Viết lại câu giải thích sau bằng giọng Llama, giữ nguyên toàn bộ sự kiện/con số, không thêm thông tin mới. Ngữ cảnh: chặng học hôm nay dài ${dailyMinutes} phút, tập trung vào "${focusTopicLabel}".\n\nCâu gốc: "${deterministicExplanation}"\n\nChỉ trả về câu đã viết lại, không giải thích thêm.`,
    AI_TASKS.EXPLAIN_METRIC, db
  );
  const message = raw?.trim() || deterministicExplanation;
  return { message, mood: 'thinking' };
}

/**
 * Explains a specific wrong answer's Mistake DNA in Llama's voice.
 * @param {{ mistakeLabel: string, explanation: string, question: string }} input
 */
export async function explainMistake({ mistakeLabel, explanation, question }, db) {
  const fallback = `Llama vừa soi ra điểm dễ nhầm: ${mistakeLabel}. ${explanation}`;
  const raw = await callGemini(
    PERSONALITY_RULES,
    `Người học vừa trả lời sai câu: "${question}". Loại lỗi được hệ thống xác định: "${mistakeLabel}". Giải thích đúng (KHÔNG được đổi nội dung, chỉ đổi giọng văn): "${explanation}"\n\nViết 1-2 câu bằng giọng Llama giới thiệu điểm dễ nhầm này, rồi trình bày giải thích. Chỉ trả về đoạn văn, không thêm gì khác.`,
    AI_TASKS.EXPLAIN_METRIC, db
  );
  return { message: raw?.trim() || fallback, mood: 'concerned' };
}

const RESCUE_INTROS = {
  concept_confusion: 'Có vẻ hai khái niệm này đang mặc nhầm áo. Llama đổi lại giúp bạn nhé.',
  knowledge_gap: 'Chưa vững chỗ này thôi, không sao cả. Llama gia cố lại cùng bạn nhé.',
  exception_error: 'Câu này có bẫy ngoại lệ đó. Để Llama chỉ rõ chỗ khác biệt nhé.',
  reading_error: 'Đọc hơi nhanh nên trượt một bước thôi. Đọc lại kỹ cùng Llama nhé.',
  memory_decay: 'Kiến thức này phủ bụi rồi. Llama phủi lại cho sáng bóng nhé.',
  time_pressure: 'Hơi vội một chút thôi. Đi chậm lại cùng Llama nhé.'
};

/**
 * Generates the narration wrapper for a Rescue Trail (the factual pieces —
 * flashcard, questions — are assembled separately by engines/rescueTrail.js).
 *
 * AI usage audit: this used to call Gemini for the title/introduction/outro.
 * Removed — this is exactly the "Llama reaction to a known event" case the
 * audit's own routing table maps to GENERATE_LLAMA_COPY (useAI: false,
 * local copy library), since the local RESCUE_INTROS pool already reads
 * fine per mistake type and an API call here only risks the wrapper text,
 * never any fact, so the marginal value doesn't clear the cost/latency/
 * failure-mode bar. Calling AI here would be exactly the "AI to look more
 * AI-powered" pattern the audit says to avoid.
 * @param {{ topic: string, mistakeType: string, conceptPair: object|null }} input
 */
export function generateRescueTrail({ topic, mistakeType }) {
  return {
    title: `Chặng cứu hộ: ${topic}`,
    introduction: RESCUE_INTROS[mistakeType] || RESCUE_INTROS.knowledge_gap,
    outro: 'Ổn rồi đó. Kiến thức đã về đúng chỗ.'
  };
}

/**
 * Grounded "Ask Llama" answer — reuses the same RAG retrieval as /api/chat,
 * optionally biased by extra context (current question/topic/mistake).
 * @param {import('sqlite').Database} db
 * @param {{ message: string, history?: object[], context?: { topic?: string, question?: string, mistakeLabel?: string } }} input
 */
export async function answerQuestion(db, { message, history = [], context = {} }) {
  const retrievalQuery = context.topic ? `${message} ${context.topic}` : message;
  const retrieved = await retrieveKnowledge(db, retrievalQuery, 6);
  const bestMatch = pickBestMatchingChunk(retrieved, message);

  // A low overlap between the message and every retrieved chunk's own
  // question means FTS matched on loose/common words, not real relevance —
  // treat that the same as "nothing found" rather than answering off a
  // barely-related passage.
  const MIN_RELEVANCE = 0.25;
  if (retrieved.length === 0 || !bestMatch || bestMatch.score < MIN_RELEVANCE) {
    return {
      answer: 'Llama chưa tìm được đủ thông tin trong tài liệu đã duyệt để trả lời chắc chắn. Leo ẩu đoạn này là dễ lạc lắm.',
      sources: [],
      grounded: false
    };
  }

  const sources = [];
  for (const r of retrieved) {
    const doc = await getChunkSource(db, r.document_id);
    if (doc && !sources.some((s) => s.documentId === doc.id)) {
      sources.push({ documentId: doc.id, title: doc.title, updatedAt: doc.created_at });
    }
  }

  const contextBlock = retrieved.map((r, i) => `[Đoạn ${i + 1}] ${r.content}`).join('\n\n');
  const contextHint = context.question
    ? `\n\nBối cảnh: người dùng vừa hỏi về câu hỏi thi "${context.question}"${context.mistakeLabel ? ` và vừa mắc lỗi loại "${context.mistakeLabel}"` : ''}.`
    : '';

  const systemInstruction = `${PERSONALITY_RULES}
Bạn trả lời câu hỏi về bảo hiểm/chứng chỉ MOF CHỈ dựa trên các đoạn tài liệu đã duyệt bên dưới. TUYỆT ĐỐI không bịa thông tin ngoài tài liệu. Nếu tài liệu không đủ, nói rõ là chưa đủ thông tin.${contextHint}

${contextBlock}`;

  const raw = await callGemini(systemInstruction, message, AI_TASKS.LEARNER_CHAT, db);

  if (raw) {
    return { answer: raw.trim(), sources, grounded: true };
  }

  // Deterministic fallback: surface the best-matching retrieved passage directly.
  const best = bestMatch.chunk.content;
  const answerMatch = best.match(/Trả lời:\s*(.+)$/s);
  const answerText = answerMatch ? answerMatch[1].trim() : best;
  return { answer: answerText, sources, grounded: true };
}
