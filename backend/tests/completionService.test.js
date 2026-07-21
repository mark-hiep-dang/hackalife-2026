import test from 'node:test';
import assert from 'node:assert/strict';
import { initDb, getDb } from '../db.js';
import { syncExpeditionActivity } from '../completionService.js';

async function seedPlan(db, userId, activities) {
  const today = new Date().toISOString().split('T')[0];
  const plan = { activities, completed: false };
  await db.run(
    `INSERT INTO daily_expedition (user_id, date, data, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, date) DO UPDATE SET data = excluded.data`,
    [userId, today, JSON.stringify(plan)]
  );
}

async function readPlan(db, userId) {
  const today = new Date().toISOString().split('T')[0];
  const row = await db.get('SELECT data FROM daily_expedition WHERE user_id = ? AND date = ?', [userId, today]);
  return JSON.parse(row.data);
}

const TEST_USER_ID = 999001;

test('completionService: marks the matching activity completed and unlocks the next one', async () => {
  await initDb();
  const db = await getDb();
  await db.run('INSERT OR IGNORE INTO users (id, username, password_hash, xp, streak, last_login_date) VALUES (?, ?, ?, 0, 1, date())', [TEST_USER_ID, 'test_completion_user', 'x']);
  await seedPlan(db, TEST_USER_ID, [
    { sequence: 1, activityId: 'LESSON_1', type: 'LESSON', lessonId: 'lesson_1', required: true, status: 'AVAILABLE' },
    { sequence: 2, activityId: 'PRACTICE_2', type: 'PRACTICE', lessonId: 'lesson_1', required: true, status: 'LOCKED' }
  ]);

  const result = await syncExpeditionActivity(db, TEST_USER_ID, { lessonId: 'lesson_1', completableTypes: ['LESSON'] });
  assert.equal(result.activityId, 'LESSON_1');
  assert.equal(result.expeditionCompleted, false);

  const plan = await readPlan(db, TEST_USER_ID);
  assert.equal(plan.activities[0].status, 'COMPLETED');
  assert.equal(plan.activities[1].status, 'AVAILABLE', 'the next activity must unlock');
});

test('completionService: is idempotent — a second call for an already-completed activity is a no-op', async () => {
  const db = await getDb();
  await seedPlan(db, TEST_USER_ID, [
    { sequence: 1, activityId: 'LESSON_1', type: 'LESSON', lessonId: 'lesson_1', required: true, status: 'COMPLETED', completedAt: '2026-01-01T00:00:00.000Z' }
  ]);
  const result = await syncExpeditionActivity(db, TEST_USER_ID, { lessonId: 'lesson_1', completableTypes: ['LESSON'] });
  assert.equal(result, null, 'must not re-complete or error on an already-completed activity');
});

test('completionService: marks the whole plan completed once every required activity is done', async () => {
  const db = await getDb();
  await seedPlan(db, TEST_USER_ID, [
    { sequence: 1, activityId: 'PRACTICE_1', type: 'PRACTICE', lessonId: 'lesson_1', required: true, status: 'AVAILABLE' }
  ]);
  const result = await syncExpeditionActivity(db, TEST_USER_ID, { lessonId: 'lesson_1', completableTypes: ['PRACTICE'] });
  assert.equal(result.expeditionCompleted, true);
});

test('completionService: returns null when there is no Expedition today', async () => {
  const db = await getDb();
  await db.run('DELETE FROM daily_expedition WHERE user_id = ?', [TEST_USER_ID + 1]);
  const result = await syncExpeditionActivity(db, TEST_USER_ID + 1, { lessonId: 'lesson_1', completableTypes: ['LESSON'] });
  assert.equal(result, null);
});

test('completionService: returns null when the completed lesson/type is not part of today\'s plan (no cross-lesson leakage)', async () => {
  const db = await getDb();
  await seedPlan(db, TEST_USER_ID, [
    { sequence: 1, activityId: 'LESSON_1', type: 'LESSON', lessonId: 'lesson_1', required: true, status: 'AVAILABLE' }
  ]);
  const result = await syncExpeditionActivity(db, TEST_USER_ID, { lessonId: 'lesson_2', completableTypes: ['LESSON'] });
  assert.equal(result, null);
});
