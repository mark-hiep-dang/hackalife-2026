// Centralized local copy for Daily Expedition / Camp moments — mirrors
// llamaPersonality.js's pattern (spec §21). Every "Llama says something"
// moment around opening a lesson, finishing an activity, or navigating the
// camp map goes through here instead of a component picking its own string,
// and none of it calls an LLM — these are common, predictable reactions,
// exactly the case where a local copy library is enough.
//
// @typedef {"OPEN_SELECTED_LESSON"|"LESSON_COMPLETED"|"RETURN_TO_EXPEDITION"|"CAMP_LOCKED"|"CHECKPOINT_UNLOCKED"|"EXPEDITION_ALL_DONE"} ExpeditionEvent

function pick(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}
function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? ''));
}

const POOLS = {
  OPEN_SELECTED_LESSON: {
    vi: ['Llama đã đánh dấu đúng bài rồi. Mình vào học thôi!', 'Đây nè, bài Llama chọn cho hôm nay đó.'],
    en: ["Llama already marked the right lesson. Let's dive in!", "Here it is — the lesson Llama picked for today."]
  },
  LESSON_COMPLETED: {
    vi: ['Bài học xong! Một đoạn đường vừa được lát phẳng.', 'Xong bài rồi, chân bước tiếp thôi nào.'],
    en: ['Lesson done! One more stretch of trail just got paved.', 'Lesson complete — onward we go.']
  },
  RETURN_TO_EXPEDITION: {
    vi: ['Xong phần kiến thức rồi. Giờ thử xem mấy câu hỏi có giở trò không nhé.', 'Quay lại chặng hôm nay để đi tiếp nào.'],
    en: ['Knowledge part done. Let\'s see if the questions try any tricks.', 'Back to today\'s trail — let\'s keep climbing.']
  },
  CAMP_LOCKED: {
    vi: ['Trại này chưa mở đâu. Mình gia cố nền trước nhé.'],
    en: ['This camp isn\'t open yet. Let\'s shore up the foundation first.']
  },
  CHECKPOINT_UNLOCKED: {
    vi: ['Chốt bài đã mở! Vài câu nữa là cắm cờ hôm nay.'],
    en: ['Checkpoint unlocked! A few more questions and today\'s flag goes up.']
  },
  EXPEDITION_ALL_DONE: {
    vi: ['Chặng hôm nay xong rồi! Llama tự hào về bạn lắm.', 'Cắm cờ thành công! Hẹn gặp lại ở chặng tiếp theo.'],
    en: ['Today\'s trail is complete! Llama is proud of you.', 'Flag planted! See you on the next trail.']
  }
};

/**
 * @param {ExpeditionEvent} event
 * @param {{ lang?: 'vi'|'en' }} [context]
 * @returns {{ message: string }}
 */
export function getExpeditionCopy(event, context = {}) {
  const lang = context.lang || 'vi';
  const pool = POOLS[event]?.[lang] || POOLS[event]?.vi;
  if (!pool) return { message: '' };
  return { message: fill(pick(pool), context) };
}

// Static activity-type labels/icons — used by both the dashboard card and
// the Expedition Player so the two views never drift into different copy.
export const ACTIVITY_ICON = {
  LESSON: '📖', LESSON_REVIEW: '📖', PRACTICE: '🎯', FLASHCARD_REVIEW: '🗂️',
  SCENARIO: '🧩', RESCUE_TRAIL: '🧗', CHECKPOINT: '🏁'
};
