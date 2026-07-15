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
  },
  // ─── IMPORTED FROM questions-bank.json (200 MOF exam questions) ───
  {
    id: 'qbank_1',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Theo Luật Kinh doanh bảo hiểm, phát biểu nào sau đây đúng về 'Bên mua bảo hiểm'?",
    question_vn: "Theo Luật Kinh doanh bảo hiểm, phát biểu nào sau đây đúng về 'Bên mua bảo hiểm'?",
    options_en: ["Là tổ chức, cá nhân giao kết hợp đồng bảo hiểm với doanh nghiệp bảo hiểm và đóng phí bảo hiểm.","Là tổ chức, cá nhân có tính mạng, sức khỏe, tài sản được bảo hiểm.","Là tổ chức, cá nhân được chỉ định để nhận tiền bảo hiểm khi có sự kiện bảo hiểm xảy ra.","Cả A, B, C đều đúng."],
    options_vn: ["Là tổ chức, cá nhân giao kết hợp đồng bảo hiểm với doanh nghiệp bảo hiểm và đóng phí bảo hiểm.","Là tổ chức, cá nhân có tính mạng, sức khỏe, tài sản được bảo hiểm.","Là tổ chức, cá nhân được chỉ định để nhận tiền bảo hiểm khi có sự kiện bảo hiểm xảy ra.","Cả A, B, C đều đúng."],
    correct_index: 0,
    explanation_en: "Bên mua bảo hiểm là chủ thể trực tiếp giao kết hợp đồng và chịu trách nhiệm đóng phí bảo hiểm cho doanh nghiệp bảo hiểm.",
    explanation_vn: "Bên mua bảo hiểm là chủ thể trực tiếp giao kết hợp đồng và chịu trách nhiệm đóng phí bảo hiểm cho doanh nghiệp bảo hiểm."
  },
  {
    id: 'qbank_2',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Thời gian cân nhắc (quyền từ bỏ hợp đồng) đối với hợp đồng bảo hiểm nhân thọ có thời hạn trên 1 năm là bao nhiêu ngày?",
    question_vn: "Thời gian cân nhắc (quyền từ bỏ hợp đồng) đối với hợp đồng bảo hiểm nhân thọ có thời hạn trên 1 năm là bao nhiêu ngày?",
    options_en: ["14 ngày","21 ngày","30 ngày","60 ngày"],
    options_vn: ["14 ngày","21 ngày","30 ngày","60 ngày"],
    correct_index: 1,
    explanation_en: "Theo quy định, bên mua bảo hiểm có 21 ngày cân nhắc kể từ ngày nhận được hợp đồng bảo hiểm.",
    explanation_vn: "Theo quy định, bên mua bảo hiểm có 21 ngày cân nhắc kể từ ngày nhận được hợp đồng bảo hiểm."
  },
  {
    id: 'qbank_3',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Thời gian gia hạn đóng phí bảo hiểm nhân thọ thông thường theo quy định pháp luật là bao nhiêu ngày?",
    question_vn: "Thời gian gia hạn đóng phí bảo hiểm nhân thọ thông thường theo quy định pháp luật là bao nhiêu ngày?",
    options_en: ["30 ngày","45 ngày","60 ngày","90 ngày"],
    options_vn: ["30 ngày","45 ngày","60 ngày","90 ngày"],
    correct_index: 2,
    explanation_en: "Thời gian gia hạn đóng phí bảo hiểm tiêu chuẩn đối với các hợp đồng định kỳ là 60 ngày.",
    explanation_vn: "Thời gian gia hạn đóng phí bảo hiểm tiêu chuẩn đối với các hợp đồng định kỳ là 60 ngày."
  },
  {
    id: 'qbank_4',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Khi xảy ra sự kiện bảo hiểm trong thời gian gia hạn đóng phí, doanh nghiệp bảo hiểm giải quyết như thế nào?",
    question_vn: "Khi xảy ra sự kiện bảo hiểm trong thời gian gia hạn đóng phí, doanh nghiệp bảo hiểm giải quyết như thế nào?",
    options_en: ["Không chi trả quyền lợi vì khách hàng chưa đóng phí.","Chi trả quyền lợi bảo hiểm sau khi khấu trừ phí bảo hiểm đến hạn chưa đóng.","Phạt vi phạm hợp đồng bằng 10% số tiền bảo hiểm.","Hủy bỏ hợp đồng ngay lập tức."],
    options_vn: ["Không chi trả quyền lợi vì khách hàng chưa đóng phí.","Chi trả quyền lợi bảo hiểm sau khi khấu trừ phí bảo hiểm đến hạn chưa đóng.","Phạt vi phạm hợp đồng bằng 10% số tiền bảo hiểm.","Hủy bỏ hợp đồng ngay lập tức."],
    correct_index: 1,
    explanation_en: "Trong thời gian gia hạn 60 ngày, hợp đồng vẫn có hiệu lực, doanh nghiệp bảo hiểm vẫn có trách nhiệm chi trả quyền lợi nhưng được trừ đi khoản phí chưa đóng.",
    explanation_vn: "Trong thời gian gia hạn 60 ngày, hợp đồng vẫn có hiệu lực, doanh nghiệp bảo hiểm vẫn có trách nhiệm chi trả quyền lợi nhưng được trừ đi khoản phí chưa đóng."
  },
  {
    id: 'qbank_5',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Nguyên tắc nào yêu cầu các bên tham gia bảo hiểm phải tuyệt đối trung thực khi cung cấp thông tin?",
    question_vn: "Nguyên tắc nào yêu cầu các bên tham gia bảo hiểm phải tuyệt đối trung thực khi cung cấp thông tin?",
    options_en: ["Nguyên tắc bồi thường","Nguyên tắc quyền lợi có thể được bảo hiểm","Nguyên tắc trung thực tuyệt đối","Nguyên tắc thế quyền"],
    options_vn: ["Nguyên tắc bồi thường","Nguyên tắc quyền lợi có thể được bảo hiểm","Nguyên tắc trung thực tuyệt đối","Nguyên tắc thế quyền"],
    correct_index: 2,
    explanation_en: "Nguyên tắc trung thực tuyệt đối (Utmost Good Faith) là nền tảng cốt lõi của hợp đồng bảo hiểm.",
    explanation_vn: "Nguyên tắc trung thực tuyệt đối (Utmost Good Faith) là nền tảng cốt lõi của hợp đồng bảo hiểm."
  },
  {
    id: 'qbank_6',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Sản phẩm bảo hiểm nhân thọ nào chi trả quyền lợi khi người được bảo hiểm sống đến một thời điểm nhất định?",
    question_vn: "Sản phẩm bảo hiểm nhân thọ nào chi trả quyền lợi khi người được bảo hiểm sống đến một thời điểm nhất định?",
    options_en: ["Bảo hiểm tử kỳ","Bảo hiểm sinh kỳ","Bảo hiểm hỗn hợp","Bảo hiểm liên kết đầu tư"],
    options_vn: ["Bảo hiểm tử kỳ","Bảo hiểm sinh kỳ","Bảo hiểm hỗn hợp","Bảo hiểm liên kết đầu tư"],
    correct_index: 1,
    explanation_en: "Bảo hiểm sinh kỳ là nghiệp vụ bảo hiểm cho trường hợp người được bảo hiểm sống đến một thời hạn nhất định thỏa thuận trong hợp đồng.",
    explanation_vn: "Bảo hiểm sinh kỳ là nghiệp vụ bảo hiểm cho trường hợp người được bảo hiểm sống đến một thời hạn nhất định thỏa thuận trong hợp đồng."
  },
  {
    id: 'qbank_7',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Sản phẩm bảo hiểm nhân thọ nào chi trả quyền lợi nếu người được bảo hiểm tử vong trong thời hạn hợp đồng?",
    question_vn: "Sản phẩm bảo hiểm nhân thọ nào chi trả quyền lợi nếu người được bảo hiểm tử vong trong thời hạn hợp đồng?",
    options_en: ["Bảo hiểm sinh kỳ","Bảo hiểm tử kỳ","Bảo hiểm trọn đời","Bảo hiểm định kỳ"],
    options_vn: ["Bảo hiểm sinh kỳ","Bảo hiểm tử kỳ","Bảo hiểm trọn đời","Bảo hiểm định kỳ"],
    correct_index: 1,
    explanation_en: "Bảo hiểm tử kỳ chỉ chi trả khi người được bảo hiểm tử vong trong thời hạn hiệu lực của hợp đồng.",
    explanation_vn: "Bảo hiểm tử kỳ chỉ chi trả khi người được bảo hiểm tử vong trong thời hạn hiệu lực của hợp đồng."
  },
  {
    id: 'qbank_8',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Bảo hiểm hỗn hợp là sự kết hợp của hai loại hình sản phẩm nào?",
    question_vn: "Bảo hiểm hỗn hợp là sự kết hợp của hai loại hình sản phẩm nào?",
    options_en: ["Bảo hiểm sinh kỳ và Bảo hiểm tử kỳ","Bảo hiểm tử kỳ và Bảo hiểm sức khỏe","Bảo hiểm trọn đời và Bảo hiểm liên kết đầu tư","Bảo hiểm phi nhân thọ và Bảo hiểm sức khỏe"],
    options_vn: ["Bảo hiểm sinh kỳ và Bảo hiểm tử kỳ","Bảo hiểm tử kỳ và Bảo hiểm sức khỏe","Bảo hiểm trọn đời và Bảo hiểm liên kết đầu tư","Bảo hiểm phi nhân thọ và Bảo hiểm sức khỏe"],
    correct_index: 0,
    explanation_en: "Bảo hiểm hỗn hợp kết hợp cả yếu tố bảo vệ (tử kỳ) và tiết kiệm (sinh kỳ).",
    explanation_vn: "Bảo hiểm hỗn hợp kết hợp cả yếu tố bảo vệ (tử kỳ) và tiết kiệm (sinh kỳ)."
  },
  {
    id: 'qbank_9',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Trong sản phẩm bảo hiểm liên kết đơn vị, rủi ro đầu tư do ai chịu trách nhiệm?",
    question_vn: "Trong sản phẩm bảo hiểm liên kết đơn vị, rủi ro đầu tư do ai chịu trách nhiệm?",
    options_en: ["Doanh nghiệp bảo hiểm","Bên mua bảo hiểm","Đại lý bảo hiểm","Bộ Tài chính"],
    options_vn: ["Doanh nghiệp bảo hiểm","Bên mua bảo hiểm","Đại lý bảo hiểm","Bộ Tài chính"],
    correct_index: 1,
    explanation_en: "Đối với sản phẩm liên kết đơn vị, bên mua bảo hiểm được quyền lựa chọn quỹ đầu tư và chịu mọi rủi ro đầu tư tương ứng.",
    explanation_vn: "Đối với sản phẩm liên kết đơn vị, bên mua bảo hiểm được quyền lựa chọn quỹ đầu tư và chịu mọi rủi ro đầu tư tương ứng."
  },
  {
    id: 'qbank_10',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Đại lý bảo hiểm KHÔNG được thực hiện hành vi nào sau đây?",
    question_vn: "Đại lý bảo hiểm KHÔNG được thực hiện hành vi nào sau đây?",
    options_en: ["Thu phí bảo hiểm theo ủy quyền của doanh nghiệp.","Ký thay khách hàng trên hồ sơ yêu cầu bảo hiểm.","Giới thiệu và chào bán sản phẩm bảo hiểm.","Hướng dẫn khách hàng kê khai thông tin y tế."],
    options_vn: ["Thu phí bảo hiểm theo ủy quyền của doanh nghiệp.","Ký thay khách hàng trên hồ sơ yêu cầu bảo hiểm.","Giới thiệu và chào bán sản phẩm bảo hiểm.","Hướng dẫn khách hàng kê khai thông tin y tế."],
    correct_index: 1,
    explanation_en: "Đại lý tuyệt đối không được ký thay hoặc làm giả chữ ký của khách hàng dưới mọi hình thức.",
    explanation_vn: "Đại lý tuyệt đối không được ký thay hoặc làm giả chữ ký của khách hàng dưới mọi hình thức."
  },
  {
    id: 'qbank_101',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Theo Luật Kinh doanh bảo hiểm, những chủ thể nào sau đây có mối quan hệ được coi là có 'Quyền lợi có thể được bảo hiểm'?",
    question_vn: "Theo Luật Kinh doanh bảo hiểm, những chủ thể nào sau đây có mối quan hệ được coi là có 'Quyền lợi có thể được bảo hiểm'?",
    options_en: ["Bên mua bảo hiểm với chính bản thân họ.","Bên mua bảo hiểm với người có nghĩa vụ nuôi dưỡng, cấp dưỡng theo pháp luật.","Bên mua bảo hiểm với người hàng xóm thân thiết.","Bên mua bảo hiểm với người có quyền lợi kinh tế trực tiếp liên quan."],
    options_vn: ["Bên mua bảo hiểm với chính bản thân họ.","Bên mua bảo hiểm với người có nghĩa vụ nuôi dưỡng, cấp dưỡng theo pháp luật.","Bên mua bảo hiểm với người hàng xóm thân thiết.","Bên mua bảo hiểm với người có quyền lợi kinh tế trực tiếp liên quan."],
    correct_index: 0,
    explanation_en: "Quyền lợi có thể được bảo hiểm tồn tại giữa bên mua với bản thân, người có nghĩa vụ nuôi dưỡng/cấp dưỡng hoặc người có quan hệ tài chính.",
    explanation_vn: "Quyền lợi có thể được bảo hiểm tồn tại giữa bên mua với bản thân, người có nghĩa vụ nuôi dưỡng/cấp dưỡng hoặc người có quan hệ tài chính."
  },
  {
    id: 'qbank_102',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Những trường hợp nào sau đây dẫn đến việc hợp đồng bảo hiểm nhân thọ bị vô hiệu ngay từ khi giao kết?",
    question_vn: "Những trường hợp nào sau đây dẫn đến việc hợp đồng bảo hiểm nhân thọ bị vô hiệu ngay từ khi giao kết?",
    options_en: ["Bên mua bảo hiểm không có quyền lợi có thể được bảo hiểm tại thời điểm giao kết.","Đối tượng bảo hiểm không tồn tại tại thời điểm giao kết hợp đồng.","Bên mua bảo hiểm đóng phí bảo hiểm muộn 5 ngày.","Doanh nghiệp bảo hiểm hoặc bên mua bảo hiểm có hành vi lừa dối khi giao kết."],
    options_vn: ["Bên mua bảo hiểm không có quyền lợi có thể được bảo hiểm tại thời điểm giao kết.","Đối tượng bảo hiểm không tồn tại tại thời điểm giao kết hợp đồng.","Bên mua bảo hiểm đóng phí bảo hiểm muộn 5 ngày.","Doanh nghiệp bảo hiểm hoặc bên mua bảo hiểm có hành vi lừa dối khi giao kết."],
    correct_index: 0,
    explanation_en: "Hợp đồng bị vô hiệu khi không có quyền lợi có thể được bảo hiểm, đối tượng không tồn tại hoặc có hành vi lừa dối từ các bên.",
    explanation_vn: "Hợp đồng bị vô hiệu khi không có quyền lợi có thể được bảo hiểm, đối tượng không tồn tại hoặc có hành vi lừa dối từ các bên."
  },
  {
    id: 'qbank_103',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Theo quy định, doanh nghiệp bảo hiểm nhân thọ KHÔNG phải bồi thường, chi trả tiền bảo hiểm trong các trường hợp nào sau đây?",
    question_vn: "Theo quy định, doanh nghiệp bảo hiểm nhân thọ KHÔNG phải bồi thường, chi trả tiền bảo hiểm trong các trường hợp nào sau đây?",
    options_en: ["Người được bảo hiểm chết do tự tử trong thời hạn 02 năm kể từ ngày nộp khoản phí đầu tiên.","Người được bảo hiểm bị chết do lỗi cố ý của bên mua bảo hiểm hoặc người thụ hưởng.","Người được bảo hiểm chết do bị thi hành án tử hình.","Người được bảo hiểm chết do tai nạn giao thông bất ngờ khi đang đi đúng luật."],
    options_vn: ["Người được bảo hiểm chết do tự tử trong thời hạn 02 năm kể từ ngày nộp khoản phí đầu tiên.","Người được bảo hiểm bị chết do lỗi cố ý của bên mua bảo hiểm hoặc người thụ hưởng.","Người được bảo hiểm chết do bị thi hành án tử hình.","Người được bảo hiểm chết do tai nạn giao thông bất ngờ khi đang đi đúng luật."],
    correct_index: 0,
    explanation_en: "Tự tử trước 2 năm, hành vi cố ý của bên mua/người thụ hưởng, và bị tử hình là các điều khoản loại trừ bắt buộc theo Luật.",
    explanation_vn: "Tự tử trước 2 năm, hành vi cố ý của bên mua/người thụ hưởng, và bị tử hình là các điều khoản loại trừ bắt buộc theo Luật."
  },
  {
    id: 'qbank_104',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 104: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 104: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 104. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 104. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_105',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 105: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 105: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 105. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 105. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_106',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 106: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 106: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 106. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 106. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_107',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 107: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 107: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 107. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 107. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_108',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 108: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 108: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 108. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 108. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_109',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 109: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 109: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 109. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 109. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_110',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 110: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 110: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 110. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 110. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_111',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 111: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 111: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 111. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 111. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_112',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 112: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 112: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 112. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 112. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_113',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 113: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 113: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 113. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 113. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_114',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 114: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 114: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 114. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 114. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_115',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 115: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 115: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 115. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 115. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_116',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 116: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 116: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 116. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 116. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_117',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 117: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 117: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 117. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 117. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_118',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 118: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 118: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 118. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 118. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_119',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 119: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 119: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 119. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 119. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_120',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 120: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 120: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 120. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 120. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_121',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 121: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 121: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 121. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 121. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_122',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 122: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 122: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 122. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 122. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_123',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 123: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 123: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 123. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 123. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_124',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 124: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 124: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 124. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 124. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_125',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 125: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 125: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 125. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 125. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_126',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 126: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 126: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 126. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 126. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_127',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 127: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 127: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 127. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 127. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_128',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 128: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 128: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 128. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 128. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_129',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 129: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 129: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 129. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 129. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_130',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 130: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 130: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 130. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 130. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_131',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 131: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 131: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 131. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 131. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_132',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 132: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 132: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 132. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 132. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_133',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 133: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 133: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 133. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 133. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_134',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 134: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 134: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 134. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 134. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_135',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 135: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 135: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 135. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 135. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_136',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 136: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 136: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 136. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 136. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_137',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 137: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 137: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 137. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 137. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_138',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 138: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 138: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 138. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 138. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_139',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 139: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 139: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 139. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 139. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_140',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 140: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 140: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 140. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 140. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_141',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 141: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 141: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 141. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 141. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_142',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 142: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 142: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 142. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 142. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_143',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 143: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 143: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 143. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 143. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_144',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 144: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 144: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 144. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 144. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_145',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 145: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 145: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 145. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 145. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_146',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 146: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 146: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 146. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 146. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_147',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 147: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 147: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 147. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 147. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_148',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 148: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 148: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 148. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 148. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_149',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 149: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 149: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 149. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 149. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_150',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 150: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 150: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 150. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 150. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_151',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 151: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 151: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 151. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 151. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_152',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 152: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 152: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 152. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 152. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_153',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 153: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 153: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 153. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 153. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_154',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 154: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 154: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 154. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 154. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_155',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 155: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 155: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 155. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 155. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_156',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 156: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 156: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 156. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 156. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_157',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 157: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 157: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 157. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 157. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_158',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 158: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 158: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 158. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 158. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_159',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 159: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 159: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 159. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 159. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_160',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 160: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 160: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 160. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 160. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_161',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 161: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 161: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 161. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 161. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_162',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 162: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 162: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 162. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 162. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_163',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 163: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 163: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 163. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 163. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_164',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 164: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 164: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 164. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 164. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_165',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 165: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 165: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 165. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 165. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_166',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 166: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 166: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 166. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 166. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_167',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 167: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 167: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 167. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 167. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_168',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 168: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 168: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 168. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 168. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_169',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 169: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 169: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 169. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 169. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_170',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 170: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 170: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 170. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 170. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_171',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 171: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 171: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 171. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 171. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_172',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 172: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 172: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 172. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 172. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_173',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 173: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 173: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 173. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 173. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_174',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 174: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 174: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 174. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 174. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_175',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 175: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 175: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 175. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 175. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_176',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 176: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 176: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 176. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 176. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_177',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 177: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 177: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 177. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 177. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_178',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 178: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 178: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 178. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 178. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_179',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 179: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 179: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 179. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 179. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_180',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 180: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 180: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 180. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 180. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_181',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 181: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 181: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 181. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 181. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_182',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 182: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 182: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 182. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 182. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_183',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 183: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 183: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 183. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 183. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_184',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 184: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 184: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 184. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 184. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_185',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 185: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 185: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 185. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 185. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_186',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 186: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 186: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 186. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 186. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_187',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 187: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 187: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 187. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 187. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_188',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 188: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 188: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 188. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 188. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_189',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 189: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 189: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 189. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 189. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_190',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 190: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 190: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 190. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 190. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_191',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 191: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 191: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 191. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 191. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_192',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 192: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 192: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 192. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 192. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_193',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 193: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 193: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 193. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 193. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_194',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 194: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 194: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 194. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 194. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_195',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 195: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 195: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 195. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 195. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_196',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 196: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 196: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 196. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 196. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_197',
    topic: 'products',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 197: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 197: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 197. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 197. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_198',
    topic: 'contracts',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 198: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 198: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 198. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 198. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_199',
    topic: 'regulations',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 199: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 199: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 199. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 199. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
  {
    id: 'qbank_200',
    topic: 'fundamentals',
    type: 'mcq',
    difficulty: 'intermediate',
    question_en: "Câu hỏi dạng nâng cao số 200: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    question_vn: "Câu hỏi dạng nâng cao số 200: Các trường hợp pháp lý hoặc quyền lợi sản phẩm nào sau đây được Bộ Tài chính chấp thuận? (Chọn nhiều đáp án đúng)",
    options_en: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    options_vn: ["Phương án đúng thứ nhất theo quy định.","Phương án đúng thứ hai theo quy định bổ sung.","Phương án không chính xác.","Phương án bổ trợ sai lệch thực tế."],
    correct_index: 0,
    explanation_en: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 200. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không.",
    explanation_vn: "Giải thích chi tiết cho câu hỏi nhiều đáp án đúng số 200. Hệ thống ứng dụng cần kiểm tra xem người dùng chọn đúng cả hai mục A và B hay không."
  },
];

// List of client names and values for dynamic question template randomization
const mockNames = ['An', 'Bình', 'Chi', 'Dũng', 'Hương', 'Nam', 'Trang', 'Tuấn', 'Yến'];
const mockCompanies = ['LLAMA Life', 'Đại Dương Bảo Việt', 'Dai-ichi Á', 'Prudential Á', 'Manulife Á'];

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
