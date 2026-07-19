// Deterministic Mistake DNA classifier — a rule cascade, not an LLM call, so a
// wrong answer always gets the same diagnosis given the same inputs (see
// PERSONALIZED_EXPEDITION_PLAN.md §17 and spec §7).

export const MISTAKE_TYPES = {
  KNOWLEDGE_GAP: 'knowledge_gap',
  CONCEPT_CONFUSION: 'concept_confusion',
  EXCEPTION_ERROR: 'exception_error',
  READING_ERROR: 'reading_error',
  MEMORY_DECAY: 'memory_decay',
  TIME_PRESSURE: 'time_pressure'
};

export const MISTAKE_LABELS_VI = {
  [MISTAKE_TYPES.KNOWLEDGE_GAP]: 'Chưa vững kiến thức',
  [MISTAKE_TYPES.CONCEPT_CONFUSION]: 'Hai khái niệm đang đổi áo cho nhau',
  [MISTAKE_TYPES.EXCEPTION_ERROR]: 'Dính bẫy ngoại lệ',
  [MISTAKE_TYPES.READING_ERROR]: 'Đọc nhanh hơn Llama chạy',
  [MISTAKE_TYPES.MEMORY_DECAY]: 'Kiến thức hơi phủ bụi',
  [MISTAKE_TYPES.TIME_PRESSURE]: 'Leo hơi vội'
};

const NEGATION_KEYWORDS = ['không đúng', 'ngoại trừ', 'không', 'sai'];
const EXCEPTION_KEYWORDS = ['ngoại lệ', 'trường hợp ngoại lệ', 'không áp dụng', 'trừ trường hợp'];

function containsAny(text, keywords) {
  const lower = (text || '').toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

/**
 * @param {object} input
 * @param {string} input.question - the question text (for keyword heuristics)
 * @param {number} input.previousMastery - 0–100, mastery before this attempt
 * @param {number} [input.evidenceCount] - how many prior attempts exist on this topic
 * @param {string} [input.confidence] - one of CONFIDENCE.* from mastery.js
 * @param {number} [input.responseTimeMs]
 * @param {number} [input.expectedTimeMs] - defaults to 45s
 * @param {number} [input.timeRemainingRatio] - 0–1, only meaningful in timed exam mode
 * @param {number} [input.daysSinceLastReview]
 * @returns {{ type: string, label: string }}
 */
export function classifyMistake({
  question = '',
  previousMastery = 0,
  evidenceCount = 0,
  confidence,
  responseTimeMs,
  expectedTimeMs = 45000,
  timeRemainingRatio,
  daysSinceLastReview
}) {
  const isFast = typeof responseTimeMs === 'number' && responseTimeMs < expectedTimeMs * 0.4;
  const nearTimeout = typeof timeRemainingRatio === 'number' && timeRemainingRatio < 0.05;

  let type;
  if (containsAny(question, NEGATION_KEYWORDS) && isFast) {
    type = MISTAKE_TYPES.READING_ERROR;
  } else if (containsAny(question, EXCEPTION_KEYWORDS)) {
    type = MISTAKE_TYPES.EXCEPTION_ERROR;
  } else if (isFast || nearTimeout) {
    type = MISTAKE_TYPES.TIME_PRESSURE;
  } else if (confidence === 'certain' && previousMastery >= 40) {
    type = MISTAKE_TYPES.CONCEPT_CONFUSION;
  } else if (evidenceCount >= 2 && previousMastery >= 50 && typeof daysSinceLastReview === 'number' && daysSinceLastReview >= 14) {
    type = MISTAKE_TYPES.MEMORY_DECAY;
  } else {
    type = MISTAKE_TYPES.KNOWLEDGE_GAP;
  }

  return { type, label: MISTAKE_LABELS_VI[type] };
}
