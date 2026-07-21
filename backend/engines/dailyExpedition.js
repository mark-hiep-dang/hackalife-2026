// Deterministic Daily Expedition allocator. Selects ONE existing lesson
// (camp) as today's focus and a dynamic activity sequence around it — never
// a generic, always-the-same-four-steps list, and never content that isn't
// a reference to something that already exists (lessons/test_questions/
// flashcards). Pure function — no DB access — so it stays easy to test.
// See CAMP_LESSON_EXPEDITION_ALIGNMENT_PLAN.md for the full design.

const LESSON_MINUTES = 3;
const REVIEW_MINUTES = 3;
const SCENARIO_MINUTES = 5;
const CHECKPOINT_MINUTES = 3;
const MIN_PER_QUESTION = 1.2;
const MIN_PER_FLASHCARD = 1;
const CHECKPOINT_QUESTION_COUNT = 3;
const MEMORY_DECAY_DAYS = 7;
const STRONG_MASTERY_THRESHOLD = 80;
const LOW_MASTERY_THRESHOLD = 50;

/**
 * @param {object} input
 * @param {number} input.dailyMinutes
 * @param {Array<{topic: string, score: number, reasons: string[]}>} input.rankedTopics
 * @param {number} [input.dueFlashcardCount]
 * @param {'quick'|'flashcard'|'quiz'|'scenario'} [input.preferredFormat]
 * @param {{ topic: string, mistakeType: string } | null} [input.rescueNeeded]
 * @param {string} input.focusLessonId - the lesson/camp id this plan is about (never null once any lesson exists)
 * @param {string} [input.focusLessonTitle]
 * @param {string} [input.campLabel] - e.g. "Trại Nền"
 * @param {boolean} [input.lessonCompleted]
 * @param {number} [input.lessonMastery] - 0-100, rolled up from the lesson's mapped topics
 * @param {number} [input.daysSinceLastReview]
 * @param {(reasons: string[], topicLabel: string) => string} explain
 * @returns {{ focusTopic: string|null, focusLessonId: string|null, status: string, totalMinutes: number, activities: object[], explanation: string }}
 */
