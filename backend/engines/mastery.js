// Deterministic mastery engine — the LLM never touches this math (see
// PERSONALIZED_EXPEDITION_PLAN.md §17). A topic's mastery is a slow-moving
// 0–100 score: a single correct answer nudges it, it never jumps to "mastered"
// in one shot, and every step is explainable from its inputs alone.

export const DIFFICULTY_WEIGHT = {
  'Dễ': 0.85,
  'Trung bình': 1,
  'Khó': 1.15
};

// Confidence codes as collected by the Quiz UI (§14). Language-neutral so the
// bilingual UI can display "Chắc chắn"/"Certain" while sending the same
// stable value regardless of which language is active. Only "certain" moves
// the needle — being unsure either way is treated as neutral evidence.
export const CONFIDENCE = {
  CERTAIN: 'certain',
  FAIRLY_SURE: 'fairly_sure',
  GUESSING: 'guessing'
};

export const MASTERY_STATES = [
  { max: 39, label: 'Khu vực dễ trượt chân' },
  { max: 59, label: 'Cần gia cố' },
  { max: 74, label: 'Đang leo ổn' },
  { max: 89, label: 'Chân khá vững' },
  { max: 100, label: 'Llama duyệt!' }
];

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function masteryStateLabel(score) {
  const state = MASTERY_STATES.find((s) => score <= s.max);
  return state ? state.label : MASTERY_STATES[MASTERY_STATES.length - 1].label;
}

/**
 * @param {object} input
 * @param {number} input.previousMastery - 0–100, current stored score (0 if never seen)
 * @param {boolean} input.isCorrect
 * @param {'Dễ'|'Trung bình'|'Khó'} input.difficulty
 * @param {string} [input.confidence] - one of CONFIDENCE.*, defaults to neutral
 * @param {number} [input.responseTimeMs]
 * @param {number} [input.expectedTimeMs] - defaults to 45s (a reasonable single-MCQ pace)
 * @returns {{ mastery: number, evidence: number }}
 */
export function calculateMastery({
  previousMastery = 0,
  isCorrect,
  difficulty = 'Trung bình',
  confidence,
  responseTimeMs,
  expectedTimeMs = 45000
}) {
  const difficultyWeight = DIFFICULTY_WEIGHT[difficulty] ?? DIFFICULTY_WEIGHT['Trung bình'];
  const evidenceScore = isCorrect ? 100 : 0;

  // Unknown response time is treated as "on pace" — never punish a topic
  // just because we lack timing data for it (e.g. historical rows).
  const speedMultiplier =
    typeof responseTimeMs !== 'number' || responseTimeMs <= expectedTimeMs * 1.3
      ? 1
      : 0.9;

  const evidence = clamp(evidenceScore * difficultyWeight * speedMultiplier, 0, 100);

  // Confidence doesn't change the evidence value itself (a wrong answer is
  // still 0 regardless of how sure you were) — it changes how hard THIS
  // attempt should move the needle. Being confidently wrong is a stronger
  // signal (concept confusion, not a coin-flip guess) than an unsure miss,
  // so it pulls mastery down faster; being confidently right consolidates
  // slightly faster too.
  const confidenceBlendFactor =
    confidence === CONFIDENCE.CERTAIN ? (isCorrect ? 1.05 : 1.4) : 1;
  const blendWeight = clamp(0.25 * confidenceBlendFactor, 0, 0.4);

  const newMastery = clamp(previousMastery * (1 - blendWeight) + evidence * blendWeight, 0, 100);

  return { mastery: Math.round(newMastery * 10) / 10, evidence };
}
