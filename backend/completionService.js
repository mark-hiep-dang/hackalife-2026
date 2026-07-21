// Central place where a real learner action (finishing a lesson, submitting
// a scored quiz/checkpoint, reviewing flashcards) gets reflected into
// TODAY's Daily Expedition plan, if that plan has a matching, not-yet-
// completed activity for the same lesson (spec §9/§10 — "shared completion
// state"). This does NOT award XP or compute scores itself — the caller
// (/api/lessons/:id/complete, /api/quiz/submit) already does that, correctly
// and idempotently; this only keeps the Expedition Player's view of today's
// progress in sync with whatever the learner actually just did, regardless
// of whether they did it from the Camp or from the Expedition Player. It is
// itself idempotent: calling it again for an activity that's already
// COMPLETED is a no-op (returns null), so it can never be a source of
// duplicate XP even if the underlying endpoint were ever called twice.

function findMatchingActivity(plan, { lessonId, completableTypes }) {
  if (!Array.isArray(plan.activities)) return null; // legacy blob shape (pre-migration) — leave untouched
  return plan.activities.find((a) => a.lessonId === lessonId && completableTypes.includes(a.type) && a.status !== 'COMPLETED');
}

/**
 * @param {import('sqlite').Database} db
 * @param {number} userId
 * @param {{ lessonId: string, completableTypes: string[], resultId?: number|string }} input
 * @returns {Promise<{ activityId: string, expeditionCompleted: boolean } | null>}
 *   null when there's no active Expedition today, or no matching/incomplete activity in it.
 */
export async function syncExpeditionActivity(db, userId, { lessonId, completableTypes, resultId }) {
  if (!lessonId) return null;
  const today = new Date().toISOString().split('T')[0];
  const row = await db.get('SELECT data FROM daily_expedition WHERE user_id = ? AND date = ?', [userId, today]);
  if (!row) return null;

  let plan;
  try { plan = JSON.parse(row.data); } catch { return null; }

  const target = findMatchingActivity(plan, { lessonId, completableTypes });
  if (!target) return null;

  target.status = 'COMPLETED';
  target.completedAt = new Date().toISOString();
  if (resultId != null) target.resultId = resultId;

  const next = plan.activities.find((a) => a.sequence === target.sequence + 1);
  if (next && next.status === 'LOCKED') next.status = 'AVAILABLE';

  const allRequiredDone = plan.activities.filter((a) => a.required).every((a) => a.status === 'COMPLETED');
  if (allRequiredDone) plan.completed = true;

  await db.run(
    'UPDATE daily_expedition SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND date = ?',
    [JSON.stringify(plan), userId, today]
  );

  return { activityId: target.activityId, expeditionCompleted: !!plan.completed };
}
