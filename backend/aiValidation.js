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

/** A single generated MCQ/scenario/checkpoint question must have exactly 4
 * options and exactly one correct index. */
export function validateGeneratedQuestion(q) {
  const errors = [];
  if (!q || typeof q.questionText !== 'string' || !q.questionText.trim()) errors.push('missing questionText');
  if (!Array.isArray(q?.options) || q.options.length !== 4) errors.push('must have exactly 4 options');
  if (typeof q?.correctOption !== 'number' || q.correctOption < 0 || q.correctOption > 3) errors.push('correctOption must be a single index 0-3');
  return { valid: errors.length === 0, errors };
}

// Card "type" mirrors the shapes the trainer-facing spec calls out (Term →
// Definition, Concept → Meaning, ...) — kept as a soft classification (falls
// back to 'Term' rather than rejecting the card) since it's a quality/UX tag,
// not something worth failing an otherwise-good flashcard over.
export const FLASHCARD_TYPES = ['Term', 'Concept', 'Rule', 'Comparison', 'ProcessStep', 'Exception'];

/** A generated flashcard must have both a non-empty front and back. */
export function validateGeneratedFlashcard(f) {
  const errors = [];
  if (!f || typeof f.front !== 'string' || !f.front.trim()) errors.push('missing front');
  if (!f || typeof f.back !== 'string' || !f.back.trim()) errors.push('missing back');
  return { valid: errors.length === 0, errors };
}

// A Lesson's core content block: a short introduction, 2-4 concise sections,
// and a key-takeaways list — deliberately short-form (per-lesson, grounded
// only in that lesson's own source chunks) rather than one long
// undifferentiated summary.
const MIN_KNOWLEDGE_SECTIONS = 2;
const MAX_KNOWLEDGE_SECTIONS = 4;

/** A generated knowledge (core lesson text) block must have an introduction,
 * 2-4 sections (each with a heading and non-empty body), and at least one key
 * takeaway. `insufficientSource: true` is always accepted as-is — that's the
 * model honestly reporting it doesn't have enough source material, which is
 * the correct response, not a malformed one (see spec §5: never invent facts
 * to fill the gap). */
export function validateGeneratedKnowledge(k) {
  if (k && k.insufficientSource === true) return { valid: true, errors: [] };
  const errors = [];
  if (!k || typeof k.introduction !== 'string' || !k.introduction.trim()) errors.push('missing introduction');
  if (!k || !Array.isArray(k.sections) || k.sections.length === 0) {
    errors.push('missing sections');
    return { valid: false, errors };
  }
  if (k.sections.length < MIN_KNOWLEDGE_SECTIONS || k.sections.length > MAX_KNOWLEDGE_SECTIONS) {
    errors.push(`must have ${MIN_KNOWLEDGE_SECTIONS}-${MAX_KNOWLEDGE_SECTIONS} sections (got ${k.sections.length})`);
  }
  k.sections.forEach((s, i) => {
    if (!s || typeof s.heading !== 'string' || !s.heading.trim()) errors.push(`section ${i}: missing heading`);
    if (!s || typeof s.body !== 'string' || !s.body.trim()) errors.push(`section ${i}: missing body`);
  });
  if (!Array.isArray(k.keyTakeaways) || k.keyTakeaways.filter((s) => typeof s === 'string' && s.trim()).length === 0) {
    errors.push('missing keyTakeaways');
  }
  return { valid: errors.length === 0, errors };
}

// A lesson titled with a raw classroom instruction ("Yêu cầu học viên tính
// số lượng...", "Hoạt động lớp học: chia nhóm...") is the single most common
// failure mode of the old curriculum generator — the model would lift
// whatever imperative sentence happened to sit in the source chunk it was
// grounding on, rather than naming the topic that sentence belongs to.
// "tình huống" (scenario/situational) is deliberately narrower than the rest
// — it's also a common, legitimate topic name on its own (e.g. the real MOF
// exam topic "Tình huống tổng hợp"), so only the colon-led instructional form
// ("Tình huống: hãy tính...") counts, not every title that happens to start
// with the word.
const CLASSROOM_INSTRUCTION_RE = /^(yêu cầu|hoạt động|hãy\s|thực hành|thảo luận|bài tập|làm bài|lưu ý\b|ghi nhớ\b|ví dụ\b|câu hỏi\b|tình huống\s*:|activity[:\s]|exercise[:\s]|note[:\s]|please\s|discuss\s|instructions?[:\s])/i;

/** Deterministic cleanup applied to every AI-proposed lesson title before it's
 * validated or shown to a trainer: trims quotes/whitespace, drops a trailing
 * ellipsis, and clips to the 4-12 word / 80-char ranges — never rejects on
 * its own, just removes the mechanical ways a title can go out of bounds. */
export function sanitizeLessonTitle(rawTitle) {
  let t = (rawTitle || '').replace(/\s+/g, ' ').trim();
  // Ellipsis before quotes: a trailing "..." can sit either inside or
  // outside a wrapping quote mark ("Foo"... vs "Foo..."), so strip whichever
  // is outermost first, then the other, rather than assuming one order.
  t = t.replace(/[.…]+$/g, '').trim();
  t = t.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
  t = t.replace(/[.…]+$/g, '').trim();
  const words = t.split(' ').filter(Boolean);
  if (words.length > 12) t = words.slice(0, 12).join(' ');
  if (t.length > 80) t = t.slice(0, 80).trim();
  return t;
}

/** Checks the lesson-title rules that sanitizeLessonTitle can't mechanically
 * fix: reads like a classroom instruction rather than a topic, too short to
 * be a coherent topic at all, or lifted verbatim from the source text
 * instead of naming what that text is about. `sourceText`, if given, is
 * whatever source chunk(s) the lesson cites. */
