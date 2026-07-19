import test from 'node:test';
import assert from 'node:assert/strict';
import { detectLearnerRisk, RISK_STATUS } from '../engines/learnerRisk.js';

test('Case D: a learner below threshold in two consecutive mock exams is flagged as needing help now', () => {
  const { status, reasons } = detectLearnerRisk({ recentScoresChronological: [55, 58], targetScore: 70 });
  assert.equal(status, RISK_STATUS.NEEDS_HELP_NOW);
  assert.ok(reasons.some((r) => r.includes('liên tiếp')));
});

test('a learner improving over time and above threshold is marked improving, not at risk', () => {
  const { status } = detectLearnerRisk({ recentScoresChronological: [60, 68, 78], targetScore: 70, summitReadiness: 80 });
  assert.equal(status, RISK_STATUS.IMPROVING);
});

test('a learner with no attempts and an unattempted assigned exam needs help now', () => {
  const { status, reasons } = detectLearnerRisk({ recentScoresChronological: [], hasAttemptedAssigned: false });
  assert.equal(status, RISK_STATUS.NEEDS_HELP_NOW);
  assert.ok(reasons[0].includes('Chưa làm bài'));
});

test('a learner with no data at all returns insufficient data, not a false risk flag', () => {
  const { status } = detectLearnerRisk({ recentScoresChronological: [] });
  assert.equal(status, RISK_STATUS.INSUFFICIENT_DATA);
});

test('a large score decline is flagged even without two consecutive low scores', () => {
  const { status, reasons } = detectLearnerRisk({ recentScoresChronological: [85, 60], targetScore: 70 });
  assert.equal(status, RISK_STATUS.NEEDS_HELP_NOW);
  assert.ok(reasons.some((r) => r.includes('giảm mạnh')));
});

test('a stable, on-target learner needing no action is labeled stable', () => {
  const { status } = detectLearnerRisk({ recentScoresChronological: [82, 82], targetScore: 70, summitReadiness: 85 });
  assert.equal(status, RISK_STATUS.STABLE);
});
