// Deterministic topic priority engine (spec §8). Decides WHAT to study next —
// never delegated to the LLM. Returns a score plus reason codes; reasonCopy.js
// turns the reason codes into a Vietnamese sentence.

import { clamp } from './mastery.js';

export const REASON_CODES = {
  LOW_MASTERY: 'LOW_MASTERY',
  HIGH_EXAM_WEIGHT: 'HIGH_EXAM_WEIGHT',
  RECENT_MISTAKE: 'RECENT_MISTAKE',
  HIGH_CONFIDENCE_MISTAKE: 'HIGH_CONFIDENCE_MISTAKE',
  REVIEW_DUE: 'REVIEW_DUE',
  EXAM_DATE_NEAR: 'EXAM_DATE_NEAR',
  REQUIRED_PREREQUISITE: 'REQUIRED_PREREQUISITE'
};

/**
 * @param {object} input
 * @param {number} input.mastery - 0–100
 * @param {number} input.examWeight - 0–1, this topic's share of the exam
 * @param {number} [input.daysSinceLastReview]
 * @param {number} [input.daysUntilExam]
 * @param {boolean} [input.hasRecentHighConfidenceMistake]
 * @param {boolean} [input.hasRecentMistake]
 * @param {boolean} [input.isPrerequisiteForWeakTopic]
 * @returns {{ score: number, reasons: string[] }}
 */
export function calculateTopicPriority({
  mastery,
  examWeight,
  daysSinceLastReview = 0,
  daysUntilExam,
  hasRecentHighConfidenceMistake = false,
  hasRecentMistake = false,
  isPrerequisiteForWeakTopic = false
}) {
  const knowledgeGap = (100 - mastery) / 100;
  const forgettingRisk = clamp(daysSinceLastReview / 7, 0, 1);
  const deadlineUrgency =
    typeof daysUntilExam === 'number' ? clamp(14 / Math.max(daysUntilExam, 1), 1, 1.5) : 1;
  const misconceptionMultiplier = hasRecentHighConfidenceMistake ? 1.25 : 1;
  const prerequisiteMultiplier = isPrerequisiteForWeakTopic ? 1.2 : 1;

  const score =
    knowledgeGap *
    examWeight *
    (0.6 + 0.4 * forgettingRisk) *
    deadlineUrgency *
    misconceptionMultiplier *
    prerequisiteMultiplier;

  const reasons = [];
  if (mastery < 50) reasons.push(REASON_CODES.LOW_MASTERY);
  if (examWeight >= 0.15) reasons.push(REASON_CODES.HIGH_EXAM_WEIGHT);
  if (hasRecentHighConfidenceMistake) reasons.push(REASON_CODES.HIGH_CONFIDENCE_MISTAKE);
  else if (hasRecentMistake) reasons.push(REASON_CODES.RECENT_MISTAKE);
  if (forgettingRisk >= 0.85) reasons.push(REASON_CODES.REVIEW_DUE);
  if (typeof daysUntilExam === 'number' && daysUntilExam <= 7) reasons.push(REASON_CODES.EXAM_DATE_NEAR);
  if (isPrerequisiteForWeakTopic) reasons.push(REASON_CODES.REQUIRED_PREREQUISITE);

  return { score: Math.round(score * 1000) / 1000, reasons };
}

/**
 * Ranks every topic by priority score, descending. `topics` is an array of
 * the raw per-topic inputs `calculateTopicPriority` expects, each carrying a
 * `topic` key through untouched.
 */
export function rankTopics(topics) {
  return topics
    .map((t) => ({ topic: t.topic, ...calculateTopicPriority(t) }))
    .sort((a, b) => b.score - a.score);
}
