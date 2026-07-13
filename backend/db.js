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

  // Seed Lessons if empty
  const lessonsCount = await db.get('SELECT COUNT(*) as count FROM lessons');
  if (lessonsCount.count === 0) {
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
            tip_en: 'Keywords: Risk transfer, premium, financial protection.',
            tip_vn: 'Từ khóa: Chuyển giao rủi ro, phí bảo hiểm, bảo vệ tài chính.'
          },
          {
            id: 'l1_c2',
            title_en: 'Principle of Utmost Good Faith',
            title_vn: 'Nguyên Tắc Trung Thực Tuyệt Đối',
            content_en: 'Both the policyholder and the insurer must fully and honestly disclose all material facts before signing the insurance contract. Any concealment can make the contract void.',
            content_vn: 'Cả bên mua bảo hiểm và doanh nghiệp bảo hiểm phải công khai đầy đủ và trung thực mọi thông tin quan trọng trước khi ký hợp đồng. Mọi hành vi che giấu có thể làm hợp đồng vô hiệu.',
            tip_en: 'Also known in Latin as "Uberrimae Fidei".',
            tip_vn: 'Còn được gọi là "Uberrimae Fidei". Sự trung thực là nền tảng cốt lõi.'
          },
          {
            id: 'l1_c3',
            title_en: 'Insurable Interest',
            title_vn: 'Quyền Lợi Có Thể Được Bảo Hiểm',
            content_en: 'The policyholder must stand to suffer a financial loss if the insured event occurs. You cannot buy life insurance for a complete stranger.',
            content_vn: 'Bên mua bảo hiểm phải chịu tổn thất tài chính nếu sự kiện bảo hiểm xảy ra. Bạn không thể mua bảo hiểm nhân thọ cho một người hoàn toàn xa lạ.',
            tip_en: 'Crucial for preventing speculation on lives or properties.',
            tip_vn: 'Quan trọng để ngăn chặn đầu cơ trục lợi trên mạng sống hoặc tài sản.'
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
            tip_en: 'Life is long-term; non-life is usually annual/short-term.',
            tip_vn: 'Nhân thọ mang tính dài hạn; phi nhân thọ thường là hàng năm/ngắn hạn.'
          },
          {
            id: 'l2_c2',
            title_en: 'Unit-Linked Insurance (ULIP)',
            title_vn: 'Bảo Hiểm Liên Kết Đơn Vị',
            content_en: 'A hybrid product combining life protection and investment. Premium is split: one part goes to insurance cover, the other is invested in mutual fund units chosen by the policyholder.',
            content_vn: 'Sản phẩm hỗn hợp kết hợp bảo vệ nhân thọ và đầu tư. Phí bảo hiểm được chia làm hai: một phần cho bảo vệ, phần còn lại được đầu tư vào các quỹ do khách hàng tự chọn.',
            tip_en: 'The policyholder bears the investment risk, not the insurance company.',
            tip_vn: 'Bên mua bảo hiểm chịu rủi ro đầu tư, không phải doanh nghiệp bảo hiểm.'
          },
          {
            id: 'l2_c3',
            title_en: 'Health Insurance',
            title_vn: 'Bảo Hiểm Sức Khỏe',
            content_en: 'Covers medical expenses, hospitalization, surgery, or personal accidents. It can be sold by both life and non-life insurance companies under Vietnamese law.',
            content_vn: 'Bồi thường chi phí y tế, nằm viện, phẫu thuật hoặc tai nạn cá nhân. Cả doanh nghiệp BH nhân thọ và phi nhân thọ đều được phép bán BH sức khỏe tại Việt Nam.',
            tip_en: 'Often sold as an add-on rider or standalone policy.',
            tip_vn: 'Thường được bán dưới dạng sản phẩm bổ trợ hoặc hợp đồng độc lập.'
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
            tip_en: 'Any ambiguous clause is usually interpreted in favor of the policyholder.',
            tip_vn: 'Mọi điều khoản không rõ ràng thường được giải thích có lợi cho bên mua.'
          },
          {
            id: 'l3_c2',
            title_en: 'Grace Period for Premium Payment',
            title_vn: 'Thời Gian Gia Hạn Nộp Phí',
            content_en: 'Under Vietnamese law, the policyholder has a 60-day grace period to pay overdue premiums. During this time, the policy remains fully active.',
            content_vn: 'Theo luật Việt Nam, bên mua bảo hiểm có 60 ngày gia hạn để đóng phí quá hạn. Trong thời gian này, hợp đồng vẫn có hiệu lực đầy đủ.',
            tip_en: 'Applies to long-term life contracts if the policy has cash value.',
            tip_vn: 'Áp dụng cho hợp đồng nhân thọ dài hạn nếu hợp đồng đã có giá trị hoàn lại.'
          },
          {
            id: 'l3_c3',
            title_en: 'Void Contracts',
            title_vn: 'Hợp Đồng Vô Hiệu',
            content_en: 'A contract is void if: the subject matter does not exist, the policyholder has no insurable interest, or there is severe fraud at inception.',
            content_vn: 'Hợp đồng vô hiệu nếu: đối tượng bảo hiểm không tồn tại, bên mua không có quyền lợi có thể được bảo hiểm, hoặc có hành vi gian lận nghiêm trọng khi ký kết.',
            tip_en: 'Void contracts are treated as if they never existed; premiums are returned (minus costs).',
            tip_vn: 'Hợp đồng vô hiệu coi như chưa từng tồn tại; phí bảo hiểm được hoàn lại (trừ chi phí hợp lý).'
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
            tip_en: 'MOF is the ultimate regulatory authority for insurance.',
            tip_vn: 'Bộ Tài chính là cơ quan quản lý nhà nước tối cao về bảo hiểm.'
          },
          {
            id: 'l4_c2',
            title_en: 'Insurance Agent Obligations',
            title_vn: 'Nghĩa Vụ Của Đại Lý Bảo Hiểm',
            content_en: 'Agents must hold a valid certificate, strictly follow the agency contract, explain products truthfully, keep customer information confidential, and never promise unauthorized rebates.',
            content_vn: 'Đại lý phải có chứng chỉ đại lý hợp lệ, tuân thủ hợp đồng đại lý, tư vấn trung thực, bảo mật thông tin khách hàng và không được hứa hẹn giảm phí hoặc chiết khấu trái phép.',
            tip_en: 'Rebating premiums to clients is illegal under MOF rules.',
            tip_vn: 'Việc hoàn phí/chiết khấu hoa hồng cho khách hàng là bất hợp pháp theo quy định.'
          },
          {
            id: 'l4_c3',
            title_en: 'Solvency Margin Requirements',
            title_vn: 'Yêu Cầu Biên Khả Năng Thanh Toán',
            content_en: 'Insurance companies must maintain a solvency margin. If it falls below the statutory minimum, the MOF can force capital injections or implement special recovery measures.',
            content_vn: 'Doanh nghiệp bảo hiểm phải duy trì biên khả năng thanh toán. Nếu thấp hơn mức tối thiểu, Bộ Tài chính có quyền yêu cầu bơm thêm vốn hoặc áp dụng kiểm soát đặc biệt.',
            tip_en: 'Crucial for protecting policyholders from company bankruptcies.',
            tip_vn: 'Quan trọng để bảo vệ bên mua bảo hiểm khỏi nguy cơ vỡ nợ của doanh nghiệp.'
          }
        ])
      }
    ];

    for (const lesson of defaultLessons) {
      await db.run(
        `INSERT INTO lessons (id, title_en, title_vn, topic, difficulty, cards, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [lesson.id, lesson.title_en, lesson.title_vn, lesson.topic, lesson.difficulty, lesson.cards, lesson.order_index]
      );
    }
  }

  console.log('Database initialized and seeded successfully.');
}
