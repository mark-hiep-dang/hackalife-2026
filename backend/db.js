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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

  console.log('Database initialized and seeded successfully.');
}
