import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyExpedition } from '../engines/dailyExpedition.js';
import { buildPriorityExplanation } from '../engines/reasonCopy.js';

const explain = (reasons, topic) => buildPriorityExplanation(reasons, topic);
const baseInput = { focusLessonId: 'lesson_1', focusLessonTitle: 'Kiến thức chung', campLabel: 'Trại Nền' };

test('dailyExpedition: total activity time roughly matches the requested daily budget', () => {
  const plan = buildDailyExpedition(
    { ...baseInput, dailyMinutes: 15, rankedTopics: [{ topic: 'Nghĩa vụ đại lý', score: 0.5, reasons: [] }], dueFlashcardCount: 5, lessonCompleted: true, lessonMastery: 65 },
    explain
  );
  assert.ok(plan.totalMinutes <= 20 && plan.totalMinutes >= 10);
});

test('dailyExpedition: every activity references the same focus lesson id — no duplicated/unrelated content', () => {
  const plan = buildDailyExpedition(
    { ...baseInput, dailyMinutes: 15, rankedTopics: [{ topic: 'A', score: 0.5, reasons: [] }], lessonCompleted: false },
    explain
  );
  assert.ok(plan.activities.every((a) => a.lessonId === 'lesson_1'));
  assert.equal(plan.focusLessonId, 'lesson_1');
});

test('dailyExpedition: an unstarted lesson gets "Học bài trọng tâm" as the first activity (status NEW)', () => {
  const plan = buildDailyExpedition(
    { ...baseInput, dailyMinutes: 15, rankedTopics: [{ topic: 'A', score: 0.5, reasons: [] }], lessonCompleted: false },
    explain
  );
  assert.equal(plan.status, 'NEW');
  assert.equal(plan.activities[0].type, 'LESSON');
  assert.equal(plan.activities[0].label.vi, 'Học bài trọng tâm');
  assert.equal(plan.activities[0].label.en, 'Learn the core lesson');
  assert.ok(plan.activities.some((a) => a.type === 'CHECKPOINT'), 'every sequence ends with a checkpoint');
});

test('dailyExpedition: low mastery on a completed lesson gets a lesson review, not the full lesson again', () => {
  const plan = buildDailyExpedition(
    { ...baseInput, dailyMinutes: 15, rankedTopics: [{ topic: 'A', score: 0.5, reasons: [] }], lessonCompleted: true, lessonMastery: 30 },
    explain
  );
  assert.equal(plan.status, 'LOW_MASTERY');
  assert.equal(plan.activities[0].type, 'LESSON_REVIEW');
  assert.ok(!plan.activities.some((a) => a.type === 'LESSON'));
});

test('dailyExpedition: memory decay (no recent review) leads with flashcards, not the lesson', () => {
  const plan = buildDailyExpedition(
    { ...baseInput, dailyMinutes: 15, rankedTopics: [{ topic: 'A', score: 0.5, reasons: [] }], lessonCompleted: true, lessonMastery: 70, daysSinceLastReview: 10 },
    explain
  );
  assert.equal(plan.status, 'MEMORY_DECAY');
  assert.equal(plan.activities[0].type, 'FLASHCARD_REVIEW');
});

test('dailyExpedition: a strong learner gets a scenario/hard-practice opener, not the base lesson', () => {
  const plan = buildDailyExpedition(
    { ...baseInput, dailyMinutes: 15, rankedTopics: [{ topic: 'A', score: 0.5, reasons: [] }], lessonCompleted: true, lessonMastery: 90, daysSinceLastReview: 1 },
    explain
  );
  assert.equal(plan.status, 'STRONG');
  assert.equal(plan.activities[0].type, 'SCENARIO');
  const practice = plan.activities.find((a) => a.type === 'PRACTICE');
  assert.equal(practice.difficulty, 'Khó');
});

test('dailyExpedition: a recent misconception always leads with a Rescue Trail, overriding every other signal', () => {
  const plan = buildDailyExpedition(
    {
      ...baseInput, dailyMinutes: 20, rankedTopics: [{ topic: 'Nghĩa vụ đại lý', score: 0.8, reasons: [] }],
      lessonCompleted: false, // even an unstarted lesson yields to an active misconception
      rescueNeeded: { topic: 'Nghĩa vụ đại lý', mistakeType: 'concept_confusion' }
    },
    explain
  );
  assert.equal(plan.status, 'MISCONCEPTION');
  assert.equal(plan.activities[0].type, 'RESCUE_TRAIL');
  assert.equal(plan.activities[0].insertedAdaptively, true);
  assert.ok(!plan.activities.some((a) => a.type === 'LESSON'));
});

test('dailyExpedition: "flashcard" preference allocates more flashcard time than "quiz" preference', () => {
  const flashcardPlan = buildDailyExpedition(
    { ...baseInput, dailyMinutes: 30, rankedTopics: [{ topic: 'A', score: 0.5, reasons: [] }], dueFlashcardCount: 20, preferredFormat: 'flashcard', lessonCompleted: true, lessonMastery: 65 },
    explain
  );
  const quizPlan = buildDailyExpedition(
    { ...baseInput, dailyMinutes: 30, rankedTopics: [{ topic: 'A', score: 0.5, reasons: [] }], dueFlashcardCount: 20, preferredFormat: 'quiz', lessonCompleted: true, lessonMastery: 65 },
    explain
  );
  const fcMinutes = (plan) => plan.activities.find((a) => a.type === 'FLASHCARD_REVIEW')?.minutes ?? 0;
  assert.ok(fcMinutes(flashcardPlan) > fcMinutes(quizPlan));
});

test('dailyExpedition: practice activity subtitle references the focus lesson', () => {
  const plan = buildDailyExpedition(
    { ...baseInput, dailyMinutes: 15, rankedTopics: [{ topic: 'A', score: 0.5, reasons: [] }], lessonCompleted: true, lessonMastery: 65 },
    explain
  );
  const practice = plan.activities.find((a) => a.type === 'PRACTICE');
  assert.match(practice.subtitle.vi, /Kiến thức chung/);
  assert.match(practice.subtitle.en, /Kiến thức chung/);
});

test('dailyExpedition: explanation names the focus topic, in both languages', () => {
  const plan = buildDailyExpedition(
    { ...baseInput, dailyMinutes: 15, rankedTopics: [{ topic: 'Nghĩa vụ đại lý', score: 0.5, reasons: ['LOW_MASTERY'] }], lessonCompleted: true, lessonMastery: 65 },
    explain
  );
  assert.match(plan.explanation.vi, /Nghĩa vụ đại lý/);
  assert.match(plan.explanation.en, /Nghĩa vụ đại lý/);
});

test('dailyExpedition: with no ranked topics yet, still returns a safe fallback plan', () => {
  const plan = buildDailyExpedition({ ...baseInput, dailyMinutes: 10, rankedTopics: [] }, explain);
  assert.equal(plan.focusTopic, null);
  assert.ok(plan.activities.length > 0);
});
