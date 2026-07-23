// Deterministic Course Quality Checker (spec §9). The LLM only explains/
// suggests fixes for what this finds — it never decides the findings
// themselves. Takes an already-assembled course bundle (DB orchestration
// lives in studio/routes.js) so this stays pure and unit-testable.

export const SEVERITY = { INFO: 'INFO', SUGGESTION: 'SUGGESTION', WARNING: 'WARNING', BLOCKER: 'BLOCKER' };

// A real course with fully-approved content across every lesson still racks
// up a couple dozen SUGGESTION/WARNING-tier issues (similar questions,
// skills covered by more than one lesson, duration estimates being a bit
// off) — none of those should be able to bottom the score out to 0 the way
// {SUGGESTION:3, WARNING:6} did (20 suggestions alone = 60 points gone).
// BLOCKER stays the dominant signal since it's the one thing that actually
// gates publishing.
const SEVERITY_PENALTY = { INFO: 1, SUGGESTION: 2, WARNING: 5, BLOCKER: 20 };

function textTokens(text) {
  return new Set((text || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 2));
}

function similarity(a, b) {
  const ta = textTokens(a), tb = textTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  return overlap / Math.max(ta.size, tb.size);
}

/**
 * @param {object} bundle
 * @param {{id, title, targetDurationMinutes?, targetScore?}} bundle.course
 * @param {{id, title, orderIndex}[]} bundle.camps
 * @param {{id, campId, title, orderIndex, estimatedMinutes, difficulty, learningOutcomeId, sourceChunkIds, recommendedActivities}[]} bundle.lessons
 * @param {{id, description, skillId}[]} bundle.learningOutcomes
 * @param {{id, name}[]} bundle.skills
 * @param {{id, lessonId, contentType, questionText, options, correctOption, explanation, difficulty, cognitiveLevel, sourceChunkIds, sourceVersion, status}[]} bundle.contentItems
 * @param {number[]} [bundle.expiredSourceChunkIds]
 */
