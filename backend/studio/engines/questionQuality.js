// Deterministic per-question analytics (spec §12.6). Flags questions for
// trainer review — never edits or archives anything automatically.

import { mean } from './mockExamAnalytics.js';

/**
 * @param {object} input
 * @param {string} input.questionText
 * @param {'Dễ'|'Trung bình'|'Khó'} input.difficulty
 * @param {boolean} [input.sourceExpired]
 * @param {{selectedOption:number, isCorrect:boolean, responseTimeMs?:number, isStrongLearner?:boolean, changedAnswer?:boolean, skipped?:boolean}[]} input.answers
 */
export function analyzeQuestionQuality({ questionText = '', difficulty = 'Trung bình', sourceExpired = false, answers = [] }) {
  const flags = [];
  const attempted = answers.filter((a) => !a.skipped);
  const total = attempted.length;
  if (total === 0) {
    return { correctRate: null, skipRate: answers.length ? 1 : 0, flags: ['NO_ATTEMPTS'], optionDistribution: {}, changeRate: 0, averageResponseTimeMs: null };
  }

  const correctCount = attempted.filter((a) => a.isCorrect).length;
  const correctRate = correctCount / total;
  const skipRate = answers.length ? (answers.length - total) / answers.length : 0;
  const changeRate = total ? attempted.filter((a) => a.changedAnswer).length / total : 0;
  const averageResponseTimeMs = Math.round(mean(attempted.filter((a) => a.responseTimeMs).map((a) => a.responseTimeMs)));

  const optionDistribution = {};
  for (const a of attempted) optionDistribution[a.selectedOption] = (optionDistribution[a.selectedOption] || 0) + 1;
  const mostSelectedWrong = Object.entries(optionDistribution)
    .filter(([opt]) => !attempted.find((a) => a.selectedOption === Number(opt))?.isCorrect)
    .sort((a, b) => b[1] - a[1])[0];

  const strong = attempted.filter((a) => a.isStrongLearner === true);
  const weak = attempted.filter((a) => a.isStrongLearner === false);
  const strongCorrectRate = strong.length ? strong.filter((a) => a.isCorrect).length / strong.length : null;
  const weakCorrectRate = weak.length ? weak.filter((a) => a.isCorrect).length / weak.length : null;

  if (correctRate > 0.95) flags.push('TOO_EASY');
  if (correctRate < 0.2) flags.push('TOO_DIFFICULT');

  // High incorrect rate for BOTH strong and weak learners → likely unclear
  // wording rather than a genuine knowledge gap (spec's Case F / example).
  if (correctRate < 0.3 && strong.length >= 2 && strongCorrectRate !== null && strongCorrectRate < 0.5) {
    flags.push('UNCLEAR_OR_MISLEADING');
  }

  if (strongCorrectRate !== null && weakCorrectRate !== null && strong.length >= 2 && weak.length >= 2) {
    if (Math.abs(strongCorrectRate - weakCorrectRate) < 0.1 && correctRate > 0.15 && correctRate < 0.85) {
      flags.push('LOW_DISCRIMINATION');
    }
  }

  const difficultyRank = { 'Dễ': 0, 'Trung bình': 1, 'Khó': 2 };
  if (difficultyRank[difficulty] === 0 && correctRate < 0.5) flags.push('DIFFICULTY_MISMATCH');
  if (difficultyRank[difficulty] === 2 && correctRate > 0.9) flags.push('DIFFICULTY_MISMATCH');

  if (questionText.length > 220) flags.push('WORDING_TOO_LONG');
  if (/không|ngoại trừ|trừ trường hợp/i.test(questionText) && averageResponseTimeMs && averageResponseTimeMs < 20000 && correctRate < 0.6) {
    flags.push('NEGATIVE_WORDING_RISK');
  }
  if (sourceExpired) flags.push('OUTDATED_SOURCE');

  return {
    correctRate: Math.round(correctRate * 100),
    skipRate: Math.round(skipRate * 100),
    changeRate: Math.round(changeRate * 100),
    averageResponseTimeMs,
    optionDistribution,
    mostSelectedWrongOption: mostSelectedWrong ? Number(mostSelectedWrong[0]) : null,
    strongLearnerCorrectRate: strongCorrectRate !== null ? Math.round(strongCorrectRate * 100) : null,
    weakLearnerCorrectRate: weakCorrectRate !== null ? Math.round(weakCorrectRate * 100) : null,
    flags
  };
}
