// Lesson-level mastery is not a new stored value — `topic_mastery` already
// tracks mastery per real exam topic, and a lesson/camp covers 2 of those
// topics (see backend/campTopicMap.js). This just rolls that up. Pure
// function — no DB access — so it stays unit-testable without a DB.

/**
 * @param {{ mastery_score: number, last_reviewed_at?: string|null }[]} topicMasteryRows
 *   rows already fetched for exactly this lesson's mapped topics
 * @returns {{ mastery: number, daysSinceLastReview: number|undefined, hasEvidence: boolean }}
 */
export function calculateLessonMastery(topicMasteryRows = []) {
  const scores = topicMasteryRows.map((r) => r.mastery_score).filter((v) => typeof v === 'number');
  const mastery = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;

  const reviewDates = topicMasteryRows
    .map((r) => r.last_reviewed_at)
    .filter(Boolean)
    .map((d) => new Date(d));
  const daysSinceLastReview = reviewDates.length
    ? Math.min(...reviewDates.map((d) => Math.max(0, Math.round((Date.now() - d.getTime()) / 86400000))))
    : undefined;

  return { mastery, daysSinceLastReview, hasEvidence: scores.length > 0 };
}