export function checkCourseQuality({ course, camps = [], lessons = [], learningOutcomes = [], skills = [], contentItems = [], expiredSourceChunkIds = [] }) {
  const issues = [];
  const push = (category, severity, message, affectedEntityType, affectedEntityId) =>
    issues.push({ category, severity, message, affectedEntityType, affectedEntityId });

  // A trainer archiving (rejecting) a piece of content — a duplicate, a bad
  // question, whatever — takes it out of the live course; it shouldn't keep
  // counting against coverage/assessment/experience quality once it's been
  // dealt with, or archiving would never actually improve the score.
  const liveContentItems = contentItems.filter((c) => c.status !== 'ARCHIVED');

  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const itemsByLesson = new Map();
  for (const item of liveContentItems) {
    if (!itemsByLesson.has(item.lessonId)) itemsByLesson.set(item.lessonId, []);
    itemsByLesson.get(item.lessonId).push(item);
  }
  const assessmentTypes = new Set(['mcq', 'scenario']);
  const assessedItems = liveContentItems.filter((c) => assessmentTypes.has(c.contentType));

  // ── CURRICULUM COVERAGE ──────────────────────────────────────────────
  for (const outcome of learningOutcomes) {
    const lessonsForOutcome = lessons.filter((l) => l.learningOutcomeId === outcome.id);
    const hasAssessment = lessonsForOutcome.some((l) => (itemsByLesson.get(l.id) || []).some((c) => assessmentTypes.has(c.contentType)));
    if (lessonsForOutcome.length > 0 && !hasAssessment) {
      push('COVERAGE', SEVERITY.WARNING, `Mục tiêu "${outcome.description}" chưa có câu hỏi nào kiểm tra.`, 'learningOutcome', outcome.id);
    }
  }
  for (const skill of skills) {
    const hasLesson = lessons.some((l) => (l.skillIds || []).includes(skill.id));
    if (!hasLesson) push('COVERAGE', SEVERITY.SUGGESTION, `Kỹ năng "${skill.name}" chưa có chặng học nào phụ trách.`, 'skill', skill.id);
  }
  for (const lesson of lessons) {
    if (!lesson.sourceChunkIds || lesson.sourceChunkIds.length === 0) {
      push('COVERAGE', SEVERITY.WARNING, `Chặng "${lesson.title}" chưa gắn nguồn tài liệu.`, 'lesson', lesson.id);
    }
  }
  if (course.targetDurationMinutes) {
    const total = lessons.reduce((s, l) => s + (l.estimatedMinutes || 0), 0);
    if (Math.abs(total - course.targetDurationMinutes) / course.targetDurationMinutes > 0.3) {
      push('COVERAGE', SEVERITY.SUGGESTION, `Tổng thời lượng khóa học (${total} phút) lệch khá xa mục tiêu (${course.targetDurationMinutes} phút).`, 'course', course.id);
    }
  }

  // ── ASSESSMENT QUALITY ───────────────────────────────────────────────
  const mcqs = liveContentItems.filter((c) => c.contentType === 'mcq');
  if (mcqs.length > 0) {
    const recallCount = mcqs.filter((q) => q.cognitiveLevel === 'Ghi nhớ').length;
    if (recallCount / mcqs.length > 0.6) {
      push('ASSESSMENT', SEVERITY.WARNING, `${Math.round((recallCount / mcqs.length) * 100)}% câu hỏi chỉ ở mức "Ghi nhớ" — nên thêm câu vận dụng/tình huống.`, 'course', course.id);
    }
    const scenarioCount = liveContentItems.filter((c) => c.contentType === 'scenario').length;
    if (scenarioCount === 0) {
      push('ASSESSMENT', SEVERITY.SUGGESTION, 'Khóa học chưa có câu hỏi tình huống nào để kiểm tra khả năng vận dụng.', 'course', course.id);
    }
    const difficultyCounts = {};
    for (const q of mcqs) difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
    const maxShare = Math.max(...Object.values(difficultyCounts)) / mcqs.length;
    if (maxShare > 0.75) {
      push('ASSESSMENT', SEVERITY.SUGGESTION, 'Phân bổ độ khó câu hỏi đang lệch quá nhiều về một mức.', 'course', course.id);
    }
    const positionCounts = {};
    for (const q of mcqs) positionCounts[q.correctOption] = (positionCounts[q.correctOption] || 0) + 1;
    const maxPositionShare = Math.max(...Object.values(positionCounts)) / mcqs.length;
    if (mcqs.length >= 5 && maxPositionShare > 0.5) {
      push('ASSESSMENT', SEVERITY.SUGGESTION, 'Vị trí đáp án đúng đang lặp lại khá nhiều — học viên có thể đoán theo mẫu.', 'course', course.id);
    }
    const negativeCount = mcqs.filter((q) => /không|ngoại trừ|trừ trường hợp/i.test(q.questionText || '')).length;
    if (negativeCount / mcqs.length > 0.4) {
      push('ASSESSMENT', SEVERITY.SUGGESTION, 'Có khá nhiều câu hỏi phủ định — dễ gây lỗi đọc nhanh.', 'course', course.id);
    }
    for (const q of mcqs) {
      if (!q.explanation) push('ASSESSMENT', SEVERITY.WARNING, 'Một câu hỏi chưa có phần giải thích.', 'contentItem', q.id);
      if (!q.sourceChunkIds || q.sourceChunkIds.length === 0) push('ASSESSMENT', SEVERITY.WARNING, 'Một câu hỏi chưa gắn nguồn tài liệu.', 'contentItem', q.id);
      if ((q.questionText || '').length > 220) push('ASSESSMENT', SEVERITY.SUGGESTION, 'Một câu hỏi có đề bài khá dài, có thể rút gọn.', 'contentItem', q.id);
      const lesson = lessonById.get(q.lessonId);
      if (lesson && !lesson.learningOutcomeId) push('ASSESSMENT', SEVERITY.SUGGESTION, 'Một câu hỏi không gắn với mục tiêu học tập nào.', 'contentItem', q.id);
    }
    for (let i = 0; i < mcqs.length; i++) {
      for (let j = i + 1; j < mcqs.length; j++) {
        if (similarity(mcqs[i].questionText, mcqs[j].questionText) > 0.8) {
          push('ASSESSMENT', SEVERITY.SUGGESTION, 'Hai câu hỏi có nội dung khá giống nhau, cân nhắc gộp hoặc thay đổi.', 'contentItem', mcqs[i].id);
        }
      }
    }
    // Skill assessment balance.
    const skillCounts = {};
    for (const q of mcqs) if (q.skillId) skillCounts[q.skillId] = (skillCounts[q.skillId] || 0) + 1;
    const counts = Object.values(skillCounts);
    if (counts.length > 1) {
      const avg = counts.reduce((s, c) => s + c, 0) / counts.length;
      for (const [skillId, count] of Object.entries(skillCounts)) {
        if (count > avg * 2.5) push('ASSESSMENT', SEVERITY.INFO, `Một kỹ năng đang được kiểm tra nhiều hơn hẳn mức trung bình.`, 'skill', Number(skillId));
        if (count < avg * 0.4) push('ASSESSMENT', SEVERITY.INFO, `Một kỹ năng đang được kiểm tra ít hơn hẳn mức trung bình.`, 'skill', Number(skillId));
      }
    }
  }

  // ── LEARNING EXPERIENCE ───────────────────────────────────────────────
  for (const lesson of lessons) {
    if (lesson.estimatedMinutes > 30) push('EXPERIENCE', SEVERITY.SUGGESTION, `Chặng "${lesson.title}" khá dài (${lesson.estimatedMinutes} phút), cân nhắc chia nhỏ.`, 'lesson', lesson.id);
    const items = itemsByLesson.get(lesson.id) || [];
    if (items.length === 0) push('EXPERIENCE', SEVERITY.WARNING, `Chặng "${lesson.title}" chưa có nội dung ôn luyện nào (flashcard/câu hỏi).`, 'lesson', lesson.id);
    const hasCheckpoint = items.some((c) => c.contentType === 'checkpoint');
    if (!hasCheckpoint && items.length > 0) push('EXPERIENCE', SEVERITY.SUGGESTION, `Chặng "${lesson.title}" chưa có checkpoint để chốt kiến thức.`, 'lesson', lesson.id);
  }
  const campsSorted = [...camps].sort((a, b) => a.orderIndex - b.orderIndex);
  for (const camp of campsSorted) {
    const campLessons = lessons.filter((l) => l.campId === camp.id).sort((a, b) => a.orderIndex - b.orderIndex);
    for (let i = 0; i < campLessons.length - 1; i++) {
      const cur = campLessons[i], next = campLessons[i + 1];
      const rank = { 'Dễ': 0, 'Trung bình': 1, 'Khó': 2 };
      if ((rank[next.difficulty] ?? 1) - (rank[cur.difficulty] ?? 1) >= 2) {
        push('EXPERIENCE', SEVERITY.SUGGESTION, `Độ khó tăng khá đột ngột giữa "${cur.title}" và "${next.title}".`, 'lesson', next.id);
      }
    }
    // Prerequisite taught too late.
    for (const lesson of campLessons) {
      for (const prereqId of lessons.filter((l) => l.id === lesson.id)[0]?.prerequisiteLessonIds || []) {
        const prereq = lessonById.get(prereqId);
        if (prereq && prereq.orderIndex > lesson.orderIndex) {
          push('EXPERIENCE', SEVERITY.WARNING, `Điều kiện tiên quyết của "${lesson.title}" lại được dạy sau chặng này.`, 'lesson', lesson.id);
        }
      }
    }
  }

  // ── CONTENT GOVERNANCE ────────────────────────────────────────────────
  const draftItems = liveContentItems.filter((c) => c.status === 'AI_DRAFT');
  if (draftItems.length > 0) {
    push('GOVERNANCE', SEVERITY.BLOCKER, `${draftItems.length} nội dung vẫn ở trạng thái AI_DRAFT, chưa được trainer duyệt.`, 'course', course.id);
  }
  for (const item of liveContentItems) {
    if (item.sourceChunkIds?.length > 0 && !item.sourceVersion) {
      push('GOVERNANCE', SEVERITY.WARNING, 'Một nội dung có nguồn nhưng chưa ghi phiên bản nguồn.', 'contentItem', item.id);
    }
    if (item.sourceChunkIds?.some((id) => expiredSourceChunkIds.includes(id))) {
      push('GOVERNANCE', SEVERITY.WARNING, 'Một nội dung đang tham chiếu nguồn đã hết hạn.', 'contentItem', item.id);
    }
  }

  const healthScore = Math.max(0, 100 - issues.reduce((s, i) => s + SEVERITY_PENALTY[i.severity], 0));
  const hasBlocker = issues.some((i) => i.severity === SEVERITY.BLOCKER);

  return { healthScore, issues, canPublish: !hasBlocker };
}
