import { createContext, useContext, useState, useEffect } from 'react';

const vi = {
  // Navigation
  navHome: 'Trang chủ',
  navQuiz: 'Đề thi',
  navFlashcards: 'Thẻ bài',
  navLeaderboard: 'Xếp hạng',
  navChat: 'Hỏi Llama',
  navSettings: 'Cài đặt',

  // Auth
  authTitle: 'LLAMA 🦙',
  authSubtitle: 'Đăng nhập để chiến nghiệm',
  loginTitle: 'LLAMA',
  registerTitle: 'LLAMA',
  tagline: 'Learning Like A Master Agent',
  usernameLabel: 'Tên đăng nhập',
  passwordLabel: 'Mật khẩu',
  loginBtn: 'Đăng nhập ngay',
  registerBtn: 'Tạo tài khoản',
  usernamePlaceholder: 'Tên chiến binh...',
  passwordPlaceholder: 'Mật mã bí mật...',
  loginToggle: 'Chưa có tài khoản? Tạo ngay! ⚡',
  registerToggle: 'Đã có tài khoản? Đăng nhập! 🚀',
  loginError: 'Oái, sai rồi! Thử lại nha.',

  // Dashboard
  welcomeLabel: 'Chào buổi sáng,',
  streakLabel: 'Chuỗi học',
  levelLabel: 'Cấp độ',
  lessonsTitle: 'Bài học 📚',
  progressLabel: 'Tiến độ:',
  lessonStartBtn: 'Học ngay',
  lessonCompletedBtn: 'Học lại',
  lockedBtn: 'Đang khóa 🔒',

  // Quiz
  quizTitle: 'Chiến Quiz',
  selectTopic: 'Chọn chủ đề',
  difficultyLabel: 'Mức độ khó',
  practiceMode: 'Luyện tập 🎯',
  examMode: 'Thi thử 🕒',
  startQuizBtn: 'Vào việc',
  submitAnswerBtn: 'Chốt đơn!',
  nextQuestionBtn: 'Tiếp tục',
  correctAnswerWas: 'Đáp án đúng:',
  explanationTitle: 'Giải thích nè:',
  quizCompleted: 'Hoàn thành!',
  xpEarned: 'Kinh nghiệm nhận được',
  comboBonus: 'Thưởng Combo',
  backToDashboard: 'Chọn chế độ khác',
  questionIndicator: 'Câu {current} / {total}',
  badge_streak_3: 'Hăng hái (3 ngày)',
  badge_streak_7: 'Chăm chỉ (7 ngày)',
  badge_first_lesson: 'Khởi đầu tốt',
  badge_topic_master: 'Bậc thầy',
  badge_pang_sniper: 'Tay bắn tỉa',
  badge_xp_1000: 'Đại gia XP',

  // Flashcards
  flashcardTitle: 'Thẻ Bài Ma Thuật',
  flipBtn: 'Lật xem',
  prevBtn: 'Quay lại',
  nextBtn: 'Kế tiếp',
  emptyState: 'Chưa có thẻ nào.',

  // Leaderboard
  leaderboardTitle: 'Bảng Xếp Hạng Xạ Thủ Techcom Life 🏆',
  leaderboardEmpty: 'Chưa có cao thủ nào xuất hiện.',

  // Chat
  chatTitle: 'Hỏi Llama Đại Lý 🦙',
  chatSubtitle: 'Hỏi gì cũng được, Llama tra tài liệu rồi trả lời liền!',
  chatPlaceholder: 'Hỏi về thời gian gia hạn, quyền lợi bảo hiểm...',
  chatSendBtn: 'Gửi',
  chatThinking: 'Llama đang suy nghĩ, bạn đợi chút nhé...',
  chatEmptyState: 'Chào bạn! Hỏi mình bất cứ điều gì về bảo hiểm nhé 🦙',
  knowledgeTitle: 'Tài liệu tham khảo',
  knowledgeSubtitle: 'Tải tài liệu lên để Llama trả lời chính xác hơn',
  knowledgeUploadFile: 'Tải file lên (PDF / TXT)',
  knowledgePasteText: 'Hoặc dán văn bản',
  knowledgePasteTitlePlaceholder: 'Tên tài liệu (không bắt buộc)',
  knowledgePasteTextPlaceholder: 'Dán nội dung tài liệu vào đây...',
  knowledgeSaveBtn: 'Lưu vào kho tài liệu',
  knowledgeEmptyState: 'Chưa có tài liệu nào. Tải lên để bắt đầu!',
  knowledgeDeleteBtn: 'Xóa',

  // Settings
  settingsTitle: 'Cài đặt',
  languageLabel: 'Ngôn ngữ',
  soundLabel: 'Âm thanh',
  connectionConfig: 'Cấu hình kết nối (Llama AI)',
  saveConfig: 'Lưu thay đổi',
  logout: 'Đăng xuất',

  // Learn
  learnTitle: 'Kiến Thức Cốt Lõi',
  lessonCompleted: 'Xuất sắc! Bạn đã xong bài này.',
  lessonFinishBtn: 'Hoàn thành bài học',
  tipLabel: 'Mẹo nhỏ 💡',

  // Path Selection
  pathSaveError: 'Lỗi lưu chứng chỉ!',
  pathHeading: 'Bạn đang luyện thi chứng chỉ nào?',
  pathSubheading: 'Hãy chọn mục tiêu học tập của bạn để Llama lên lộ trình phù hợp nhé!',
  pathComingSoon: 'Sắp ra mắt',
  pathSaving: 'Đang lưu...',
  pathChooseBtn: 'Chọn lộ trình 🚀',
  path_mof_title: 'Đại lý Cơ bản (MOF)',
  path_mof_desc: 'Chứng chỉ đại lý bảo hiểm nhân thọ cơ bản do Bộ Tài Chính cấp.',
  path_ul_title: 'Liên kết chung (UL)',
  path_ul_desc: 'Sản phẩm Bảo hiểm Liên kết chung (Universal Life).',
  path_ilp_title: 'Liên kết đầu tư (ILP)',
  path_ilp_desc: 'Sản phẩm Bảo hiểm Liên kết đầu tư (Investment-Linked).',

  // Dashboard climb section
  climbTitle: 'Llama cùng bạn tiến đến đỉnh {path}',
  climbSubtitle: 'Bấm vào từng trại để xem nội dung nhé!',

  // Leaderboard extras
  lbHeading: 'Đường Đua Llama',
  lbSubtitle: 'Ai chạy nhanh nhất tuần này? Cán đích để giành huy chương! 🥇',
  lbTabDaily: 'Hôm nay',
  lbTabWeekly: 'Tuần này',
  lbTabMonthly: 'Tháng này',
  lbLoading: 'Đang tải BXH...',
  lbLoadError: 'Lỗi tải BXH',
  lbYouBadge: 'Bạn',
  lbStreakLevel: '{streak} ngày · Lv {level}',

  // Settings extras
  settingsSaved: 'Đã lưu cài đặt!',
  soundEffectsLabel: 'Hiệu ứng âm thanh',
  soundEffectsDesc: 'Tắt để học trong tĩnh lặng',
  localLlmLabel: 'LLM Địa phương (Ollama)',

  // Learn extras
  learnDoneSubtext: 'Kinh nghiệm là tài sản lớn nhất của bạn.',
  understoodBtn: 'Đã hiểu',

  // Chat extras
  chatDocsLoadError: 'Lỗi tải danh sách tài liệu',
  chatReplyError: 'Llama không trả lời được, thử lại nhé',
  chatUploadError: 'Lỗi tải file',
  chatSaveDocError: 'Lỗi lưu tài liệu',
  chatDeleteDocError: 'Lỗi xóa tài liệu',
  chatWalkAlt: 'Llama đang đi dạo chờ bạn hỏi',
  chatDocsLoading: 'Đang tải...',
  chatChunkCount: '{count} đoạn',
  suggestedQuestions: [
    'Thời gian cân nhắc là gì?',
    'Bảo hiểm Tử kỳ là gì?',
    'Phân biệt BMBH và NĐBH?',
    '60 ngày gia hạn là sao?',
    'Điều kiện để làm đại lý bảo hiểm?',
    'Cho tôi mẹo nhớ các con số quan trọng'
  ],

  // Quiz extras
  quizChooseModeHeading: 'Chọn chế độ chiến!',
  quizChooseModeSubtitle: 'Luyện súng nhẹ nhàng hay thử lửa thi thật?',
  quizPracticeDesc: '5 câu, thoải mái xem giải thích',
  quizExamDesc: '40 câu • 60 phút • tính giờ nghiêm túc',
  quizPreparing: 'Đang chuẩn bị đạn...',
  quizHistoryBtn: '📜 Lịch sử thi thử',
  quizNoQuestions: 'Không có câu hỏi nào cho chủ đề này.',
  quizLoadError: 'Lỗi tải đề thi',
  quizSaveError: 'Lỗi lưu kết quả',
  quizPassMessage: 'ĐẠT RỒI! 🎉 Xạ thủ đúng chuẩn đại lý tương lai đây!',
  quizFailMessage: 'Chưa đủ 70% đâu nha, đừng buồn! Xạ thủ giỏi cỡ nào cũng từng bắn trượt trước khi trăm phát trăm trúng 💪',
  quizNewBadges: '🏅 Huy hiệu mới',
  quizComboIndicator: '🔥 Combo {combo}x',
  quizReadyTag: '🎯 Sẵn sàng bắn chưa?',
  quizCorrectAlt: 'Llama hoan hô vì bạn trả lời đúng',
  quizWrongAlt: 'Llama phun nước vào mặt vì bạn trả lời sai',
  quizSourceLabel: 'Nguồn: {source}',

  // Exam report
  tierWeak: 'Yếu',
  tierMid: 'Cần ôn thêm',
  tierStrong: 'Vững',
  reportTitle: '📊 Báo cáo học tập',
  reportCorrectCount: '✅ Đúng: {n} câu',
  reportWrongCount: '❌ Sai: {n} câu',
  reportStrengthChart: 'Lĩnh vực mạnh / yếu',
  reportRoadmapTitle: '🗺️ Lộ trình đề xuất',
  reportRoadmapEmpty: 'Không có lĩnh vực nào đáng lo cả! Ôn lại tổng quan một lượt trước khi thi thật là đủ rồi, xạ thủ ạ! 🎯',
  reportRoadmapHint: 'Bấm vào từng chương để vào Thẻ bài ôn lại nhé!',
  reportHideDetail: '▲ Ẩn báo cáo chi tiết',
  reportShowDetail: '📋 Xem báo cáo chi tiết từng câu',
  reportQuestionLabel: 'Câu {n}',
  reportYourCorrectAnswer: '✓ Bạn đã trả lời đúng: {answer}',
  reportYourWrongAnswer: '✕ Bạn chọn: {answer}',
  reportCorrectAnswer: '✓ Đáp án đúng: {answer}',
  reportExplanation: 'Giải thích',

  // Flashcards
  fcTopicsLoadError: 'Lỗi tải danh sách bộ thẻ',
  fcCardsLoadError: 'Lỗi tải thẻ bài',
  fcDeckTitle: 'Thẻ ghi nhớ',
  fcChooseTopic: 'Chọn một chủ đề để bắt đầu ôn nhé!',
  fcLoadingDecks: 'Đang tải bộ thẻ...',
  fcRandomMix: 'Ngẫu nhiên tổng hợp',
  fcCardsStudied: '{known}/{total} thẻ đã học',
  fcDrawingCards: 'Đang rút bài...',
  fcBackToTopics: '← Chủ đề',
  fcTapToFlip: '👆 Chạm để xem đáp án',
  fcTapHint: 'Chạm vào thẻ để lật, rồi cho Llama biết bạn có nhớ không nhé!',
  fcNotKnownBtn: '😓 Chưa nhớ',
  fcKnownBtn: '✅ Đã nhớ',
  fcDeckDone: 'Xong bộ thẻ rồi! 🎉',
  fcProudMessage: 'Llama tự hào về bạn lắm đó!',
  fcKnownLabel: 'Đã nhớ',
  fcNotKnownLabel: 'Chưa nhớ',
  fcAnotherTopicBtn: 'Chủ đề khác',
  fcRestartBtn: 'Ôn lại lần nữa 🔁',

  // Quiz history
  historyLoadError: 'Lỗi tải lịch sử',
  historyDetailLoadError: 'Lỗi tải chi tiết',
  historyBackBtn: 'Quay lại lịch sử',
  historyLoading: 'Đang tải...',
  historyEmpty: 'Chưa có lượt thi thử nào. Vào trận đầu tiên thôi! 🚀',
  historyRow: '{score}/{total} câu · +{xp} XP',
  historyPassed: 'ĐẠT',
  historyFailed: 'CHƯA ĐẠT',

  // Lesson path
  campBase: 'Trại Nền',
  campSummit: 'Đỉnh MOF',
  campNumbered: 'Trại {n}',
  campStartHere: 'Bắt đầu ở đây 👇',
  campLockedMessage: '🔒 Trại này đang khóa. Hoàn thành trại trước đó để mở đường lên đây nhé!',
  campCardsIn: 'Trong trại này ({n} thẻ):',
  campCloseBtn: 'Đóng',
  campStartBtn: 'Bắt đầu 🎯'
};

