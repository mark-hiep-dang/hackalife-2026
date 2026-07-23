import test from 'node:test';
import assert from 'node:assert/strict';
import { initDb, getDb } from '../../db.js';
import { buildJourneyStages, journeyStageForScore, journeyStageForCompletedCount, computeCohortJourney } from '../routes.js';

test('buildJourneyStages: derives one stage per real camp, positional labels (Base Camp/Camp N/Summit), last camp forced to Summit', () => {
  const camps = [
    { title: 'Base Camp: Kiến thức chung về bảo hiểm' },
    { title: 'Camp 1: Pháp luật kinh doanh bảo hiểm' },
    { title: 'Camp 2: Sản phẩm bảo hiểm nhân thọ & sức khỏe' },
    { title: 'Camp 3: Quyền, nghĩa vụ & đạo đức hành nghề' }
  ];
  const stages = buildJourneyStages(camps);
  assert.equal(stages.length, 4);
  assert.deepEqual(stages.map((s) => s.label), ['Base Camp', 'Camp 1', 'Camp 2', 'Summit']);
  assert.equal(stages[stages.length - 1].key, 'summit');
  assert.equal(stages[stages.length - 1].maxScore, 100);
  // 4 equal bands across 0-100
  assert.deepEqual(stages.map((s) => s.maxScore), [24, 49, 74, 100]);
});

test('buildJourneyStages: labels stay Base Camp/Camp N/Summit even when a trainer renames camps to drop the prefix entirely', () => {
  // Regression: a trainer editing a camp's title down to just its topic
  // name (e.g. "Kiến thức chung về bảo hiểm", no "Base Camp:" prefix) must
  // never leak that raw topic name into the journey's stage label — labels
  // are purely positional, independent of whatever the camp is titled.
  const camps = [
    { title: 'Kiến thức chung về bảo hiểm' },
    { title: 'Pháp luật kinh doanh bảo hiểm' },
    { title: 'Sản phẩm bảo hiểm nhân thọ & sức khỏe' },
    { title: 'Quyền, nghĩa vụ & đạo đức hành nghề' }
  ];
  const stages = buildJourneyStages(camps);
  assert.deepEqual(stages.map((s) => s.label), ['Base Camp', 'Camp 1', 'Camp 2', 'Summit']);
});

test('journeyStageForScore: maps a score to the correct real-camp-derived stage', () => {
  const stages = buildJourneyStages([{ title: 'Base Camp: X' }, { title: 'Camp 1: Y' }, { title: 'Camp 2: Z' }, { title: 'Camp 3: W' }]);
  assert.equal(journeyStageForScore(0, stages).label, 'Base Camp');
  assert.equal(journeyStageForScore(24, stages).label, 'Base Camp');
  assert.equal(journeyStageForScore(25, stages).label, 'Camp 1');
  assert.equal(journeyStageForScore(49, stages).label, 'Camp 1');
  assert.equal(journeyStageForScore(50, stages).label, 'Camp 2');
  assert.equal(journeyStageForScore(74, stages).label, 'Camp 2');
  assert.equal(journeyStageForScore(75, stages).label, 'Summit');
  assert.equal(journeyStageForScore(100, stages).label, 'Summit');
});

test('journeyStageForCompletedCount: maps a real lesson-completion count to the matching stage, capped at the last (Summit)', () => {
  const stages = buildJourneyStages([{}, {}, {}, {}]); // 4 stages: Base Camp, Camp 1, Camp 2, Summit
  assert.equal(journeyStageForCompletedCount(0, stages).label, 'Base Camp');
  assert.equal(journeyStageForCompletedCount(1, stages).label, 'Camp 1');
  assert.equal(journeyStageForCompletedCount(2, stages).label, 'Camp 2');
  assert.equal(journeyStageForCompletedCount(3, stages).label, 'Summit');
  assert.equal(journeyStageForCompletedCount(4, stages).label, 'Summit', 'completing every lesson still caps at the last stage');
  assert.equal(journeyStageForCompletedCount(99, stages).label, 'Summit', 'never indexes past the stage array');
});

async function makeLearner(db, username) {
  await db.run('DELETE FROM users WHERE username = ?', [username]);
  const user = await db.run('INSERT INTO users (username, password_hash, xp, streak) VALUES (?, ?, 0, 0)', [username, 'x']);
  return user.lastID;
}

