import test from 'node:test';
import assert from 'node:assert/strict';
import { initDb, getDb } from '../db.js';
import { processQuizAnswers, computeSummitReadiness, computeRankedTopics } from '../engines/adaptiveLoop.js';

const TOPIC = '7. Đại lý, đạo đức, quyền & nghĩa vụ';

async function makeTestUser(db, username) {
  await db.run('DELETE FROM users WHERE username = ?', [username]);
  const result = await db.run(
    'INSERT INTO users (username, password_hash, xp, streak, last_login_date) VALUES (?, ?, 0, 5, ?)',
    [username, 'x', new Date().toISOString().split('T')[0]]
  );
  return result.lastID;
}

test('processQuizAnswers: a correct answer raises mastery for that topic', async () => {
  await initDb();
  const db = await getDb();
  const userId = await makeTestUser(db, 'test_adaptive_1');

  const { masteryUpdates } = await processQuizAnswers(db, userId, [
    { question: 'Đại lý bảo hiểm có nghĩa vụ gì?', topic: TOPIC, difficulty: 'Trung bình', isCorrect: true }
  ]);

  assert.equal(masteryUpdates.length, 1);
  assert.ok(masteryUpdates[0].newMastery > masteryUpdates[0].previousMastery);

  const row = await db.get('SELECT * FROM topic_mastery WHERE user_id = ? AND topic = ?', [userId, TOPIC]);
  assert.equal(row.evidence_count, 1);

  await db.run('DELETE FROM users WHERE id = ?', [userId]);
});

test('processQuizAnswers: a confident wrong answer on a moderately-known topic flags a Rescue Trail', async () => {
  await initDb();
  const db = await getDb();
  const userId = await makeTestUser(db, 'test_adaptive_2');

  // Prime some existing mastery so the "concept confusion" branch (mastery >= 40) applies.
  await db.run(
    `INSERT INTO topic_mastery (user_id, topic, mastery_score, evidence_count, last_reviewed_at)
     VALUES (?, ?, 55, 2, CURRENT_TIMESTAMP)`,
    [userId, TOPIC]
  );

  const { rescueNeeded, masteryUpdates } = await processQuizAnswers(db, userId, [
    {
      question: 'Đại lý bảo hiểm có nghĩa vụ gì đối với khách hàng?',
      topic: TOPIC,
      difficulty: 'Trung bình',
      isCorrect: false,
      confidence: 'certain',
      responseTimeMs: 20000
    }
  ]);

  assert.ok(rescueNeeded);
  assert.equal(rescueNeeded.topic, TOPIC);
  assert.equal(rescueNeeded.mistakeType, 'concept_confusion');
  assert.equal(masteryUpdates[0].mistakeDNA.type, 'concept_confusion');

  await db.run('DELETE FROM users WHERE id = ?', [userId]);
});

test('computeRankedTopics: a topic with a recent high-confidence mistake ranks above one with none', async () => {
  await initDb();
  const db = await getDb();
  const userId = await makeTestUser(db, 'test_adaptive_3');

  const quiz = await db.run(
    `INSERT INTO user_quizzes (user_id, score, total_questions, topic, type, xp_earned) VALUES (?, 0, 1, ?, 'practice', 0)`,
    [userId, TOPIC]
  );
  await db.run(
    `INSERT INTO user_quiz_answers (quiz_id, question, topic, options, correct_index, selected_index, is_correct, confidence)
     VALUES (?, 'q', ?, '[]', 0, 1, 0, 'certain')`,
    [quiz.lastID, TOPIC]
  );

  const ranked = await computeRankedTopics(db, userId, 14);
  const flagged = ranked.find((r) => r.topic === TOPIC);
  assert.ok(flagged);
  assert.ok(flagged.reasons.includes('HIGH_CONFIDENCE_MISTAKE'));

  // Compare against the same computation without the mistake — isolates the
  // misconception multiplier's effect instead of depending on this DB's
  // relative exam-weight distribution across topics.
  const rankedWithoutMistake = await computeRankedTopics(db, userId + 999999, 14);
  const unflagged = rankedWithoutMistake.find((r) => r.topic === TOPIC);
  assert.ok(flagged.score > unflagged.score);

  await db.run('DELETE FROM users WHERE id = ?', [userId]);
});

test('computeSummitReadiness: returns a 0-100 score with no crash for a brand-new user', async () => {
  await initDb();
  const db = await getDb();
  const userId = await makeTestUser(db, 'test_adaptive_4');

  const { score, label } = await computeSummitReadiness(db, userId);
  assert.ok(score >= 0 && score <= 100);
  assert.equal(typeof label, 'string');

  await db.run('DELETE FROM users WHERE id = ?', [userId]);
});
