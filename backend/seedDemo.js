// Demo Mode scenario seed (spec §18) — run with:
//   node seedDemo.js
// Targets a dedicated demo account (never the real "linsu" user's actual
// progress) so running this is always safe to repeat before a demo.
//
// Scenario: 14 days until the exam, 20 min/day, strong in basic insurance
// knowledge, weak in insurance-agent rights & obligations, one recent
// high-confidence wrong answer on that weak topic (triggers Concept
// Confusion + a Rescue Trail), Summit Readiness starting around 60%.

import bcrypt from 'bcryptjs';
import { initDb, getDb } from './db.js';

const DEMO_USERNAME = process.env.DEMO_USERNAME || 'Agentdemo';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demopass123';

const STRONG_TOPIC = '1. Kiến thức chung & quản trị rủi ro';
const WEAK_TOPIC = '7. Đại lý, đạo đức, quyền & nghĩa vụ';
const OTHER_TOPICS = [
  '2. Thuật ngữ & chủ thể hợp đồng',
  '3. Nguyên tắc & phân loại bảo hiểm',
  '4. Bảo hiểm nhân thọ cơ bản',
  '5. Bảo hiểm sức khỏe',
  '6. Hợp đồng bảo hiểm & pháp luật',
  '8. Tình huống tổng hợp'
];

async function main() {
  await initDb();
  const db = await getDb();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  let user = await db.get('SELECT id FROM users WHERE username = ?', [DEMO_USERNAME]);
  if (!user) {
    const result = await db.run(
      'INSERT INTO users (username, password_hash, xp, streak, last_login_date, selected_path) VALUES (?, ?, ?, ?, ?, ?)',
      [DEMO_USERNAME, passwordHash, 450, 6, new Date().toISOString().split('T')[0], 'MOF']
    );
    user = { id: result.lastID };
    console.log(`Created demo user "${DEMO_USERNAME}" (password: ${DEMO_PASSWORD})`);
  } else {
    // Always reset the password too — the documented demo login must work
    // every time this script runs, regardless of what the account's password
    // happened to be set to before.
    await db.run('UPDATE users SET xp = 450, streak = 6, selected_path = ?, password_hash = ? WHERE id = ?', ['MOF', passwordHash, user.id]);
    console.log(`Reusing existing demo user "${DEMO_USERNAME}" (id ${user.id}), password reset`);
  }
  const userId = user.id;

  // 1. Learner preferences: 14 days to exam, 20 min/day.
  const examDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  await db.run(
    `INSERT INTO learner_preferences (user_id, exam_date, daily_minutes, target_score, experience_level, preferred_format, goal, updated_at)
     VALUES (?, ?, 20, 70, 'new', 'quiz', 'pass', CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET
       exam_date = excluded.exam_date, daily_minutes = excluded.daily_minutes, target_score = excluded.target_score,
       experience_level = excluded.experience_level, preferred_format = excluded.preferred_format, goal = excluded.goal,
       updated_at = CURRENT_TIMESTAMP`,
    [userId, examDate]
  );

  // 2. Mastery: strong in fundamentals, weak in agent rights/obligations,
  // moderate everywhere else — nets to a Summit Readiness around 60%.
  await db.run('DELETE FROM topic_mastery WHERE user_id = ?', [userId]);
  await db.run('DELETE FROM mastery_history WHERE user_id = ?', [userId]);

  async function setMastery(topic, score, evidenceCount, daysAgo) {
    const reviewedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    await db.run(
      `INSERT INTO topic_mastery (user_id, topic, mastery_score, evidence_count, last_reviewed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, topic, score, evidenceCount, reviewedAt]
    );
    await db.run('INSERT INTO mastery_history (user_id, topic, mastery_score) VALUES (?, ?, ?)', [userId, topic, score]);
  }

  await setMastery(STRONG_TOPIC, 88, 6, 1);
  // Weak topic sits at moderate mastery on purpose, not near-zero: Concept
  // Confusion means "you know something here, but two ideas are mixed up" —
  // the classifier requires mastery >= 40 for that diagnosis (below that,
  // a wrong answer reads as a plain knowledge gap instead, see
  // engines/mistakeDNA.js). 52 keeps the "moderately-understood but
  // confused" narrative intact for the live demo.
  await setMastery(WEAK_TOPIC, 52, 3, 2);
  for (const topic of OTHER_TOPICS) {
    await setMastery(topic, 60 + Math.round(Math.random() * 10), 3, 3);
  }

  // 3. One recent high-confidence wrong answer on the weak topic, logged to
  // history so computeRankedTopics already flags it as a recent high-
  // confidence mistake before the presenter does anything live.
  const question = await db.get(
    `SELECT * FROM test_questions WHERE topic = ? AND difficulty != 'Dễ' ORDER BY RANDOM() LIMIT 1`,
    [WEAK_TOPIC]
  );
  if (question) {
    const wrongIndex = (['A', 'B', 'C', 'D'].indexOf(question.answer) + 1) % 4;
    const quiz = await db.run(
      `INSERT INTO user_quizzes (user_id, score, total_questions, topic, type, xp_earned, created_at)
       VALUES (?, 0, 1, ?, 'practice', 0, CURRENT_TIMESTAMP)`,
      [userId, WEAK_TOPIC]
    );
    await db.run(
      `INSERT INTO user_quiz_answers
         (quiz_id, question, topic, options, correct_index, selected_index, is_correct, explanation, difficulty, confidence, response_time_ms)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'certain', 22000)`,
      [
        quiz.lastID, question.question, WEAK_TOPIC,
        JSON.stringify([question.optA, question.optB, question.optC, question.optD].filter(Boolean)),
        ['A', 'B', 'C', 'D'].indexOf(question.answer), wrongIndex, question.explanation, question.difficulty
      ]
    );
    console.log(`Seeded a recent high-confidence wrong answer on "${WEAK_TOPIC}" → next quiz submit involving this topic will trigger Concept Confusion + a Rescue Trail.`);
  } else {
    console.warn(`No non-easy question found for "${WEAK_TOPIC}" — skipped seeding the wrong-answer trigger.`);
  }

  // Clear any cached Daily Expedition so it regenerates fresh from this seeded state.
  await db.run('DELETE FROM daily_expedition WHERE user_id = ?', [userId]);

  console.log('\nDemo scenario ready:');
  console.log(`  Login: ${DEMO_USERNAME} / ${DEMO_PASSWORD}`);
  console.log(`  Exam in 14 days, 20 min/day, strong in "${STRONG_TOPIC}", weak in "${WEAK_TOPIC}".`);
  console.log('  Summit Readiness should read ~60%. Submitting a wrong answer on the weak topic (or opening its Rescue Trail) shows the adaptive loop live.');

  process.exit(0);
}

main().catch((err) => {
  console.error('Demo seed failed:', err);
  process.exit(1);
});
