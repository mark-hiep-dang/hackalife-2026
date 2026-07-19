// Deterministic before/after comparison for Rescue Expeditions (spec §16).
// Never claims causation — the wording layer (studioPersonality.js) is
// responsible for phrasing this as "improved after", not "caused by".

import { mean } from './mockExamAnalytics.js';

const SMALL_SAMPLE_THRESHOLD = 5;

/**
 * @param {{learnerId:number, masteryBefore?:number, masteryAfter?:number, relatedScoreBefore?:number, relatedScoreAfter?:number, completed:boolean}[]} results
 */
export function calculateInterventionEffectiveness(results) {
  const assignedCount = results.length;
  const completed = results.filter((r) => r.completed);
  const completedCount = completed.length;

  const withMastery = completed.filter((r) => typeof r.masteryBefore === 'number' && typeof r.masteryAfter === 'number');
  const averageMasteryBefore = withMastery.length ? Math.round(mean(withMastery.map((r) => r.masteryBefore))) : null;
  const averageMasteryAfter = withMastery.length ? Math.round(mean(withMastery.map((r) => r.masteryAfter))) : null;

  const withScore = completed.filter((r) => typeof r.relatedScoreBefore === 'number' && typeof r.relatedScoreAfter === 'number');
  const averageScoreBefore = withScore.length ? Math.round(mean(withScore.map((r) => r.relatedScoreBefore))) : null;
  const averageScoreAfter = withScore.length ? Math.round(mean(withScore.map((r) => r.relatedScoreAfter))) : null;

  const stillNeedingSupportCount = withMastery.filter((r) => r.masteryAfter < 60).length;
  const masteryImproved = averageMasteryBefore !== null && averageMasteryAfter !== null && averageMasteryAfter > averageMasteryBefore;

  return {
    assignedCount,
    completedCount,
    completionRate: assignedCount ? Math.round((completedCount / assignedCount) * 100) : 0,
    averageMasteryBefore,
    averageMasteryAfter,
    averageScoreBefore,
    averageScoreAfter,
    stillNeedingSupportCount,
    improved: masteryImproved,
    smallSample: completedCount > 0 && completedCount < SMALL_SAMPLE_THRESHOLD
  };
}
