import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCohortOverview, calculateTopicPerformance, classifyTrend, mean, median } from '../engines/mockExamAnalytics.js';

test('mean/median: basic correctness', () => {
  assert.equal(mean([70, 80, 90]), 80);
  assert.equal(median([70, 80, 90]), 80);
  assert.equal(median([70, 80, 90, 100]), 85);
});

test('calculateCohortOverview: average, median, pass rate, and change from previous', () => {
  const attempts = [
    { score: 58, totalQuestions: 40, completionTimeSeconds: 2000, summitReadinessBefore: 55 },
    { score: 82, totalQuestions: 40, completionTimeSeconds: 2200, summitReadinessBefore: 70 },
    { score: 45, totalQuestions: 40, completionTimeSeconds: 1800, summitReadinessBefore: 40 }
  ];
  const result = calculateCohortOverview(attempts, 70, [{ score: 50 }, { score: 60 }]);
  assert.equal(result.averageScore, 61.7);
  assert.equal(result.highestScore, 82);
  assert.equal(result.lowestScore, 45);
  assert.equal(result.aboveThreshold, 1);
  assert.equal(result.belowThreshold, 2);
  assert.ok(result.changeFromPrevious > 0);
});

test('calculateTopicPerformance: ranks the weakest topic first and flags high risk', () => {
  const answers = [
    { topic: 'A', isCorrect: true, learnerId: 1 },
    { topic: 'A', isCorrect: true, learnerId: 2 },
    { topic: 'B', isCorrect: false, learnerId: 1, mistakeType: 'concept_confusion' },
    { topic: 'B', isCorrect: false, learnerId: 2, mistakeType: 'concept_confusion' },
    { topic: 'B', isCorrect: false, learnerId: 3, mistakeType: 'concept_confusion' }
  ];
  const results = calculateTopicPerformance(answers, 70);
  assert.equal(results[0].topic, 'B');
  assert.equal(results[0].risk, 'Cao');
  assert.equal(results[0].commonIssue, 'concept_confusion');
  assert.equal(results[0].recommendedAction, 'Tạo Rescue Expedition');
});

test('classifyTrend: classifies improving, declining, plateauing, inconsistent, and insufficient data', () => {
  assert.equal(classifyTrend([58, 67, 76]), 'improving');
  assert.equal(classifyTrend([80, 70, 60]), 'declining');
  assert.equal(classifyTrend([70, 71, 70]), 'plateauing');
  assert.equal(classifyTrend([50, 90, 40, 85]), 'inconsistent');
  assert.equal(classifyTrend([75]), 'insufficient_data');
  assert.equal(classifyTrend([90, 91, 89]), 'high_stable');
});
