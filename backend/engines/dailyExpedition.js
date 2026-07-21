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
 * @param {(reasons: string[], topicLabel: string) => {vi: string, en: string}} explain
 * @returns {{ focusTopic: string|null, focusLessonId: string|null, status: string, totalMinutes: number, activities: object[], explanation: {vi: string, en: string} }}
 *   each activity's `label`/`subtitle` is also `{vi, en}` — both baked in at
 *   generation time since the plan is cached once per user/day and must
 *   support either UI language being active on any later fetch that day.
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
  // Camp/lesson names are domain content (like exam topic names) and stay
  // as-is in both languages — only the surrounding UI phrasing below needs
  // a real translation.
  const subtitleLabel = campLabel ? `${campLabel} · ${lessonLabel}` : lessonLabel;
  const bi = (vi, en) => ({ vi, en });

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
    pushActivity({ type: 'LESSON', label: bi('Học bài trọng tâm', 'Learn the core lesson'), subtitle: bi(subtitleLabel, subtitleLabel), minutes: LESSON_MINUTES });
  } else if (status === 'LOW_MASTERY') {
    pushActivity({
      type: 'LESSON_REVIEW', label: bi(`Ôn nhanh ${lessonLabel}`, `Quick review: ${lessonLabel}`),
      subtitle: bi('Xem lại phần bạn thường nhầm', 'Review the parts you often mix up'), minutes: REVIEW_MINUTES
    });
  } else if (status === 'MEMORY_DECAY') {
    const count = Math.max(dueFlashcardCount, 2);
    pushActivity({
      type: 'FLASHCARD_REVIEW', label: bi('Ôn lại flashcard', 'Review flashcards'),
      subtitle: bi(`${count} kiến thức đang hơi phủ bụi`, `${count} concepts gathering dust`),
      minutes: count * MIN_PER_FLASHCARD, count
    });
  } else if (status === 'STRONG') {
    pushActivity({
      type: 'SCENARIO', label: bi('Tình huống nâng cao', 'Advanced scenario'),
      subtitle: bi(`Tình huống thực tế · ${lessonLabel}`, `Real-world scenario · ${lessonLabel}`), minutes: SCENARIO_MINUTES
    });
  } else if (status === 'MISCONCEPTION') {
    pushActivity({
      type: 'RESCUE_TRAIL', label: bi('Chặng cứu hộ', 'Rescue Trail'), subtitle: bi('Gỡ rối hai khái niệm dễ nhầm', 'Untangle two easily-confused concepts'),
      minutes: Math.max(questionMinutes, 4), topic: rescueNeeded.topic, mistakeType: rescueNeeded.mistakeType,
      topics: [rescueNeeded.topic], insertedAdaptively: true
    });
  }

  pushActivity({
    type: 'PRACTICE',
    label: bi(`${questionCount} câu luyện tập`, `${questionCount} practice questions`),
    subtitle: bi(`Câu hỏi từ ${lessonLabel}`, `Questions from ${lessonLabel}`),
    minutes: questionMinutes,
    count: questionCount,
    difficulty: status === 'STRONG' ? 'Khó' : undefined
  });

  if (extraFlashcardCount > 0) {
    pushActivity({
      type: 'FLASHCARD_REVIEW', label: bi(`Ôn lại ${extraFlashcardCount} flashcard`, `Review ${extraFlashcardCount} flashcards`),
      subtitle: bi(`Khái niệm từ ${lessonLabel}`, `Concepts from ${lessonLabel}`), minutes: extraFlashcardMinutes, count: extraFlashcardCount
    });
  }

  pushActivity({
    type: 'CHECKPOINT',
    label: bi('Chốt bài', 'Checkpoint'),
    subtitle: bi(
      `${CHECKPOINT_QUESTION_COUNT} câu xác nhận bạn đã nắm ${lessonLabel}`,
      `${CHECKPOINT_QUESTION_COUNT} questions confirming you've mastered ${lessonLabel}`
    ),
    minutes: CHECKPOINT_MINUTES,
    count: CHECKPOINT_QUESTION_COUNT
  });

  const totalMinutes = activities.reduce((s, a) => s + a.minutes, 0);
  const explanation = focus
    ? explain(focus.reasons, focusTopic)
    : bi(
        'Llama chưa đủ dữ liệu để chọn chặng hôm nay — cứ bắt đầu bằng một chặng luyện tập nhẹ nhé!',
        "Llama doesn't have enough data yet to pick today's trail — just start with a light practice round!"
      );

  return { focusTopic, focusLessonId, status, totalMinutes, activities, explanation };
}
