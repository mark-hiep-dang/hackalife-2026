import test from 'node:test';
import assert from 'node:assert/strict';
import { initDb, getDb } from '../../db.js';
import { generateLessonKit } from '../studioAIService.js';

const TOPIC = '4. Bảo hiểm nhân thọ cơ bản';

test('generateLessonKit: genFlashcards=false skips flashcards, quiz still generated', async () => {
  await initDb();
  const db = await getDb();
  const kit = await generateLessonKit(db, { topic: TOPIC, lessonTitle: 'Test lesson', genFlashcards: false });
  assert.equal(kit.flashcards.length, 0);
  assert.ok(kit.easyQuestions.length > 0);
});

test('generateLessonKit: genQuiz=false skips all question types, flashcards still generated', async () => {
  await initDb();
  const db = await getDb();
  const kit = await generateLessonKit(db, { topic: TOPIC, lessonTitle: 'Test lesson', genQuiz: false });
  assert.equal(kit.easyQuestions.length, 0);
  assert.equal(kit.mediumQuestions.length, 0);
  assert.equal(kit.hardQuestions.length, 0);
  assert.equal(kit.scenario, null);
  assert.equal(kit.checkpoint, null);
  assert.ok(kit.flashcards.length > 0);
});

test('generateLessonKit: defaults (no flags passed) generate both, matching prior behavior', async () => {
  await initDb();
  const db = await getDb();
  const kit = await generateLessonKit(db, { topic: TOPIC, lessonTitle: 'Test lesson' });
  assert.ok(kit.flashcards.length > 0);
  assert.ok(kit.easyQuestions.length > 0);
});
