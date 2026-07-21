// Centralized Llama Studio personality service (spec §3). Calmer and more
// grown-up than the learner-facing llamaPersonality.js — Studio Llama sits
// beside the trainer as a teaching assistant, never judges the trainer's
// work, and never jokes inside legal/insurance content.
//
// @typedef {"welcoming"|"thinking"|"helpful"|"concerned"|"celebrating"|"reviewing"|"encouraging"} StudioLlamaMood
// @typedef {"STUDIO_GREETING"|"SOURCE_UPLOADED"|"SOURCE_ANALYZING"|"CURRICULUM_CREATED"|"LESSON_KIT_CREATED"|"QUALITY_CHECK_COMPLETE"|"QUALITY_ISSUE_FOUND"|"COURSE_READY"|"COURSE_PUBLISHED"|"MOCK_EXAM_COMPLETED"|"COHORT_SCORE_IMPROVED"|"LEARNER_RISK_FOUND"|"OUTLIER_PATTERN_FOUND"|"MISCONCEPTION_CLUSTER_FOUND"|"QUESTION_QUALITY_WARNING"|"INTERVENTION_CREATED"|"INTERVENTION_ASSIGNED"|"INTERVENTION_IMPROVED_RESULTS"|"EMPTY_COURSE"|"AI_ERROR"} StudioLlamaEvent

function pick(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}
function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? ''));
}

const POOLS = {
  STUDIO_GREETING: [
    'Chào trainer! Hôm nay mình dựng đường mới hay xem học viên đang vấp ở đâu?',
    'Giáo án đang khá khỏe. Llama thấy một đoạn hơi dốc cần xử lý thôi.',
    'Bạn lo phần chuyên môn. Llama phụ đặt biển, dọn đá và kiểm tra đường.'
  ],
  SOURCE_UPLOADED: [
    'Thả tài liệu vào đây. Llama đọc trước, bạn duyệt sau.',
    'Llama đang đọc giáo trình. Nhiều chữ thật, nhưng chưa nặng bằng ba lô lên Summit.'
  ],
  SOURCE_ANALYZING: [
    'Llama đang phân tích tài liệu, chờ một chút nhé.',
    'Đang đọc kỹ từng trang. Sắp có bản nháp cho bạn xem rồi.'
  ],
  CURRICULUM_CREATED: [
    'Đường lên núi đã có bản nháp!',
    'Llama chia nội dung thành {campCount} camp và {lessonCount} chặng. Bạn xem có đoạn nào cần đổi đường nhé.'
  ],
  LESSON_KIT_CREATED: [
    'Bộ nội dung cho chặng "{lessonTitle}" đã xong bản nháp.',
    'Llama vừa soạn xong flashcard và câu hỏi cho chặng này. Bạn duyệt qua nhé.'
  ],
  QUALITY_CHECK_COMPLETE: [
    'Giáo án khá ổn rồi. Có vài mục đáng xem qua thôi.',
    'Llama vừa kiểm tra xong. Sức khỏe giáo án đang ở mức {healthScore}/100.'
  ],
  QUALITY_ISSUE_FOUND: [
    'Camp {campTitle} đang hơi mê học thuộc. Thêm vài tình huống là khỏe hơn nhiều.',
    'Giáo án khá ổn rồi. Có một mục tiêu vẫn chưa được câu hỏi nào kiểm tra.'
  ],
  COURSE_READY: [
    'Đường đã kiểm tra xong. Sẵn sàng mở trại cho học viên!',
    'Giáo án đã sẵn sàng. Bạn có thể publish bất cứ lúc nào.'
  ],
  COURSE_PUBLISHED: [
    'Đường đã mở! Học viên có thể bắt đầu leo rồi.',
    'Publish thành công! Llama sẽ theo dõi tiến độ cùng bạn.'
  ],
  MOCK_EXAM_COMPLETED: [
    'Cả lớp đang leo khá ổn, nhưng phần Pháp luật vẫn còn vài tảng đá trơn.',
    'Nhóm này học khá chăm, nhưng kiến thức chưa chịu ở lại lâu.'
  ],
  COHORT_SCORE_IMPROVED: [
    'Điểm trung bình cả lớp vừa tăng {change} điểm so với lần trước. Đáng mừng đó!',
    'Cả lớp đang leo nhanh hơn rồi, tiếp tục đà này nhé.'
  ],
  LEARNER_RISK_FOUND: [
    '{count} học viên đang cần được chú ý thêm.',
    'Có vài học viên đang vấp ở cùng một chỗ, Llama đã ghi chú lại rồi.'
  ],
  OUTLIER_PATTERN_FOUND: [
    '{count} học viên đang có kiểu học hơi khác thường — không hẳn là yếu, chỉ là đáng để ý thêm.',
    'Llama nhận thấy {count} học viên học theo cách khác lạ. Không phải lỗi của ai, chỉ là một góc nhìn mới thôi.'
  ],
  MISCONCEPTION_CLUSTER_FOUND: [
    '{count} học viên đang vấp cùng một chỗ. Có vẻ tảng đá này cần gắn biển cảnh báo.',
    'Llama phát hiện một nhóm học viên đang nhầm cùng một khái niệm.'
  ],
  QUESTION_QUALITY_WARNING: [
    'Câu {questionLabel} làm khó cả những học viên mạnh. Có thể viên đá này được đặt hơi lệch.',
    'Câu {questionLabel} có tỷ lệ sai khá cao. Llama đề xuất xem lại cách diễn đạt.'
  ],
  INTERVENTION_CREATED: [
    'Llama đã chuẩn bị một chặng cứu hộ {duration} phút. Bạn xem lại trước khi giao nhé.',
    'Chặng cứu hộ đã soạn xong bản nháp, đang chờ bạn duyệt.'
  ],
  INTERVENTION_ASSIGNED: [
    'Llama đã đặt chặng cứu hộ vào hành trình của {count} học viên.',
    'Đã giao chặng cứu hộ xong. Llama sẽ theo dõi kết quả giúp bạn.'
  ],
  INTERVENTION_IMPROVED_RESULTS: [
    'Chặng cứu hộ có tác dụng rồi. Tảng đá này bớt trơn hơn hẳn.',
    'Kết quả đã cải thiện sau chặng cứu hộ. Đáng mừng đó!'
  ],
  EMPTY_COURSE: [
    'Chưa có khóa học nào ở đây. Mình dựng con đường đầu tiên nhé?',
    'Trống trơn quá! Bắt đầu một khóa học mới thôi.'
  ],
  AI_ERROR: [
    'Llama vừa làm rơi một tờ giáo án. Thử lại lần nữa nhé.',
    'Có gì đó trục trặc rồi. Bạn thử lại giúp Llama nhé.'
  ]
};

