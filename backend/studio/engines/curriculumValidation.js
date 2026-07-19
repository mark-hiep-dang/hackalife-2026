// Deterministic curriculum validation (spec §5). Runs on an AI-proposed or
// trainer-edited curriculum shape before it can leave AI_DRAFT — the LLM
// proposes the structure, this decides whether the structure is actually valid.

/**
 * @typedef {object} ProposedLesson
 * @property {string|number} id
 * @property {string} title
 * @property {string|number} campId
 * @property {string} [learningOutcome]
 * @property {(string|number)[]} [skillIds]
 * @property {(string|number)[]} [prerequisiteLessonIds]
 * @property {number} estimatedMinutes
 * @property {(string|number)[]} [sourceChunkIds]
 */

/**
 * @param {{ camps: {id:string|number, title:string}[], lessons: ProposedLesson[], targetDurationMinutes?: number }} curriculum
 * @returns {{ issues: { code: string, severity: 'BLOCKER'|'WARNING', message: string, lessonId?: string|number }[] }}
 */
export function validateCurriculum({ camps = [], lessons = [], targetDurationMinutes } = {}) {
  const issues = [];
  const lessonIds = new Set(lessons.map((l) => l.id));
  const campIds = new Set(camps.map((c) => c.id));

  // Circular prerequisites — DFS cycle detection.
  const graph = new Map(lessons.map((l) => [l.id, l.prerequisiteLessonIds || []]));
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map(lessons.map((l) => [l.id, WHITE]));
  function hasCycleFrom(id, stack) {
    color.set(id, GRAY);
    for (const dep of graph.get(id) || []) {
      if (!lessonIds.has(dep)) continue;
      if (color.get(dep) === GRAY) return true;
      if (color.get(dep) === WHITE && hasCycleFrom(dep, [...stack, dep])) return true;
    }
    color.set(id, BLACK);
    return false;
  }
  for (const l of lessons) {
    if (color.get(l.id) === WHITE && hasCycleFrom(l.id, [l.id])) {
      issues.push({ code: 'CIRCULAR_PREREQUISITE', severity: 'BLOCKER', message: `Chặng "${l.title}" nằm trong một vòng lặp điều kiện tiên quyết.`, lessonId: l.id });
    }
  }

  const titleCounts = new Map();
  for (const l of lessons) {
    titleCounts.set(l.title, (titleCounts.get(l.title) || 0) + 1);

    if (!campIds.has(l.campId)) {
      issues.push({ code: 'MISSING_CAMP', severity: 'BLOCKER', message: `Chặng "${l.title}" không thuộc camp nào hợp lệ.`, lessonId: l.id });
    }
    if (!l.sourceChunkIds || l.sourceChunkIds.length === 0) {
      issues.push({ code: 'MISSING_SOURCE', severity: 'WARNING', message: `Chặng "${l.title}" chưa có nguồn tài liệu tham chiếu.`, lessonId: l.id });
    }
    if (!l.learningOutcome) {
      issues.push({ code: 'MISSING_OUTCOME', severity: 'WARNING', message: `Chặng "${l.title}" chưa có mục tiêu học tập.`, lessonId: l.id });
    }
    if (!l.skillIds || l.skillIds.length === 0) {
      issues.push({ code: 'MISSING_SKILL_MAPPING', severity: 'WARNING', message: `Chặng "${l.title}" chưa gắn với kỹ năng nào.`, lessonId: l.id });
    }
    if (!l.estimatedMinutes || l.estimatedMinutes <= 0 || l.estimatedMinutes > 120) {
      issues.push({ code: 'INVALID_DURATION', severity: 'WARNING', message: `Chặng "${l.title}" có thời lượng không hợp lý (${l.estimatedMinutes} phút).`, lessonId: l.id });
    }
    for (const dep of l.prerequisiteLessonIds || []) {
      if (!lessonIds.has(dep)) {
        issues.push({ code: 'MISSING_PREREQUISITE', severity: 'WARNING', message: `Chặng "${l.title}" tham chiếu một điều kiện tiên quyết không tồn tại.`, lessonId: l.id });
      }
    }
  }

  for (const [title, count] of titleCounts) {
    if (count > 1) issues.push({ code: 'DUPLICATE_TITLE', severity: 'WARNING', message: `Có ${count} chặng cùng tên "${title}".` });
  }

  if (typeof targetDurationMinutes === 'number') {
    const totalMinutes = lessons.reduce((s, l) => s + (l.estimatedMinutes || 0), 0);
    const diffRatio = Math.abs(totalMinutes - targetDurationMinutes) / Math.max(targetDurationMinutes, 1);
    if (diffRatio > 0.3) {
      issues.push({
        code: 'DURATION_MISMATCH',
        severity: 'WARNING',
        message: `Tổng thời lượng (${totalMinutes} phút) lệch khá xa mục tiêu (${targetDurationMinutes} phút).`
      });
    }
  }

  return { issues };
}
