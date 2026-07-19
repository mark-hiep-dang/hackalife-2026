// Orchestrates the deterministic engines against real DB state (spec §10's
// adaptive loop). Kept separate from server.js so route handlers stay thin,
// and separate from the pure engines so those stay unit-testable without a DB.

import { calculateMastery, masteryStateLabel } from './mastery.js';
import { classifyMistake } from './mistakeDNA.js';
import { rankTopics } from './priority.js';
import { calculateSummitReadiness, aggregateReadinessInputs } from './summitReadiness.js';

function daysBetween(a, b) {
  return Math.max(0, Math.round((b - a) / 86400000));
}

export async function getExamWeights(db) {
  const rows = await db.all('SELECT topic, COUNT(*) as cnt FROM test_questions GROUP BY topic');
  const total = rows.reduce((s, r) => s + r.cnt, 0) || 1;
  const weights = {};
  for (const r of rows) weights[r.topic] = r.cnt / total;
  return weights;
}

async function getTopicMasteryRow(db, userId, topic) {
  const row = await db.get('SELECT * FROM topic_mastery WHERE user_id = ? AND topic = ?', [userId, topic]);
  return row || { mastery_score: 0, evidence_count: 0, last_reviewed_at: null };
}

/**
 * Read-only Mistake DNA classification for a single just-answered question —
 * used to show inline feedback immediately in practice mode, without writing
 * anything (the batch submit at the end of the session is the sole writer,
 * so this can't cause a double-update of mastery).
 */
export async function previewMistakeDNA(db, userId, answer) {
  if (answer.isCorrect) return null;
  const topic = answer.topic || 'unknown';
  const prev = await getTopicMasteryRow(db, userId, topic);
  const daysSinceLastReview = prev.last_reviewed_at
    ? daysBetween(new Date(prev.last_reviewed_at), new Date())
    : undefined;

  return classifyMistake({
    question: answer.question,
    previousMastery: prev.mastery_score,
    evidenceCount: prev.evidence_count,
    confidence: answer.confidence,
    responseTimeMs: answer.responseTimeMs,
    daysSinceLastReview
  });
}

/**
 * Persists a batch of quiz answers, updates mastery + Mistake DNA per topic,
 * and flags whether a Rescue Trail or a visible path-change is warranted.
 * `answers` items: { question, topic, difficulty, isCorrect, confidence, responseTimeMs }
 */
export async function processQuizAnswers(db, userId, answers) {
  const masteryUpdates = [];
  let rescueNeeded = null;
  let pathChanged = false;

  for (const a of answers) {
    const topic = a.topic || 'unknown';
    const prev = await getTopicMasteryRow(db, userId, topic);
    const daysSinceLastReview = prev.last_reviewed_at
      ? daysBetween(new Date(prev.last_reviewed_at), new Date())
      : undefined;

    let mistake = null;
    if (!a.isCorrect) {
      mistake = classifyMistake({
        question: a.question,
        previousMastery: prev.mastery_score,
        evidenceCount: prev.evidence_count,
        confidence: a.confidence,
        responseTimeMs: a.responseTimeMs,
        daysSinceLastReview
      });
    }

    const { mastery: newMastery } = calculateMastery({
      previousMastery: prev.mastery_score,
      isCorrect: a.isCorrect,
      difficulty: a.difficulty,
      confidence: a.confidence,
      responseTimeMs: a.responseTimeMs
    });

    const previousState = masteryStateLabel(prev.mastery_score);
    const newState = masteryStateLabel(newMastery);
    if (previousState !== newState) pathChanged = true;

    await db.run(
      `INSERT INTO topic_mastery (user_id, topic, mastery_score, evidence_count, last_reviewed_at, updated_at)
       VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, topic) DO UPDATE SET
         mastery_score = excluded.mastery_score,
         evidence_count = evidence_count + 1,
         last_reviewed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, topic, newMastery]
    );
    await db.run('INSERT INTO mastery_history (user_id, topic, mastery_score) VALUES (?, ?, ?)', [userId, topic, newMastery]);

    const isRescueWorthy =
      mistake &&
      (mistake.type === 'concept_confusion' ||
        mistake.type === 'memory_decay' ||
        (newMastery < 50 && prev.evidence_count >= 1));
    if (isRescueWorthy && !rescueNeeded) {
      rescueNeeded = { topic, mistakeType: mistake.type };
    }

    masteryUpdates.push({
      topic,
      previousMastery: prev.mastery_score,
      newMastery,
      previousState,
      newState,
      mistakeDNA: mistake
    });
  }

  return { masteryUpdates, rescueNeeded, pathChanged };
}

/** Ranks every real exam topic by priority for the current user (spec §8). */
export async function computeRankedTopics(db, userId, daysUntilExam) {
  const weights = await getExamWeights(db);
  const masteryRows = await db.all(
    'SELECT topic, mastery_score, last_reviewed_at, evidence_count FROM topic_mastery WHERE user_id = ?',
    [userId]
  );
  const masteryByTopic = new Map(masteryRows.map((r) => [r.topic, r]));

  const recentAnswers = await db.all(
    `SELECT ua.topic, ua.confidence, ua.is_correct FROM user_quiz_answers ua
     JOIN user_quizzes q ON ua.quiz_id = q.id
     WHERE q.user_id = ? ORDER BY ua.id DESC LIMIT 20`,
    [userId]
  );

  const topics = Object.keys(weights).map((topic) => {
    const m = masteryByTopic.get(topic);
    const daysSinceLastReview = m?.last_reviewed_at ? daysBetween(new Date(m.last_reviewed_at), new Date()) : undefined;
    const topicAnswers = recentAnswers.filter((r) => r.topic === topic && !r.is_correct);
    return {
      topic,
      mastery: m?.mastery_score ?? 0,
      examWeight: weights[topic],
      daysSinceLastReview,
      daysUntilExam,
      hasRecentMistake: topicAnswers.length > 0,
      hasRecentHighConfidenceMistake: topicAnswers.some((r) => r.confidence === 'certain')
    };
  });

  return rankTopics(topics);
}

/** Aggregates Summit Readiness for the current user from real DB state (spec §12). */
export async function computeSummitReadiness(db, userId) {
  const weights = await getExamWeights(db);
  const masteryRows = await db.all(
    'SELECT topic, mastery_score, last_reviewed_at FROM topic_mastery WHERE user_id = ?',
    [userId]
  );
  const masteryByTopic = new Map(masteryRows.map((r) => [r.topic, r]));

  const topics = Object.keys(weights).map((topic) => {
    const m = masteryByTopic.get(topic);
    const daysSinceLastReview = m?.last_reviewed_at ? daysBetween(new Date(m.last_reviewed_at), new Date()) : undefined;
    return { topic, mastery: m?.mastery_score ?? 0, examWeight: weights[topic], daysSinceLastReview };
  });

  const user = await db.get('SELECT streak FROM users WHERE id = ?', [userId]);
  const mockExams = await db.all(
    `SELECT score, total_questions FROM user_quizzes WHERE user_id = ? AND type = 'exam' ORDER BY created_at DESC LIMIT 3`,
    [userId]
  );
  const mockExamScore = mockExams.length
    ? Math.round((100 * mockExams.reduce((s, q) => s + q.score / q.total_questions, 0)) / mockExams.length)
    : undefined;

  const inputs = aggregateReadinessInputs(topics, user?.streak ?? 0);
  return calculateSummitReadiness({ ...inputs, mockExamScore });
}
