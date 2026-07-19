// Deterministic misconception clustering (spec §14). Rule-based grouping —
// no ML model needed for the hackathon, matching the spec's own guidance.

const MIN_CLUSTER_SIZE = 3;

/**
 * @param {{learnerId:number, topic:string, questionId?:number, selectedOption?:number, isCorrect:boolean, confidence?:string, mistakeType?:string, mastery?:number}[]} answers
 * @returns {{ topic:string, questionId?:number, wrongOption?:number, mistakeType:string, learnerIds:number[], learnerCount:number, highConfidenceCount:number, averageMastery:number|null }[]}
 */
export function clusterMisconceptions(answers) {
  const wrongAnswers = answers.filter((a) => !a.isCorrect && a.mistakeType);
  const groups = new Map();

  for (const a of wrongAnswers) {
    const key = [a.topic, a.questionId ?? 'any', a.selectedOption ?? 'any', a.mistakeType].join('::');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(a);
  }

  const clusters = [];
  for (const [key, groupAnswers] of groups) {
    const learnerIds = [...new Set(groupAnswers.map((a) => a.learnerId))];
    if (learnerIds.length < MIN_CLUSTER_SIZE) continue;

    const [topic, questionIdRaw, wrongOptionRaw, mistakeType] = key.split('::');
    const highConfidenceCount = groupAnswers.filter((a) => a.confidence === 'certain').length;
    const masteries = groupAnswers.filter((a) => typeof a.mastery === 'number').map((a) => a.mastery);
    const averageMastery = masteries.length ? Math.round(masteries.reduce((s, m) => s + m, 0) / masteries.length) : null;

    clusters.push({
      topic,
      questionId: questionIdRaw === 'any' ? undefined : Number(questionIdRaw),
      wrongOption: wrongOptionRaw === 'any' ? undefined : Number(wrongOptionRaw),
      mistakeType,
      learnerIds,
      learnerCount: learnerIds.length,
      highConfidenceCount,
      averageMastery
    });
  }

  return clusters.sort((a, b) => b.learnerCount - a.learnerCount);
}
