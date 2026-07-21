import test from 'node:test';
import assert from 'node:assert/strict';
import { initDb, getDb } from '../../db.js';
import {
  getRealLearnerAccounts, getRealLearnersWithRisk, getCohortRosterSize, getLearnerInterventions,
  getCohortRoster, addLearnerToCohort, removeLearnerFromCohort, getAllLearnerAccounts
} from '../routes.js';

async function makeLearner(db, username) {
  await db.run('DELETE FROM users WHERE username = ?', [username]);
  const user = await db.run('INSERT INTO users (username, password_hash, xp, streak) VALUES (?, ?, 0, 0)', [username, 'x']);
  await db.run(
    `INSERT INTO user_quizzes (user_id, score, total_questions, topic, type, xp_earned) VALUES (?, 7, 10, 'Topic A', 'practice', 0)`,
    [user.lastID]
  );
  return user.lastID;
}

async function makeCohort(db, trainerId, name) {
  const course = await db.run('INSERT INTO studio_courses (trainer_id, title) VALUES (?, ?)', [trainerId, `Course for ${name}`]);
  const cohort = await db.run('INSERT INTO studio_cohorts (course_id, trainer_id, name) VALUES (?, ?, ?)', [course.lastID, trainerId, name]);
  return cohort.lastID;
}

test('getRealLearnerAccounts: cohort-scoped call excludes learners from other cohorts', async () => {
  await initDb();
  const db = await getDb();
  const trainer = await db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['test_routes_trainer_1', 'x', 'trainer']);
  const learnerA = await makeLearner(db, 'test_routes_learner_a');
  const learnerB = await makeLearner(db, 'test_routes_learner_b');
  const cohortA = await makeCohort(db, trainer.lastID, 'Cohort A');
  const cohortB = await makeCohort(db, trainer.lastID, 'Cohort B');
  await db.run('INSERT INTO studio_cohort_learners (cohort_id, learner_id) VALUES (?, ?)', [cohortA, learnerA]);
  await db.run('INSERT INTO studio_cohort_learners (cohort_id, learner_id) VALUES (?, ?)', [cohortB, learnerB]);

  const inCohortA = await getRealLearnerAccounts(db, cohortA);
  assert.ok(inCohortA.some((l) => l.id === learnerA));
  assert.ok(!inCohortA.some((l) => l.id === learnerB));

  const withRiskA = await getRealLearnersWithRisk(db, cohortA);
  assert.ok(withRiskA.some((l) => l.id === learnerA));
  assert.ok(!withRiskA.some((l) => l.id === learnerB));

  await db.run('DELETE FROM users WHERE id IN (?, ?, ?)', [trainer.lastID, learnerA, learnerB]);
});

test('getCohortRosterSize: counts enrolled learners regardless of activity', async () => {
  await initDb();
  const db = await getDb();
  const trainer = await db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['test_routes_trainer_2', 'x', 'trainer']);
  const learnerA = await makeLearner(db, 'test_routes_learner_c');
  const learnerB = await makeLearner(db, 'test_routes_learner_d');
  const cohort = await makeCohort(db, trainer.lastID, 'Cohort Roster');
  await db.run('INSERT INTO studio_cohort_learners (cohort_id, learner_id) VALUES (?, ?)', [cohort, learnerA]);
  await db.run('INSERT INTO studio_cohort_learners (cohort_id, learner_id) VALUES (?, ?)', [cohort, learnerB]);

  assert.equal(await getCohortRosterSize(db, cohort), 2);

  await db.run('DELETE FROM users WHERE id IN (?, ?, ?)', [trainer.lastID, learnerA, learnerB]);
});

test('getLearnerInterventions: returns assigned interventions with completion status', async () => {
  await initDb();
  const db = await getDb();
  const trainer = await db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['test_routes_trainer_3', 'x', 'trainer']);
  const learner = await makeLearner(db, 'test_routes_learner_e');
  const cohort = await makeCohort(db, trainer.lastID, 'Cohort Interventions');
  const iv1 = await db.run(
    `INSERT INTO studio_interventions (cohort_id, title, status) VALUES (?, ?, 'assigned')`, [cohort, 'Ôn tập A']
  );
  const iv2 = await db.run(
    `INSERT INTO studio_interventions (cohort_id, title, status) VALUES (?, ?, 'assigned')`, [cohort, 'Ôn tập B']
  );
  await db.run('INSERT INTO studio_intervention_assignments (intervention_id, learner_id, completed_at) VALUES (?, ?, NULL)', [iv1.lastID, learner]);
  await db.run('INSERT INTO studio_intervention_assignments (intervention_id, learner_id, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [iv2.lastID, learner]);

  const interventions = await getLearnerInterventions(db, learner);
  assert.equal(interventions.length, 2);
  const incomplete = interventions.find((iv) => iv.title === 'Ôn tập A');
  const complete = interventions.find((iv) => iv.title === 'Ôn tập B');
  assert.equal(incomplete.completed_at, null);
  assert.ok(complete.completed_at);

  await db.run('DELETE FROM users WHERE id IN (?, ?)', [trainer.lastID, learner]);
});

async function makeLearnerNoActivity(db, username) {
  await db.run('DELETE FROM users WHERE username = ?', [username]);
  const user = await db.run('INSERT INTO users (username, password_hash, xp, streak) VALUES (?, ?, 0, 0)', [username, 'x']);
  return user.lastID;
}

test('addLearnerToCohort/getCohortRoster: a freshly-enrolled learner with zero quiz activity still shows up', async () => {
  await initDb();
  const db = await getDb();
  const trainer = await db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['test_routes_trainer_4', 'x', 'trainer']);
  const learner = await makeLearnerNoActivity(db, 'test_routes_learner_f');
  const cohort = await makeCohort(db, trainer.lastID, 'Cohort Roster Mgmt');

  let roster = await getCohortRoster(db, cohort);
  assert.ok(!roster.some((l) => l.id === learner));

  await addLearnerToCohort(db, cohort, learner);
  roster = await getCohortRoster(db, cohort);
  assert.ok(roster.some((l) => l.id === learner));

  // getRealLearnerAccounts still excludes them (no quiz activity yet) — the
  // two views are intentionally different.
  const realAccounts = await getRealLearnerAccounts(db, cohort);
  assert.ok(!realAccounts.some((l) => l.id === learner));

  await removeLearnerFromCohort(db, cohort, learner);
  roster = await getCohortRoster(db, cohort);
  assert.ok(!roster.some((l) => l.id === learner));

  await db.run('DELETE FROM users WHERE id IN (?, ?)', [trainer.lastID, learner]);
});

test('getAllLearnerAccounts: includes real learners regardless of activity, excludes trainers', async () => {
  await initDb();
  const db = await getDb();
  const trainer = await db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['test_routes_trainer_5', 'x', 'trainer']);
  const learner = await makeLearnerNoActivity(db, 'test_routes_learner_g');

  const all = await getAllLearnerAccounts(db);
  assert.ok(all.some((l) => l.id === learner));
  assert.ok(!all.some((l) => l.id === trainer.lastID));

  await db.run('DELETE FROM users WHERE id IN (?, ?)', [trainer.lastID, learner]);
});
