// Deterministic "học sinh cá biệt" (outlier-pattern) detection. Distinct from
// learnerRisk.js: this is not about being weak (low mastery/score), it's about
// unusual BEHAVIOR that a plain threshold would miss. Same supportive,
// never-judgmental tone as learnerRisk.js — a pattern is a signal to look
// closer, never a verdict.

export const OUTLIER_PATTERN = {
  DILIGENT_NO_PROGRESS: 'Chăm nhưng chưa lên',
  ERRATIC_SWINGS: 'Lên xuống thất thường',
  SUSPECTED_GUESSING: 'Nghi đoán may rủi',
  DISENGAGE_REENGAGE_CYCLE: 'Học rồi nghỉ, nghỉ rồi học lại',
  SILENT_LOW_SUPPORT_ENGAGEMENT: 'Im lặng, ít tương tác hỗ trợ'
};

// Minimum-sample gates, same spirit as misconceptionCluster.js's
// MIN_CLUSTER_SIZE — a pattern only "exists" once there's enough history to
// distinguish it from noise.
const MIN_TOPICS_WITH_TREND = 2;
const MIN_MASTERY_POINTS_PER_TOPIC = 4;
const FLAT_MASTERY_DELTA = 3;
const DILIGENT_ACTIVITY_THRESHOLD = 8;

const MIN_ANSWERS_FOR_ERRATIC = 8;
const FLIP_RATE_THRESHOLD = 0.55;
const ERRATIC_MIN_CORRECT_RATE = 0.25;
const ERRATIC_MAX_CORRECT_RATE = 0.75;

const MIN_HARD_ANSWERS_FOR_GUESS = 5;
const MIN_FAST_CORRECT_HARD = 3;
const GUESS_FAST_RATIO_THRESHOLD = 0.5;
const GUESS_SPEED_CUTOFF_RATIO = 0.4; // same "isFast" cutoff as engines/mistakeDNA.js
const GUESS_MASTERY_CEILING = 60;

const MIN_QUIZ_ATTEMPTS_FOR_CYCLE = 6;
const GAP_THRESHOLD_DAYS = 5;
const MIN_GAP_CYCLES = 2;

const MIN_QUALIFYING_RESCUE_MOMENTS = 3;
const MAX_OPEN_RATIO_FOR_SILENT = 0.2;

/**
 * @param {object} input
 * @param {{topic:string, masteryScore:number, createdAt:string}[]} [input.masteryHistory] - chronological asc
 * @param {number} [input.recentActivityCount] - total quiz/practice attempts
 * @param {{isCorrect:boolean, difficulty?:string, responseTimeMs?:number, topic?:string}[]} [input.answersChronological] - oldest→newest
 * @param {Object<string,number>} [input.topicMasteryByTopic]
 * @param {string[]} [input.quizTimestampsChronological] - oldest→newest
 * @param {number} [input.qualifyingRescueOpportunityCount] - wrong answers with mistake_type concept_confusion/memory_decay
 * @param {number} [input.rescueTrailOpenedCount]
 * @param {number} [input.expectedTimeMs]
 * @returns {{ type: string, reason: string }[]}
 */
