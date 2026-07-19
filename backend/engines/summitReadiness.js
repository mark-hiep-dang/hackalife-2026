// Deterministic Summit Readiness (spec §12) — a study-support indicator, not
// a pass/fail guarantee. Never phrase it as a promised exam score.

import { clamp } from './mastery.js';

export const READINESS_LABELS = [
  { max: 39, label: 'Llama vẫn đang buộc dây giày' },
  { max: 59, label: 'Đã rời Base Camp' },
  { max: 74, label: 'Đang leo đúng hướng' },
  { max: 84, label: 'Thấy Summit rồi!' },
  { max: 100, label: 'Llama chuẩn bị cắm cờ' }
];

export function readinessLabel(score) {
  const state = READINESS_LABELS.find((s) => score <= s.max);
  return state ? state.label : READINESS_LABELS[READINESS_LABELS.length - 1].label;
}

/**
 * @param {object} input
 * @param {number} input.weightedSkillMastery - 0–100, exam-weighted average mastery across topics
 * @param {number} input.retentionScore - 0–100, based on recency of review across topics
 * @param {number} input.practiceConsistency - 0–100, based on streak/active days
 * @param {number} input.timeManagementScore - 0–100, based on pacing vs expected time
 * @param {number} [input.mockExamScore] - 0–100, blended in with a modest weight if attempts exist
 * @returns {{ score: number, label: string }}
 */
export function calculateSummitReadiness({
  weightedSkillMastery,
  retentionScore,
  practiceConsistency,
  timeManagementScore,
  mockExamScore
}) {
  let score =
    weightedSkillMastery * 0.7 + retentionScore * 0.15 + practiceConsistency * 0.1 + timeManagementScore * 0.05;

  // If real mock-exam data exists, blend it in — actual exam performance is
  // the strongest signal available, so it earns a meaningful (but not
  // dominant) share once it exists.
  if (typeof mockExamScore === 'number') {
    score = score * 0.8 + mockExamScore * 0.2;
  }

  score = clamp(Math.round(score), 0, 100);
  return { score, label: readinessLabel(score) };
}

/**
 * Aggregates per-topic mastery/review data into the inputs calculateSummitReadiness
 * expects. Kept separate from the DB layer so it stays pure and testable.
 * @param {Array<{ mastery: number, examWeight: number, daysSinceLastReview: number }>} topics
 * @param {number} streak
 * @param {number} [avgResponseRatio] - avg(responseTimeMs / expectedTimeMs) across recent answers
 */
export function aggregateReadinessInputs(topics, streak, avgResponseRatio) {
  const totalWeight = topics.reduce((s, t) => s + t.examWeight, 0) || 1;
  const weightedSkillMastery = topics.reduce((s, t) => s + t.mastery * t.examWeight, 0) / totalWeight;

  const avgForgettingRisk =
    topics.reduce((s, t) => s + clamp((t.daysSinceLastReview ?? 999) / 7, 0, 1), 0) / (topics.length || 1);
  const retentionScore = 100 * (1 - avgForgettingRisk);

  const practiceConsistency = 100 * clamp(streak / 7, 0, 1);

  const timeManagementScore =
    typeof avgResponseRatio === 'number' ? 100 * clamp(2 - avgResponseRatio, 0, 1) : 80;

  return { weightedSkillMastery, retentionScore, practiceConsistency, timeManagementScore };
}