// English variants exist only where a trainer is actually likely to demo in
// English (the Overview hero greeting) — everywhere else in Studio stays
// Vietnamese-only per the app-wide convention (see translations.jsx). Falls
// back to the Vietnamese pool for any event without an English one.
const POOLS_EN = {
  STUDIO_GREETING: [
    'Hey trainer! Building a new trail today, or checking where learners are stumbling?',
    'The curriculum is looking solid. Llama spotted one steep patch worth smoothing out.',
    'You handle the expertise — Llama will put up signs, clear rocks, and check the trail.'
  ],
  EMPTY_COURSE: [
    'No courses here yet. Shall we build the first trail together?',
    'Pretty empty in here! Let’s start a new course.'
  ]
};

const MOOD_BY_EVENT = {
  STUDIO_GREETING: 'welcoming',
  SOURCE_UPLOADED: 'helpful',
  SOURCE_ANALYZING: 'thinking',
  CURRICULUM_CREATED: 'celebrating',
  LESSON_KIT_CREATED: 'helpful',
  QUALITY_CHECK_COMPLETE: 'reviewing',
  QUALITY_ISSUE_FOUND: 'concerned',
  COURSE_READY: 'encouraging',
  COURSE_PUBLISHED: 'celebrating',
  MOCK_EXAM_COMPLETED: 'reviewing',
  COHORT_SCORE_IMPROVED: 'celebrating',
  LEARNER_RISK_FOUND: 'concerned',
  OUTLIER_PATTERN_FOUND: 'concerned',
  MISCONCEPTION_CLUSTER_FOUND: 'concerned',
  QUESTION_QUALITY_WARNING: 'reviewing',
  INTERVENTION_CREATED: 'helpful',
  INTERVENTION_ASSIGNED: 'encouraging',
  INTERVENTION_IMPROVED_RESULTS: 'celebrating',
  EMPTY_COURSE: 'welcoming',
  AI_ERROR: 'concerned'
};

/**
 * @param {StudioLlamaEvent} event
 * @param {object} [context]
 * @param {'vi'|'en'} [lang] - falls back to the Vietnamese pool if no English one exists for this event
 * @returns {{ message: string, mood: StudioLlamaMood, secondaryMessage?: string, animation?: string }}
 */
export function getStudioLlamaReaction(event, context = {}, lang = 'vi') {
  const pool = (lang === 'en' && POOLS_EN[event]) || POOLS[event];
  if (!pool) return { message: '', mood: 'helpful' };
  return { message: fill(pick(pool), context), mood: MOOD_BY_EVENT[event] || 'helpful' };
}
