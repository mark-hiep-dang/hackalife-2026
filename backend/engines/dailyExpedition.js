// Deterministic Daily Expedition allocator (spec §9). Turns "how many minutes
// does the learner have today" + "what does the priority engine say to study"
// into a concrete, time-boxed activity list. Pure function — no DB access —
// so it stays easy to test.

const MIN_PER_QUESTION = 1.2;
const MIN_PER_FLASHCARD = 1;
const WARMUP_MINUTES = 3;
const CHECKPOINT_MINUTES = 3;

/**
 * @param {object} input
 * @param {number} input.dailyMinutes - 10/15/20/30/45/60
 * @param {Array<{topic: string, score: number, reasons: string[]}>} input.rankedTopics - from priority.rankTopics, descending
 * @param {number} [input.dueFlashcardCount] - flashcards due for the focus topic
 * @param {'quick'|'flashcard'|'quiz'|'scenario'} [input.preferredFormat]
 * @param {{ topic: string, mistakeType: string } | null} [input.rescueNeeded]
 * @param {(reasons: string[], topicLabel: string) => string} explain - reasonCopy.buildPriorityExplanation
 * @returns {{ focusTopic: string, totalMinutes: number, activities: object[], explanation: string }}
 */
export function buildDailyExpedition({
  dailyMinutes = 15,
  rankedTopics = [],
  dueFlashcardCount = 0,
  preferredFormat = 'quiz',
  rescueNeeded = null
}, explain) {
  const focus = rankedTopics[0];
  const focusTopic = focus?.topic ?? null;

  // "Học nhanh" trims the ceremony (no warmup) so every minute goes to content.
  const includeWarmup = preferredFormat !== 'quick';
  const overhead = (includeWarmup ? WARMUP_MINUTES : 0) + CHECKPOINT_MINUTES;
  const contentMinutes = Math.max(dailyMinutes - overhead, dailyMinutes >= 15 ? 4 : dailyMinutes);

  // Format preference shifts the practice/flashcard split; rescue need forces
  // at least one flashcard slot regardless of preference (the trail needs it).
  let flashcardShare = preferredFormat === 'flashcard' ? 0.6 : preferredFormat === 'quiz' ? 0.2 : 0.4;
  const flashcardMinutesWanted = Math.min(contentMinutes * flashcardShare, dueFlashcardCount * MIN_PER_FLASHCARD);
  const flashcardCount = Math.max(
    Math.round(flashcardMinutesWanted / MIN_PER_FLASHCARD),
    rescueNeeded ? 1 : 0
  );
  const flashcardMinutes = flashcardCount * MIN_PER_FLASHCARD;

  const remainingForQuestions = Math.max(contentMinutes - flashcardMinutes, MIN_PER_QUESTION);
  const questionCount = Math.max(Math.round(remainingForQuestions / MIN_PER_QUESTION), 1);
  const questionMinutes = Math.round(questionCount * MIN_PER_QUESTION);

  const activities = [];
  if (includeWarmup) {
    activities.push({ type: 'warmup', label: 'Khởi động nhanh', minutes: WARMUP_MINUTES });
  }
  if (rescueNeeded) {
    activities.push({
      type: 'rescue',
      label: 'Chặng cứu hộ',
      minutes: Math.max(questionMinutes, 4),
      topic: rescueNeeded.topic,
      mistakeType: rescueNeeded.mistakeType
    });
  } else {
    activities.push({
      type: 'practice',
      label: `${questionCount} câu luyện tập`,
      minutes: questionMinutes,
      count: questionCount,
      topic: focusTopic
    });
  }
  if (flashcardCount > 0) {
    activities.push({
      type: 'flashcard',
      label: `Phủi bụi ${flashcardCount} flashcard`,
      minutes: flashcardMinutes,
      count: flashcardCount,
      topic: focusTopic
    });
  }
  activities.push({ type: 'checkpoint', label: 'Checkpoint', minutes: CHECKPOINT_MINUTES });

  const totalMinutes = activities.reduce((s, a) => s + a.minutes, 0);
  const explanation = focus
    ? explain(focus.reasons, focusTopic)
    : 'Llama chưa đủ dữ liệu để chọn chặng hôm nay — cứ bắt đầu bằng một chặng luyện tập nhẹ nhé!';

  return { focusTopic, totalMinutes, activities, explanation };
}
