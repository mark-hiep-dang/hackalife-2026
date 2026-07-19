import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSummitReadiness, aggregateReadinessInputs, readinessLabel } from '../engines/summitReadiness.js';

test('summitReadiness: higher mastery across the board yields a higher score', () => {
  const low = calculateSummitReadiness({ weightedSkillMastery: 30, retentionScore: 50, practiceConsistency: 50, timeManagementScore: 50 });
  const high = calculateSummitReadiness({ weightedSkillMastery: 90, retentionScore: 50, practiceConsistency: 50, timeManagementScore: 50 });
  assert.ok(high.score > low.score);
});

test('summitReadiness: mock exam data, when present, is blended in (not the sole driver)', () => {
  const withoutMock = calculateSummitReadiness({ weightedSkillMastery: 60, retentionScore: 60, practiceConsistency: 60, timeManagementScore: 60 });
  const withHighMock = calculateSummitReadiness({ weightedSkillMastery: 60, retentionScore: 60, practiceConsistency: 60, timeManagementScore: 60, mockExamScore: 95 });
  const withLowMock = calculateSummitReadiness({ weightedSkillMastery: 60, retentionScore: 60, practiceConsistency: 60, timeManagementScore: 60, mockExamScore: 20 });
  assert.ok(withHighMock.score > withoutMock.score);
  assert.ok(withLowMock.score < withoutMock.score);
  // Blended, not overriding: a 20% mock score shouldn't tank a 60-mastery learner to near 0.
  assert.ok(withLowMock.score > 30);
});

test('summitReadiness: labels map to the expected bands', () => {
  assert.equal(readinessLabel(20), 'Llama vẫn đang buộc dây giày');
  assert.equal(readinessLabel(50), 'Đã rời Base Camp');
  assert.equal(readinessLabel(70), 'Đang leo đúng hướng');
  assert.equal(readinessLabel(80), 'Thấy Summit rồi!');
  assert.equal(readinessLabel(95), 'Llama chuẩn bị cắm cờ');
});

test('summitReadiness: score is always within 0-100', () => {
  const { score } = calculateSummitReadiness({ weightedSkillMastery: 100, retentionScore: 100, practiceConsistency: 100, timeManagementScore: 100, mockExamScore: 100 });
  assert.ok(score <= 100);
});

test('aggregateReadinessInputs: topics never reviewed drag retention down', () => {
  const reviewed = aggregateReadinessInputs([{ mastery: 70, examWeight: 0.5, daysSinceLastReview: 1 }], 5);
  const neverReviewed = aggregateReadinessInputs([{ mastery: 70, examWeight: 0.5, daysSinceLastReview: undefined }], 5);
  assert.ok(reviewed.retentionScore > neverReviewed.retentionScore);
});

test('aggregateReadinessInputs: weighted mastery favors high-exam-weight topics', () => {
  const { weightedSkillMastery } = aggregateReadinessInputs(
    [
      { mastery: 90, examWeight: 0.1, daysSinceLastReview: 1 },
      { mastery: 30, examWeight: 0.9, daysSinceLastReview: 1 }
    ],
    5
  );
  assert.ok(weightedSkillMastery < 50); // dominated by the heavily-weighted weak topic
});
