import test from 'node:test';
import assert from 'node:assert/strict';
import { detectOutlierPatterns, OUTLIER_PATTERN } from '../engines/outlierPatterns.js';

test('no data at all returns no patterns, not a false flag', () => {
  const patterns = detectOutlierPatterns({});
  assert.deepEqual(patterns, []);
});

test('a learner with high activity but flat mastery across topics is flagged diligent-no-progress', () => {
  const patterns = detectOutlierPatterns({
    masteryHistory: [
      { topic: 'A', masteryScore: 40 }, { topic: 'A', masteryScore: 41 }, { topic: 'A', masteryScore: 42 }, { topic: 'A', masteryScore: 42 },
      { topic: 'B', masteryScore: 50 }, { topic: 'B', masteryScore: 51 }, { topic: 'B', masteryScore: 52 }, { topic: 'B', masteryScore: 51 }
    ],
    recentActivityCount: 10
  });
  assert.ok(patterns.some((p) => p.type === OUTLIER_PATTERN.DILIGENT_NO_PROGRESS));
});

test('flat mastery on only one trended topic is not enough to flag diligent-no-progress', () => {
  const patterns = detectOutlierPatterns({
    masteryHistory: [
      { topic: 'A', masteryScore: 40 }, { topic: 'A', masteryScore: 41 }, { topic: 'A', masteryScore: 42 }, { topic: 'A', masteryScore: 42 },
      { topic: 'B', masteryScore: 50 }, { topic: 'B', masteryScore: 51 }
    ],
    recentActivityCount: 10
  });
  assert.ok(!patterns.some((p) => p.type === OUTLIER_PATTERN.DILIGENT_NO_PROGRESS));
});

test('alternating correct/incorrect answers are flagged as erratic swings', () => {
  const answers = [true, false, true, false, true, false, true, false, true, false].map((isCorrect) => ({ isCorrect }));
  const patterns = detectOutlierPatterns({ answersChronological: answers });
  assert.ok(patterns.some((p) => p.type === OUTLIER_PATTERN.ERRATIC_SWINGS));
});

test('uniformly wrong answers are not erratic — that stays learnerRisk.js\'s job, not this one\'s', () => {
  const answers = Array.from({ length: 10 }, () => ({ isCorrect: false }));
  const patterns = detectOutlierPatterns({ answersChronological: answers });
  assert.ok(!patterns.some((p) => p.type === OUTLIER_PATTERN.ERRATIC_SWINGS));
});

test('correct but suspiciously fast answers on hard questions with still-mediocre mastery are flagged as suspected guessing', () => {
  const hardAnswers = [
    { isCorrect: true, difficulty: 'Khó', responseTimeMs: 5000, topic: 'X' },
    { isCorrect: true, difficulty: 'Khó', responseTimeMs: 5000, topic: 'X' },
    { isCorrect: true, difficulty: 'Khó', responseTimeMs: 5000, topic: 'X' },
    { isCorrect: true, difficulty: 'Khó', responseTimeMs: 5000, topic: 'X' },
    { isCorrect: false, difficulty: 'Khó', responseTimeMs: 40000, topic: 'X' }
  ];
  const patterns = detectOutlierPatterns({ answersChronological: hardAnswers, topicMasteryByTopic: { X: 40 } });
  assert.ok(patterns.some((p) => p.type === OUTLIER_PATTERN.SUSPECTED_GUESSING));
});

test('fewer than the minimum sample of hard questions is not enough to flag guessing', () => {
  const hardAnswers = [
    { isCorrect: true, difficulty: 'Khó', responseTimeMs: 5000, topic: 'X' },
    { isCorrect: true, difficulty: 'Khó', responseTimeMs: 5000, topic: 'X' },
    { isCorrect: true, difficulty: 'Khó', responseTimeMs: 5000, topic: 'X' }
  ];
  const patterns = detectOutlierPatterns({ answersChronological: hardAnswers, topicMasteryByTopic: { X: 40 } });
  assert.ok(!patterns.some((p) => p.type === OUTLIER_PATTERN.SUSPECTED_GUESSING));
});

test('fast, correct answers on a topic the learner has genuinely mastered are not flagged as guessing', () => {
  const hardAnswers = Array.from({ length: 5 }, () => ({ isCorrect: true, difficulty: 'Khó', responseTimeMs: 5000, topic: 'X' }));
  const patterns = detectOutlierPatterns({ answersChronological: hardAnswers, topicMasteryByTopic: { X: 90 } });
  assert.ok(!patterns.some((p) => p.type === OUTLIER_PATTERN.SUSPECTED_GUESSING));
});

