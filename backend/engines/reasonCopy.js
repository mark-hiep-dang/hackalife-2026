// Turns topic-priority reason codes into a natural Vietnamese sentence
// (spec §8). The LLM may polish this further via LlamaAIService.explainExpedition,
// but a working deterministic sentence must always exist first.

const FRAGMENTS = {
  LOW_MASTERY: 'bạn chưa vững phần này',
  HIGH_EXAM_WEIGHT: 'đây là phần chiếm tỉ trọng lớn trong đề thi',
  RECENT_MISTAKE: 'bạn vừa làm sai câu gần đây ở đây',
  HIGH_CONFIDENCE_MISTAKE: 'bạn vừa nhầm liên tiếp dù rất tự tin',
  REVIEW_DUE: 'đã lâu bạn chưa ôn lại phần này',
  EXAM_DATE_NEAR: 'ngày thi đang đến gần',
  REQUIRED_PREREQUISITE: 'đây là kiến thức nền cho một phần khác bạn đang yếu'
};

/**
 * @param {string[]} reasons - reason codes from calculateTopicPriority
 * @param {string} topicLabel
 * @returns {string}
 */
export function buildPriorityExplanation(reasons, topicLabel) {
  const fragments = reasons.map((r) => FRAGMENTS[r]).filter(Boolean);
  if (fragments.length === 0) {
    return `Llama chọn "${topicLabel}" để ôn tiếp theo trong hành trình của bạn.`;
  }
  const joined =
    fragments.length === 1
      ? fragments[0]
      : `${fragments.slice(0, -1).join(', ')} và ${fragments[fragments.length - 1]}`;
  return `Llama chọn "${topicLabel}" vì ${joined}.`;
}
