import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInterventionEffectiveness } from '../engines/interventionEffectiveness.js';

test('Case H: intervention metrics correctly compare mastery and score before and after', () => {
  const results = [
    { learnerId: 1, masteryBefore: 40, masteryAfter: 65, relatedScoreBefore: 55, relatedScoreAfter: 75, completed: true },
    { learnerId: 2, masteryBefore: 45, masteryAfter: 68, relatedScoreBefore: 50, relatedScoreAfter: 70, completed: true },
    { learnerId: 3, masteryBefore: 44, completed: false }
  ];
  const result = calculateInterventionEffectiveness(results);
  assert.equal(result.assignedCount, 3);
  assert.equal(result.completedCount, 2);
  assert.equal(result.averageMasteryBefore, 43); // (40+45)/2 rounded — 42.5 -> 43
  assert.equal(result.averageMasteryAfter, 67); // (65+68)/2 = 66.5 -> 67
  assert.equal(result.improved, true);
});

test('a small completed sample is flagged so trainers do not over-read the result', () => {
  const results = [{ learnerId: 1, masteryBefore: 40, masteryAfter: 60, completed: true }];
  const result = calculateInterventionEffectiveness(results);
  assert.equal(result.smallSample, true);
});

test('no completions yet reports null before/after rather than misleading zeros', () => {
  const results = [{ learnerId: 1, completed: false }, { learnerId: 2, completed: false }];
  const result = calculateInterventionEffectiveness(results);
  assert.equal(result.completedCount, 0);
  assert.equal(result.averageMasteryBefore, null);
  assert.equal(result.improved, false);
});
