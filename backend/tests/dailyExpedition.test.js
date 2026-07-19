import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyExpedition } from '../engines/dailyExpedition.js';
import { buildPriorityExplanation } from '../engines/reasonCopy.js';

const explain = (reasons, topic) => buildPriorityExplanation(reasons, topic);

test('dailyExpedition: total activity time roughly matches the requested daily budget', () => {
  const plan = buildDailyExpedition(
    { dailyMinutes: 15, rankedTopics: [{ topic: 'Nghĩa vụ đại lý', score: 0.5, reasons: [] }], dueFlashcardCount: 5 },
    explain
  );
  assert.ok(plan.totalMinutes <= 20 && plan.totalMinutes >= 10);
});

test('dailyExpedition: "quick" preference skips the warmup activity', () => {
  const plan = buildDailyExpedition(
    { dailyMinutes: 15, rankedTopics: [{ topic: 'A', score: 0.5, reasons: [] }], preferredFormat: 'quick' },
    explain
  );
  assert.ok(!plan.activities.some((a) => a.type === 'warmup'));
});

test('dailyExpedition: "flashcard" preference allocates more flashcard time than "quiz" preference', () => {
  const flashcardPlan = buildDailyExpedition(
    { dailyMinutes: 30, rankedTopics: [{ topic: 'A', score: 0.5, reasons: [] }], dueFlashcardCount: 20, preferredFormat: 'flashcard' },
    explain
  );
  const quizPlan = buildDailyExpedition(
    { dailyMinutes: 30, rankedTopics: [{ topic: 'A', score: 0.5, reasons: [] }], dueFlashcardCount: 20, preferredFormat: 'quiz' },
    explain
  );
  const fcMinutes = (plan) => plan.activities.find((a) => a.type === 'flashcard')?.minutes ?? 0;
  assert.ok(fcMinutes(flashcardPlan) > fcMinutes(quizPlan));
});

test('dailyExpedition: a rescue need replaces normal practice with a rescue activity', () => {
  const plan = buildDailyExpedition(
    {
      dailyMinutes: 20,
      rankedTopics: [{ topic: 'Nghĩa vụ đại lý', score: 0.8, reasons: [] }],
      rescueNeeded: { topic: 'Nghĩa vụ đại lý', mistakeType: 'concept_confusion' }
    },
    explain
  );
  assert.ok(plan.activities.some((a) => a.type === 'rescue'));
  assert.ok(!plan.activities.some((a) => a.type === 'practice'));
});

test('dailyExpedition: explanation names the focus topic', () => {
  const plan = buildDailyExpedition(
    { dailyMinutes: 15, rankedTopics: [{ topic: 'Nghĩa vụ đại lý', score: 0.5, reasons: ['LOW_MASTERY'] }] },
    explain
  );
  assert.match(plan.explanation, /Nghĩa vụ đại lý/);
});

test('dailyExpedition: with no ranked topics yet, still returns a safe fallback plan', () => {
  const plan = buildDailyExpedition({ dailyMinutes: 10, rankedTopics: [] }, explain);
  assert.equal(plan.focusTopic, null);
  assert.ok(plan.activities.length > 0);
});
