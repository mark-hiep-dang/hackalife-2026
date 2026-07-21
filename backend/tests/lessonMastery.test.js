import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLessonMastery } from '../engines/lessonMastery.js';

test('lessonMastery: averages mastery across the lesson\'s mapped topics', () => {
  const result = calculateLessonMastery([{ mastery_score: 40 }, { mastery_score: 60 }]);
  assert.equal(result.mastery, 50);
  assert.equal(result.hasEvidence, true);
});

test('lessonMastery: no evidence at all yields 0 mastery, not a crash', () => {
  const result = calculateLessonMastery([]);
  assert.equal(result.mastery, 0);
  assert.equal(result.hasEvidence, false);
  assert.equal(result.daysSinceLastReview, undefined);
});

test('lessonMastery: daysSinceLastReview uses the MOST RECENT of the mapped topics, not the oldest', () => {
  const recentDate = new Date(Date.now() - 2 * 86400000).toISOString();
  const oldDate = new Date(Date.now() - 20 * 86400000).toISOString();
  const result = calculateLessonMastery([
    { mastery_score: 50, last_reviewed_at: oldDate },
    { mastery_score: 50, last_reviewed_at: recentDate }
  ]);
  assert.equal(result.daysSinceLastReview, 2);
});
