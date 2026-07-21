// Structured-output validation for AI-generated content (audit §7). The
// project has no TypeScript/Zod; these are small dependency-free checks in
// the same spirit — reject malformed or ungrounded output before it's ever
// saved, rather than trusting whatever the model returned.

/** Rejects a curriculum proposal that cites a source chunk the caller didn't
 * approve, is missing a required field, or has a non-positive duration. */
export function validateCurriculumProposal(proposal, approvedChunkIds) {
  const errors = [];
  if (!proposal || typeof proposal.summary !== 'string') errors.push('missing summary');
  if (!Array.isArray(proposal?.camps) || proposal.camps.length === 0) errors.push('missing camps');
  if (!Array.isArray(proposal?.lessons) || proposal.lessons.length === 0) errors.push('missing lessons');

  const approved = new Set(approvedChunkIds || []);
  for (const lesson of proposal?.lessons || []) {
    if (!lesson.title) errors.push(`lesson missing title`);
    if (typeof lesson.estimatedMinutes !== 'number' || lesson.estimatedMinutes <= 0) errors.push(`"${lesson.title}": non-positive duration`);
    if (!Array.isArray(lesson.sourceChunkIds) || lesson.sourceChunkIds.length === 0) errors.push(`"${lesson.title}": no source citation`);
    for (const id of lesson.sourceChunkIds || []) {
      if (approved.size > 0 && !approved.has(id)) errors.push(`"${lesson.title}": cites unknown/unapproved source chunk ${id}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/** Same shape checks as validateCurriculumProposal, minus the source-citation
 * requirement — used when a trainer generates a curriculum purely from a goal
 * prompt with no uploaded documents to cite. */
export function validateGoalOnlyCurriculumProposal(proposal) {
  const errors = [];
  if (!proposal || typeof proposal.summary !== 'string') errors.push('missing summary');
  if (!Array.isArray(proposal?.camps) || proposal.camps.length === 0) errors.push('missing camps');
  if (!Array.isArray(proposal?.lessons) || proposal.lessons.length === 0) errors.push('missing lessons');
  for (const lesson of proposal?.lessons || []) {
    if (!lesson.title) errors.push('lesson missing title');
    if (typeof lesson.estimatedMinutes !== 'number' || lesson.estimatedMinutes <= 0) errors.push(`"${lesson.title}": non-positive duration`);
  }
  return { valid: errors.length === 0, errors };
}

/** A single generated MCQ/scenario/checkpoint question must have exactly 4
 * options and exactly one correct index. */
export function validateGeneratedQuestion(q) {
  const errors = [];
  if (!q || typeof q.questionText !== 'string' || !q.questionText.trim()) errors.push('missing questionText');
  if (!Array.isArray(q?.options) || q.options.length !== 4) errors.push('must have exactly 4 options');
  if (typeof q?.correctOption !== 'number' || q.correctOption < 0 || q.correctOption > 3) errors.push('correctOption must be a single index 0-3');
  return { valid: errors.length === 0, errors };
}

/** A generated flashcard must have both a non-empty front and back. */
export function validateGeneratedFlashcard(f) {
  const errors = [];
  if (!f || typeof f.front !== 'string' || !f.front.trim()) errors.push('missing front');
  if (!f || typeof f.back !== 'string' || !f.back.trim()) errors.push('missing back');
  return { valid: errors.length === 0, errors };
}

/** A generated knowledge (core lesson text) block must have a non-empty body. */
export function validateGeneratedKnowledge(k) {
  const errors = [];
  if (!k || typeof k.body !== 'string' || !k.body.trim()) errors.push('missing body');
  return { valid: errors.length === 0, errors };
}

/** Rescue Expedition proposals must stay grounded and time-boxed. */
export function validateInterventionProposal(intervention) {
  const errors = [];
  if (!intervention || typeof intervention.title !== 'string') errors.push('missing title');
  if (typeof intervention?.durationMinutes !== 'number' || intervention.durationMinutes <= 0) errors.push('non-positive durationMinutes');
  if (typeof intervention?.trainerSummary !== 'string') errors.push('missing trainerSummary');
  if (typeof intervention?.learnerIntroduction !== 'string') errors.push('missing learnerIntroduction');
  return { valid: errors.length === 0, errors };
}