// computeCohortJourney scopes its roster to the currently-PUBLISHED course's
// own cohorts (real MOF course + cohort already exist in the seeded dev DB),
// so this test adds its 3 learners to a cohort of THAT course and asserts
// the delta it causes, never an absolute total (the shared dev DB already
// has other real roster members for that same course). Stage assignment is
// now driven by real `user_lessons` completions against the same fixed
// 4-lesson Camp Map Llama Learner itself shows (LessonPath.jsx) — not an
// indirect Summit Readiness score, which can lag behind real completion.
test('computeCohortJourney: buckets a published course\'s roster by real Llama Learner lesson completions, counting a never-active member at the first stage', async () => {
  await initDb();
  const db = await getDb();
  await db.run('DELETE FROM users WHERE username = ?', ['test_journey_learner_a']);
  await db.run('DELETE FROM users WHERE username = ?', ['test_journey_learner_b']);
  await db.run('DELETE FROM users WHERE username = ?', ['test_journey_learner_c']);

  const publishedCourse = await db.get("SELECT * FROM studio_courses WHERE status = 'PUBLISHED' ORDER BY id LIMIT 1");
  assert.ok(publishedCourse, 'expected a seeded PUBLISHED course to exist in the dev DB');
  const cohort = await db.get('SELECT id FROM studio_cohorts WHERE course_id = ? LIMIT 1', [publishedCourse.id]);
  assert.ok(cohort, 'expected the published course to already have a cohort');
  const legacyLessons = await db.all('SELECT id FROM lessons ORDER BY order_index ASC');
  assert.ok(legacyLessons.length >= 2, 'expected the seeded dev DB to have the real Camp Map lessons');

  const before = await computeCohortJourney(db, []);
  const beforeByKey = Object.fromEntries(before.stages.map((s) => [s.key, s.count]));

  const learnerA = await makeLearner(db, 'test_journey_learner_a'); // completed every lesson, most recently just now -> Summit, moved forward
  const learnerB = await makeLearner(db, 'test_journey_learner_b'); // completed only the first lesson, 30 days ago -> stage 1, no progress in 7 days
  const learnerC = await makeLearner(db, 'test_journey_learner_c'); // roster member, zero completions ever -> first (Base Camp) stage
  for (const id of [learnerA, learnerB, learnerC]) {
    await db.run('INSERT INTO studio_cohort_learners (cohort_id, learner_id) VALUES (?, ?)', [cohort.id, id]);
    await db.run('DELETE FROM user_lessons WHERE user_id = ?', [id]);
  }
  const now = new Date().toISOString();
  const longAgo = '2020-01-01T00:00:00.000Z';
  for (const lesson of legacyLessons) {
    await db.run('INSERT INTO user_lessons (user_id, lesson_id, completed_at) VALUES (?, ?, ?)', [learnerA, lesson.id, now]);
  }
  await db.run('INSERT INTO user_lessons (user_id, lesson_id, completed_at) VALUES (?, ?, ?)', [learnerB, legacyLessons[0].id, longAgo]);

  const learnersWithRisk = [
    { id: learnerB, status: 'Cần hỗ trợ ngay' },
    { id: 999999, status: 'Cần hỗ trợ ngay' } // not in this roster — must be ignored
  ];

  const after = await computeCohortJourney(db, learnersWithRisk);
  const afterByKey = Object.fromEntries(after.stages.map((s) => [s.key, s.count]));

  assert.equal(after.stages[after.stages.length - 1].key, 'summit');
  assert.equal(afterByKey.summit - (beforeByKey.summit ?? 0), 1, 'learnerA (completed every lesson) lands in the Summit stage');
  assert.equal(afterByKey[after.stages[0].key] - (beforeByKey[after.stages[0].key] ?? 0), 1, 'learnerC (never active) lands in the first stage');
  assert.equal(afterByKey[after.stages[1].key] - (beforeByKey[after.stages[1].key] ?? 0), 1, 'learnerB (completed 1 lesson) lands in the second stage');
  assert.equal(after.total - before.total, 3, 'only the 3 real roster members count, not the unrelated learner');
  assert.equal(after.needsInterventionCount - before.needsInterventionCount, 1);
  assert.equal(after.movedForwardCount - before.movedForwardCount, 1, 'only learnerA completed a lesson in the last 7 days');
  assert.equal(after.noProgressCount - before.noProgressCount, 1, 'learnerB completed a lesson, just not in the last 7 days');

  await db.run('DELETE FROM user_lessons WHERE user_id IN (?, ?, ?)', [learnerA, learnerB, learnerC]);
  await db.run('DELETE FROM studio_cohort_learners WHERE cohort_id = ? AND learner_id IN (?, ?, ?)', [cohort.id, learnerA, learnerB, learnerC]);
  await db.run('DELETE FROM users WHERE id IN (?, ?, ?)', [learnerA, learnerB, learnerC]);
});
