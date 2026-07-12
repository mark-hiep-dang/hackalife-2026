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

  console.log('Database initialized and seeded successfully.');
}