export function detectOutlierPatterns({
  masteryHistory = [],
  recentActivityCount = 0,
  answersChronological = [],
  topicMasteryByTopic = {},
  quizTimestampsChronological = [],
  qualifyingRescueOpportunityCount = 0,
  rescueTrailOpenedCount = 0,
  expectedTimeMs = 45000
} = {}) {
  const patterns = [];

  // 1. Diligent but not improving.
  const byTopic = new Map();
  for (const m of masteryHistory) {
    if (!byTopic.has(m.topic)) byTopic.set(m.topic, []);
    byTopic.get(m.topic).push(m.masteryScore);
  }
  const trendedTopics = [...byTopic.values()].filter((points) => points.length >= MIN_MASTERY_POINTS_PER_TOPIC);
  if (trendedTopics.length >= MIN_TOPICS_WITH_TREND && recentActivityCount >= DILIGENT_ACTIVITY_THRESHOLD) {
    const deltas = trendedTopics.map((points) => points[points.length - 1] - points[0]);
    const flatOrDeclining = deltas.filter((d) => d <= FLAT_MASTERY_DELTA).length;
    if (flatOrDeclining === trendedTopics.length) {
      patterns.push({
        type: OUTLIER_PATTERN.DILIGENT_NO_PROGRESS,
        reason: `Đã học ${recentActivityCount} lần nhưng mastery ở ${trendedTopics.length} chủ đề không nhích lên.`
      });
    }
  }

  // 2. Erratic swings — not simply weak, genuinely unstable.
  if (answersChronological.length >= MIN_ANSWERS_FOR_ERRATIC) {
    let flips = 0;
    for (let i = 1; i < answersChronological.length; i++) {
      if (answersChronological[i].isCorrect !== answersChronological[i - 1].isCorrect) flips++;
    }
    const flipRate = flips / (answersChronological.length - 1);
    const correctRate = answersChronological.filter((a) => a.isCorrect).length / answersChronological.length;
    if (flipRate >= FLIP_RATE_THRESHOLD && correctRate > ERRATIC_MIN_CORRECT_RATE && correctRate < ERRATIC_MAX_CORRECT_RATE) {
      patterns.push({ type: OUTLIER_PATTERN.ERRATIC_SWINGS, reason: 'Đúng/sai xen kẽ liên tục, chưa thấy xu hướng ổn định.' });
    }
  }

  // 3. Suspected guessing — correct, but suspiciously fast on hard questions.
  const hardAnswers = answersChronological.filter((a) => a.difficulty === 'Khó');
  if (hardAnswers.length >= MIN_HARD_ANSWERS_FOR_GUESS) {
    const fastCorrectHard = hardAnswers.filter(
      (a) => a.isCorrect && typeof a.responseTimeMs === 'number' && a.responseTimeMs < expectedTimeMs * GUESS_SPEED_CUTOFF_RATIO
    );
    const ratio = fastCorrectHard.length / hardAnswers.length;
    const topicsInvolved = [...new Set(fastCorrectHard.map((a) => a.topic))];
    const stillMediocre = topicsInvolved.some((t) => (topicMasteryByTopic[t] ?? 0) < GUESS_MASTERY_CEILING);
    if (fastCorrectHard.length >= MIN_FAST_CORRECT_HARD && ratio >= GUESS_FAST_RATIO_THRESHOLD && stillMediocre) {
      patterns.push({ type: OUTLIER_PATTERN.SUSPECTED_GUESSING, reason: 'Trả lời đúng câu khó nhưng nhanh bất thường, có thể đang đoán.' });
    }
  }

  // 4. Repeated drop-off / re-engage cycles — distinct from one flat streak break.
  if (quizTimestampsChronological.length >= MIN_QUIZ_ATTEMPTS_FOR_CYCLE) {
    let gapCount = 0;
    for (let i = 1; i < quizTimestampsChronological.length; i++) {
      const days = (new Date(quizTimestampsChronological[i]) - new Date(quizTimestampsChronological[i - 1])) / 86400000;
      if (days >= GAP_THRESHOLD_DAYS) gapCount++;
    }
    if (gapCount >= MIN_GAP_CYCLES) {
      patterns.push({ type: OUTLIER_PATTERN.DISENGAGE_REENGAGE_CYCLE, reason: `Đã nghỉ rồi quay lại học ${gapCount} lần.` });
    }
  }

  // 5. Silent / near-zero support engagement — gated on having had a real
  // opportunity, so a learner with no qualifying mistakes is never flagged.
  if (qualifyingRescueOpportunityCount >= MIN_QUALIFYING_RESCUE_MOMENTS) {
    const openRatio = rescueTrailOpenedCount / qualifyingRescueOpportunityCount;
    if (openRatio <= MAX_OPEN_RATIO_FOR_SILENT) {
      patterns.push({ type: OUTLIER_PATTERN.SILENT_LOW_SUPPORT_ENGAGEMENT, reason: 'Có nhiều thời điểm đáng ra cần Rescue Trail nhưng hầu như không mở.' });
    }
  }

  return patterns;
}
