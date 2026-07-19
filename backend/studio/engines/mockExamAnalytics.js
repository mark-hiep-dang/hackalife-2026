// Deterministic Mock Exam Analytics (spec §12, §20). All numbers here are
// application logic — the LLM (studioAIService.summarizeMockExamInsight)
// only turns the numbers into friendly sentences afterward.

export function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * @param {{score:number, totalQuestions:number, unansweredCount:number, completionTimeSeconds:number, summitReadinessBefore?:number}[]} attempts
 * @param {number} targetScore
 * @param {{score:number}[]} [previousAttempts]
 */
export function calculateCohortOverview(attempts, targetScore, previousAttempts = []) {
  const scores = attempts.map((a) => a.score);
  const averageScore = Math.round(mean(scores) * 10) / 10;
  const medianScore = median(scores);
  const highestScore = scores.length ? Math.max(...scores) : 0;
  const lowestScore = scores.length ? Math.min(...scores) : 0;
  const aboveThreshold = scores.filter((s) => s >= targetScore).length;
  const belowThreshold = scores.filter((s) => s < targetScore).length;
  const passRate = attempts.length ? Math.round((aboveThreshold / attempts.length) * 100) : 0;
  const averageCompletionTime = Math.round(mean(attempts.map((a) => a.completionTimeSeconds || 0)));
  const averageSummitReadiness = Math.round(mean(attempts.map((a) => a.summitReadinessBefore ?? 0)));

  const previousAverage = previousAttempts.length ? mean(previousAttempts.map((a) => a.score)) : null;
  const changeFromPrevious = previousAverage !== null ? Math.round((averageScore - previousAverage) * 10) / 10 : null;

  return {
    averageScore, medianScore, highestScore, lowestScore, passRate,
    aboveThreshold, belowThreshold, averageCompletionTime, averageSummitReadiness, changeFromPrevious,
    attemptedCount: attempts.length
  };
}

const RISK_THRESHOLDS = { high: 60, medium: 75 };

function riskLabel(averageScore) {
  if (averageScore < RISK_THRESHOLDS.high) return 'Cao';
  if (averageScore < RISK_THRESHOLDS.medium) return 'Trung bình';
  return 'Thấp';
}

/**
 * @param {{topic:string, isCorrect:boolean, confidence?:string, responseTimeMs?:number, mistakeType?:string}[]} answers
 * @param {number} masteryThreshold
 * @param {Record<string, number>} [previousTopicAverages] - topic -> average % from a prior exam, for trend
 */
export function calculateTopicPerformance(answers, masteryThreshold = 70, previousTopicAverages = {}) {
  const byTopic = new Map();
  for (const a of answers) {
    if (!byTopic.has(a.topic)) byTopic.set(a.topic, []);
    byTopic.get(a.topic).push(a);
  }

  const results = [];
  for (const [topic, topicAnswers] of byTopic) {
    const correctCount = topicAnswers.filter((a) => a.isCorrect).length;
    const correctRate = Math.round((correctCount / topicAnswers.length) * 100);
    const confidences = topicAnswers.filter((a) => a.confidence).map((a) => (a.confidence === 'certain' ? 100 : a.confidence === 'fairly_sure' ? 66 : 33));
    const averageConfidence = confidences.length ? Math.round(mean(confidences)) : null;
    const averageResponseTime = Math.round(mean(topicAnswers.filter((a) => a.responseTimeMs).map((a) => a.responseTimeMs)));

    // Learners below mastery threshold on this topic (by their own accuracy).
    const byLearner = new Map();
    for (const a of topicAnswers) {
      if (!a.learnerId) continue;
      if (!byLearner.has(a.learnerId)) byLearner.set(a.learnerId, []);
      byLearner.get(a.learnerId).push(a);
    }
    let belowMasteryCount = 0;
    for (const learnerAnswers of byLearner.values()) {
      const rate = (learnerAnswers.filter((a) => a.isCorrect).length / learnerAnswers.length) * 100;
      if (rate < masteryThreshold) belowMasteryCount++;
    }

    const mistakeCounts = {};
    for (const a of topicAnswers) if (a.mistakeType) mistakeCounts[a.mistakeType] = (mistakeCounts[a.mistakeType] || 0) + 1;
    const commonIssue = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const previous = previousTopicAverages[topic];
    const change = typeof previous === 'number' ? Math.round(correctRate - previous) : null;

    results.push({
      topic, correctRate, averageConfidence, averageResponseTime,
      belowMasteryCount, commonIssue, change, risk: riskLabel(correctRate),
      recommendedAction: correctRate < RISK_THRESHOLDS.high ? 'Tạo Rescue Expedition' : correctRate < RISK_THRESHOLDS.medium ? 'Theo dõi thêm' : 'Không cần hành động'
    });
  }

  return results.sort((a, b) => a.correctRate - b.correctRate);
}

/**
 * @param {number[]} scoresChronological
 * @returns {'high_stable'|'improving'|'plateauing'|'declining'|'inconsistent'|'insufficient_data'}
 */
export function classifyTrend(scoresChronological) {
  if (scoresChronological.length < 2) return 'insufficient_data';

  const diffs = [];
  for (let i = 1; i < scoresChronological.length; i++) diffs.push(scoresChronological[i] - scoresChronological[i - 1]);

  const totalChange = scoresChronological[scoresChronological.length - 1] - scoresChronological[0];
  const avgScore = mean(scoresChronological);
  const variance = mean(diffs.map((d) => Math.abs(d)));

  if (avgScore >= 85 && variance <= 5) return 'high_stable';
  if (variance >= 15) return 'inconsistent';
  if (totalChange >= 8) return 'improving';
  if (totalChange <= -8) return 'declining';
  return 'plateauing';
}