const en = {
  // Navigation
  navHome: 'Home',
  navQuiz: 'Quiz',
  navFlashcards: 'Flashcards',
  navLeaderboard: 'Leaderboard',
  navChat: 'Ask Llama',
  navSettings: 'Settings',

  // Auth
  authTitle: 'LLAMA 🦙',
  authSubtitle: 'Log in and start your streak',
  loginTitle: 'LLAMA',
  registerTitle: 'LLAMA',
  tagline: 'Learning Like A Master Agent',
  usernameLabel: 'Username',
  passwordLabel: 'Password',
  loginBtn: 'Log In',
  registerBtn: 'Create Account',
  usernamePlaceholder: 'agent_007',
  passwordPlaceholder: 'Secret password...',
  loginToggle: "Don't have an account? Sign up! ⚡",
  registerToggle: 'Already have an account? Log in! 🚀',
  loginError: "Oops, that's wrong! Try again.",

  // Dashboard
  welcomeLabel: 'Good morning,',
  streakLabel: 'Streak',
  levelLabel: 'Level',
  lessonsTitle: 'Lessons 📚',
  progressLabel: 'Progress:',
  lessonStartBtn: 'Start Learning',
  lessonCompletedBtn: 'Review Again',
  lockedBtn: 'Locked 🔒',

  // Quiz
  quizTitle: 'Quiz Battle',
  selectTopic: 'Choose a Topic',
  difficultyLabel: 'Difficulty',
  practiceMode: 'Practice 🎯',
  examMode: 'Mock Exam 🕒',
  startQuizBtn: "Let's Go",
  submitAnswerBtn: 'Lock It In!',
  nextQuestionBtn: 'Continue',
  correctAnswerWas: 'Correct answer:',
  explanationTitle: "Here's why:",
  quizCompleted: 'Done!',
  xpEarned: 'XP Earned',
  comboBonus: 'Combo Bonus',
  backToDashboard: 'Choose Another Mode',
  questionIndicator: 'Question {current} / {total}',
  badge_streak_3: 'Fired Up (3 days)',
  badge_streak_7: 'Dedicated (7 days)',
  badge_first_lesson: 'Great Start',
  badge_topic_master: 'Master',
  badge_pang_sniper: 'Sharpshooter',
  badge_xp_1000: 'XP Tycoon',

  // Flashcards
  flashcardTitle: 'Magic Flashcards',
  flipBtn: 'Flip',
  prevBtn: 'Back',
  nextBtn: 'Next',
  emptyState: 'No flashcards yet.',

  // Leaderboard
  leaderboardTitle: 'Techcom Life Sharpshooter Leaderboard 🏆',
  leaderboardEmpty: 'No champions yet.',

  // Chat
  chatTitle: 'Ask Llama Agent 🦙',
  chatSubtitle: 'Ask anything — Llama digs through the docs and answers right away!',
  chatPlaceholder: 'Ask about grace periods, insurance benefits...',
  chatSendBtn: 'Send',
  chatThinking: 'Llama is thinking, hang tight...',
  chatEmptyState: 'Hey there! Ask me anything about insurance 🦙',
  knowledgeTitle: 'Reference Documents',
  knowledgeSubtitle: 'Upload documents so Llama can answer more accurately',
  knowledgeUploadFile: 'Upload File (PDF / TXT)',
  knowledgePasteText: 'Or paste text',
  knowledgePasteTitlePlaceholder: 'Document name (optional)',
  knowledgePasteTextPlaceholder: 'Paste document content here...',
  knowledgeSaveBtn: 'Save to Library',
  knowledgeEmptyState: 'No documents yet. Upload one to get started!',
  knowledgeDeleteBtn: 'Delete',

  // Settings
  settingsTitle: 'Settings',
  languageLabel: 'Language',
  soundLabel: 'Sound',
  connectionConfig: 'Connection Settings (Llama AI)',
  saveConfig: 'Save Changes',
  logout: 'Log Out',

  // Learn
  learnTitle: 'Core Knowledge',
  lessonCompleted: "Awesome! You've finished this lesson.",
  lessonFinishBtn: 'Complete Lesson',
  tipLabel: 'Quick Tip 💡',

  // Path Selection
  pathSaveError: 'Failed to save your track!',
  pathHeading: 'Which certificate are you studying for?',
  pathSubheading: "Pick your study goal so Llama can plan the right path for you!",
  pathComingSoon: 'Coming Soon',
  pathSaving: 'Saving...',
  pathChooseBtn: 'Choose This Path 🚀',
  path_mof_title: 'Basic Agent (MOF)',
  path_mof_desc: 'Basic life insurance agent certificate issued by the Ministry of Finance.',
  path_ul_title: 'Universal Life (UL)',
  path_ul_desc: 'Universal Life insurance products.',
  path_ilp_title: 'Investment-Linked (ILP)',
  path_ilp_desc: 'Investment-Linked insurance products.',

  // Dashboard climb section
  climbTitle: 'Llama climbs with you to the {path} summit',
  climbSubtitle: 'Tap each camp to see what\'s inside!',

  // Leaderboard extras
  lbHeading: 'Llama Race Track',
  lbSubtitle: "Who's fastest this week? Cross the finish line to win a medal! 🥇",
  lbTabDaily: 'Today',
  lbTabWeekly: 'This Week',
  lbTabMonthly: 'This Month',
  lbLoading: 'Loading leaderboard...',
  lbLoadError: 'Failed to load leaderboard',
  lbYouBadge: 'You',
  lbStreakLevel: '{streak}d · Lv {level}',

  // Settings extras
  settingsSaved: 'Settings saved!',
  soundEffectsLabel: 'Sound Effects',
  soundEffectsDesc: 'Turn off to study in silence',
  localLlmLabel: 'Local LLM (Ollama)',

  // Learn extras
  learnDoneSubtext: 'Knowledge is your greatest asset.',
  understoodBtn: 'Got It',

  // Chat extras
  chatDocsLoadError: 'Failed to load document list',
  chatReplyError: "Llama couldn't reply, please try again",
  chatUploadError: 'Failed to upload file',
  chatSaveDocError: 'Failed to save document',
  chatDeleteDocError: 'Failed to delete document',
  chatWalkAlt: 'Llama taking a stroll, waiting for your question',
  chatDocsLoading: 'Loading...',
  chatChunkCount: '{count} chunks',
  suggestedQuestions: [
    'What is the free-look period?',
    'What is term life insurance?',
    'Difference between insured and policyholder?',
    'What is the 60-day grace period?',
    'What are the requirements to become an insurance agent?',
    'Give me tips for remembering the key numbers'
  ],

  // Quiz extras
  quizChooseModeHeading: 'Choose Your Battle Mode!',
  quizChooseModeSubtitle: 'Light target practice or the real exam heat?',
  quizPracticeDesc: '5 questions, explanations included',
  quizExamDesc: '40 questions • 60 minutes • timed for real',
  quizPreparing: 'Loading up the ammo...',
  quizHistoryBtn: '📜 Exam History',
  quizNoQuestions: 'No questions available for this topic.',
  quizLoadError: 'Failed to load quiz',
  quizSaveError: 'Failed to save your results',
  quizPassMessage: 'PASSED! 🎉 A true future agent sharpshooter right here!',
  quizFailMessage: "Didn't hit 70% this time, no worries! Even the best sharpshooters missed a few before going 100% on target 💪",
  quizNewBadges: '🏅 New Badges',
  quizComboIndicator: '🔥 Combo {combo}x',
  quizReadyTag: '🎯 Ready to fire?',
  quizCorrectAlt: 'Llama cheering because you got it right',
  quizWrongAlt: 'Llama spitting water at you because you got it wrong',
  quizSourceLabel: 'Source: {source}',

  // Exam report
  tierWeak: 'Weak',
  tierMid: 'Needs Review',
  tierStrong: 'Solid',
  reportTitle: '📊 Study Report',
  reportCorrectCount: '✅ Correct: {n}',
  reportWrongCount: '❌ Wrong: {n}',
  reportStrengthChart: 'Strengths / Weaknesses',
  reportRoadmapTitle: '🗺️ Suggested Roadmap',
  reportRoadmapEmpty: "No weak areas at all! Just a general review before the real exam is enough, sharpshooter! 🎯",
  reportRoadmapHint: 'Tap each chapter to review it in Flashcards!',
  reportHideDetail: '▲ Hide Detailed Report',
  reportShowDetail: '📋 View Per-Question Detail',
  reportQuestionLabel: 'Question {n}',
  reportYourCorrectAnswer: '✓ You answered correctly: {answer}',
  reportYourWrongAnswer: '✕ You chose: {answer}',
  reportCorrectAnswer: '✓ Correct answer: {answer}',
  reportExplanation: 'Explanation',

  // Flashcards
  fcTopicsLoadError: 'Failed to load deck list',
  fcCardsLoadError: 'Failed to load flashcards',
  fcDeckTitle: 'Flashcards',
  fcChooseTopic: 'Pick a topic to start reviewing!',
  fcLoadingDecks: 'Loading decks...',
  fcRandomMix: 'Random Mix',
  fcCardsStudied: '{known}/{total} cards studied',
  fcDrawingCards: 'Drawing cards...',
  fcBackToTopics: '← Topics',
  fcTapToFlip: '👆 Tap to see the answer',
  fcTapHint: 'Tap the card to flip it, then let Llama know if you remembered!',
  fcNotKnownBtn: "😓 Didn't Know",
  fcKnownBtn: '✅ Knew It',
  fcDeckDone: 'Deck complete! 🎉',
  fcProudMessage: 'Llama is so proud of you!',
  fcKnownLabel: 'Knew It',
  fcNotKnownLabel: "Didn't Know",
  fcAnotherTopicBtn: 'Another Topic',
  fcRestartBtn: 'Review Again 🔁',

  // Quiz history
  historyLoadError: 'Failed to load history',
  historyDetailLoadError: 'Failed to load details',
  historyBackBtn: 'Back to History',
  historyLoading: 'Loading...',
  historyEmpty: 'No exam attempts yet. Go take your first one! 🚀',
  historyRow: '{score}/{total} · +{xp} XP',
  historyPassed: 'PASSED',
  historyFailed: 'FAILED',

  // Lesson path
  campBase: 'Base Camp',
  campSummit: 'MOF Summit',
  campNumbered: 'Camp {n}',
  campStartHere: 'Start Here 👇',
  campLockedMessage: '🔒 This camp is locked. Complete the previous camp to open the way up here!',
  campCardsIn: 'In this camp ({n} cards):',
  campCloseBtn: 'Close',
  campStartBtn: 'Start 🎯'
};

const dictionaries = { vi, en };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('pang_chiu_lang') || 'vi');

  useEffect(() => {
    localStorage.setItem('pang_chiu_lang', lang);
  }, [lang]);

  const toggleLanguage = () => setLang((l) => (l === 'vi' ? 'en' : 'vi'));

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t: dictionaries[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext).t;
}

export function useLanguage() {
  const { lang, setLang, toggleLanguage } = useContext(LanguageContext);
  return { lang, setLang, toggleLanguage };
}
