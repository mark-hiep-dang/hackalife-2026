import test from 'node:test';
import assert from 'node:assert/strict';
import { initDb, getDb } from '../../db.js';
import { buildJourneyStages, journeyStageForScore, computeCohortJourney } from '../routes.js';

test('buildJourneyStages: derives one stage per real camp, labeled from the camp title, last camp forced to Summit', () => {
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

async function makeLearner(db, username) {
  await db.run('DELETE FROM users WHERE username = ?', [username]);
  const user = await db.run('INSERT INTO users (username, password_hash, xp, streak) VALUES (?, ?, 0, 0)', [username, 'x']);
  return user.lastID;
}

// computeCohortJourney scopes its roster to the currently-PUBLISHED course's
// own cohorts (real MOF course + cohort already exist in the seeded dev DB),
// so this test adds its 3 learners to a cohort of THAT course and asserts
// the delta it causes, never an absolute total (the shared dev DB already
// has other real roster members for that same course).
test('computeCohortJourney: buckets a published course\'s roster by real Summit Readiness score, counting a never-active member at the first stage', async () => {
  await initDb();
  const db = await getDb();
  await db.run('DELETE FROM users WHERE username = ?', ['test_journey_learner_a']);
  await db.run('DELETE FROM users WHERE username = ?', ['test_journey_learner_b']);
  await db.run('DELETE FROM users WHERE username = ?', ['test_journey_learner_c']);

  const publishedCourse = await db.get("SELECT * FROM studio_courses WHERE status = 'PUBLISHED' ORDER BY id LIMIT 1");
  assert.ok(publishedCourse, 'expected a seeded PUBLISHED course to exist in the dev DB');
  const cohort = await db.get('SELECT id FROM studio_cohorts WHERE course_id = ? LIMIT 1', [publishedCourse.id]);
  assert.ok(cohort, 'expected the published course to already have a cohort');

  const before = await computeCohortJourney(db, []);
  const beforeByKey = Object.fromEntries(before.stages.map((s) => [s.key, s.count]));

  const learnerA = await makeLearner(db, 'test_journey_learner_a'); // active, high score -> last (Summit) stage
  const learnerB = await makeLearner(db, 'test_journey_learner_b'); // active, low score -> first stage
  const learnerC = await makeLearner(db, 'test_journey_learner_c'); // roster member, zero activity -> first stage
  for (const id of [learnerA, learnerB, learnerC]) {
    await db.run('INSERT INTO studio_cohort_learners (cohort_id, learner_id) VALUES (?, ?)', [cohort.id, id]);
  }

  const learnersWithRisk = [
    { id: learnerA, summitReadinessScore: 95, status: 'Ổn định', lastActivityAt: new Date().toISOString() },
    { id: learnerB, summitReadinessScore: 5, status: 'Cần hỗ trợ ngay', lastActivityAt: '2020-01-01T00:00:00.000Z' },
    { id: 999999, summitReadinessScore: 95, status: 'Ổn định', lastActivityAt: new Date().toISOString() } // not in this roster — must be ignored
  ];

  const after = await computeCohortJourney(db, learnersWithRisk);
  const afterByKey = Object.fromEntries(after.stages.map((s) => [s.key, s.count]));

  assert.equal(after.stages[after.stages.length - 1].key, 'summit');
  assert.equal(afterByKey.summit - (beforeByKey.summit ?? 0), 1, 'learnerA (score 95) lands in the Summit stage');
  assert.equal(afterByKey[after.stages[0].key] - (beforeByKey[after.stages[0].key] ?? 0), 2, 'learnerB (score 5) + learnerC (never active) both land in the first stage');
  assert.equal(after.total - before.total, 3, 'only the 3 real roster members count, not the unrelated learner');
  assert.equal(after.needsInterventionCount - before.needsInterventionCount, 1);
  assert.equal(after.movedForwardCount - before.movedForwardCount, 1, 'only learnerA has recent activity');
  assert.equal(after.noProgressCount - before.noProgressCount, 1, 'learnerB has activity, just none in the last 7 days');

  await db.run('DELETE FROM studio_cohort_learners WHERE cohort_id = ? AND learner_id IN (?, ?, ?)', [cohort.id, learnerA, learnerB, learnerC]);
  await db.run('DELETE FROM users WHERE id IN (?, ?, ?)', [learnerA, learnerB, learnerC]);
});