export function validateLessonTitle(title, sourceText = '') {
  const errors = [];
  const t = (title || '').trim();
  if (!t) { errors.push('empty title'); return { valid: false, errors }; }
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 12) errors.push('more than 12 words');
  if (t.length > 80) errors.push('longer than 80 characters');
  if (/[.…]$/.test(t)) errors.push('ends with an ellipsis');
  if (words.length < 2) errors.push('too short to be a coherent topic');
  if (CLASSROOM_INSTRUCTION_RE.test(t)) errors.push('reads like a classroom instruction, not a topic');
  if (sourceText && t.length >= 25) {
    const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
    if (norm(sourceText).includes(norm(t))) errors.push('copied verbatim from the source text instead of naming its topic');
  }
  return { valid: errors.length === 0, errors };
}

// A course request with no document and only a one-or-two-word description
// ("Tạo khóa học", "Khóa học cho đại lý") gives Gemini nothing real to ground
// a curriculum in — it fills the gap with a random/generic course no matter
// how the downstream prompt is engineered. The fix belongs here, before the
// first Gemini call is ever made, not in the prompt.
const MIN_DESCRIPTION_WORDS = 6;
const VAGUE_DESCRIPTION_RE = /^(tạo\s+)?(khóa học|bài học)(\s+cho\s+đại\s?lý)?\.?$/i;

export const VAGUE_INPUT_MESSAGE = 'Llama cần thêm một chút thông tin để dựng đường chính xác hơn. Hãy thêm: chủ đề khóa học, đối tượng học viên, mục tiêu đầu ra, và thời lượng dự kiến.';

/** A course request needs at least a real topic/goal description or a
 * readable uploaded document — never both empty, and never a description so
 * vague ("tạo khóa học") that it's indistinguishable from no input at all. */
export function validateCourseInput({ hasReadableDocument = false, description = '' } = {}) {
  if (hasReadableDocument) return { valid: true, errors: [] };
  const trimmed = (description || '').trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  if (!trimmed || wordCount < MIN_DESCRIPTION_WORDS || VAGUE_DESCRIPTION_RE.test(trimmed)) {
    return { valid: false, errors: [VAGUE_INPUT_MESSAGE] };
  }
  return { valid: true, errors: [] };
}

// A Course Blueprint is structure only (title/outcomes/camps/lessons) — no
// lesson content, quizzes, or flashcards belong here (those are generated
// per-lesson, on demand, after the trainer approves this structure).
const MAX_CAMPS = 6;
const MIN_LESSONS_PER_CAMP = 2;
const MAX_LESSONS_PER_CAMP = 5;

/** Validates a Course Blueprint proposal end to end: camp/lesson counts,
 * every lesson title against the rules above, campIndex/prerequisite
 * references actually resolve within the proposal, and every cited source
 * chunk was really approved for this course. `lessons[].prerequisiteIndexes`
 * are indexes into `blueprint.lessons` itself (remapped to real lesson ids
 * only once the blueprint is persisted) — a prerequisite must reference a
 * strictly earlier lesson, never itself or a later one. */
export function validateCourseBlueprint(blueprint, approvedChunkIds = []) {
  const errors = [];
  if (!blueprint || typeof blueprint.title !== 'string' || !blueprint.title.trim()) errors.push('missing course title');
  if (!Array.isArray(blueprint?.outcomes) || blueprint.outcomes.length === 0) errors.push('missing course outcomes');
  if (!Array.isArray(blueprint?.camps) || blueprint.camps.length === 0) errors.push('missing camps');
  if (Array.isArray(blueprint?.camps) && blueprint.camps.length > MAX_CAMPS) errors.push(`too many camps (${blueprint.camps.length} > ${MAX_CAMPS})`);
  if (!Array.isArray(blueprint?.lessons) || blueprint.lessons.length === 0) errors.push('missing lessons');

  const approved = new Set(approvedChunkIds);
  const lessonCountByCamp = new Map();
  (blueprint?.lessons || []).forEach((lesson, i) => {
    const campCount = blueprint.camps?.length || 0;
    if (typeof lesson.campIndex !== 'number' || lesson.campIndex < 0 || lesson.campIndex >= campCount) {
      errors.push(`lesson ${i} ("${lesson.title}"): invalid campIndex ${lesson.campIndex}`);
    } else {
      lessonCountByCamp.set(lesson.campIndex, (lessonCountByCamp.get(lesson.campIndex) || 0) + 1);
    }

    const titleCheck = validateLessonTitle(lesson.title);
    if (!titleCheck.valid) errors.push(`lesson ${i} ("${lesson.title}"): ${titleCheck.errors.join(', ')}`);
    if (typeof lesson.estimatedMinutes !== 'number' || lesson.estimatedMinutes <= 0) errors.push(`lesson ${i} ("${lesson.title}"): non-positive duration`);

    for (const id of lesson.sourceChunkIds || []) {
      if (approved.size > 0 && !approved.has(id)) errors.push(`lesson ${i} ("${lesson.title}"): cites unknown/unapproved source chunk ${id}`);
    }
    for (const prereq of lesson.prerequisiteIndexes || []) {
      if (typeof prereq !== 'number' || prereq < 0 || prereq >= i) errors.push(`lesson ${i} ("${lesson.title}"): prerequisite must reference an earlier lesson (got index ${prereq})`);
    }
  });
  for (const [campIndex, count] of lessonCountByCamp) {
    if (count < MIN_LESSONS_PER_CAMP || count > MAX_LESSONS_PER_CAMP) {
      errors.push(`camp ${campIndex}: ${count} lesson(s) (must be ${MIN_LESSONS_PER_CAMP}-${MAX_LESSONS_PER_CAMP})`);
    }
  }
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
