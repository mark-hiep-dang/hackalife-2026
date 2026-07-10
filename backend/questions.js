// Question Database & Dynamic Generator

export const questionBank = [
  // --- FUNDAMENTALS ---
  {
    id: 'q_fund_1',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'beginner',
    question_en: 'What is the primary function of insurance?',
    question_vn: 'Chức năng chính của bảo hiểm là gì?',
    options_en: [
      'To eliminate physical risks entirely',
      'To transfer the financial burden of potential losses',
      'To guarantee high investment returns',
      'To cover any losses caused intentionally'
    ],
    options_vn: [
      'Loại bỏ hoàn toàn rủi ro vật chất',
      'Chuyển giao gánh nặng tài chính của tổn thất tiềm ẩn',
      'Đảm bảo lợi nhuận đầu tư cao',
      'Bồi thường cho các tổn thất do cố ý gây ra'
    ],
    correct_index: 1,
    explanation_en: 'Insurance is a risk transfer mechanism. It does not prevent physical accidents, but it transfers the financial consequence of losses from the individual to the group.',
    explanation_vn: 'Bảo hiểm là cơ chế chuyển giao rủi ro. Nó không ngăn ngừa tai nạn vật chất xảy ra, nhưng chuyển giao hậu quả tài chính từ cá nhân sang cộng đồng.'
  },
  {
    id: 'q_fund_2',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'beginner',
    question_en: 'Which principle states that the policyholder must disclose all relevant facts honestly?',
    question_vn: 'Nguyên tắc nào quy định bên mua bảo hiểm phải kê khai trung thực tất cả thông tin liên quan?',
    options_en: [
      'Principle of Indemnity',
      'Principle of Subrogation',
      'Principle of Utmost Good Faith',
      'Principle of Insurable Interest'
    ],
    options_vn: [
      'Nguyên tắc bồi thường',
      'Nguyên tắc thế quyền',
      'Nguyên tắc trung thực tuyệt đối',
      'Nguyên tắc quyền lợi có thể được bảo hiểm'
    ],
    correct_index: 2,
    explanation_en: 'The Principle of Utmost Good Faith (Uberrimae Fidei) requires absolute honesty from both the insurer and the policyholder during disclosure.',
    explanation_vn: 'Nguyên tắc trung thực tuyệt đối (Uberrimae Fidei) yêu cầu sự trung thực tuyệt đối từ cả doanh nghiệp bảo hiểm và bên mua bảo hiểm trong quá trình khai báo.'
  },
  {
    id: 'q_fund_3',
    topic: 'tf',
    difficulty: 'beginner',
    question_en: 'True or False: Under the principle of insurable interest, you can buy a life insurance policy for a total stranger.',
    question_vn: 'Đúng hay Sai: Theo nguyên tắc quyền lợi có thể được bảo hiểm, bạn có thể mua bảo hiểm nhân thọ cho một người hoàn toàn xa lạ.',
    options_en: ['True', 'False'],
    options_vn: ['Đúng', 'Sai'],
    correct_index: 1,
    explanation_en: 'False. You must have a recognized insurable interest (such as family relationship, business partnership, or debtor-creditor relationship) to purchase insurance.',
    explanation_vn: 'Sai. Bạn phải có quyền lợi có thể được bảo hiểm được pháp luật thừa nhận (như quan hệ gia đình, đối tác kinh doanh hoặc chủ nợ - con nợ) để mua bảo hiểm.'
  },
  {
    id: 'q_fund_4',
    topic: 'fitb',
    difficulty: 'intermediate',
    question_en: 'The financial consideration paid by the policyholder to the insurer is called the...',
    question_vn: 'Khoản tiền mà bên mua bảo hiểm đóng cho doanh nghiệp bảo hiểm được gọi là...',
    correct_answer: 'premium',
    correct_answer_vn: 'phí bảo hiểm',
    explanation_en: 'The premium is the price of the insurance coverage, paid periodically or as a single payment.',
    explanation_vn: 'Phí bảo hiểm là giá của sự bảo vệ bảo hiểm, được nộp định kỳ hoặc một lần.'
  },
  {
    id: 'q_fund_5',
    topic: 'mcq',
    difficulty: 'intermediate',
    question_en: 'The Principle of Indemnity states that after a loss, the insured should be:',
    question_vn: 'Nguyên tắc bồi thường quy định rằng sau khi xảy ra tổn thất, người được bảo hiểm phải được:',
    options_en: [
      'Enriched and paid more than the actual loss value',
      'Restored to the same financial position as prior to the loss',
      'Compensated only with cash vouchers',
      'Exempted from paying future premiums'
    ],
    options_vn: [
      'Trở nên giàu có hơn và được trả nhiều hơn giá trị tổn thất thực tế',
      'Khôi phục lại tình trạng tài chính giống như ngay trước khi xảy ra tổn thất',
      'Bồi thường chỉ bằng các phiếu mua hàng',
      'Miễn nộp phí bảo hiểm trong tương lai'
    ],
    correct_index: 1,
    explanation_en: 'The Principle of Indemnity aims to restore the insured to their approximate financial state before the loss occurred, preventing any financial gain from claims.',
    explanation_vn: 'Nguyên tắc bồi thường nhằm mục đích khôi phục người được bảo hiểm về trạng thái tài chính xấp xỉ như trước khi xảy ra tổn thất, ngăn ngừa việc trục lợi từ bảo hiểm.'
  },

  // --- PRODUCTS ---
  {
    id: 'q_prod_1',
    topic: 'products',
    type: 'mcq',
    difficulty: 'beginner',
    question_en: 'Which insurance product combines life protection with active investment in mutual funds chosen by the policyholder?',
    question_vn: 'Sản phẩm bảo hiểm nào kết hợp bảo vệ nhân thọ với đầu tư vào các quỹ do khách hàng tự lựa chọn?',
    options_en: [
      'Term Insurance',
      'Whole Life Insurance',
      'Unit-Linked Insurance',
      'Endowment Insurance'
    ],
    options_vn: [
      'Bảo hiểm tử kỳ',
      'Bảo hiểm trọn đời',
      'Bảo hiểm liên kết đơn vị',
      'Bảo hiểm hỗn hợp'
    ],
    correct_index: 2,
    explanation_en: 'Unit-Linked Insurance Plans (ULIPs) divide premiums between life coverage and investment units in funds chosen by the policyholder, who also bears the investment risks.',
    explanation_vn: 'Bảo hiểm liên kết đơn vị chia phí bảo hiểm làm hai phần: bảo vệ nhân thọ và các đơn vị đầu tư trong quỹ do khách hàng chọn, khách hàng tự chịu rủi ro đầu tư.'
  },
  {
    id: 'q_prod_2',
    topic: 'mcq',
    difficulty: 'intermediate',
    question_en: 'According to Vietnamese law, health insurance products can be offered by:',
    question_vn: 'Theo pháp luật Việt Nam, sản phẩm bảo hiểm sức khỏe có thể được cung cấp bởi:',
    options_en: [
      'Only Life Insurance Companies',
      'Only Non-Life Insurance Companies',
      'Both Life and Non-Life Insurance Companies',
      'Only government-run social security agencies'
    ],
    options_vn: [
      'Chỉ các doanh nghiệp bảo hiểm nhân thọ',
      'Chỉ các doanh nghiệp bảo hiểm phi nhân thọ',
      'Cả doanh nghiệp bảo hiểm nhân thọ và phi nhân thọ',
      'Chỉ các cơ quan bảo hiểm xã hội của nhà nước'
    ],
    correct_index: 2,
    explanation_en: 'Under the Law on Insurance Business in Vietnam, health insurance is a separate line of business that can be sold by both life and non-life insurance enterprises.',
    explanation_vn: 'Theo Luật Kinh doanh bảo hiểm Việt Nam, bảo hiểm sức khỏe là nghiệp vụ riêng biệt mà cả doanh nghiệp BH nhân thọ và phi nhân thọ đều được phép triển khai.'
  },
  {
    id: 'q_prod_3',
    topic: 'tf',
    difficulty: 'beginner',
    question_en: 'True or False: Compulsory Motor Third-Party Liability insurance is optional for motorbike owners in Vietnam.',
    question_vn: 'Đúng hay Sai: Bảo hiểm trách nhiệm dân sự bắt buộc của chủ xe cơ giới là tự nguyện đối với chủ xe máy tại Việt Nam.',
    options_en: ['True', 'False'],
    options_vn: ['Đúng', 'Sai'],
    correct_index: 1,
    explanation_en: 'False. It is compulsory (strictly required by law) for all motor vehicle owners, including motorbikes, to protect third-party victims in accidents.',
    explanation_vn: 'Sai. Đây là bảo hiểm bắt buộc theo luật đối với mọi chủ xe cơ giới, bao gồm xe máy, nhằm bảo vệ quyền lợi của bên thứ ba khi xảy ra tai nạn.'
  },
  {
    id: 'q_prod_4',
    topic: 'fitb',
    difficulty: 'intermediate',
    question_en: 'The type of life insurance that pays the sum assured only if the insured dies within a specified duration is called...',
    question_vn: 'Loại bảo hiểm nhân thọ chỉ chi trả số tiền bảo hiểm nếu người được bảo hiểm tử vong trong một thời hạn nhất định được gọi là bảo hiểm...',
    correct_answer: 'term',
    correct_answer_vn: 'tử kỳ',
    explanation_en: 'Term life insurance offers pure death protection for a fixed number of years and carries no savings or cash value.',
    explanation_vn: 'Bảo hiểm nhân thọ tử kỳ cung cấp sự bảo vệ thuần túy trước rủi ro tử vong trong một số năm nhất định và không có giá trị tiết kiệm hoàn lại.'
  },

  // --- CONTRACTS ---
  {
    id: 'q_cont_1',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: 'What is the standard grace period for premium payments in long-term life insurance policies under Vietnamese law?',
    question_vn: 'Thời gian gia hạn nộp phí bảo hiểm tiêu chuẩn đối với hợp đồng nhân thọ dài hạn theo luật Việt Nam là bao lâu?',
    options_en: ['30 days', '45 days', '60 days', '90 days'],
    options_vn: ['30 ngày', '45 ngày', '60 ngày', '90 ngày'],
    correct_index: 2,
    explanation_en: 'The Law on Insurance Business mandates a minimum grace period of 60 days for periodic premium payments. During this period, the contract remains in force.',
    explanation_vn: 'Luật Kinh doanh bảo hiểm quy định thời gian gia hạn đóng phí tối thiểu là 60 ngày đối với các khoản phí đóng định kỳ. Trong thời gian này hợp đồng vẫn có hiệu lực.'
  },
  {
    id: 'q_cont_2',
    topic: 'mcq',
    difficulty: 'advanced',
    question_en: 'If a policyholder intentionally conceals a serious medical condition when applying for life insurance, what can the insurer do?',
    question_vn: 'Nếu bên mua bảo hiểm cố ý che giấu tình trạng bệnh lý nghiêm trọng khi nộp hồ sơ bảo hiểm, doanh nghiệp bảo hiểm có quyền làm gì?',
    options_en: [
      'Unilaterally terminate the contract and deny any claim',
      'Increase the premium retroactively and pay the full claim',
      'Fine the policyholder double the premium amount',
      'Nothing, because the contract was already signed'
    ],
    options_vn: [
      'Đơn phương đình chỉ thực hiện hợp đồng và từ chối bồi thường/chi trả',
      'Tăng phí bảo hiểm hồi tố và chi trả toàn bộ số tiền bảo hiểm',
      'Phạt bên mua bảo hiểm gấp đôi số phí bảo hiểm',
      'Không được làm gì, vì hợp đồng đã được ký kết thành công'
    ],
    correct_index: 0,
    explanation_en: 'Intentional non-disclosure violates the Principle of Utmost Good Faith. Under Article 22 of the Law on Insurance Business, the insurer has the right to unilaterally terminate the contract and withhold claims.',
    explanation_vn: 'Cố ý che giấu thông tin vi phạm Nguyên tắc Trung thực tuyệt đối. Theo Luật Kinh doanh bảo hiểm, doanh nghiệp có quyền đơn phương chấm dứt hợp đồng và từ chối chi trả.'
  },
  {
    id: 'q_cont_3',
    topic: 'tf',
    difficulty: 'intermediate',
    question_en: 'True or False: Policyholders have a 21-day "free look" period to cancel their life insurance policies and receive a full premium refund.',
    question_vn: 'Đúng hay Sai: Bên mua bảo hiểm có 21 ngày "cân nhắc" để hủy hợp đồng nhân thọ và nhận lại toàn bộ phí bảo hiểm đã đóng.',
    options_en: ['True', 'False'],
    options_vn: ['Đúng', 'Sai'],
    correct_index: 0,
    explanation_en: 'True. For life insurance policies with terms of over 1 year, the policyholder has 21 days from receipt of the policy documents to change their mind and cancel for a full refund (minus medical check costs).',
    explanation_vn: 'Đúng. Đối với hợp đồng bảo hiểm nhân thọ có thời hạn trên 1 năm, bên mua có 21 ngày kể từ ngày nhận được bàn giao hợp đồng để cân nhắc hủy bỏ và nhận lại phí (trừ chi phí kiểm tra sức khỏe nếu có).'
  },
  {
    id: 'q_cont_4',
    topic: 'fitb',
    difficulty: 'advanced',
    question_en: 'If an insurance contract has ambiguous terms, the law states that they must be interpreted in favor of the...',
    question_vn: 'Nếu hợp đồng bảo hiểm có điều khoản không rõ ràng thì điều khoản đó được giải thích theo hướng có lợi cho...',
    correct_answer: 'policyholder',
    correct_answer_vn: 'bên mua bảo hiểm',
    explanation_en: 'Because insurance contracts are contracts of adhesion (standard forms drafted by the insurer), any ambiguity is legally interpreted in favor of the policyholder/insured.',
    explanation_vn: 'Vì hợp đồng bảo hiểm là hợp đồng gia nhập (soạn sẵn bởi doanh nghiệp), mọi sự không rõ ràng sẽ được giải thích có lợi cho bên mua bảo hiểm/người được bảo hiểm.'
  },

  // --- REGULATIONS ---
  {
    id: 'q_reg_1',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'beginner',
    question_en: 'Which state agency is responsible for licensing and supervising insurance companies in Vietnam?',
    question_vn: 'Cơ quan nhà nước nào chịu trách nhiệm cấp phép và giám sát các doanh nghiệp bảo hiểm tại Việt Nam?',
    options_en: [
      'The Ministry of Industry and Trade (MOIT)',
      'The Ministry of Finance (MOF)',
      'The State Bank of Vietnam (SBV)',
      'The Ministry of Planning and Investment (MPI)'
    ],
    options_vn: [
      'Bộ Công Thương',
      'Bộ Tài chính',
      'Ngân hàng Nhà nước Việt Nam',
      'Bộ Kế hoạch và Đầu tư'
    ],
    correct_index: 1,
    explanation_en: 'The Ministry of Finance (MOF) acts as the state administrator of the insurance market in Vietnam, managing license approvals, solvencies, and agent systems.',
    explanation_vn: 'Bộ Tài chính đóng vai trò quản lý nhà nước về thị trường bảo hiểm tại Việt Nam, cấp phép thành lập, kiểm tra biên khả năng thanh toán và quản lý hệ thống chứng chỉ đại lý.'
  },
  {
    id: 'q_reg_2',
    topic: 'mcq',
    difficulty: 'intermediate',
    question_en: 'What is the minimum age required for an individual to sign an agency contract and practice as an insurance agent in Vietnam?',
    question_vn: 'Độ tuổi tối thiểu bắt buộc đối với cá nhân ký hợp đồng đại lý và hoạt động đại lý bảo hiểm tại Việt Nam là bao nhiêu?',
    options_en: ['16 years old', '18 years old', '20 years old', '21 years old'],
    options_vn: ['16 tuổi', '18 tuổi', '20 tuổi', '21 tuổi'],
    correct_index: 1,
    explanation_en: 'Under Vietnamese law, an insurance agent must have full civil capacity and be at least 18 years old.',
    explanation_vn: 'Theo quy định của pháp luật Việt Nam, cá nhân hoạt động đại lý bảo hiểm phải có năng lực hành vi dân sự đầy đủ và từ đủ 18 tuổi trở lên.'
  },
  {
    id: 'q_reg_3',
    topic: 'tf',
    difficulty: 'intermediate',
    question_en: 'True or False: An insurance agent is legally permitted to give part of their commission back to the customer as a rebate or discount to sign the contract.',
    question_vn: 'Đúng hay Sai: Đại lý bảo hiểm được phép chiết khấu hoặc trả lại một phần hoa hồng cho khách hàng để thuyết phục họ ký hợp đồng.',
    options_en: ['True', 'False'],
    options_vn: ['Đúng', 'Sai'],
    correct_index: 1,
    explanation_en: 'False. It is strictly prohibited for agents to offer premium rebates, commissions, or other unauthorized financial benefits to entice clients under Article 125 of the Law on Insurance Business.',
    explanation_vn: 'Sai. Đại lý bảo hiểm bị cấm hứa hẹn giảm phí, chiết khấu hoa hồng hoặc các lợi ích tài chính không được doanh nghiệp cho phép theo Điều 125 Luật Kinh doanh bảo hiểm.'
  },
  {
    id: 'q_reg_4',
    topic: 'fitb',
    difficulty: 'advanced',
    question_en: 'The document issued by the Ministry of Finance certifying that an agent has passed the professional exam is the insurance agent...',
    question_vn: 'Văn bằng do Bộ Tài chính cấp chứng nhận đại lý đã thi đạt kỳ thi chuyên môn được gọi là...',
    correct_answer: 'certificate',
    correct_answer_vn: 'chứng chỉ đại lý bảo hiểm',
    explanation_en: 'An agent must possess a valid Insurance Agent Certificate to practice.',
    explanation_vn: 'Đại lý phải sở hữu Chứng chỉ đại lý bảo hiểm hợp lệ do cơ sở đào tạo được Bộ Tài chính chấp thuận cấp để hành nghề.'
  }
];