test('two or more gaps of 5+ days between quiz attempts are flagged as a repeated disengage/re-engage cycle', () => {
  const timestamps = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-10', '2024-01-11', '2024-01-20'];
  const patterns = detectOutlierPatterns({ quizTimestampsChronological: timestamps });
  assert.ok(patterns.some((p) => p.type === OUTLIER_PATTERN.DISENGAGE_REENGAGE_CYCLE));
});

test('a single gap is a normal break, not a repeated cycle', () => {
  const timestamps = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-15'];
  const patterns = detectOutlierPatterns({ quizTimestampsChronological: timestamps });
  assert.ok(!patterns.some((p) => p.type === OUTLIER_PATTERN.DISENGAGE_REENGAGE_CYCLE));
});

test('rarely opening Rescue Trail despite having qualifying moments is flagged as silent/low support engagement', () => {
  const patterns = detectOutlierPatterns({ qualifyingRescueOpportunityCount: 5, rescueTrailOpenedCount: 0 });
  assert.ok(patterns.some((p) => p.type === OUTLIER_PATTERN.SILENT_LOW_SUPPORT_ENGAGEMENT));
});

test('a learner who never had a qualifying mistake is not flagged as silent, even with zero opens', () => {
  const patterns = detectOutlierPatterns({ qualifyingRescueOpportunityCount: 0, rescueTrailOpenedCount: 0 });
  assert.ok(!patterns.some((p) => p.type === OUTLIER_PATTERN.SILENT_LOW_SUPPORT_ENGAGEMENT));
});

test('a learner matching multiple patterns at once gets all of them returned', () => {
  const answers = [true, false, true, false, true, false, true, false, true, false].map((isCorrect) => ({ isCorrect }));
  const patterns = detectOutlierPatterns({
    answersChronological: answers,
    qualifyingRescueOpportunityCount: 5,
    rescueTrailOpenedCount: 0
  });
  assert.ok(patterns.some((p) => p.type === OUTLIER_PATTERN.ERRATIC_SWINGS));
  assert.ok(patterns.some((p) => p.type === OUTLIER_PATTERN.SILENT_LOW_SUPPORT_ENGAGEMENT));
  assert.equal(patterns.length, 2);
});

test('a genuinely healthy learner (steady gains, consistent correctness, no big gaps, engages when it matters) matches no patterns', () => {
  const patterns = detectOutlierPatterns({
    masteryHistory: [
      { topic: 'A', masteryScore: 40 }, { topic: 'A', masteryScore: 55 }, { topic: 'A', masteryScore: 70 }, { topic: 'A', masteryScore: 85 }
    ],
    recentActivityCount: 10,
    answersChronological: [
      { isCorrect: true, difficulty: 'Dễ', responseTimeMs: 40000, topic: 'A' },
      { isCorrect: true, difficulty: 'Dễ', responseTimeMs: 40000, topic: 'A' },
      { isCorrect: true, difficulty: 'Khó', responseTimeMs: 44000, topic: 'A' },
      { isCorrect: true, difficulty: 'Khó', responseTimeMs: 44000, topic: 'A' },
      { isCorrect: false, difficulty: 'Khó', responseTimeMs: 44000, topic: 'A' },
      { isCorrect: true, difficulty: 'Trung bình', responseTimeMs: 40000, topic: 'A' },
      { isCorrect: true, difficulty: 'Trung bình', responseTimeMs: 40000, topic: 'A' },
      { isCorrect: true, difficulty: 'Trung bình', responseTimeMs: 40000, topic: 'A' },
      { isCorrect: true, difficulty: 'Trung bình', responseTimeMs: 40000, topic: 'A' },
      { isCorrect: true, difficulty: 'Trung bình', responseTimeMs: 40000, topic: 'A' }
    ],
    topicMasteryByTopic: { A: 85 },
    quizTimestampsChronological: ['2024-01-01', '2024-01-03', '2024-01-05', '2024-01-07', '2024-01-09', '2024-01-11'],
    qualifyingRescueOpportunityCount: 4,
    rescueTrailOpenedCount: 4
  });
  assert.deepEqual(patterns, []);
});
