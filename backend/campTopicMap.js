// Bridges the two topic vocabularies that exist in this codebase (see
// CAMP_LESSON_EXPEDITION_ALIGNMENT_PLAN.md §2): the 4 `lessons` rows (camps)
// use a coarse slug taxonomy (fundamentals/products/contracts/regulations),
// while test_questions/flashcards/topic_mastery/the expedition engine use
// the 8 real MOF exam topic strings. This is the single source of truth for
// "which real topics does this lesson/camp cover" — both the backend
// (Daily Expedition, lesson mastery, practice/flashcard/checkpoint scoping)
// and the frontend (LessonPath's mastery rollup) read from this one map so
// it can never drift into two different mappings again.
export const LESSON_TOPIC_MAP = {
  lesson_1: ['1. Kiến thức chung & quản trị rủi ro', '3. Nguyên tắc & phân loại bảo hiểm'],
  lesson_2: ['4. Bảo hiểm nhân thọ cơ bản', '5. Bảo hiểm sức khỏe'],
  lesson_3: ['2. Thuật ngữ & chủ thể hợp đồng', '6. Hợp đồng bảo hiểm & pháp luật'],
  lesson_4: ['7. Đại lý, đạo đức, quyền & nghĩa vụ', '8. Tình huống tổng hợp']
};

export function getTopicsForLesson(lessonId) {
  return LESSON_TOPIC_MAP[lessonId] || [];
}

/** Reverse lookup: which lesson/camp covers this real exam topic. */
export function getLessonIdForTopic(topic) {
  for (const [lessonId, topics] of Object.entries(LESSON_TOPIC_MAP)) {
    if (topics.includes(topic)) return lessonId;
  }
  return null;
}
