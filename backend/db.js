import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'mof_exam.db');

let dbConnection = null;

export async function getDb() {
  if (dbConnection) return dbConnection;
  
  dbConnection = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  return dbConnection;
}

export async function initDb() {
  const db = await getDb();
  
  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  // Create Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak INTEGER DEFAULT 0,
      last_login_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      selected_path TEXT
    )
  `);

  // Migrate existing users table to add selected_path if it doesn't exist
  try {
    await db.exec('ALTER TABLE users ADD COLUMN selected_path TEXT');
  } catch (err) {
    // Column already exists, ignore
  }

  // Create Lessons table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      title_en TEXT NOT NULL,
      title_vn TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      cards TEXT NOT NULL, -- JSON string array of flashcards
      order_index INTEGER NOT NULL
    )
  `);

  // Create User Lessons table (tracks completion)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_lessons (
      user_id INTEGER,
      lesson_id TEXT,
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, lesson_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    )
  `);

  // Create User Badges table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_badges (
      user_id INTEGER,
      badge_id TEXT,
      unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, badge_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create User Quizzes table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      topic TEXT NOT NULL,
      type TEXT NOT NULL, -- 'practice' or 'exam'
      xp_earned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Per-question answer log for exam attempts, so a past exam's full study
  // report (topic breakdown, roadmap, per-question review) can be reopened later.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_quiz_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      topic TEXT,
      options TEXT NOT NULL,
      correct_index INTEGER NOT NULL,
      selected_index INTEGER,
      is_correct INTEGER NOT NULL,
      explanation TEXT,
      FOREIGN KEY (quiz_id) REFERENCES user_quizzes(id) ON DELETE CASCADE
    )
  `);

  // Create Flashcards table (imported from Excel)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stt INTEGER,
      topic TEXT,
      card_type TEXT,
      difficulty TEXT,
      front TEXT,
      back TEXT,
      keyword TEXT,
      state TEXT,
      wrong_count INTEGER,
      notes TEXT
    )
  `);

  // Tracks which flashcards each user has marked "known", so the topic picker
  // can show learned/total progress per deck.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_flashcard_progress (
      user_id INTEGER NOT NULL,
      flashcard_id INTEGER NOT NULL,
      known INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, flashcard_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE
    )
  `);

  // Create Test Questions table (imported from Excel)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS test_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stt INTEGER,
      topic TEXT,
      difficulty TEXT,
      question TEXT,
      optA TEXT,
      optB TEXT,
      optC TEXT,
      optD TEXT,
      answer TEXT,
      explanation TEXT,
      source TEXT
    )
  `);

  // Knowledge base for the Llama RAG chat — documents agents upload get chunked and
  // indexed here so the chat endpoint can retrieve relevant passages to ground its answers.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      source_type TEXT NOT NULL,
      uploaded_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES knowledge_documents(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_chunks_fts USING fts5(
      content,
      chunk_id UNINDEXED,
      document_id UNINDEXED
    )
  `);

  // ─── Personalized Expedition schema ──────────────────────────────────────

  // Learner preferences captured in Settings (or a first-time modal) — every
  // column has a safe default so existing users are never blocked.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS learner_preferences (
      user_id INTEGER PRIMARY KEY,
      exam_date TEXT,
      daily_minutes INTEGER DEFAULT 15,
      target_score INTEGER DEFAULT 70,
      experience_level TEXT DEFAULT 'new',
      preferred_format TEXT DEFAULT 'quiz',
      goal TEXT DEFAULT 'pass',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Current mastery state per (user, real exam topic) — one row per topic,
  // overwritten on every update. History of how it got there lives in
  // mastery_history below.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS topic_mastery (
      user_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      mastery_score REAL NOT NULL DEFAULT 0,
      evidence_count INTEGER NOT NULL DEFAULT 0,
      last_reviewed_at TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, topic),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Append-only log of every mastery change — powers "42% → 68%" style copy
  // and lets the formula be tested/explained after the fact.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS mastery_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      mastery_score REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Extend user_quiz_answers (previously exam-only) with the fields the
  // adaptive engines need. Practice-mode answers now populate this table too.
  for (const col of ['difficulty TEXT', 'confidence TEXT', 'response_time_ms INTEGER', 'mistake_type TEXT']) {
    try { await db.exec(`ALTER TABLE user_quiz_answers ADD COLUMN ${col}`); } catch (err) { /* already exists */ }
  }

  // Append-only flashcard review log (user_flashcard_progress only keeps the
  // latest known/unknown state — this keeps history for forgetting-risk math).
  await db.exec(`
    CREATE TABLE IF NOT EXISTS flashcard_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      flashcard_id INTEGER NOT NULL,
      topic TEXT,
      known INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE
    )
  `);

  // Caches each day's generated Daily Expedition so re-opening Home doesn't
  // regenerate a different plan mid-day, and tracks per-activity completion.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS daily_expedition (
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Lightweight record of when a Rescue Trail was offered/finished. The trail's
  // actual content is assembled on demand (engines/rescueTrail.js), not queued here.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS rescue_trail_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      mistake_type TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Lessons are static reference content controlled by the codebase, so we upsert them
  // on every boot (keeping user progress in user_lessons untouched) instead of seeding once.
  {
    const defaultLessons = [
      {
        id: 'lesson_1',
        title_en: 'Insurance Fundamentals',
        title_vn: 'Nguyên Lý Bảo Hiểm Cơ Bản',
        topic: 'fundamentals',
        difficulty: 'beginner',
        order_index: 1,
        cards: JSON.stringify([
          {
            id: 'l1_c1',
            title_en: 'What is Insurance?',
            title_vn: 'Bảo Hiểm Là Gì?',
            content_en: 'Insurance is a risk management mechanism where individuals or entities transfer financial risks of potential losses to an insurance company in exchange for paying a premium.',
            content_vn: 'Bảo hiểm là cơ chế quản lý rủi ro, trong đó cá nhân hoặc tổ chức chuyển giao rủi ro tài chính của tổn thất tiềm ẩn cho doanh nghiệp bảo hiểm bằng cách nộp phí bảo hiểm.',
            tip_en: 'Keywords to remember: risk transfer, premium, financial protection. That\'s the whole game in 3 words! 🎯',
            tip_vn: 'Từ khóa cần nhớ: chuyển giao rủi ro, phí bảo hiểm, bảo vệ tài chính. Gói gọn trong 3 từ vậy đó! 🎯'
          },
          {
            id: 'l1_c2',
            title_en: 'Principle of Utmost Good Faith',
            title_vn: 'Nguyên Tắc Trung Thực Tuyệt Đối',
            content_en: 'Both the policyholder and the insurer must fully and honestly disclose all material facts before signing the insurance contract. Any concealment can make the contract void.',
            content_vn: 'Cả bên mua bảo hiểm và doanh nghiệp bảo hiểm phải công khai đầy đủ và trung thực mọi thông tin quan trọng trước khi ký hợp đồng. Mọi hành vi che giấu có thể làm hợp đồng vô hiệu.',
            tip_en: 'Fancy Latin name: "Uberrimae Fidei". Sounds posh, just means "be honest, always"! 🤝',
            tip_vn: 'Tên tiếng Latin nghe sang chảnh: "Uberrimae Fidei". Dịch nôm na là "thật thà là thượng sách"! 🤝'
          },
          {
            id: 'l1_c3',
            title_en: 'Insurable Interest',
            title_vn: 'Quyền Lợi Có Thể Được Bảo Hiểm',
            content_en: 'The policyholder must stand to suffer a financial loss if the insured event occurs. You cannot buy life insurance for a complete stranger.',
            content_vn: 'Bên mua bảo hiểm phải chịu tổn thất tài chính nếu sự kiện bảo hiểm xảy ra. Bạn không thể mua bảo hiểm nhân thọ cho một người hoàn toàn xa lạ.',
            tip_en: 'This rule stops people from betting on a stranger\'s life — keeps insurance honest, not a casino! 🎲🚫',
            tip_vn: 'Quy tắc này ngăn việc "cá cược" vào mạng sống người lạ — giữ cho bảo hiểm tử tế, không phải sòng bạc! 🎲🚫'
          },
          {
            id: 'l1_c4',
            title_en: 'Subrogation? Not For Life Insurance!',
            title_vn: 'Thế Quyền? Bảo Hiểm Nhân Thọ Miễn Nha!',
            content_en: 'Subrogation lets an insurer step into your shoes and chase whoever caused the damage — but it only works for contracts that reimburse an actual loss, like property or liability insurance. Life insurance pays a fixed amount agreed on up front, not a loss reimbursement, so subrogation simply does not apply here. Nobody chasing anybody!',
            content_vn: 'Nguyên tắc thế quyền cho phép công ty bảo hiểm "đứng vào vị trí" của bạn để đòi lại tiền từ người gây ra thiệt hại — nhưng chỉ áp dụng với hợp đồng bồi thường tổn thất thực tế như bảo hiểm tài sản hay trách nhiệm dân sự. Bảo hiểm nhân thọ trả một số tiền cố định đã thỏa thuận từ đầu, không phải bồi thường tổn thất, nên thế quyền... không có cửa ở đây!',
            tip_en: 'Life insurance = fixed payout, not indemnity → no subrogation. Easy peasy! 🎯',
            tip_vn: 'Bảo hiểm nhân thọ = trả số tiền cố định, không phải bồi thường → không có thế quyền. Dễ ợt! 🎯'
          }
        ])
      },
      {
        id: 'lesson_2',
        title_en: 'Insurance Products',
        title_vn: 'Các Sản Phẩm Bảo Hiểm',
        topic: 'products',
        difficulty: 'beginner',
        order_index: 2,
        cards: JSON.stringify([
          {
            id: 'l2_c1',
            title_en: 'Life vs. Non-Life Insurance',
            title_vn: 'Bảo Hiểm Nhân Thọ & Phi Nhân Thọ',
            content_en: 'Life insurance covers human life, longevity, or death. Non-life insurance covers property, liabilities, credit, and other financial losses.',
            content_vn: 'Bảo hiểm nhân thọ bảo vệ tuổi thọ, tính mạng con người. Bảo hiểm phi nhân thọ bảo vệ tài sản, trách nhiệm dân sự, tín dụng và các tổn thất tài chính khác.',
            tip_en: 'Quick memory hack: life insurance = marathon, non-life = yearly sprint. 🏃',
            tip_vn: 'Mẹo nhớ nhanh: nhân thọ = chạy marathon, phi nhân thọ = chạy nước rút hàng năm. 🏃'
          },
          {
            id: 'l2_c2',
            title_en: 'Unit-Linked Insurance (ULIP)',
            title_vn: 'Bảo Hiểm Liên Kết Đơn Vị',
            content_en: 'A hybrid product combining life protection and investment. Premium is split: one part goes to insurance cover, the other is invested in mutual fund units chosen by the policyholder.',
            content_vn: 'Sản phẩm hỗn hợp kết hợp bảo vệ nhân thọ và đầu tư. Phí bảo hiểm được chia làm hai: một phần cho bảo vệ, phần còn lại được đầu tư vào các quỹ do khách hàng tự chọn.',
            tip_en: 'You\'re the one riding the market rollercoaster here, not the insurer! 🎢',
            tip_vn: 'Bạn mới là người ngồi tàu lượn thị trường, không phải công ty bảo hiểm! 🎢'
          },
          {
            id: 'l2_c3',
            title_en: 'Health Insurance',
            title_vn: 'Bảo Hiểm Sức Khỏe',
            content_en: 'Covers medical expenses, hospitalization, surgery, or personal accidents. It can be sold by both life and non-life insurance companies under Vietnamese law.',
            content_vn: 'Bồi thường chi phí y tế, nằm viện, phẫu thuật hoặc tai nạn cá nhân. Cả doanh nghiệp BH nhân thọ và phi nhân thọ đều được phép bán BH sức khỏe tại Việt Nam.',
            tip_en: 'Think of it as a combo meal (rider) or a solo dish (standalone policy) — your choice! 🍔',
            tip_vn: 'Giống như gọi combo (sản phẩm bổ trợ) hay gọi món riêng (hợp đồng độc lập) — tùy bạn chọn! 🍔'
          }
        ])
      },
      {
        id: 'lesson_3',
        title_en: 'Insurance Contracts',
        title_vn: 'Hợp Đồng Bảo Hiểm',
        topic: 'contracts',
        difficulty: 'intermediate',
        order_index: 3,
        cards: JSON.stringify([
          {
            id: 'l3_c1',
            title_en: 'Legal Nature of the Contract',
            title_vn: 'Tính Chất Pháp Lý Của Hợp Đồng',
            content_en: 'An insurance contract is a bilateral agreement, unilateral performance, aleatory (dependent on chance), and of adhesion (terms drafted by the insurer, accepted as-is by the policyholder).',
            content_vn: 'Hợp đồng bảo hiểm là hợp đồng song vụ, thực hiện đơn phương, mang tính may rủi và gia nhập (bên mua chấp nhận các điều khoản soạn sẵn bởi doanh nghiệp).',
            tip_en: 'When in doubt, the law sides with YOU, the customer. Nice perk, huh? 😌',
            tip_vn: 'Điều khoản mập mờ? Luật thiên vị BẠN, khách hàng đó! Ưu đãi ngầm ghê chưa? 😌'
          },
          {
            id: 'l3_c2',
            title_en: 'Grace Period for Premium Payment',
            title_vn: 'Thời Gian Gia Hạn Nộp Phí',
            content_en: 'Under Vietnamese law, the policyholder has a 60-day grace period to pay overdue premiums. During this time, the policy remains fully active.',
            content_vn: 'Theo luật Việt Nam, bên mua bảo hiểm có 60 ngày gia hạn để đóng phí quá hạn. Trong thời gian này, hợp đồng vẫn có hiệu lực đầy đủ.',
            tip_en: '60 days of "still got you covered" even if payment\'s late. Don\'t push it though! ⏳',
            tip_vn: '60 ngày vẫn được bảo vệ dù đóng phí trễ. Nhưng đừng ỷ y quá nha! ⏳'
          },
          {
            id: 'l3_c3',
            title_en: 'Void Contracts',
            title_vn: 'Hợp Đồng Vô Hiệu',
            content_en: 'A contract is void if: the subject matter does not exist, the policyholder has no insurable interest, or there is severe fraud at inception.',
            content_vn: 'Hợp đồng vô hiệu nếu: đối tượng bảo hiểm không tồn tại, bên mua không có quyền lợi có thể được bảo hiểm, hoặc có hành vi gian lận nghiêm trọng khi ký kết.',
            tip_en: 'Void = as if it never happened. Premiums come back (mostly), but trust? Not so much. 💔',
            tip_vn: 'Vô hiệu = coi như chưa từng ký. Phí được hoàn (gần hết), nhưng niềm tin thì... khó hoàn lại! 💔'
          },
          {
            id: 'l3_c4',
            title_en: 'The Clock Is Ticking: Claim Deadlines',
            title_vn: 'Đồng Hồ Đang Chạy: Hạn Nộp Hồ Sơ Bồi Thường',
            content_en: 'Under the 2022 Law on Insurance Business, you (or your beneficiary) have exactly 1 year from the date of the insured event to file a claim — miss it and things get complicated! On the flip side, once the insurer receives a complete, valid claim file, they must pay out within 15 days (unless the contract says otherwise). Fair on both sides!',
            content_vn: 'Theo Luật Kinh doanh Bảo hiểm 2022, bạn (hoặc người thụ hưởng) có đúng 1 năm kể từ ngày xảy ra sự kiện bảo hiểm để nộp hồ sơ yêu cầu trả tiền/bồi thường — trễ hạn là rắc rối đó nha! Ngược lại, khi công ty bảo hiểm đã nhận đủ hồ sơ hợp lệ, họ phải chi trả trong vòng 15 ngày (trừ khi hợp đồng có thỏa thuận khác). Công bằng cho cả hai bên!',
            tip_en: '1 year to claim, 15 days for them to pay (once your file is complete). Mark your calendar! 📅',
            tip_vn: '1 năm để yêu cầu, 15 ngày để công ty trả (khi hồ sơ đã đủ). Note lại lịch liền nha! 📅'
          },
          {
            id: 'l3_c5',
            title_en: 'When Does a Contract End (or Change)?',
            title_vn: 'Hợp Đồng Kết Thúc (Hoặc Thay Đổi) Khi Nào?',
            content_en: 'Besides the usual Civil Code reasons, an insurance contract also ends if the policyholder no longer has an insurable interest, or premiums go unpaid past the due date (and the grace period) with no other agreement in place. Golden rule: any amendment or addition to the contract MUST be in writing — a verbal promise doesn\'t count, no matter how convincing it sounds!',
            content_vn: 'Ngoài các trường hợp chấm dứt theo Bộ luật Dân sự, hợp đồng bảo hiểm còn chấm dứt khi: bên mua không còn quyền lợi có thể được bảo hiểm, hoặc không đóng đủ phí đúng hạn (và hết luôn thời gian gia hạn) mà không có thỏa thuận khác. Quy tắc vàng: mọi sửa đổi, bổ sung hợp đồng bảo hiểm PHẢI được lập thành văn bản — hứa miệng dù ngọt đến đâu cũng không tính!',
            tip_en: 'No insurable interest + unpaid premium past grace period = contract over. Changes? Always in writing! ✍️',
            tip_vn: 'Mất quyền lợi bảo hiểm + không đóng phí quá hạn gia hạn = hợp đồng chấm dứt. Đổi gì cũng phải viết ra giấy nha! ✍️'
          }
        ])
      },
      {
        id: 'lesson_4',
        title_en: 'State Regulations',
        title_vn: 'Quy Định Pháp Luật về Kinh Doanh Bảo Hiểm',
        topic: 'regulations',
        difficulty: 'advanced',
        order_index: 4,
        cards: JSON.stringify([
          {
            id: 'l4_c1',
            title_en: 'MOF Oversight',
            title_vn: 'Vai Trò Quản Lý Của Bộ Tài Chính',
            content_en: 'The Ministry of Finance (MOF) regulates licensing, minimum capital requirements, solvency standards, agent examinations, and supervises all insurance market activities in Vietnam.',
            content_vn: 'Bộ Tài chính cấp phép, quy định vốn pháp định, tiêu chuẩn biên khả năng thanh toán, tổ chức thi chứng chỉ đại lý và giám sát toàn bộ hoạt động thị trường bảo hiểm tại Việt Nam.',
            tip_en: 'MOF = the strict-but-fair teacher watching over the whole insurance classroom. 👀',
            tip_vn: 'Bộ Tài chính = thầy giáo nghiêm nhưng công bằng, luôn để mắt tới cả lớp bảo hiểm. 👀'
          },
          {
            id: 'l4_c2',
            title_en: 'Insurance Agent Obligations',
            title_vn: 'Nghĩa Vụ Của Đại Lý Bảo Hiểm',
            content_en: 'Agents must hold a valid certificate, strictly follow the agency contract, explain products truthfully, keep customer information confidential, and never promise unauthorized rebates.',
            content_vn: 'Đại lý phải có chứng chỉ đại lý hợp lệ, tuân thủ hợp đồng đại lý, tư vấn trung thực, bảo mật thông tin khách hàng và không được hứa hẹn giảm phí hoặc chiết khấu trái phép.',
            tip_en: 'Rebating premiums = instant red card. Don\'t even joke about it with clients! 🟥',
            tip_vn: 'Chiết khấu phí cho khách = thẻ đỏ ngay lập tức. Đừng đùa với khách về vụ này nha! 🟥'
          },
          {
            id: 'l4_c3',
            title_en: 'Solvency Margin Requirements',
            title_vn: 'Yêu Cầu Biên Khả Năng Thanh Toán',
            content_en: 'Insurance companies must maintain a solvency margin. If it falls below the statutory minimum, the MOF can force capital injections or implement special recovery measures.',
            content_vn: 'Doanh nghiệp bảo hiểm phải duy trì biên khả năng thanh toán. Nếu thấp hơn mức tối thiểu, Bộ Tài chính có quyền yêu cầu bơm thêm vốn hoặc áp dụng kiểm soát đặc biệt.',
            tip_en: 'Think of it as the insurer\'s financial airbag — always there just in case. 🛟',
            tip_vn: 'Cứ hình dung đây là túi khí tài chính của công ty bảo hiểm — luôn sẵn sàng phòng khi cần. 🛟'
          },
          {
            id: 'l4_c4',
            title_en: 'The Safety Net: Insurance Protection Fund',
            title_vn: 'Lưới An Toàn: Quỹ Bảo Vệ Người Được Bảo Hiểm',
            content_en: 'Insurance companies — not agents, not brokers, not you! — are required to contribute to the Insurance Protection Fund, a safety net that kicks in to protect policyholders if an insurer runs into serious financial trouble. One more reason the MOF keeps such a close eye on insurer solvency.',
            content_vn: 'Các doanh nghiệp bảo hiểm (không phải đại lý, không phải môi giới, càng không phải bạn!) có trách nhiệm trích nộp Quỹ bảo vệ người được bảo hiểm — một tấm lưới an toàn bảo vệ quyền lợi khách hàng nếu công ty bảo hiểm gặp khó khăn tài chính nghiêm trọng. Đây cũng là lý do Bộ Tài chính luôn giám sát sát sao biên khả năng thanh toán của các công ty.',
            tip_en: 'Who pays into the fund? The insurer. Always the insurer. 🛡️',
            tip_vn: 'Ai đóng quỹ? Doanh nghiệp bảo hiểm. Luôn luôn là doanh nghiệp bảo hiểm. 🛡️'
          },
          {
            id: 'l4_c5',
            title_en: 'Foreign Insurers in Vietnam: Not All Doors Are Open',
            title_vn: 'Bảo Hiểm Nước Ngoài Tại Việt Nam: Không Phải Cửa Nào Cũng Mở',
            content_en: 'Foreign non-life insurers can open a branch directly in Vietnam — but foreign LIFE insurers cannot. A foreign life insurer wanting in must set up a proper subsidiary or joint venture instead. Good exam trivia: "branch" + "foreign life insurer" together in an answer = red flag, likely wrong!',
            content_vn: 'Doanh nghiệp bảo hiểm phi nhân thọ nước ngoài được phép mở chi nhánh trực tiếp tại Việt Nam — nhưng doanh nghiệp bảo hiểm NHÂN THỌ nước ngoài thì KHÔNG. Muốn vào Việt Nam, họ phải lập công ty con hoặc liên doanh đàng hoàng. Mẹo thi: thấy "chi nhánh" đi chung với "bảo hiểm nhân thọ nước ngoài" là auto sai đó nha!',
            tip_en: 'Life insurance + foreign branch = not allowed in Vietnam. Remember this combo! 🚫',
            tip_vn: 'Nhân thọ + chi nhánh nước ngoài = không được phép ở Việt Nam. Nhớ kỹ combo này! 🚫'
          }
        ])
      }
    ];

    for (const lesson of defaultLessons) {
      await db.run(
        `INSERT INTO lessons (id, title_en, title_vn, topic, difficulty, cards, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title_en = excluded.title_en,
           title_vn = excluded.title_vn,
           topic = excluded.topic,
           difficulty = excluded.difficulty,
           cards = excluded.cards,
           order_index = excluded.order_index`,
        [lesson.id, lesson.title_en, lesson.title_vn, lesson.topic, lesson.difficulty, lesson.cards, lesson.order_index]
      );
    }
  }

  // Seed a starter FAQ knowledge base for the "Hỏi Llama" chat feature, so common
  // exam terms are retrievable even before an agent uploads their own materials.
  {
    const faqTitle = 'Bộ câu hỏi thường gặp - Thuật ngữ & Nghiệp vụ bảo hiểm';
    const existingFaq = await db.get('SELECT id FROM knowledge_documents WHERE title = ?', [faqTitle]);
    if (!existingFaq) {
      const faqEntries = [
        {
          q: 'Thời gian cân nhắc là gì?',
          a: 'Thời gian cân nhắc giống như mua đồ online có "21 ngày đổi trả" vậy. Theo quy định, đây là 21 ngày kể từ ngày nhận hợp đồng bảo hiểm (áp dụng với hợp đồng có thời hạn trên 1 năm). Trong 21 ngày này, bên mua bảo hiểm có quyền hủy hợp đồng và được hoàn lại phí đã đóng. Ví dụ: nhận hợp đồng ngày 1/7, đến 22/7 nếu thấy không phù hợp thì có thể hủy và lấy lại tiền. Lưu ý bẫy thi MOF: đề hay cho 30 ngày hoặc 15 ngày là sai, đáp án đúng luôn là 21 ngày.'
        },
        {
          q: 'Giải thích nguyên tắc thế quyền',
          a: 'Nguyên tắc thế quyền (Subrogation) giống như khi bạn bị đánh, bên bảo hiểm trả viện phí cho bạn trước, rồi bên bảo hiểm sẽ đi đòi lại người gây ra thiệt hại. Theo quy định, doanh nghiệp bảo hiểm sau khi đã bồi thường cho người được bảo hiểm thì có quyền yêu cầu bên thứ ba gây ra tổn thất phải hoàn trả trong phạm vi số tiền đã bồi thường. Ví dụ: xe A bị xe B đâm, doanh nghiệp bảo hiểm trả tiền sửa xe A trước, sau đó đi đòi xe B hoàn lại. Lưu ý quan trọng: nguyên tắc này không áp dụng cho bảo hiểm nhân thọ và bảo hiểm sức khỏe con người, đây là điểm đề thi hay hỏi.'
        },
        {
          q: 'Phân biệt BMBH và NĐBH?',
          a: 'Bên mua bảo hiểm (BMBH) là người ký hợp đồng và đóng phí bảo hiểm, có thể chuyển nhượng quyền và nghĩa vụ này cho người khác. Người được bảo hiểm (NĐBH) là người được bảo vệ bởi hợp đồng, và không thể thay đổi người này khi hợp đồng đang có hiệu lực. Ví dụ đời thường: bố mua bảo hiểm cho con, thì bố là bên mua bảo hiểm (người ký và đóng tiền), còn con là người được bảo hiểm (người được bảo vệ) — giống như bố mua bảo hành laptop cho con vậy. Lưu ý bẫy thi MOF: người được bảo hiểm không thể thay đổi khi hợp đồng đã có hiệu lực, nhiều người hay nhầm chỗ này.'
        },
        {
          q: '60 ngày gia hạn là sao?',
          a: 'Thời gian gia hạn đóng phí giống như nhà mạng cho bạn nợ cước 60 ngày mà điện thoại vẫn dùng được bình thường. Theo quy định, đây là 60 ngày kể từ ngày đến hạn đóng phí, và trong thời gian này hợp đồng vẫn có hiệu lực dù chưa đóng phí. Ví dụ: phí đến hạn ngày 1/7, bạn quên đóng, thì đến hết ngày 30/8 vẫn được bảo vệ bình thường; nhưng sau mốc đó mà vẫn chưa đóng phí thì hợp đồng sẽ mất hiệu lực. Lưu ý bẫy thi MOF: đề hay cho 30 ngày hoặc 90 ngày là sai, đáp án đúng luôn là 60 ngày.'
        },
        {
          q: 'Tại sao BH nhân thọ không áp dụng nguyên tắc bồi thường?',
          a: 'Lý do là vì mạng người không thể định giá được. Với bảo hiểm xe, nếu xe hư hại 50 triệu thì được bồi thường đúng 50 triệu (bồi thường theo tổn thất thực tế). Nhưng với bảo hiểm nhân thọ, khi người được bảo hiểm qua đời thì không thể tính tổn thất thực tế bằng tiền, nên sẽ chi trả theo số tiền bảo hiểm đã thỏa thuận từ đầu, chứ không theo nguyên tắc bồi thường. Kết luận: bảo hiểm phi nhân thọ và bảo hiểm sức khỏe áp dụng nguyên tắc bồi thường, còn bảo hiểm nhân thọ thì không. Lưu ý bẫy thi MOF: đề hay hỏi nguyên tắc nào không áp dụng cho bảo hiểm nhân thọ — câu trả lời là cả nguyên tắc bồi thường và nguyên tắc thế quyền, cần nhớ cả hai.'
        },
        {
          q: 'Cho tôi mẹo nhớ các con số quan trọng',
          a: 'Một số mốc thời gian quan trọng hay ra trong đề thi MOF: 21 ngày là thời gian cân nhắc (mẹo nhớ: hối hận thì 21 ngày sau vẫn hủy được); 60 ngày là thời gian gia hạn đóng phí (mẹo nhớ: 60 ngày là 2 tháng, đủ thời gian tìm tiền đóng phí); 2 năm đầu là thời gian loại trừ chi trả do tự tử; 1 năm là thời hiệu khiếu nại đòi bồi thường; 18 tuổi là độ tuổi tối thiểu để làm đại lý bảo hiểm. Học thuộc 5 con số này sẽ giúp ăn chắc nhiều câu trong đề thi.'
        },
        {
          q: 'BH tử kỳ khác BH trọn đời chỗ nào?',
          a: 'Bảo hiểm tử kỳ có thời hạn nhất định (ví dụ 10 hoặc 20 năm), chỉ chi trả nếu người được bảo hiểm qua đời trong thời hạn đó, không có giá trị hoàn lại, và phí thường rẻ hơn — giống như đi thuê nhà, hết hạn thuê thì ra đi tay trắng. Bảo hiểm trọn đời bảo vệ suốt đời, chắc chắn sẽ chi trả, có giá trị hoàn lại, nhưng phí đắt hơn — giống như mua nhà trả góp, chắc chắn sẽ có nhà. Lưu ý bẫy thi MOF: nói bảo hiểm tử kỳ có giá trị hoàn lại là sai, bảo hiểm tử kỳ không có giá trị hoàn lại.'
        },
        {
          q: 'Tôi sắp thi, cho tips ôn nhanh',
          a: 'Một vài mẹo ôn nhanh: thuộc 5 con số quan trọng (21 ngày, 60 ngày, 2 năm, 1 năm, 18 tuổi); nhớ 5 nguyên tắc cơ bản (trung thực tuyệt đối, quyền lợi có thể được bảo hiểm, bồi thường, thế quyền, nguyên nhân trực tiếp); phân biệt rõ 5 loại bảo hiểm nhân thọ (tử kỳ, sinh kỳ, hỗn hợp, trọn đời, liên kết đầu tư); tập trung ôn kỹ phần đại lý bảo hiểm vì chiếm tỷ trọng lớn trong đề thi; và nên làm đi làm lại bộ câu hỏi luyện tập nhiều lần, lần đầu để học, lần sau để nhớ, lần cuối để thành thạo.'
        },
        {
          q: 'Giải thích sự kiện bảo hiểm',
          a: 'Sự kiện bảo hiểm là thời điểm mà doanh nghiệp bảo hiểm phải chi trả tiền. Theo quy định, đây là sự kiện khách quan do các bên thỏa thuận hoặc pháp luật quy định, khi xảy ra thì doanh nghiệp bảo hiểm phải chi trả bảo hiểm hoặc bồi thường. Ví dụ: mua bảo hiểm nhân thọ, người được bảo hiểm qua đời do tai nạn — đây là một sự kiện bảo hiểm nên doanh nghiệp phải chi trả. Từ khóa cần nhớ là khách quan, tức là không phải do cố ý gây ra. Lưu ý bẫy thi MOF: nói sự kiện bảo hiểm là sự kiện chủ quan là sai, phải là khách quan.'
        },
        {
          q: 'Điều kiện để làm đại lý bảo hiểm?',
          a: 'Có 3 điều kiện để làm đại lý bảo hiểm: đủ 18 tuổi trở lên; có năng lực hành vi dân sự đầy đủ (tỉnh táo, minh mẫn); và có chứng chỉ đại lý bảo hiểm do cơ sở đào tạo được Bộ Tài chính chấp thuận cấp. Ví dụ: một người 20 tuổi, tỉnh táo, có chứng chỉ MOF là đủ điều kiện; nhưng một người 17 tuổi dù giỏi đến đâu vẫn chưa đủ điều kiện. Lưu ý bẫy thi MOF: chứng chỉ đại lý phải do cơ sở đào tạo được Bộ Tài chính chấp thuận cấp, không phải do doanh nghiệp bảo hiểm tự cấp.'
        },
        {
          q: 'Tóm tắt Chapter 3 cho tôi',
          a: 'Chapter 3 tập trung vào các điều khoản và mốc thời gian quan trọng trong hợp đồng bảo hiểm: bảo hiểm tạm thời có hiệu lực từ khi nộp hồ sơ và phí; thời gian cân nhắc là 21 ngày; thời gian gia hạn đóng phí là 60 ngày; thời hiệu khiếu nại đòi bồi thường là 1 năm; loại trừ chi trả do tự tử trong 2 năm đầu hợp đồng; thời gian chờ là 30 ngày với bệnh thông thường và 0 ngày với tai nạn; và hợp đồng có thể được khôi phục hiệu lực sau khi đã mất hiệu lực. Mẹo nhớ: chương này chủ yếu xoay quanh các con số, nên thuộc số là thuộc được phần lớn nội dung chương.'
        },
        {
          q: 'Bảo hiểm liên kết đầu tư là gì?',
          a: 'Bảo hiểm liên kết đầu tư (ILP) là sản phẩm kết hợp giữa bảo hiểm và đầu tư — vừa được bảo vệ vừa có cơ hội sinh lời. Phí đóng được chia làm hai phần: một phần dùng để bảo vệ giống bảo hiểm thông thường, phần còn lại được đầu tư vào quỹ và có thể lời hoặc lỗ tùy theo thị trường. Ví dụ: đóng 10 triệu mỗi tháng, trong đó 3 triệu dùng để mua bảo hiểm và 7 triệu được đầu tư vào quỹ; nếu quỹ tăng trưởng thì có lời, nếu quỹ giảm thì chịu lỗ. Lưu ý bẫy thi MOF: điểm khác biệt lớn nhất so với bảo hiểm truyền thống là rủi ro đầu tư do khách hàng chịu, không phải doanh nghiệp bảo hiểm.'
        },
        {
          q: 'So sánh quyền của BMBH và DNBH',
          a: 'Bên mua bảo hiểm (BMBH) có các quyền chính như: yêu cầu doanh nghiệp bảo hiểm giải thích điều khoản, được chọn doanh nghiệp bảo hiểm, được hủy hợp đồng, và được đòi bồi thường khi có sự kiện bảo hiểm xảy ra — trong đó quyền hủy hợp đồng có thể thực hiện bất cứ lúc nào. Doanh nghiệp bảo hiểm (DNBH) có quyền thu phí, được từ chối chi trả nếu bên mua bảo hiểm gian lận, và được điều tra sự kiện bảo hiểm — nhưng chỉ được đơn phương hủy hợp đồng khi bên mua bảo hiểm gian lận, không phải bất cứ lúc nào. Nhìn chung bên mua bảo hiểm có nhiều quyền hơn, còn doanh nghiệp bảo hiểm có nhiều nghĩa vụ hơn. Lưu ý bẫy thi MOF: nói doanh nghiệp bảo hiểm có quyền đơn phương hủy hợp đồng bất cứ lúc nào là sai, chỉ được hủy khi bên mua bảo hiểm gian lận.'
        },
        {
          q: 'Nguyên tắc trung thực tuyệt đối áp dụng cho ai?',
          a: 'Nguyên tắc trung thực tuyệt đối áp dụng cho cả hai bên trong hợp đồng bảo hiểm, không phải chỉ riêng bên mua bảo hiểm. Bên mua bảo hiểm phải khai báo trung thực, đầy đủ các thông tin liên quan như tình trạng sức khỏe, tiền sử bệnh, mục đích sử dụng đối tượng bảo hiểm. Doanh nghiệp bảo hiểm cũng phải trung thực, giải thích rõ ràng đầy đủ các điều khoản, quyền lợi, và điều khoản loại trừ cho khách hàng. Ví dụ vi phạm: bên mua bảo hiểm giấu bệnh tim khi kê khai sức khỏe — đây là vi phạm nguyên tắc trung thực tuyệt đối và doanh nghiệp bảo hiểm có quyền từ chối chi trả bảo hiểm. Lưu ý bẫy thi MOF: nhiều người tưởng nguyên tắc này chỉ áp dụng cho bên mua bảo hiểm, nhưng thực tế áp dụng cho cả hai bên.'
        }
      ];

      const faqDoc = await db.run(
        'INSERT INTO knowledge_documents (title, source_type, uploaded_by) VALUES (?, ?, ?)',
        [faqTitle, 'paste', null]
      );
      for (let i = 0; i < faqEntries.length; i++) {
        const content = `Câu hỏi: ${faqEntries[i].q} Trả lời: ${faqEntries[i].a}`;
        const chunk = await db.run(
          'INSERT INTO knowledge_chunks (document_id, chunk_index, content) VALUES (?, ?, ?)',
          [faqDoc.lastID, i, content]
        );
        await db.run(
          'INSERT INTO knowledge_chunks_fts (content, chunk_id, document_id) VALUES (?, ?, ?)',
          [content, chunk.lastID, faqDoc.lastID]
        );
      }
    }
  }

  // Seed the full MOF agent-certification exam question bank (9 sections) into
  // the knowledge base, so "Hỏi Llama" can answer specific exam questions directly.
  {
    const examBankTitle = 'Ngân hàng câu hỏi ôn thi ĐLBH - Bộ đề 9 phần';
    const existingExamBank = await db.get('SELECT id FROM knowledge_documents WHERE title = ?', [examBankTitle]);
    if (!existingExamBank) {
      const examBankChunks = [
        "Câu hỏi: Rủi ro có thể được bảo hiểm và được doanh nghiệp bảo hiểm chấp nhận bảo hiểm là rủi ro được bảo hiểm? Trả lời: Đúng. Rủi ro được bảo hiểm là rủi ro có thể được bảo hiểm và được DNBH chấp nhận bảo hiểm.",
        "Câu hỏi: Rủi ro được coi là rủi ro có thể được bảo hiểm khi đáp ứng các điều kiện sau: Trả lời: Tổn thất phải ngẫu nhiên, bất ngờ; Phải đo được, định lượng được về tài chính; Phải có số đông; Không trái với chuẩn mực đạo đức xã hội. Rủi ro có thể được bảo hiểm phải đáp ứng đủ 4 điều kiện: ngẫu nhiên/bất ngờ, đo lường được, có số đông, và không trái đạo đức.",
        "Câu hỏi: Phát biểu nào sau đây là đúng nhất về rủi ro loại trừ: Trả lời: Là rủi ro không thể được bảo hiểm; Là rủi ro có thể được bảo hiểm nhưng doanh nghiệp bảo hiểm không chấp nhận bảo hiểm. Rủi ro loại trừ bao gồm cả rủi ro không thể được bảo hiểm và rủi ro có thể được bảo hiểm nhưng DNBH không chấp nhận.",
        "Câu hỏi: Bảo hiểm là phương thức quản lý rủi ro nào sau đây: Trả lời: Chuyển giao rủi ro. Bảo hiểm là phương thức chuyển giao rủi ro từ người được bảo hiểm sang doanh nghiệp bảo hiểm.",
        "Câu hỏi: Theo Luật KDBH, loại hình bảo hiểm cho trường hợp NĐBH sống hoặc chết là: Trả lời: Bảo hiểm nhân thọ. Theo Luật KDBH, bảo hiểm nhân thọ là loại hình bảo hiểm cho trường hợp người được bảo hiểm sống hoặc chết.",
        "Câu hỏi: Theo Luật KDBH, chọn phương án đúng về khái niệm bảo hiểm nhân thọ: Trả lời: BHNT là loại hình bảo hiểm cho trường hợp NĐBH sống hoặc chết. Theo Luật KDBH, BHNT chỉ bảo hiểm cho trường hợp NĐBH sống hoặc chết. Các trường hợp khác thuộc BH sức khỏe.",
        "Câu hỏi: Mục tiêu của cá nhân khi tham gia bảo hiểm nhân thọ: Trả lời: Hỗ trợ người thân, người phụ thuộc khi bản thân xảy ra rủi ro; Tiết kiệm để đáp ứng các kế hoạch tài chính cá nhân, đầu tư nguồn vốn nhàn rỗi; Chi trả cho các khoản nợ và chi phí tài chính khi không may xảy ra rủi ro. Cá nhân tham gia BHNT với nhiều mục tiêu: hỗ trợ người thân, tiết kiệm/đầu tư, và chi trả nợ khi gặp rủi ro.",
        "Câu hỏi: Mục tiêu của doanh nghiệp khi tham gia bảo hiểm nhân thọ: Trả lời: Đảm bảo nguồn tài chính để duy trì hoạt động kinh doanh khi chủ DN hoặc người chủ chốt gặp rủi ro; Cung cấp nguồn phúc lợi cho nhân viên; Bảo đảm cho các khoản vay của tổ chức tín dụng khi người vay gặp rủi ro tử vong hoặc thương tật toàn bộ vĩnh viễn. Doanh nghiệp tham gia BHNT để đảm bảo tài chính kinh doanh, phúc lợi nhân viên, và bảo đảm khoản vay.",
        "Câu hỏi: Vai trò xã hội của bảo hiểm là: Trả lời: Góp phần đảm bảo an toàn cho nền kinh tế - xã hội; Tạo thêm việc làm cho xã hội; Tạo nếp sống tiết kiệm và mang đến trạng thái an toàn về mặt tinh thần cho xã hội. Bảo hiểm có vai trò xã hội toàn diện: đảm bảo an toàn kinh tế-xã hội, tạo việc làm, và tạo nếp sống tiết kiệm.",
        "Câu hỏi: Theo Luật KDBH, bên mua bảo hiểm là: Trả lời: Tổ chức, cá nhân giao kết HĐBH với DNBH và đóng phí bảo hiểm. Bên mua bảo hiểm là tổ chức/cá nhân giao kết HĐBH trực tiếp với DNBH và đóng phí bảo hiểm.",
        "Câu hỏi: Theo Luật KDBH, phát biểu nào sau đây sai: Trả lời: BMBH là cá nhân được người thụ hưởng chỉ định để đóng phí bảo hiểm theo thỏa thuận trong HĐBH. Phát biểu sai vì BMBH không phải là người được người thụ hưởng chỉ định để đóng phí.",
        "Câu hỏi: Theo Luật KDBH, tổ chức, cá nhân giao kết HĐBH với DNBH và đóng phí bảo hiểm được gọi là: Trả lời: Bên mua bảo hiểm. Theo định nghĩa Luật KDBH, đó chính là Bên mua bảo hiểm.",
        "Câu hỏi: Bên mua bảo hiểm có thể là: Trả lời: NĐBH; Người thụ hưởng. BMBH có thể đồng thời là NĐBH (mua BH cho chính mình) hoặc là người thụ hưởng.",
        "Câu hỏi: Khoản tiền mà bên mua bảo hiểm đóng cho DNBH theo thỏa thuận trong HĐBH là: Trả lời: Phí bảo hiểm. Phí bảo hiểm là khoản tiền BMBH đóng cho DNBH theo thỏa thuận trong HĐBH.",
        "Câu hỏi: Theo Luật KDBH, phí bảo hiểm là: Trả lời: Khoản tiền mà BMBH phải đóng cho DNBH theo quy định pháp luật hoặc do các bên thỏa thuận trong HĐBH. Phí BH là khoản tiền BMBH phải đóng cho DNBH theo quy định pháp luật hoặc thỏa thuận trong HĐBH.",
        "Câu hỏi: Trong HĐBH nhân thọ, đối tượng nào không được thay đổi trong khi hợp đồng có hiệu lực: Trả lời: NĐBH. Trong HĐBH nhân thọ, NĐBH không được thay đổi trong suốt thời gian hợp đồng có hiệu lực.",
        "Câu hỏi: Theo Luật KDBH, hợp đồng bảo hiểm là sự thỏa thuận giữa: Trả lời: Bên mua bảo hiểm và DNBH. HĐBH là sự thỏa thuận giữa BMBH và DNBH, không phải với đại lý hay NĐBH.",
        "Câu hỏi: Theo Luật KDBH, chọn phương án đúng nhất về SKBH: Trả lời: Là sự kiện khách quan do các bên thỏa thuận hoặc pháp luật quy định mà khi xảy ra thì DNBH phải bồi thường, trả tiền BH; Là sự kiện do pháp luật quy định mà khi xảy ra thì DNBH phải bồi thường, trả tiền BH. SKBH là sự kiện khách quan do các bên thỏa thuận hoặc pháp luật quy định.",
        "Câu hỏi: Theo Luật KDBH, tổ chức, cá nhân được BMBH hoặc NĐBH chỉ định để nhận tiền bảo hiểm theo thỏa thuận trong HĐBH là: Trả lời: Người thụ hưởng. Người thụ hưởng là tổ chức/cá nhân được BMBH hoặc NĐBH chỉ định để nhận tiền BH.",
        "Câu hỏi: Chọn phương án đúng về thương tật toàn bộ vĩnh viễn: Trả lời: NĐBH bị mất, liệt hoàn toàn và không thể phục hồi chức năng của một tay và một chân; NĐBH bị thương tật từ 81% trở lên. Thương tật toàn bộ vĩnh viễn bao gồm: mất/liệt hoàn toàn một tay VÀ một chân, hoặc thương tật từ 81% trở lên.",
        "Câu hỏi: Theo Luật KDBH, hoạt động của DNBH chấp nhận rủi ro của NĐBH, trên cơ sở BMBH đóng phí BH để DNBH bồi thường khi xảy ra SKBH là: Trả lời: Kinh doanh bảo hiểm. Đây là định nghĩa của hoạt động kinh doanh bảo hiểm theo Luật KDBH.",
        "Câu hỏi: Theo Luật KDBH, đối với các HĐBH nhân thọ có thời hạn trên 01 năm, thời gian cân nhắc tham gia bảo hiểm kể từ ngày nhận được HĐBH là: Trả lời: 21 ngày. Thời gian cân nhắc là 21 ngày kể từ ngày BMBH nhận được HĐBH đối với HĐ có thời hạn trên 1 năm.",
        "Câu hỏi: Thời gian cân nhắc tham gia bảo hiểm là thời hạn được tính từ: Trả lời: Ngày BMBH nhận được HĐBH. Thời gian cân nhắc được tính từ ngày BMBH nhận được HĐBH, không phải ngày phát hành hay chấp thuận.",
        "Câu hỏi: Trong thời gian cân nhắc tham gia bảo hiểm, BMBH có quyền: Trả lời: BMBH có quyền từ chối tiếp tục tham gia BH, DNBH hoàn lại phí BH đã đóng sau khi trừ đi chi phí hợp lý (nếu có). Trong thời gian cân nhắc, BMBH có quyền từ chối và được hoàn lại phí BH sau khi trừ chi phí hợp lý.",
        "Câu hỏi: Thời gian gia hạn đóng phí bảo hiểm là bao nhiêu ngày kể từ ngày đến hạn nộp phí: Trả lời: 60 ngày. Thời gian gia hạn đóng phí là 60 ngày kể từ ngày đến hạn nộp phí bảo hiểm.",
        "Câu hỏi: Trường hợp SKBH xảy ra trong thời gian gia hạn đóng phí và BMBH chưa đóng đủ phí BH, DNBH có trách nhiệm chi trả quyền lợi BH? Trả lời: Đúng. DNBH vẫn có trách nhiệm chi trả quyền lợi BH nếu SKBH xảy ra trong thời gian gia hạn đóng phí.",
        "Câu hỏi: HĐBH nhân thọ đã bị đơn phương chấm dứt do BMBH không đóng phí BH có thể khôi phục hiệu lực trong thời hạn: Trả lời: 02 năm kể từ ngày bị chấm dứt và BMBH đã đóng số phí BH còn thiếu. HĐBH có thể khôi phục trong 02 năm kể từ ngày bị chấm dứt, với điều kiện BMBH đóng đủ phí còn thiếu.",
        "Câu hỏi: Thời hạn nộp hồ sơ yêu cầu bồi thường, trả tiền bảo hiểm theo HĐBH là: Trả lời: 01 năm kể từ ngày xảy ra SKBH. Thời hạn nộp hồ sơ yêu cầu bồi thường là 01 năm kể từ ngày xảy ra sự kiện bảo hiểm.",
        "Câu hỏi: DNBH không phải bồi thường, trả tiền BH trong trường hợp: Trả lời: NĐBH chết do tự tử trong thời hạn 02 năm kể từ ngày nộp phí BH đầu tiên hoặc kể từ ngày HĐBH khôi phục hiệu lực; NĐBH chết do lỗi cố ý của BMBH; NĐBH chết do bị thi hành án tử hình. DNBH không phải chi trả trong cả 3 trường hợp: tự tử trong 2 năm đầu, lỗi cố ý của BMBH, và thi hành án tử hình.",
        "Câu hỏi: Khoảng thời gian mà nếu SKBH xảy ra, NĐBH không được nhận quyền lợi BH được gọi là: Trả lời: Thời gian chờ. Thời gian chờ là khoảng thời gian mà nếu SKBH xảy ra, NĐBH không được nhận quyền lợi BH.",
        "Câu hỏi: DNBH phải bồi thường, trả tiền BH trong trường hợp: Trả lời: NĐBH chết do tự tử sau thời hạn 02 năm kể từ ngày nộp phí BH đầu tiên hoặc kể từ ngày HĐBH khôi phục hiệu lực. DNBH phải chi trả nếu NĐBH tự tử SAU thời hạn 02 năm kể từ ngày nộp phí đầu tiên hoặc khôi phục HĐ.",
        "Câu hỏi: Thời hạn phải bồi thường, trả tiền BH cho BMBH kể từ ngày nhận được đầy đủ hồ sơ hợp lệ (trường hợp không có thỏa thuận) là: Trả lời: 15 ngày. Khi không có thỏa thuận, DNBH phải chi trả trong 15 ngày kể từ ngày nhận đủ hồ sơ hợp lệ.",
        "Câu hỏi: Trong HĐBH nhân thọ, trường hợp NĐBH chết do bị thi hành án tử hình, DNBH sẽ: Trả lời: Trả cho BMBH giá trị hoàn lại của HĐBH; Trả cho BMBH toàn bộ số phí BH đã đóng sau khi trừ các chi phí hợp lý. Khi NĐBH chết do thi hành án tử hình, DNBH trả giá trị hoàn lại hoặc hoàn phí đã đóng (trừ chi phí hợp lý).",
        "Câu hỏi: Theo Luật KDBH, phát biểu nào đúng nhất về nguyên tắc trung thực tuyệt đối: Trả lời: Là nghĩa vụ chung của cả DNBH và BMBH. Nguyên tắc trung thực tuyệt đối là nghĩa vụ chung của cả hai bên: DNBH và BMBH.",
        "Câu hỏi: Trong HĐBH nhân thọ, HĐBH sức khỏe, BMBH có thể mua bảo hiểm cho những người nào: Trả lời: Bản thân BMBH; Vợ, chồng, cha, mẹ, con của BMBH; Anh ruột, chị ruột, em ruột hoặc người khác có quan hệ nuôi dưỡng, cấp dưỡng với BMBH. BMBH có thể mua BH cho bản thân, gia đình trực hệ, và người có quan hệ nuôi dưỡng/cấp dưỡng.",
        "Câu hỏi: Chọn phương án đúng nhất về 'Nguyên tắc bồi thường': Trả lời: Số tiền bồi thường mà NĐBH nhận được không vượt quá thiệt hại thực tế trong SKBH, trừ trường hợp có thỏa thuận khác. Nguyên tắc bồi thường: số tiền bồi thường không vượt quá thiệt hại thực tế, trừ khi có thỏa thuận khác.",
        "Câu hỏi: Một người được bảo hiểm bởi nhiều HĐBH nhân thọ tại nhiều DNBH khác nhau, khi xảy ra SKBH sẽ: Trả lời: Được hưởng quyền lợi BH theo tất cả các HĐBH đã tham gia. Trong BHNT, NĐBH được hưởng quyền lợi theo TẤT CẢ các HĐBH đã tham gia (nguyên tắc khoán).",
        "Câu hỏi: Chọn phương án đúng nhất về xác định số tiền mà DNBH phải chi trả theo 'Nguyên tắc khoán' khi xảy ra SKBH: Trả lời: Số tiền đã được thỏa thuận tại HĐBH. Theo nguyên tắc khoán, DNBH chi trả đúng số tiền đã thỏa thuận tại HĐBH, không phụ thuộc thiệt hại thực tế.",
        "Câu hỏi: Nguyên tắc khoán được áp dụng cho: Trả lời: Bảo hiểm nhân thọ. Nguyên tắc khoán chỉ áp dụng cho bảo hiểm nhân thọ, không áp dụng cho BH tài sản hay trách nhiệm.",
        "Câu hỏi: Nguyên tắc thế quyền được hiểu thế nào là đúng nhất: Trả lời: NĐBH có trách nhiệm chuyển giao cho DNBH quyền yêu cầu người thứ ba bồi hoàn; DNBH đòi bồi hoàn bên thứ ba trong phạm vi số tiền đã bồi thường cho NĐBH; Nguyên tắc này không áp dụng đối với HĐBH nhân thọ và HĐBH sức khỏe. Nguyên tắc thế quyền: NĐBH chuyển giao quyền đòi bên thứ ba cho DNBH, và nguyên tắc này KHÔNG áp dụng cho BHNT và BH sức khỏe.",
        "Câu hỏi: Nguyên tắc nào sau đây không áp dụng đối với HĐBH nhân thọ và HĐBH sức khỏe: Trả lời: Nguyên tắc thế quyền. Nguyên tắc thế quyền không áp dụng cho HĐBH nhân thọ và HĐBH sức khỏe.",
        "Câu hỏi: Chọn phương án đúng nhất về 'Nguyên tắc nguyên nhân trực tiếp': Trả lời: Tổn thất thuộc trách nhiệm BH phải phát sinh trực tiếp bởi một rủi ro được bảo hiểm; Nguyên nhân trực tiếp không nhất thiết phải là nguyên nhân ban đầu hay nguyên nhân gần nhất gây ra tổn thất; Nguyên nhân trực tiếp là nguyên nhân chi phối và có tác động gây ra tổn thất. Nguyên tắc nguyên nhân trực tiếp bao gồm cả 3 yếu tố: phát sinh trực tiếp từ rủi ro được BH, không nhất thiết là nguyên nhân ban đầu/gần nhất, và là nguyên nhân chi phối.",
        "Câu hỏi: Phạm vi điều chỉnh của Luật Kinh doanh bảo hiểm là: Trả lời: Tổ chức và hoạt động kinh doanh BH; quyền và nghĩa vụ của tổ chức, cá nhân tham gia BH; quản lý nhà nước về hoạt động kinh doanh BH. Luật KDBH điều chỉnh tổ chức/hoạt động kinh doanh BH, quyền/nghĩa vụ các bên, và quản lý nhà nước về KDBH.",
        "Câu hỏi: Cơ quan chịu trách nhiệm trước Chính phủ thực hiện quản lý nhà nước về hoạt động kinh doanh bảo hiểm là: Trả lời: Bộ Tài chính. Bộ Tài chính là cơ quan chịu trách nhiệm trước Chính phủ về quản lý nhà nước đối với hoạt động KDBH.",
        "Câu hỏi: Theo Luật KDBH, chọn phương án đúng nhất về kinh doanh bảo hiểm sức khỏe: Trả lời: DNBH phi nhân thọ không được phép kinh doanh BHNT và ngược lại; DNBH phi nhân thọ và nhân thọ được phép kinh doanh nghiệp vụ BH sức khỏe. DNBH phi nhân thọ và nhân thọ không được kinh doanh chéo, nhưng cả hai đều được kinh doanh BH sức khỏe.",
        "Câu hỏi: Theo Luật KDBH, doanh nghiệp kinh doanh bảo hiểm nước ngoài không được phép thành lập tại Việt Nam: Trả lời: Chi nhánh doanh nghiệp bảo hiểm nhân thọ nước ngoài. DN BH nước ngoài không được thành lập chi nhánh BHNT tại VN, chỉ được lập chi nhánh BH phi nhân thọ.",
        "Câu hỏi: Theo Luật KDBH, các tổ chức kinh doanh bảo hiểm không bao gồm đối tượng nào: Trả lời: Hợp tác xã bảo hiểm. Hợp tác xã bảo hiểm không thuộc các tổ chức kinh doanh bảo hiểm theo Luật KDBH.",
        "Câu hỏi: Luật KDBH quy định về các loại HĐBH nào: Trả lời: HĐBH nhân thọ; HĐBH sức khỏe; HĐBH trách nhiệm. Luật KDBH quy định về HĐBH nhân thọ, HĐBH sức khỏe, và HĐBH trách nhiệm (cùng HĐBH tài sản, thiệt hại).",
        "Câu hỏi: Chọn phương án đúng nhất về đối tượng của HĐBH nhân thọ: Trả lời: Tuổi thọ; Tính mạng. Đối tượng của HĐBH nhân thọ là tuổi thọ và tính mạng con người (không bao gồm sức khỏe - thuộc BH sức khỏe).",
        "Câu hỏi: Bảo hiểm trọn đời là nghiệp vụ bảo hiểm cho trường hợp tử vong vào bất kỳ thời điểm nào trong suốt cuộc đời của: Trả lời: Người được bảo hiểm. BH trọn đời bảo hiểm cho trường hợp tử vong của NĐBH vào bất kỳ thời điểm nào trong suốt cuộc đời.",
        "Câu hỏi: Đối với nghiệp vụ bảo hiểm tử kỳ, trường hợp NĐBH sống đến hết thời hạn hợp đồng, trách nhiệm của DNBH: Trả lời: Không chi trả tiền bảo hiểm. BH tử kỳ chỉ chi trả khi NĐBH tử vong trong thời hạn HĐ. Nếu sống đến hết hạn, DNBH không chi trả.",
        "Câu hỏi: Đáp án nào đúng khi nói về bảo hiểm hỗn hợp: Trả lời: Là nghiệp vụ BH kết hợp bảo hiểm sinh kỳ và bảo hiểm tử kỳ. BH hỗn hợp = BH sinh kỳ + BH tử kỳ, chi trả cả khi NĐBH sống đến hết hạn hoặc tử vong trong thời hạn.",
        "Câu hỏi: Nghiệp vụ BH theo đó DNBH chi trả tiền BH cả khi NĐBH còn sống đến hết thời hạn BH hoặc tử vong trong thời hạn BH là: Trả lời: Bảo hiểm hỗn hợp. BH hỗn hợp chi trả trong cả hai trường hợp: NĐBH sống đến hết hạn HOẶC tử vong trong thời hạn BH.",
        "Câu hỏi: Nghiệp vụ BH cho trường hợp NĐBH sống đến một thời hạn nhất định; sau đó DNBH phải trả tiền định kỳ cho người thụ hưởng là: Trả lời: Bảo hiểm trả tiền định kỳ. BH trả tiền định kỳ: NĐBH sống đến thời hạn nhất định, sau đó DNBH trả tiền định kỳ cho người thụ hưởng.",
        "Câu hỏi: Đối với sản phẩm BH liên kết chung, DNBH được khấu trừ các loại phí: Trả lời: Phí ban đầu; Phí bảo hiểm rủi ro; Phí quản lý hợp đồng BH, phí quản lý quỹ, phí hủy bỏ HĐBH. Với BH liên kết chung, DNBH được khấu trừ: phí ban đầu, phí BH rủi ro, phí quản lý HĐ/quỹ, và phí hủy bỏ.",
        "Câu hỏi: Chọn phương án đúng nhất về đặc trưng pháp lý của HĐBH: Trả lời: HĐBH là hợp đồng song vụ; HĐBH là hợp đồng theo mẫu do DNBH đưa ra; HĐBH là sự thỏa thuận giữa BMBH và DNBH. HĐBH có 3 đặc trưng pháp lý: song vụ, theo mẫu do DNBH đưa ra, và là sự thỏa thuận giữa BMBH và DNBH.",
        "Câu hỏi: Trong HĐBH nhân thọ, số tiền BH hoặc phương thức xác định số tiền BH được: Trả lời: BMBH và DNBH thỏa thuận trong HĐBH. Số tiền BH được thỏa thuận trực tiếp giữa BMBH và DNBH trong HĐBH.",
        "Câu hỏi: Trường hợp HĐBH có điều khoản không rõ ràng dẫn đến có cách hiểu khác nhau thì điều khoản đó được giải thích theo hướng có lợi cho: Trả lời: BMBH. Khi điều khoản không rõ ràng, được giải thích theo hướng có lợi cho BMBH (bên yếu thế hơn).",
        "Câu hỏi: Trong trường hợp đại lý BH vi phạm hợp đồng đại lý BH gây thiệt hại đến quyền và lợi ích hợp pháp của NĐBH thì DNBH có phải chịu trách nhiệm thực hiện các nghĩa vụ theo thỏa thuận trong HĐBH không? Trả lời: Có. DNBH vẫn phải chịu trách nhiệm thực hiện nghĩa vụ theo HĐBH khi đại lý vi phạm gây thiệt hại cho NĐBH.",
        "Câu hỏi: Trong HĐBH nhân thọ, trường hợp có nhiều người thụ hưởng, nếu một hoặc một số người thụ hưởng cố ý gây ra cái chết hay thương tật vĩnh viễn cho NĐBH thì: Trả lời: DNBH vẫn phải bồi thường, trả tiền BH cho những người thụ hưởng khác theo thỏa thuận trong HĐBH. DNBH vẫn phải chi trả cho những người thụ hưởng KHÁC (không phải người cố ý gây hại).",
        "Câu hỏi: Theo Luật KDBH, BMBH có quyền: Trả lời: Chuyển giao HĐBH theo quy định của pháp luật. BMBH có quyền chuyển giao HĐBH theo quy định pháp luật. Cung cấp bằng chứng giao kết là nghĩa vụ của DNBH, còn từ chối cung cấp thông tin là sai.",
        "Câu hỏi: Khi giao kết HĐBH, BMBH có quyền và nghĩa vụ: Trả lời: Có quyền yêu cầu DNBH giải thích các điều kiện, điều khoản BH; Có nghĩa vụ kê khai đầy đủ, trung thực mọi thông tin có liên quan đến HĐBH theo yêu cầu của DNBH; Có nghĩa vụ đóng phí BH đầy đủ, đúng hạn theo thỏa thuận trong HĐBH. BMBH có quyền yêu cầu giải thích, và nghĩa vụ kê khai trung thực + đóng phí đầy đủ đúng hạn.",
        "Câu hỏi: BMBH có quyền hủy bỏ hợp đồng và được hoàn lại phí BH đã đóng trong trường hợp: Trả lời: DNBH cố ý không thực hiện nghĩa vụ cung cấp thông tin nhằm giao kết HĐBH; DNBH cung cấp thông tin sai sự thật nhằm giao kết HĐBH. BMBH được hủy HĐ và hoàn phí khi DNBH cố ý không cung cấp thông tin hoặc cung cấp sai sự thật.",
        "Câu hỏi: Khi giao kết HĐBH, DNBH có quyền và nghĩa vụ: Trả lời: Có quyền yêu cầu BMBH cung cấp đầy đủ, trung thực mọi thông tin liên quan đến việc giao kết HĐBH; Có quyền thu phí BH theo thỏa thuận trong HĐBH; Có nghĩa vụ giải thích rõ ràng, đầy đủ cho BMBH về quyền lợi BH, điều khoản loại trừ trách nhiệm BH, quyền và nghĩa vụ của BMBH. DNBH có quyền yêu cầu thông tin, thu phí, và nghĩa vụ giải thích đầy đủ cho BMBH.",
        "Câu hỏi: Theo Luật KDBH, DNBH không được ký kết hợp đồng ĐLBH với những đối tượng sau: Trả lời: Tổ chức, cá nhân đang bị truy cứu trách nhiệm hình sự; Cá nhân đang chấp hành hình phạt tù; Tổ chức đang bị đình chỉ hoạt động có thời hạn, đang bị cấm kinh doanh trong lĩnh vực liên quan đến bảo hiểm. DNBH không được ký HĐ ĐLBH với người đang bị truy cứu hình sự, chấp hành án tù, hoặc tổ chức bị đình chỉ/cấm.",
        "Câu hỏi: Cá nhân đã được cấp chứng chỉ ĐLBH nhưng không hoạt động ĐLBH trong thời hạn bao lâu phải thực hiện thi chứng chỉ ĐLBH mới: Trả lời: 3 năm. Nếu không hoạt động ĐLBH trong 3 năm liên tục, phải thi lấy chứng chỉ ĐLBH mới.",
        "Câu hỏi: Nội dung chủ yếu đào tạo chứng chỉ đại lý bảo hiểm bao gồm: Trả lời: Kiến thức chung về BH; Pháp luật Việt Nam về hoạt động kinh doanh BH; Quy tắc đạo đức, ứng xử nghề nghiệp ĐLBH; Quyền và nghĩa vụ của DNBH, ĐLBH; Kỹ năng và thực hành hành nghề ĐLBH. Đào tạo ĐLBH bao gồm: kiến thức BH, pháp luật, đạo đức nghề nghiệp, quyền/nghĩa vụ, và kỹ năng thực hành.",
        "Câu hỏi: Hoạt động ĐLBH bao gồm: Trả lời: Tư vấn sản phẩm BH; giới thiệu sản phẩm BH; chào bán sản phẩm BH; thu xếp việc giao kết HĐBH; thu phí BH; thu thập hồ sơ để phục vụ việc giải quyết bồi thường, trả tiền BH. Hoạt động đại lý bảo hiểm bao gồm đầy đủ các bước: tư vấn, giới thiệu, chào bán sản phẩm bảo hiểm, thu xếp việc giao kết hợp đồng, thu phí bảo hiểm, và thu thập hồ sơ phục vụ giải quyết bồi thường, trả tiền bảo hiểm.",
      ];

      const examBankDoc = await db.run(
        'INSERT INTO knowledge_documents (title, source_type, uploaded_by) VALUES (?, ?, ?)',
        [examBankTitle, 'paste', null]
      );
      for (let i = 0; i < examBankChunks.length; i++) {
        const chunk = await db.run(
          'INSERT INTO knowledge_chunks (document_id, chunk_index, content) VALUES (?, ?, ?)',
          [examBankDoc.lastID, i, examBankChunks[i]]
        );
        await db.run(
          'INSERT INTO knowledge_chunks_fts (content, chunk_id, document_id) VALUES (?, ?, ?)',
          [examBankChunks[i], chunk.lastID, examBankDoc.lastID]
        );
      }
    }
  }
  console.log('Database initialized and seeded successfully.');
}
