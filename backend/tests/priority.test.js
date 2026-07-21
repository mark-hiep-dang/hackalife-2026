import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTopicPriority, rankTopics, REASON_CODES } from '../engines/priority.js';
import { buildPriorityExplanation } from '../engines/reasonCopy.js';

test('priority: a weak, high-exam-weight topic outranks a strong, low-weight one', () => {
  const weak = calculateTopicPriority({ mastery: 30, examWeight: 0.2, daysSinceLastReview: 3 });
  const strong = calculateTopicPriority({ mastery: 90, examWeight: 0.05, daysSinceLastReview: 3 });
  assert.ok(weak.score > strong.score);
  assert.ok(weak.reasons.includes(REASON_CODES.LOW_MASTERY));
});

test('priority: a recent high-confidence mistake boosts the score via misconception multiplier', () => {
  const base = calculateTopicPriority({ mastery: 60, examWeight: 0.15, daysSinceLastReview: 3 });
  const withMistake = calculateTopicPriority({
    mastery: 60,
    examWeight: 0.15,
    daysSinceLastReview: 3,
    hasRecentHighConfidenceMistake: true
  });
  assert.ok(withMistake.score > base.score);
  assert.ok(withMistake.reasons.includes(REASON_CODES.HIGH_CONFIDENCE_MISTAKE));
});

test('priority: exam date getting closer raises urgency for the same topic', () => {
  const farFromExam = calculateTopicPriority({ mastery: 50, examWeight: 0.15, daysUntilExam: 60 });
  const nearExam = calculateTopicPriority({ mastery: 50, examWeight: 0.15, daysUntilExam: 3 });
  assert.ok(nearExam.score > farFromExam.score);
  assert.ok(nearExam.reasons.includes(REASON_CODES.EXAM_DATE_NEAR));
});

test('priority: rankTopics sorts descending by score', () => {
  const ranked = rankTopics([
    { topic: 'A', mastery: 90, examWeight: 0.1 },
    { topic: 'B', mastery: 20, examWeight: 0.2 },
    { topic: 'C', mastery: 50, examWeight: 0.15 }
  ]);
  assert.equal(ranked[0].topic, 'B');
  assert.ok(ranked[0].score >= ranked[1].score);
  assert.ok(ranked[1].score >= ranked[2].score);
});

test('reasonCopy: turns reason codes into a readable sentence in both languages', () => {
  const text = buildPriorityExplanation([REASON_CODES.HIGH_CONFIDENCE_MISTAKE, REASON_CODES.REQUIRED_PREREQUISITE], 'Nghĩa vụ đại lý');
  assert.match(text.vi, /Nghĩa vụ đại lý/);
  assert.match(text.vi, /nhầm liên tiếp/);
  assert.match(text.vi, /kiến thức nền/);
  assert.match(text.en, /Nghĩa vụ đại lý/);
  assert.match(text.en, /mixed this up repeatedly/);
  assert.match(text.en, /foundational/);
});

test('reasonCopy: falls back to a generic sentence when there are no reasons', () => {
  const text = buildPriorityExplanation([], 'Nghĩa vụ đại lý');
  assert.match(text.vi, /Nghĩa vụ đại lý/);
  assert.match(text.en, /Nghĩa vụ đại lý/);
});