// List of client names and values for dynamic question template randomization
const mockNames = ['An', 'Bình', 'Chi', 'Dũng', 'Hương', 'Nam', 'Trang', 'Tuấn', 'Yến'];
const mockCompanies = ['Pằng Chíu Life', 'Đại Dương Bảo Việt', 'Dai-ichi Á', 'Prudential Á', 'Manulife Á'];

/**
 * Generates a randomized variation of a question based on static templates
 */
export function generateDynamicQuestion(topic, difficulty) {
  // Filter questions matching topic
  const pool = questionBank.filter(q => q.topic === topic);
  if (pool.length === 0) {
    // fallback if no matching topic
    return questionBank[Math.floor(Math.random() * questionBank.length)];
  }

  // Grab a random question from the pool
  const base = pool[Math.floor(Math.random() * pool.length)];
  
  // Clone the question to avoid modifying the static bank
  const q = JSON.parse(JSON.stringify(base));

  // Perform dynamic randomization based on the ID to change names or values
  const randomName1 = mockNames[Math.floor(Math.random() * mockNames.length)];
  const randomName2 = mockNames.filter(n => n !== randomName1)[Math.floor(Math.random() * (mockNames.length - 1))];
  const randomCompany = mockCompanies[Math.floor(Math.random() * mockCompanies.length)];

  if (q.id === 'q_cont_2') {
    // Change names in question to create dynamic scenario
    q.question_en = `If a policyholder named ${randomName1} intentionally conceals a serious medical condition when applying for life insurance at ${randomCompany}, what can the insurer do?`;
    q.question_vn = `Nếu khách hàng tên là ${randomName1} cố ý che giấu tình trạng bệnh lý nghiêm trọng khi nộp hồ sơ bảo hiểm tại doanh nghiệp ${randomCompany}, doanh nghiệp có quyền làm gì?`;
  } else if (q.id === 'q_cont_3') {
    q.question_en = `True or False: After ${randomName1} receives the policy kit for a 15-year endowment product, they have a 21-day "free look" period to cancel and get a full refund.`;
    q.question_vn = `Đúng hay Sai: Sau khi anh/chị ${randomName1} nhận bàn giao hợp đồng bảo hiểm hỗn hợp 15 năm, họ có 21 ngày "cân nhắc" để hủy và được nhận lại toàn bộ phí.`;
  } else if (q.id === 'q_fund_3') {
    q.question_en = `True or False: Under the principle of insurable interest, ${randomName1} can buy a life insurance policy for ${randomName2} who is a total stranger.`;
    q.question_vn = `Đúng hay Sai: Theo nguyên tắc quyền lợi có thể được bảo hiểm, ${randomName1} có thể mua bảo hiểm nhân thọ cho ${randomName2} là một người hoàn toàn xa lạ.`;
  }

  // Ensure it has a random key to force re-render/new session in client
  q.session_key = `${q.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  return q;
}

/**
 * Attempts to fetch a custom question from Ollama running Llama
 * Falls back to local generated question on failure
 */
export async function generateLlamaQuestion(topic, difficulty, ollamaUrl = 'http://localhost:11434') {
  try {
    const systemPrompt = `You are a professional examiner creating questions for the Vietnam Ministry of Finance (MOF) Insurance Agent Certificate Exam. 
Generate ONE exam question on the topic: "${topic}" with difficulty: "${difficulty}". 
You must respond in STRICT JSON format with no markdown tags around it, no trailing commas, and matching this schema:
{
  "id": "llama_gen_${Math.floor(Math.random() * 10000)}",
  "topic": "${topic}",
  "type": "mcq",
  "difficulty": "${difficulty}",
  "question_en": "Question text in English",
  "question_vn": "Question text in Vietnamese",
  "options_en": ["Option A", "Option B", "Option C", "Option D"],
  "options_vn": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
  "correct_index": 0,
  "explanation_en": "Explanation of correct answer in English",
  "explanation_vn": "Giải thích chi tiết bằng tiếng Việt"
}
Ensure the question is factually accurate according to the Vietnam Law on Insurance Business 2022. Include Vietnamese names in scenarios. Do not include markdown codeblocks (\`\`\`) in your response. Output raw JSON.`;

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3', // or 'llama3.1' or whatever model is loaded
        prompt: systemPrompt,
        stream: false,
        options: { temperature: 0.7 }
      })
    });

    if (!response.ok) throw new Error('Ollama connection failed');

    const data = await response.json();
    let text = data.response.trim();
    
    // Clean up possible markdown code wrapper if Llama ignored instructions
    if (text.startsWith('```')) {
      text = text.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
    }

    const generatedQuestion = JSON.parse(text);
    // basic validation
    if (generatedQuestion.question_en && generatedQuestion.options_en && generatedQuestion.correct_index !== undefined) {
      generatedQuestion.session_key = `llama_${Date.now()}`;
      return generatedQuestion;
    }
    
    throw new Error('Llama returned invalid question format');
  } catch (err) {
    console.warn('Llama generation failed, falling back to local database. Error:', err.message);
    return generateDynamicQuestion(topic, difficulty);
  }
}
