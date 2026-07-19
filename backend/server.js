import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';
import { initDb, getDb } from './db.js';
import { generateDynamicQuestion, generateLlamaQuestion, questionBank } from './questions.js';
import { chunkText, buildFtsQuery, retrieveKnowledge, storeDocument, getChunkSource, pickBestMatchingChunk } from './knowledgeBase.js';
import { processQuizAnswers, previewMistakeDNA, computeRankedTopics, computeSummitReadiness, getExamWeights } from './engines/adaptiveLoop.js';
import { buildDailyExpedition } from './engines/dailyExpedition.js';
import { buildPriorityExplanation } from './engines/reasonCopy.js';
import { assembleRescueTrail } from './engines/rescueTrail.js';
import { masteryStateLabel } from './engines/mastery.js';
import { explainExpedition, explainMistake, generateRescueTrail } from './llamaAIService.js';
import { mountStudioRoutes } from './studio/routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5005;
const JWT_SECRET = process.env.JWT_SECRET || 'pang_chiu_secret_key_2026';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());

// Initialize Database
await initDb();

// --- AUTH MIDDLEWARE ---
// Verifies the token's signature is valid AND that the account it points to still
// exists — a token can outlive its user (e.g. account removed after issuing), and
// without this check downstream inserts using req.user.id as a foreign key
// (e.g. knowledge_documents.uploaded_by) fail with a raw SQLITE_CONSTRAINT error.
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    try {
      const db = await getDb();
      const exists = await db.get('SELECT id FROM users WHERE id = ?', [user.id]);
      if (!exists) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
      req.user = user;
      next();
    } catch (dbErr) {
      res.status(500).json({ error: dbErr.message });
    }
  });
}

