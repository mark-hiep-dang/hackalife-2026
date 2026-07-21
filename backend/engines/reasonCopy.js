// Turns topic-priority reason codes into a natural sentence, in both UI
// languages (spec §8). The LLM may polish the Vietnamese version further via
// LlamaAIService.explainExpedition, but a working deterministic sentence
// must always exist first, in both languages — the Daily Expedition plan is
// cached once per user/day, so both variants need to already exist at
// generation time rather than being derived later from whichever language
// happened to be active on that request.

const FRAGMENTS_VI = {
  LOW_MASTERY: 'bạn chưa vững phần này',
  HIGH_EXAM_WEIGHT: 'đây là phần chiếm tỉ trọng lớn trong đề thi',
  RECENT_MISTAKE: 'bạn vừa làm sai câu gần đây ở đây',
  HIGH_CONFIDENCE_MISTAKE: 'bạn vừa nhầm liên tiếp dù rất tự tin',
  REVIEW_DUE: 'đã lâu bạn chưa ôn lại phần này',
  EXAM_DATE_NEAR: 'ngày thi đang đến gần',
  REQUIRED_PREREQUISITE: 'đây là kiến thức nền cho một phần khác bạn đang yếu'
};

const FRAGMENTS_EN = {
  LOW_MASTERY: "you haven't gotten solid on this part yet",
  HIGH_EXAM_WEIGHT: 'this carries a lot of weight on the real exam',
  RECENT_MISTAKE: 'you just got a question wrong here recently',
  HIGH_CONFIDENCE_MISTAKE: "you've mixed this up repeatedly despite feeling sure",
  REVIEW_DUE: "it's been a while since you reviewed this",
  EXAM_DATE_NEAR: 'your exam date is coming up',
  REQUIRED_PREREQUISITE: "this is foundational for another part you're weak on"
};

function joinFragments(fragments, connector) {
  return fragments.length === 1
    ? fragments[0]
    : `${fragments.slice(0, -1).join(', ')} ${connector} ${fragments[fragments.length - 1]}`;
}

/**
 * @param {string[]} reasons - reason codes from calculateTopicPriority
 * @param {string} topicLabel
 * @returns {{ vi: string, en: string }}
 */
export function buildPriorityExplanation(reasons, topicLabel) {
  const viFragments = reasons.map((r) => FRAGMENTS_VI[r]).filter(Boolean);
  const enFragments = reasons.map((r) => FRAGMENTS_EN[r]).filter(Boolean);

  if (viFragments.length === 0) {
    return {
      vi: `Llama chọn "${topicLabel}" để ôn tiếp theo trong hành trình của bạn.`,
      en: `Llama picked "${topicLabel}" as the next step in your journey.`
    };
  }
  return {
    vi: `Llama chọn "${topicLabel}" vì ${joinFragments(viFragments, 'và')}.`,
    en: `Llama picked "${topicLabel}" because ${joinFragments(enFragments, 'and')}.`
  };
}