export function buildDailyExpedition({
  dailyMinutes = 15,
  rankedTopics = [],
  dueFlashcardCount = 0,
  preferredFormat = 'quiz',
  rescueNeeded = null,
  focusLessonId = null,
  focusLessonTitle = null,
  campLabel = null,
  lessonCompleted = false,
  lessonMastery = 0,
  daysSinceLastReview
}, explain) {
  const focus = rankedTopics[0];
  const focusTopic = focus?.topic ?? null;
  const focusTopics = focusTopic ? [focusTopic] : [];
  const lessonLabel = focusLessonTitle || 'bài học';
  const subtitleLabel = campLabel ? `${campLabel} · ${lessonLabel}` : lessonLabel;

  // Priority order matches spec §17: an active misconception always leads;
  // otherwise, has the learner even opened this lesson yet; otherwise,
  // mastery/decay signals decide the shape of today's climb.
  let status;
  if (rescueNeeded) status = 'MISCONCEPTION';
  else if (!lessonCompleted) status = 'NEW';
  else if (lessonMastery < LOW_MASTERY_THRESHOLD) status = 'LOW_MASTERY';
  else if (typeof daysSinceLastReview === 'number' && daysSinceLastReview >= MEMORY_DECAY_DAYS) status = 'MEMORY_DECAY';
  else if (lessonMastery >= STRONG_MASTERY_THRESHOLD) status = 'STRONG';
  else status = 'REINFORCE';

  const includeFlashcards = dueFlashcardCount > 0 || preferredFormat === 'flashcard';

  const firstActivityMinutes = {
    NEW: LESSON_MINUTES, LOW_MASTERY: REVIEW_MINUTES, MEMORY_DECAY: Math.max(dueFlashcardCount, 2) * MIN_PER_FLASHCARD,
    STRONG: SCENARIO_MINUTES, MISCONCEPTION: 4, REINFORCE: 0
  }[status];
  const overhead = firstActivityMinutes + CHECKPOINT_MINUTES;
  const contentMinutes = Math.max(dailyMinutes - overhead, dailyMinutes >= 15 ? 4 : dailyMinutes);

  const flashcardShare = preferredFormat === 'flashcard' ? 0.6 : preferredFormat === 'quiz' ? 0.2 : 0.35;
  const flashcardMinutesWanted = includeFlashcards ? Math.min(contentMinutes * flashcardShare, dueFlashcardCount * MIN_PER_FLASHCARD) : 0;
  const extraFlashcardCount = includeFlashcards && status !== 'MEMORY_DECAY'
    ? Math.max(Math.round(flashcardMinutesWanted / MIN_PER_FLASHCARD), 1)
    : 0;
  const extraFlashcardMinutes = extraFlashcardCount * MIN_PER_FLASHCARD;

  const remainingForQuestions = Math.max(contentMinutes - extraFlashcardMinutes, MIN_PER_QUESTION);
  const questionCount = Math.max(Math.round(remainingForQuestions / MIN_PER_QUESTION), status === 'STRONG' ? 3 : 4);
  const questionMinutes = Math.round(questionCount * MIN_PER_QUESTION);

  const activities = [];
  let sequence = 1;
  function pushActivity(partial) {
    const seq = sequence++;
    activities.push({
      sequence: seq,
      activityId: `${partial.type}_${seq}`,
      status: seq === 1 ? 'AVAILABLE' : 'LOCKED',
      lessonId: focusLessonId,
      topics: focusTopics,
      required: true,
      ...partial
    });
  }

  if (status === 'NEW') {
    pushActivity({ type: 'LESSON', label: 'Học bài trọng tâm', subtitle: subtitleLabel, minutes: LESSON_MINUTES });
  } else if (status === 'LOW_MASTERY') {
    pushActivity({ type: 'LESSON_REVIEW', label: `Ôn nhanh ${lessonLabel}`, subtitle: 'Xem lại phần bạn thường nhầm', minutes: REVIEW_MINUTES });
  } else if (status === 'MEMORY_DECAY') {
    const count = Math.max(dueFlashcardCount, 2);
    pushActivity({ type: 'FLASHCARD_REVIEW', label: 'Ôn lại flashcard', subtitle: `${count} kiến thức đang hơi phủ bụi`, minutes: count * MIN_PER_FLASHCARD, count });
  } else if (status === 'STRONG') {
    pushActivity({ type: 'SCENARIO', label: 'Tình huống nâng cao', subtitle: `Tình huống thực tế · ${lessonLabel}`, minutes: SCENARIO_MINUTES });
  } else if (status === 'MISCONCEPTION') {
    pushActivity({
      type: 'RESCUE_TRAIL', label: 'Chặng cứu hộ', subtitle: 'Gỡ rối hai khái niệm dễ nhầm',
      minutes: Math.max(questionMinutes, 4), topic: rescueNeeded.topic, mistakeType: rescueNeeded.mistakeType,
      topics: [rescueNeeded.topic], insertedAdaptively: true
    });
  }

  pushActivity({
    type: 'PRACTICE',
    label: `${questionCount} câu luyện tập`,
    subtitle: `Câu hỏi từ ${lessonLabel}`,
    minutes: questionMinutes,
    count: questionCount,
    difficulty: status === 'STRONG' ? 'Khó' : undefined
  });

  if (extraFlashcardCount > 0) {
    pushActivity({
      type: 'FLASHCARD_REVIEW', label: `Ôn lại ${extraFlashcardCount} flashcard`,
      subtitle: `Khái niệm từ ${lessonLabel}`, minutes: extraFlashcardMinutes, count: extraFlashcardCount
    });
  }

  pushActivity({
    type: 'CHECKPOINT',
    label: 'Chốt bài',
    subtitle: `${CHECKPOINT_QUESTION_COUNT} câu xác nhận bạn đã nắm ${lessonLabel}`,
    minutes: CHECKPOINT_MINUTES,
    count: CHECKPOINT_QUESTION_COUNT
  });

  const totalMinutes = activities.reduce((s, a) => s + a.minutes, 0);
  const explanation = focus
    ? explain(focus.reasons, focusTopic)
    : 'Llama chưa đủ dữ liệu để chọn chặng hôm nay — cứ bắt đầu bằng một chặng luyện tập nhẹ nhé!';

  return { focusTopic, focusLessonId, status, totalMinutes, activities, explanation };
}