// Helper to calculate level based on XP
// Level 1: 0-99 XP, Level 2: 100-299 XP, Level 3: 300-599 XP, etc.
// Formula: level = floor(sqrt(XP / 100)) + 1
function calculateLevel(xp) {
  if (xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// Helper to check and update streak
async function updateLoginStreak(db, userId, lastLoginStr) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  if (!lastLoginStr) {
    // First time logging in
    await db.run('UPDATE users SET streak = 1, last_login_date = ? WHERE id = ?', [todayStr, userId]);
    return 1;
  }

  const lastLogin = new Date(lastLoginStr);
  const today = new Date(todayStr);
  
  // Calculate difference in days
  const diffTime = Math.abs(today - lastLogin);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let newStreak = 0;
  if (diffDays === 0) {
    // Already logged in today, keep streak
    const user = await db.get('SELECT streak FROM users WHERE id = ?', [userId]);
    return user.streak;
  } else if (diffDays === 1) {
    // Logged in consecutive day
    const user = await db.get('SELECT streak FROM users WHERE id = ?', [userId]);
    newStreak = (user.streak || 0) + 1;
    await db.run('UPDATE users SET streak = ?, last_login_date = ? WHERE id = ?', [newStreak, todayStr, userId]);
  } else {
    // Streak broken (more than 1 day since last login)
    newStreak = 1;
    await db.run('UPDATE users SET streak = 1, last_login_date = ? WHERE id = ?', [todayStr, userId]);
  }

  return newStreak;
}

// Helper to check if a user is eligible for badges
async function evaluateBadges(db, userId) {
  const user = await db.get('SELECT xp, streak FROM users WHERE id = ?', [userId]);
  const lessonsCompleted = await db.all('SELECT lesson_id FROM user_lessons WHERE user_id = ?', [userId]);
  const quizHistory = await db.all('SELECT score, total_questions FROM user_quizzes WHERE user_id = ?', [userId]);
  
  const currentBadges = (await db.all('SELECT badge_id FROM user_badges WHERE user_id = ?', [userId])).map(b => b.badge_id);
  const newlyUnlocked = [];

  const badgesToCheck = [
    {
      id: 'streak_3',
      check: () => user.streak >= 3
    },
    {
      id: 'streak_7',
      check: () => user.streak >= 7
    },
    {
      id: 'first_lesson',
      check: () => lessonsCompleted.length >= 1
    },
    {
      id: 'topic_master',
      check: () => lessonsCompleted.length >= 4 // Seeded lessons count is 4
    },
    {
      id: 'pang_sniper', // 5 correct answers in a row / perfect quiz
      check: () => quizHistory.some(q => q.score === q.total_questions && q.total_questions >= 5)
    },
    {
      id: 'xp_1000',
      check: () => user.xp >= 1000
    }
  ];

  for (const badge of badgesToCheck) {
    if (!currentBadges.includes(badge.id) && badge.check()) {
      await db.run('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)', [userId, badge.id]);
      newlyUnlocked.push(badge.id);
    }
  }

  return newlyUnlocked;
}

// --- API ENDPOINTS ---

// Auth Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const db = await getDb();
  try {
    const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const todayStr = new Date().toISOString().split('T')[0];

    const result = await db.run(
      'INSERT INTO users (username, password_hash, xp, streak, last_login_date) VALUES (?, ?, 0, 1, ?)',
      [username, passwordHash, todayStr]
    );

    const token = jwt.sign({ id: result.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: result.lastID, username, xp: 0, level: 1, streak: 1, selected_path: null, role: 'learner' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const db = await getDb();
  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Update login streak
    const currentStreak = await updateLoginStreak(db, user.id, user.last_login_date);
    
    // Recalculate level just in case
    const currentLevel = calculateLevel(user.xp);
    await db.run('UPDATE users SET level = ? WHERE id = ?', [currentLevel, user.id]);

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        xp: user.xp,
        level: currentLevel,
        streak: currentStreak,
        selected_path: user.selected_path,
        role: user.role || 'learner'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User Profile & Stats
app.get('/api/profile', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const user = await db.get('SELECT id, username, xp, level, streak, last_login_date, selected_path, role FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Fresh check for streak when retrieving profile
    const currentStreak = await updateLoginStreak(db, user.id, user.last_login_date);
    const badges = (await db.all('SELECT badge_id, unlocked_at FROM user_badges WHERE user_id = ?', [req.user.id]));
    const lessons = (await db.all('SELECT lesson_id FROM user_lessons WHERE user_id = ?', [req.user.id])).map(l => l.lesson_id);
    const quizzes = await db.all('SELECT score, total_questions, topic, type, xp_earned, created_at FROM user_quizzes WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [req.user.id]);

    res.json({
      id: user.id,
      username: user.username,
      xp: user.xp,
      level: user.level,
      streak: currentStreak,
      selected_path: user.selected_path,
      role: user.role || 'learner',
      badges,
      completedLessons: lessons,
      quizHistory: quizzes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Safe demo role switch (spec: NOT complex enterprise RBAC) — lets any
// account flip between the learner app and Llama Studio for demo purposes.
app.put('/api/profile/role', authenticateToken, async (req, res) => {
  const { role } = req.body;
  if (!['learner', 'trainer'].includes(role)) {
    return res.status(400).json({ error: 'Vai trò không hợp lệ' });
  }
  const db = await getDb();
  try {
    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.user.id]);
    res.json({ success: true, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update User Path
app.put('/api/profile/path', authenticateToken, async (req, res) => {
  const { path } = req.body;
  if (!['MOF', 'UL', 'ILP'].includes(path)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  
  const db = await getDb();
  try {
    await db.run('UPDATE users SET selected_path = ? WHERE id = ?', [path, req.user.id]);
    res.json({ success: true, selected_path: path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Lessons list & Status
app.get('/api/lessons', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const lessons = await db.all('SELECT * FROM lessons ORDER BY order_index ASC');
    const completed = (await db.all('SELECT lesson_id FROM user_lessons WHERE user_id = ?', [req.user.id])).map(l => l.lesson_id);
    
    const lessonsWithStatus = lessons.map((l, index) => {
      const cards = JSON.parse(l.cards);
      const isCompleted = completed.includes(l.id);
      
      // Unlock mechanism: First lesson is always unlocked, others are unlocked if the previous one is completed
      let isUnlocked = false;
      if (index === 0) {
        isUnlocked = true;
      } else {
        const prevLessonId = lessons[index - 1].id;
        isUnlocked = completed.includes(prevLessonId);
      }

      return {
        id: l.id,
        title_en: l.title_en,
        title_vn: l.title_vn,
        topic: l.topic,
        difficulty: l.difficulty,
        cards,
        order_index: l.order_index,
        isCompleted,
        isUnlocked
      };
    });

    res.json(lessonsWithStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete a Lesson
app.post('/api/lessons/:id/complete', authenticateToken, async (req, res) => {
  const lessonId = req.params.id;
  const db = await getDb();
  try {
    const lesson = await db.get('SELECT id FROM lessons WHERE id = ?', [lessonId]);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    // Check if already completed
    const existing = await db.get('SELECT 1 FROM user_lessons WHERE user_id = ? AND lesson_id = ?', [req.user.id, lessonId]);
    
    let xpEarned = 0;
    if (!existing) {
      // Mark complete
      await db.run('INSERT INTO user_lessons (user_id, lesson_id) VALUES (?, ?)', [req.user.id, lessonId]);
      xpEarned = 25; // Complete a lesson = 25 XP
      
      // Update User XP
      const user = await db.get('SELECT xp FROM users WHERE id = ?', [req.user.id]);
      const newXp = (user.xp || 0) + xpEarned;
      const newLevel = calculateLevel(newXp);
      
      await db.run('UPDATE users SET xp = ?, level = ? WHERE id = ?', [newXp, newLevel, req.user.id]);
    }

    const newlyUnlockedBadges = await evaluateBadges(db, req.user.id);
    const updatedUser = await db.get('SELECT xp, level, streak FROM users WHERE id = ?', [req.user.id]);

    res.json({
      message: 'Lesson completed successfully',
      xp_earned: xpEarned,
      xp: updatedUser.xp,
      level: updatedUser.level,
      newBadges: newlyUnlockedBadges
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate quiz questions
app.get('/api/quiz/generate', authenticateToken, async (req, res) => {
  const { topic, difficulty, type } = req.query; // type: 'practice' or 'exam'
  const db = await getDb();
  
  try {
    if (type === 'exam') {
      // Exam: 40 questions (according to "Đề mẫu 40 câu" standard)
      const examQuestions = await db.all('SELECT * FROM test_questions ORDER BY RANDOM() LIMIT 40');
      return res.json(examQuestions.map(q => ({
        id: q.id,
        stt: q.stt,
        topic: q.topic,
        difficulty: q.difficulty,
        question: q.question,
        options: [q.optA, q.optB, q.optC, q.optD].filter(Boolean),
        correct_index: ['A', 'B', 'C', 'D'].indexOf(q.answer),
        answer: q.answer,
        explanation: q.explanation,
        source: q.source,
        type: 'mcq'
      })));
    }

    // Practice Mode: 5 questions
    let query = 'SELECT * FROM test_questions WHERE 1=1';
    const params = [];
    
    // In practice mode we can filter by topic if requested (though for now we might just randomize)
    // if (topic && topic !== 'all') { query += ' AND topic LIKE ?'; params.push(`%${topic}%`); }
    
    query += ' ORDER BY RANDOM() LIMIT 5';
    const questions = await db.all(query, params);
    
    res.json(questions.map(q => ({
      id: q.id,
      stt: q.stt,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q.question,
      options: [q.optA, q.optB, q.optC, q.optD].filter(Boolean),
      correct_index: ['A', 'B', 'C', 'D'].indexOf(q.answer),
      answer: q.answer,
      explanation: q.explanation,
      source: q.source,
      type: 'mcq'
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get flashcard topic sets with counts, plus how many the current user has marked known
app.get('/api/flashcards/topics', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const topics = await db.all(
      `SELECT f.topic, COUNT(*) as count,
              COALESCE(SUM(CASE WHEN ufp.known = 1 THEN 1 ELSE 0 END), 0) as known_count
       FROM flashcards f
       LEFT JOIN user_flashcard_progress ufp ON ufp.flashcard_id = f.id AND ufp.user_id = ?
       GROUP BY f.topic ORDER BY f.topic ASC`,
      [req.user.id]
    );
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark a flashcard as known/unknown for the current user (upsert)
app.post('/api/flashcards/:id/progress', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const { known } = req.body;
    await db.run(
      `INSERT INTO user_flashcard_progress (user_id, flashcard_id, known, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, flashcard_id) DO UPDATE SET known = excluded.known, updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, req.params.id, known ? 1 : 0]
    );
    // Append-only review log (spec §15) — powers "due for review" and
    // forgetting-risk math, which user_flashcard_progress's latest-state-only
    // row can't provide on its own.
    const card = await db.get('SELECT topic FROM flashcards WHERE id = ?', [req.params.id]);
    await db.run(
      'INSERT INTO flashcard_reviews (user_id, flashcard_id, topic, known) VALUES (?, ?, ?, ?)',
      [req.user.id, req.params.id, card?.topic || null, known ? 1 : 0]
    );
    res.json({ message: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get flashcards — pass ?topic= to get a full topic set, otherwise a random sample
app.get('/api/flashcards', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const { topic } = req.query;
    const cards = topic
      ? await db.all('SELECT * FROM flashcards WHERE topic = ? ORDER BY stt ASC', [topic])
      : await db.all('SELECT * FROM flashcards ORDER BY RANDOM() LIMIT 20');
    res.json(cards.map(c => ({
      id: c.id,
      stt: c.stt,
      topic: c.topic,
      card_type: c.card_type,
      difficulty: c.difficulty,
      front: c.front,
      back: c.back,
      keyword: c.keyword,
      type: 'flashcard'
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Quiz score
app.post('/api/quiz/submit', authenticateToken, async (req, res) => {
  const { score, totalQuestions, topic, type, maxCombo, answers } = req.body;
  const db = await getDb();
  try {
    // Base XP: 10 XP per correct answer
    let xpEarned = score * 10;

    // Combo multiplier bonus: 5% bonus per max combo item, up to 25% (max combo of 5+)
    let comboMultiplier = 1;
    if (maxCombo && maxCombo > 1) {
      comboMultiplier = 1 + Math.min((maxCombo - 1) * 0.05, 0.25);
    }

    xpEarned = Math.round(xpEarned * comboMultiplier);

    // Save quiz attempt
    const quizResult = await db.run(
      'INSERT INTO user_quizzes (user_id, score, total_questions, topic, type, xp_earned) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, score, totalQuestions, topic, type, xpEarned]
    );

    // Persist the full per-question breakdown for BOTH modes now (previously
    // exam-only) — the adaptive engines need per-question evidence from
    // practice mode too, not just mock exams.
    if (Array.isArray(answers) && answers.length > 0) {
      for (const a of answers) {
        await db.run(
          `INSERT INTO user_quiz_answers
             (quiz_id, question, topic, options, correct_index, selected_index, is_correct, explanation, difficulty, confidence, response_time_ms)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quizResult.lastID, a.question, a.topic || topic || '', JSON.stringify(a.options || []),
            a.correct_index, a.selected_index, a.isCorrect ? 1 : 0, a.explanation || '',
            a.difficulty || null, a.confidence || null, a.responseTimeMs ?? null
          ]
        );
      }
    }

    // Update user stats
    const user = await db.get('SELECT xp FROM users WHERE id = ?', [req.user.id]);
    const newXp = (user.xp || 0) + xpEarned;
    const newLevel = calculateLevel(newXp);

    await db.run('UPDATE users SET xp = ?, level = ? WHERE id = ?', [newXp, newLevel, req.user.id]);

    const newlyUnlockedBadges = await evaluateBadges(db, req.user.id);
    const updatedUser = await db.get('SELECT xp, level, streak FROM users WHERE id = ?', [req.user.id]);

    // Personalized Expedition adaptive loop (spec §10): update mastery, run
    // Mistake DNA, and flag whether a Rescue Trail / visible path change is
    // warranted. Never lets an adaptive-loop error break the core quiz flow.
    let masteryUpdates = [];
    let rescueNeeded = null;
    let pathChanged = false;
    try {
      if (Array.isArray(answers) && answers.length > 0) {
        const prefs = await db.get('SELECT exam_date FROM learner_preferences WHERE user_id = ?', [req.user.id]);
        const daysUntilExam = prefs?.exam_date
          ? Math.max(1, Math.round((new Date(prefs.exam_date) - new Date()) / 86400000))
          : undefined;
        const result = await processQuizAnswers(
          db,
          req.user.id,
          answers.map((a) => ({
            question: a.question,
            topic: a.topic || topic,
            difficulty: a.difficulty,
            isCorrect: a.isCorrect,
            confidence: a.confidence,
            responseTimeMs: a.responseTimeMs
          }))
        );
        masteryUpdates = result.masteryUpdates;
        rescueNeeded = result.rescueNeeded;
        pathChanged = result.pathChanged;
      }
    } catch (adaptiveErr) {
      console.warn('Adaptive loop failed (quiz score is still saved):', adaptiveErr.message);
    }

    res.json({
      xp_earned: xpEarned,
      xp: updatedUser.xp,
      level: updatedUser.level,
      combo_applied: comboMultiplier,
      newBadges: newlyUnlockedBadges,
      masteryUpdates,
      rescueNeeded,
      pathChanged
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List past exam attempts (score summary only) for the "Lịch sử thi thử" screen
app.get('/api/quiz/history', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const rows = await db.all(
      `SELECT id, score, total_questions, xp_earned, created_at
       FROM user_quizzes WHERE user_id = ? AND type = 'exam' ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full per-question detail for one past exam attempt, to reopen its study report
app.get('/api/quiz/history/:id', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const quiz = await db.get(
      `SELECT id, score, total_questions, xp_earned, created_at
       FROM user_quizzes WHERE id = ? AND user_id = ? AND type = 'exam'`,
      [req.params.id, req.user.id]
    );
    if (!quiz) return res.status(404).json({ error: 'Không tìm thấy lượt thi này' });

    const answers = await db.all(
      'SELECT question, topic, options, correct_index, selected_index, is_correct, explanation FROM user_quiz_answers WHERE quiz_id = ?',
      [quiz.id]
    );

    res.json({
      ...quiz,
      answers: answers.map((a) => ({
        question: a.question,
        topic: a.topic,
        options: JSON.parse(a.options),
        correct_index: a.correct_index,
        selected_index: a.selected_index,
        isCorrect: !!a.is_correct,
        explanation: a.explanation
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PERSONALIZED EXPEDITION ---

// Learner preferences (spec §5) — always returns a row with safe defaults,
// never blocks an existing user from using the app if they haven't set any.
app.get('/api/preferences', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const row = await db.get('SELECT * FROM learner_preferences WHERE user_id = ?', [req.user.id]);
    res.json(
      row || {
        user_id: req.user.id,
        exam_date: null,
        daily_minutes: 15,
        target_score: 70,
        experience_level: 'new',
        preferred_format: 'quiz',
        goal: 'pass'
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/preferences', authenticateToken, async (req, res) => {
  const { examDate, dailyMinutes, targetScore, experienceLevel, preferredFormat, goal } = req.body;
  const db = await getDb();
  try {
    await db.run(
      `INSERT INTO learner_preferences (user_id, exam_date, daily_minutes, target_score, experience_level, preferred_format, goal, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         exam_date = excluded.exam_date, daily_minutes = excluded.daily_minutes, target_score = excluded.target_score,
         experience_level = excluded.experience_level, preferred_format = excluded.preferred_format, goal = excluded.goal,
         updated_at = CURRENT_TIMESTAMP`,
      [
        req.user.id, examDate || null, dailyMinutes || 15, targetScore || 70,
        experienceLevel || 'new', preferredFormat || 'quiz', goal || 'pass'
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Per-topic mastery state (spec §6) — the mountain journey and Daily
// Expedition both read from this.
app.get('/api/mastery', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const weights = await getExamWeights(db);
    const rows = await db.all('SELECT * FROM topic_mastery WHERE user_id = ?', [req.user.id]);
    const byTopic = new Map(rows.map((r) => [r.topic, r]));

    const topics = Object.keys(weights).map((topic) => {
      const row = byTopic.get(topic);
      const score = row?.mastery_score ?? 0;
      return {
        topic,
        mastery: score,
        state: masteryStateLabel(score),
        evidenceCount: row?.evidence_count ?? 0,
        lastReviewedAt: row?.last_reviewed_at ?? null,
        examWeight: weights[topic]
      };
    });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Summit Readiness (spec §12) — a study-support indicator, never framed as a
// guaranteed exam outcome.
app.get('/api/summit-readiness', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const readiness = await computeSummitReadiness(db, req.user.id);
    const ranked = await computeRankedTopics(db, req.user.id);
    res.json({
      ...readiness,
      strongestTopic: ranked[ranked.length - 1]?.topic ?? null,
      highestRiskTopic: ranked[0]?.topic ?? null,
      disclaimer: 'Summit Readiness là chỉ số hỗ trợ học tập, không phải cam kết kết quả kỳ thi.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Daily Expedition (spec §9) — cached per user per calendar day so reloading
// Home mid-day doesn't regenerate a different plan.
app.get('/api/expedition/daily', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const today = new Date().toISOString().split('T')[0];
    const cached = await db.get('SELECT data FROM daily_expedition WHERE user_id = ? AND date = ?', [req.user.id, today]);
    if (cached) return res.json(JSON.parse(cached.data));

    const prefs = await db.get('SELECT * FROM learner_preferences WHERE user_id = ?', [req.user.id]);
    const dailyMinutes = prefs?.daily_minutes ?? 15;
    const preferredFormat = prefs?.preferred_format ?? 'quiz';
    const daysUntilExam = prefs?.exam_date
      ? Math.max(1, Math.round((new Date(prefs.exam_date) - new Date()) / 86400000))
      : undefined;

    const ranked = await computeRankedTopics(db, req.user.id, daysUntilExam);
    const focusTopic = ranked[0]?.topic;

    let dueFlashcardCount = 0;
    if (focusTopic) {
      const total = await db.get('SELECT COUNT(*) c FROM flashcards WHERE topic = ?', [focusTopic]);
      const known = await db.get(
        `SELECT COUNT(*) c FROM user_flashcard_progress ufp
         JOIN flashcards f ON f.id = ufp.flashcard_id
         WHERE ufp.user_id = ? AND f.topic = ? AND ufp.known = 1`,
        [req.user.id, focusTopic]
      );
      dueFlashcardCount = Math.max((total?.c ?? 0) - (known?.c ?? 0), 0);
    }

    const topPriority = ranked[0];
    const rescueNeeded =
      topPriority && topPriority.reasons.includes('HIGH_CONFIDENCE_MISTAKE')
        ? { topic: focusTopic, mistakeType: 'concept_confusion' }
        : null;

    const plan = buildDailyExpedition(
      { dailyMinutes, rankedTopics: ranked, dueFlashcardCount, preferredFormat, rescueNeeded },
      buildPriorityExplanation
    );

    // Let Llama re-word the deterministic explanation (fallback keeps it verbatim if AI is unavailable).
    const { message: explanation } = await explainExpedition({
      focusTopicLabel: plan.focusTopic || '',
      deterministicExplanation: plan.explanation,
      dailyMinutes
    });

    const result = { ...plan, explanation, date: today, completed: false };
    await db.run(
      `INSERT INTO daily_expedition (user_id, date, data, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, date) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, today, JSON.stringify(result)]
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marks today's Daily Expedition as completed (drives the celebration reaction).
app.post('/api/expedition/complete', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const today = new Date().toISOString().split('T')[0];
    const cached = await db.get('SELECT data FROM daily_expedition WHERE user_id = ? AND date = ?', [req.user.id, today]);
    if (cached) {
      const data = { ...JSON.parse(cached.data), completed: true };
      await db.run('UPDATE daily_expedition SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND date = ?', [
        JSON.stringify(data), req.user.id, today
      ]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rescue Trail content (spec §11) — assembled deterministically from real
// flashcards/questions, narrated by Llama (with a deterministic fallback).
app.get('/api/rescue-trail', authenticateToken, async (req, res) => {
  const { topic, mistakeType } = req.query;
  if (!topic) return res.status(400).json({ error: 'topic is required' });
  const db = await getDb();
  try {
    await db.run('INSERT INTO rescue_trail_log (user_id, topic, mistake_type) VALUES (?, ?, ?)', [
      req.user.id, topic, mistakeType || null
    ]);
    const content = await assembleRescueTrail(db, { topic, mistakeType: mistakeType || 'knowledge_gap' });
    const narration = await generateRescueTrail({ topic, mistakeType: mistakeType || 'knowledge_gap', conceptPair: content.conceptPair });
    res.json({ ...content, ...narration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rescue-trail/complete', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    await db.run(
      `UPDATE rescue_trail_log SET completed_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM rescue_trail_log WHERE user_id = ? ORDER BY id DESC LIMIT 1)`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Llama's playful explanation of a specific Mistake DNA reveal (fallback works with no API key).
app.post('/api/llama/explain-mistake', authenticateToken, async (req, res) => {
  const { mistakeLabel, explanation, question } = req.body;
  try {
    const result = await explainMistake({ mistakeLabel, explanation, question });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read-only Mistake DNA preview for a single practice-mode answer, so the UI
// can show inline feedback right away without waiting for the end-of-session
// batch submit (which is the only thing that actually writes mastery state).
app.post('/api/quiz/answer-preview', authenticateToken, async (req, res) => {
  const { question, topic, difficulty, isCorrect, confidence, responseTimeMs } = req.body;
  const db = await getDb();
  try {
    const mistakeDNA = await previewMistakeDNA(db, req.user.id, { question, topic, difficulty, isCorrect, confidence, responseTimeMs });
    res.json({ mistakeDNA });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- KNOWLEDGE BASE (RAG documents for Llama chat) ---

// Splits raw text into ~700-char chunks along paragraph boundaries.
// List uploaded knowledge documents
app.get('/api/knowledge', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const docs = await db.all(`
      SELECT d.id, d.title, d.source_type, d.created_at, COUNT(c.id) as chunk_count
      FROM knowledge_documents d
      LEFT JOIN knowledge_chunks c ON c.document_id = d.id
      GROUP BY d.id ORDER BY d.created_at DESC
    `);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a PDF or text file into the knowledge base
app.post('/api/knowledge/upload', authenticateToken, upload.single('file'), async (req, res) => {
  const db = await getDb();
  try {
    if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file để tải lên' });

    const { originalname, mimetype, buffer } = req.file;
    let text = '';
    let sourceType = 'txt';

    if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
      sourceType = 'pdf';
      const parser = new PDFParse({ data: buffer });
      text = (await parser.getText()).text;
      await parser.destroy();
    } else {
      text = buffer.toString('utf-8');
    }

    const title = (req.body.title || '').trim() || originalname;
    const result = await storeDocument(db, title, sourceType, text, req.user.id);
    res.status(201).json({ message: 'Tải tài liệu thành công', title, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Paste raw text directly into the knowledge base (no file needed)
app.post('/api/knowledge/paste', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    const { title, text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Nội dung không được để trống' });

    const finalTitle = (title || '').trim() || 'Ghi chú dán tay';
    const result = await storeDocument(db, finalTitle, 'paste', text, req.user.id);
    res.status(201).json({ message: 'Lưu tài liệu thành công', title: finalTitle, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a knowledge document and its chunks
app.delete('/api/knowledge/:id', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    // FTS5 columns aren't type-affinity-coerced like normal tables, so the string
    // route param must be parsed to a number or it silently matches nothing.
    const documentId = Number(req.params.id);
    if (!Number.isInteger(documentId)) return res.status(400).json({ error: 'ID tài liệu không hợp lệ' });

    await db.run('DELETE FROM knowledge_chunks_fts WHERE document_id = ?', [documentId]);
    await db.run('DELETE FROM knowledge_documents WHERE id = ?', [documentId]); // cascades to knowledge_chunks
    res.json({ message: 'Đã xóa tài liệu' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chatbot: Proxy to Ollama/Llama, grounded with retrieved knowledge chunks, with a local fallback
app.post('/api/chat', authenticateToken, async (req, res) => {
  const { message, history, ollamaUrl, context } = req.body;
  const db = await getDb();

  const retrieved = await retrieveKnowledge(db, message, 8);
  const contextBlock = retrieved.length > 0
    ? retrieved.map((r, i) => `[Đoạn ${i + 1}] ${r.content}`).join('\n\n')
    : '';

  // Contextual Ask Llama (spec §16): the caller can pass the question/topic/
  // mistake the learner is currently looking at (e.g. from a quiz question or
  // a Rescue Trail), so Llama's answer isn't generic.
  const contextHint = context?.question
    ? `\n\nBối cảnh hiện tại: người dùng đang xem câu hỏi thi "${context.question}"${context.topic ? ` (chủ đề: ${context.topic})` : ''}${context.mistakeLabel ? `, vừa mắc lỗi loại "${context.mistakeLabel}"` : ''}. Hãy trả lời có liên hệ tới bối cảnh này nếu phù hợp.`
    : '';

  const sources = [];
  for (const r of retrieved) {
    const doc = await getChunkSource(db, r.document_id);
    if (doc && !sources.some((s) => s.documentId === doc.id)) {
      sources.push({ documentId: doc.id, title: doc.title, updatedAt: doc.created_at });
    }
  }

  const insuranceContext = `You are "Llama Đại Lý", a sharp-tongued, sarcastic, and very funny bilingual AI tutor specializing in the Vietnam Ministry of Finance (MOF) Insurance Agent Certification.
Persona: You tease the user a bit before helping them — a light "ơ, câu này cơ bản mà bạn cũng hỏi Llama à? 😏" style jab — but you ALWAYS follow up with the correct, accurate, genuinely helpful answer. The sarcasm is affectionate and playful, never mean, never discouraging, and never at the expense of correctness. Vary your teasing opener each time so it doesn't feel repetitive. If the user asks something genuinely hard or shows they're struggling, dial the sarcasm down and be warmer/more encouraging instead.
You reply ONLY in Vietnamese, never in English. Keep answers simple, bite-sized, and structure them with bullet points.
Knowledge Base Guidelines:
1. Vietnam Law on Insurance Business 2022 is the legal basis.
2. Core Topics:
   - Fundamentals: Risk pooling, Insurable interest, Utmost Good Faith, Indemnity, Subrogation.
   - Products: Life (tử kỳ, trọn đời, hỗn hợp, liên kết đầu tư), Non-Life (tài sản, xe cơ giới, trách nhiệm), Health (sức khỏe).
   - Contracts: 60-day grace period, 21-day free look period, void states, rights/obligations.
   - Regulations: Ministry of Finance (MOF) regulates licensing and solvency. Agent certification is required. Rebating/discounting commissions is illegal.
3. If the user asks you to "quiz me", output a brief MCQ question.
4. Keep the tone snappy, game-like, and use target/gunshot references occasionally (e.g. "Hãy nhắm thẳng mục tiêu!").${contextHint}${contextBlock ? `

Bên dưới là các đoạn tài liệu được tìm kiếm tự động (không phải do người chọn tay), mỗi đoạn có dạng "Câu hỏi: ... Trả lời: ...". Vì tìm kiếm dựa trên từ khóa, có thể lẫn cả đoạn CÙNG CHỦ ĐỀ nhưng KHÁC CÂU HỎI với câu người dùng đang hỏi (ví dụ: đoạn nói "tính từ ngày nào" khác với đoạn nói "là bao nhiêu ngày"). TUYỆT ĐỐI không lấy đại đoạn xếp đầu tiên — hãy đọc kỹ phần "Câu hỏi:" của TỪNG đoạn, so khớp ý nghĩa với câu hỏi thật của người dùng, rồi chỉ dùng (các) đoạn nào thực sự trả lời đúng câu hỏi đó. Nếu không đoạn nào khớp, dùng kiến thức chung của bạn và nói rõ điều đó:

${contextBlock}` : ''}`;

  const cleanOllamaUrl = ollamaUrl || 'http://localhost:11434';

  // Tier 1: Gemini (free-tier cloud LLM — no local setup needed, works once deployed)
  if (process.env.GEMINI_API_KEY) {
    try {
      const contents = [
        ...(history || []).map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: message }] }
      ];

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: insuranceContext }] },
            contents
          })
        }
      );

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return res.json({ response: text, sources });
      } else {
        console.warn('Gemini API returned non-ok status:', geminiRes.status, await geminiRes.text());
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back. Reason:', err.message);
    }
  }

  try {
    // Try local Ollama
    const messages = [
      { role: 'system', content: insuranceContext },
      ...(history || []).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const response = await fetch(`${cleanOllamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3', // default model
        messages,
        stream: false
      })
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({ response: data.message.content, sources });
    }

    throw new Error('Ollama endpoint returned non-ok status');
  } catch (err) {
    console.warn('Ollama proxy failed, running bilingual dictionary agent fallback. Reason:', err.message);

    // If we found relevant uploaded material, surface the single best-matching chunk's
    // answer directly instead of dumping every retrieved passage — one clean answer,
    // not a wall of "Đoạn 1, Đoạn 2..." text. Re-ranked by how well the message
    // matches each chunk's own "Câu hỏi:" (BM25 alone can rank a topically-close
    // but differently-answering chunk above the one that actually answers this).
    const bestMatch = pickBestMatchingChunk(retrieved, message);
    if (bestMatch) {
      const best = bestMatch.chunk.content;
      const answerMatch = best.match(/Trả lời:\s*(.+)$/s);
      const answerText = answerMatch ? answerMatch[1].trim() : best;
      return res.json({
        response: `😏 ${answerText}`
      });
    }

    // Smart Local Fallback
    const msg = message.toLowerCase();
    let reply = '';

    if (msg.includes('quiz') || msg.includes('thi') || msg.includes('hỏi')) {
      reply = `😈 Ohh, đòi quiz hả? Được thôi, đừng có mà khóc nếu sai đó nha:

🎯 **Câu hỏi:** Theo luật Việt Nam, thời gian gia hạn đóng phí bảo hiểm quá hạn là bao lâu?

* A) 30 ngày
* B) 60 ngày
* C) 90 ngày

*Trả lời bằng chữ cái bạn chọn nha!*`;
    } else if (msg.includes('grace') || msg.includes('gia hạn') || msg.includes('đóng phí')) {
      reply = `😏 Ơ, câu này cơ bản mà bạn cũng phải hỏi Llama à? Thôi được, để Llama giải thích:

⏰ **Thời gian gia hạn nộp phí (Grace Period):**
- **Thời gian:** 60 ngày.
- **Quy tắc:** Trong 60 ngày này, hợp đồng vẫn có hiệu lực và doanh nghiệp vẫn phải bồi thường nếu có sự kiện xảy ra. Quá 60 ngày mà không đóng phí, hợp đồng sẽ bị tạm dừng hiệu lực.`;
    } else if (msg.includes('look') || msg.includes('cân nhắc') || msg.includes('21')) {
      reply = `🦙 Hỏi cái này là biết bạn chưa đọc kỹ hợp đồng mẫu rồi đó nha. May mà có Llama:

👁️ **21 ngày tự do cân nhắc (Free Look Period):**
- **Áp dụng cho:** Hợp đồng bảo hiểm nhân thọ dài hạn (trên 1 năm).
- **Nội dung:** Khách hàng có 21 ngày kể từ lúc nhận bộ hợp đồng để từ chối tiếp tục tham gia và được hoàn trả phí bảo hiểm đã đóng (sau khi trừ chi phí khám sức khỏe nếu có).`;
    } else if (msg.includes('mof') || msg.includes('bộ tài chính') || msg.includes('chứng chỉ')) {
      reply = `🙄 Định thi chứng chỉ mà còn chưa biết ai cấp á? Thôi, Llama cứu bàn thua trông thấy:

🏛️ **Bộ Tài chính (MOF):**
- **Vai trò:** Cơ quan quản lý nhà nước về kinh doanh bảo hiểm. Bộ Tài chính cấp phép thành lập doanh nghiệp bảo hiểm, quản lý biên khả năng thanh toán và tổ chức thi/cấp chứng chỉ đại lý bảo hiểm.`;
    } else if (msg.includes('rebate') || msg.includes('chiết khấu') || msg.includes('commission') || msg.includes('hoa hồng')) {
      reply = `😤 Ê ê, đang tính chiết khấu hoa hồng cho khách hả? Llama phải chặn lại ngay:

🚫 **Quy định chiết khấu hoa hồng đại lý:**
- **Luật:** Đại lý bảo hiểm bị CẤM hoàn phí bảo hiểm hoặc chiết khấu hoa hồng cho khách hàng dưới mọi hình thức để lôi kéo mua bảo hiểm. Đây là hành vi vi phạm pháp luật nghiêm trọng (Điều 125, Luật Kinh doanh bảo hiểm).`;
    } else {
      reply = `🦙 Hmm, Llama không kết nối được não bộ chính (Ollama) nên đang chạy chế độ dự phòng — nói vui vậy chứ vẫn đủ sức trêu bạn được!

Xin chào! Tôi là **Llama Đại Lý**, gia sư luyện thi chứng chỉ Bộ Tài chính của bạn. Bạn có thể hỏi tôi về:
1. **Thời gian gia hạn đóng phí** (60 ngày)
2. **21 ngày tự do cân nhắc**
3. **Vai trò của Bộ Tài chính (MOF)**
4. **Quy định cấm chiết khấu hoa hồng**
5. Gõ **"quiz me"** để thử làm câu hỏi trắc nghiệm!`;
    }

    res.json({ response: reply, sources });
  }
});

// Leaderboard rankings
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
  const db = await getDb();
  try {
    // Get real registered users
    const realUsers = await db.all('SELECT id, username, xp, level, streak FROM users ORDER BY xp DESC');
    
    // Add mock competitive users to simulate a lively community
    const mockCompetitors = [
      { id: 991, username: 'Chị Hảo BGK', xp: 850, level: 3, streak: 9 },
      { id: 992, username: 'Ngọc Full Topping', xp: 720, level: 2, streak: 12 },
      { id: 993, username: 'Harry Porter', xp: 580, level: 2, streak: 5 },
      { id: 994, username: '🛡️ Mai Anh', xp: 450, level: 2, streak: 4 }
    ];

    // Combine and sort
    const allUsers = [...realUsers, ...mockCompetitors].sort((a, b) => b.xp - a.xp);
    
    // Assign rankings
    const rankings = allUsers.map((user, idx) => ({
      rank: idx + 1,
      username: user.username,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      selected_path: user.selected_path,
      isCurrentUser: user.username === req.user.username
    }));

    res.json(rankings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

mountStudioRoutes(app, authenticateToken);

// Serve the built frontend (frontend/dist) so a single Node process can host
// both the app and the API — needed for hosts like Hostinger's Node.js App
// feature, which only runs one process per app. Falls back to index.html for
// any non-API route so client-side (React) routes resolve on direct loads.
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
