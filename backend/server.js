import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { initDb, getDb } from './db.js';
import { generateDynamicQuestion, generateLlamaQuestion } from './questions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;
const JWT_SECRET = process.env.JWT_SECRET || 'pang_chiu_secret_key_2026';

app.use(cors());
app.use(express.json());

// Initialize Database
await initDb();

// --- AUTH MIDDLEWARE ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
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
    res.status(201).json({ token, user: { id: result.lastID, username, xp: 0, level: 1, streak: 1 } });
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
        streak: currentStreak
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
    const user = await db.get('SELECT id, username, xp, level, streak, last_login_date FROM users WHERE id = ?', [req.user.id]);
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
      badges,
      completedLessons: lessons,
      quizHistory: quizzes
    });
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

// Generate dynamic quiz questions
app.get('/api/quiz/generate', authenticateToken, async (req, res) => {
  const { topic, difficulty, type, ollamaUrl } = req.query; // type: 'practice' or 'exam'
  
  try {
    if (type === 'exam') {
      // Simulated Exam: 30 static/dynamic mixed questions (10 fundamentals, 8 products, 6 contracts, 6 regulations)
      const examQuestions = [];
      const topics = [
        { name: 'fundamentals', count: 10 },
        { name: 'products', count: 8 },
        { name: 'contracts', count: 6 },
        { name: 'regulations', count: 6 }
      ];

      for (const t of topics) {
        for (let i = 0; i < t.count; i++) {
          const q = generateDynamicQuestion(t.name, difficulty || 'intermediate');
          examQuestions.push(q);
        }
      }
      return res.json(examQuestions);
    }

    // Practice Mode: generate a set of 5 adaptive questions for the specific topic
    const count = 5;
    const questions = [];
    for (let i = 0; i < count; i++) {
      let q;
      // If client requests Llama AI generation specifically and provides Ollama address
      if (ollamaUrl && Math.random() > 0.6) { // 40% chance of triggering actual Llama gen to show dynamic AI power
        q = await generateLlamaQuestion(topic, difficulty || 'intermediate', ollamaUrl);
      } else {
        q = generateDynamicQuestion(topic, difficulty || 'intermediate');
      }
      questions.push(q);
    }
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Quiz score
app.post('/api/quiz/submit', authenticateToken, async (req, res) => {
  const { score, totalQuestions, topic, type, maxCombo } = req.body;
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
    await db.run(
      'INSERT INTO user_quizzes (user_id, score, total_questions, topic, type, xp_earned) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, score, totalQuestions, topic, type, xpEarned]
    );

    // Update user stats
    const user = await db.get('SELECT xp FROM users WHERE id = ?', [req.user.id]);
    const newXp = (user.xp || 0) + xpEarned;
    const newLevel = calculateLevel(newXp);
    
    await db.run('UPDATE users SET xp = ?, level = ? WHERE id = ?', [newXp, newLevel, req.user.id]);

    const newlyUnlockedBadges = await evaluateBadges(db, req.user.id);
    const updatedUser = await db.get('SELECT xp, level, streak FROM users WHERE id = ?', [req.user.id]);

    res.json({
      xp_earned: xpEarned,
      xp: updatedUser.xp,
      level: updatedUser.level,
      combo_applied: comboMultiplier,
      newBadges: newlyUnlockedBadges
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chatbot: Proxy to Ollama/Llama with local rule-based bilingual fallback
app.post('/api/chat', async (req, res) => {
  const { message, history, ollamaUrl } = req.body;

  const insuranceContext = `You are "Llama Đại Lý", a friendly, encouraging, and highly knowledgeable bilingual AI tutor specializing in the Vietnam Ministry of Finance (MOF) Insurance Agent Certification.
You reply in both English and Vietnamese. Keep answers simple, bite-sized, and structure them with bullet points.
Knowledge Base Guidelines:
1. Vietnam Law on Insurance Business 2022 is the legal basis.
2. Core Topics:
   - Fundamentals: Risk pooling, Insurable interest, Utmost Good Faith, Indemnity, Subrogation.
   - Products: Life (tử kỳ, trọn đời, hỗn hợp, liên kết đầu tư), Non-Life (tài sản, xe cơ giới, trách nhiệm), Health (sức khỏe).
   - Contracts: 60-day grace period, 21-day free look period, void states, rights/obligations.
   - Regulations: Ministry of Finance (MOF) regulates licensing and solvency. Agent certification is required. Rebating/discounting commissions is illegal.
3. If the user asks you to "quiz me", output a brief MCQ question.
4. Keep the tone snappy, game-like, and use target/gunshot references occasionally (e.g. "Hãy nhắm thẳng mục tiêu! / Shoot straight to the target!").`;

  const cleanOllamaUrl = ollamaUrl || 'http://localhost:11434';

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
      return res.json({ response: data.message.content });
    }
    
    throw new Error('Ollama endpoint returned non-ok status');
  } catch (err) {
    console.warn('Ollama proxy failed, running bilingual dictionary agent fallback. Reason:', err.message);
    
    // Smart Local Fallback
    const msg = message.toLowerCase();
    let reply = '';

    if (msg.includes('quiz') || msg.includes('thi') || msg.includes('hỏi')) {
      reply = `**[Llama AI Fallback Mode / Chế độ Llama Dự phòng]**
🎯 Let's do a quick quiz! / Hãy trả lời câu hỏi nhanh sau:

**Question:** Under Vietnam law, how long is the grace period for paying overdue premiums?
**Câu hỏi:** Theo luật Việt Nam, thời gian gia hạn đóng phí bảo hiểm quá hạn là bao lâu?

* A) 30 days / 30 ngày
* B) 60 days / 60 ngày
* C) 90 days / 90 ngày

*Reply with the letter of your choice! / Trả lời bằng chữ cái bạn chọn!*`;
    } else if (msg.includes('grace') || msg.includes('gia hạn') || msg.includes('đóng phí')) {
      reply = `**[Llama AI Fallback Mode]**
⏰ **Grace Period (Thời gian gia hạn nộp phí):**
- **Duration / Thời gian:** 60 days / 60 ngày.
- **Rule / Quy tắc:** During these 60 days, the policy remains active and the insurer must pay claims if an event occurs. If unpaid after 60 days, the policy is suspended.
- **Tiếng Việt:** Trong 60 ngày này, hợp đồng vẫn có hiệu lực và doanh nghiệp vẫn phải bồi thường nếu có sự kiện xảy ra. Quá 60 ngày mà không đóng phí, hợp đồng sẽ bị tạm dừng hiệu lực.`;
    } else if (msg.includes('look') || msg.includes('cân nhắc') || msg.includes('21')) {
      reply = `**[Llama AI Fallback Mode]**
👁️ **21-day Free Look Period (21 ngày tự do cân nhắc):**
- **Applies to / Áp dụng cho:** Life insurance contracts with a term over 1 year.
- **Description:** The policyholder can cancel the policy within 21 days of receiving it and get a full refund of premiums paid.
- **Tiếng Việt:** Áp dụng cho hợp đồng nhân thọ dài hạn (>1 năm). Khách hàng có 21 ngày kể từ lúc nhận bộ hợp đồng để từ chối tiếp tục tham gia và được hoàn trả phí bảo hiểm đã đóng (sau khi trừ chi phí khám sức khỏe nếu có).`;
    } else if (msg.includes('mof') || msg.includes('bộ tài chính') || msg.includes('chứng chỉ')) {
      reply = `**[Llama AI Fallback Mode]**
🏛️ **Ministry of Finance (Bộ Tài chính - MOF):**
- **Role:** The official regulator of all insurance business activities in Vietnam. They issue certificates, authorize licenses, inspect solvency margins, and administer the agent certification exams.
- **Tiếng Việt:** Cơ quan quản lý nhà nước về kinh doanh bảo hiểm. Bộ Tài chính cấp phép thành lập doanh nghiệp bảo hiểm, quản lý biên khả năng thanh toán và tổ chức thi/cấp chứng chỉ đại lý bảo hiểm.`;
    } else if (msg.includes('rebate') || msg.includes('chiết khấu') || msg.includes('commission') || msg.includes('hoa hồng')) {
      reply = `**[Llama AI Fallback Mode]**
🚫 **Rebating Rules (Quy định chiết khấu hoa hồng đại lý):**
- **Law:** It is strictly ILLEGAL for an agent to rebate commission or discount premiums to entice customers into buying policies (Article 125, Law on Insurance Business).
- **Tiếng Việt:** Đại lý bảo hiểm bị CẤM hoàn phí bảo hiểm hoặc chiết khấu hoa hồng cho khách hàng dưới mọi hình thức để lôi kéo mua bảo hiểm. Đây là hành vi vi phạm pháp luật nghiêm trọng.`;
    } else {
      reply = `**[Llama AI Fallback Mode / Chế độ Llama Dự phòng]**
Hello! I am **Llama Đại Lý**, your MOF exam study coach. I am currently running in fallback mode because Ollama was not detected on port 11434. 
You can ask me about:
1. **Grace Period** / Thời gian gia hạn đóng phí (60 days)
2. **Free Look Period** / 21 ngày tự do cân nhắc
3. **Ministry of Finance (MOF)** / Vai trò Bộ Tài chính
4. **Rebating rules** / Quy định cấm chiết khấu hoa hồng
5. Type **"quiz me"** to trigger a test question!

---
Xin chào! Tôi là **Llama Đại Lý**, gia sư luyện thi chứng chỉ Bộ Tài chính của bạn. Hiện tôi đang chạy ở chế độ dự phòng.
Bạn có thể hỏi tôi về các chủ đề trên hoặc gõ **"quiz me"** để thử làm câu hỏi trắc nghiệm!`;
    }

    res.json({ response: reply });
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
      { id: 991, username: '🎯 Pằng_Chíu_Sniper', xp: 850, level: 3, streak: 9 },
      { id: 992, username: '🥇 MOF_Master_99', xp: 720, level: 2, streak: 12 },
      { id: 993, username: '💡 Llama_Fan_Boy', xp: 580, level: 2, streak: 5 },
      { id: 994, username: '🛡️ Bảo_Việt_Pro', xp: 450, level: 2, streak: 4 },
      { id: 995, username: '🔥 Học_Bất_Chấp', xp: 320, level: 1, streak: 8 }
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
      isCurrentUser: user.username === req.user.username
    }));

    res.json(rankings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
