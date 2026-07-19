// Deterministic learner-risk detection (spec §12.4). Labels are supportive,
// never judgmental — a learner is never described as failing, only as
// needing a particular kind of attention.

export const RISK_STATUS = {
  NEEDS_HELP_NOW: 'Cần hỗ trợ ngay',
  NEEDS_MONITORING: 'Cần theo dõi',
  IMPROVING: 'Đang cải thiện',
  STABLE: 'Ổn định',
  INSUFFICIENT_DATA: 'Chưa đủ dữ liệu'
};

/**
 * @param {object} input
 * @param {number[]} input.recentScoresChronological - most recent last
 * @param {number} input.targetScore
 * @param {number} [input.summitReadiness] - 0-100
 * @param {number} [input.daysUntilExam]
 * @param {number} [input.highConfidenceMistakeCount]
 * @param {number} [input.unansweredCount]
 * @param {boolean} [input.hasAttemptedAssigned]
 * @param {number} [input.masteryImprovement] - percentage points gained recently
 * @param {number} [input.recentActivityCount] - # of practice attempts recently
 * @param {number} [input.daysSinceLastReview]
 * @returns {{ status: string, reasons: string[], recommendedAction: string }}
 */
export function detectLearnerRisk({
  recentScoresChronological = [],
  targetScore = 70,
  summitReadiness,
  daysUntilExam,
  highConfidenceMistakeCount = 0,
  unansweredCount = 0,
  hasAttemptedAssigned = true,
  masteryImprovement,
  recentActivityCount = 0,
  daysSinceLastReview
} = {}) {
  const reasons = [];

  if (recentScoresChronological.length === 0) {
    if (!hasAttemptedAssigned) {
      reasons.push('Chưa làm bài thi thử đã được giao.');
      return { status: RISK_STATUS.NEEDS_HELP_NOW, reasons, recommendedAction: 'Nhắc học viên hoàn thành bài thi thử' };
    }
    return { status: RISK_STATUS.INSUFFICIENT_DATA, reasons: ['Chưa có đủ dữ liệu thi thử.'], recommendedAction: 'Theo dõi thêm' };
  }

  const latest = recentScoresChronological[recentScoresChronological.length - 1];
  const lastTwo = recentScoresChronological.slice(-2);
  const belowTwoConsecutive = lastTwo.length === 2 && lastTwo.every((s) => s < targetScore);

  if (belowTwoConsecutive) reasons.push('Điểm dưới ngưỡng mục tiêu 2 lần thi thử liên tiếp.');
  else if (latest < targetScore) reasons.push('Điểm bài thi thử gần nhất dưới ngưỡng mục tiêu.');

  if (typeof summitReadiness === 'number' && summitReadiness < 60) reasons.push('Summit Readiness dưới 60%.');
  if (typeof daysUntilExam === 'number' && daysUntilExam <= 7 && (latest < targetScore || (summitReadiness ?? 100) < 60)) {
    reasons.push('Ngày thi đang đến gần trong khi kết quả chưa ổn.');
  }
  if (highConfidenceMistakeCount >= 3) reasons.push('Có nhiều lần trả lời sai dù rất tự tin.');
  if (unansweredCount >= 3) reasons.push('Bỏ trống nhiều câu hỏi lặp lại.');
  if (recentScoresChronological.length >= 3) {
    const totalChange = latest - recentScoresChronological[0];
    if (totalChange <= 0 && recentActivityCount >= 3) reasons.push('Học khá chăm nhưng điểm chưa cải thiện.');
  }
  if (typeof daysSinceLastReview === 'number' && daysSinceLastReview >= 14) reasons.push('Đã lâu chưa ôn lại, kiến thức có thể phai nhạt.');

  const totalChange = recentScoresChronological.length >= 2 ? latest - recentScoresChronological[0] : 0;
  const largeDecline = recentScoresChronological.length >= 2 && (recentScoresChronological[recentScoresChronological.length - 2] - latest) >= 15;
  if (largeDecline) reasons.push('Điểm giảm mạnh so với lần thi trước.');

  let status;
  let recommendedAction;
  if (belowTwoConsecutive || largeDecline || (highConfidenceMistakeCount >= 3 && latest < targetScore)) {
    status = RISK_STATUS.NEEDS_HELP_NOW;
    recommendedAction = 'Tạo Rescue Expedition cho học viên này';
  } else if (reasons.length > 0) {
    status = RISK_STATUS.NEEDS_MONITORING;
    recommendedAction = 'Theo dõi thêm 1-2 lần thi thử tới';
  } else if (totalChange > 0) {
    status = RISK_STATUS.IMPROVING;
    recommendedAction = 'Tiếp tục lộ trình hiện tại';
  } else {
    status = RISK_STATUS.STABLE;
    recommendedAction = 'Không cần hành động thêm';
  }

  return { status, reasons, recommendedAction };
}
