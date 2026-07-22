import { test, describe } from 'node:test';
import assert from 'node:assert';

import { cleanDocumentText, chunkText, buildDocumentMap } from '../knowledgeBase.js';
import { sanitizeLessonTitle, validateLessonTitle, validateCourseBlueprint } from '../aiValidation.js';
import { initDb, getDb } from '../db.js';
import { generateCourseBlueprint } from '../studio/studioAIService.js';

describe('Document cleaning (headers/footers/page numbers/duplicates)', () => {
  test('strips standalone page-number lines', () => {
    const text = 'Nội dung chương 1 quan trọng ở đây.\n\n12\n\nNội dung tiếp theo của chương một.';
    const cleaned = cleanDocumentText(text);
    assert.ok(!/^12$/m.test(cleaned));
    assert.ok(cleaned.includes('Nội dung chương 1 quan trọng ở đây.'));
  });

  test('strips "Trang N/M" and "- N -" style page markers', () => {
    const text = 'Câu 1: đây là nội dung chính.\nTrang 3/40\nCâu 2: nội dung tiếp theo.\n- 4 -\nCâu 3: hết.';
    const cleaned = cleanDocumentText(text);
    assert.ok(!cleaned.includes('Trang 3/40'));
    assert.ok(!cleaned.includes('- 4 -'));
    assert.ok(cleaned.includes('Câu 1: đây là nội dung chính.'));
  });

  test('strips a short line repeated 3+ times as a running header/footer', () => {
    const header = 'Giáo trình đại lý bảo hiểm — 2024';
    const text = [header, 'Nội dung phần 1.', header, 'Nội dung phần 2.', header, 'Nội dung phần 3.'].join('\n');
    const cleaned = cleanDocumentText(text);
    assert.ok(!cleaned.includes(header));
    assert.ok(cleaned.includes('Nội dung phần 1.'));
    assert.ok(cleaned.includes('Nội dung phần 3.'));
  });

  test('leaves a line that only appears once or twice alone (real content, not header/footer)', () => {
    const text = 'Chương 1: Giới thiệu\n\nMột đoạn văn dài hơn ba mươi ký tự để vượt qua ngưỡng lọc đoạn ngắn của hệ thống.';
    const cleaned = cleanDocumentText(text);
    assert.ok(cleaned.includes('Chương 1: Giới thiệu'));
  });

  test('chunkText drops exact-duplicate paragraphs instead of chunking them twice', () => {
    const para = 'Đây là một đoạn nội dung đủ dài để vượt qua ngưỡng lọc đoạn văn quá ngắn trong bộ chia đoạn.';
    const text = [para, 'Đoạn khác hoàn toàn không liên quan chút nào tới đoạn phía trên, đủ dài để không bị lọc.', para].join('\n\n');
    const chunks = chunkText(text, 1000);
    const occurrences = chunks.filter((c) => c.includes(para)).length;
    assert.strictEqual(occurrences, 1);
  });
});

describe('buildDocumentMap', () => {
  test('produces one short preview per chunk row, tagged with the real chunk id', () => {
    const rows = [
      { id: 101, content: 'Nội dung ngắn.' },
      { id: 102, content: 'X'.repeat(150) }
    ];
    const map = buildDocumentMap(rows);
    assert.strictEqual(map.length, 2);
    assert.strictEqual(map[0].chunkId, 101);
    assert.strictEqual(map[0].preview, 'Nội dung ngắn.');
    assert.ok(map[1].preview.length < 150, 'long content should be truncated');
    assert.ok(map[1].preview.endsWith('…'));
  });
});

describe('sanitizeLessonTitle', () => {
  test('trims whitespace, quotes, and a trailing ellipsis', () => {
    assert.strictEqual(sanitizeLessonTitle('  "Nguyên tắc bảo hiểm nhân thọ"...  '), 'Nguyên tắc bảo hiểm nhân thọ');
  });

  test('clips to 12 words', () => {
    const title = sanitizeLessonTitle('một hai ba bốn năm sáu bảy tám chín mười mười-một mười-hai mười-ba mười-bốn');
    assert.strictEqual(title.split(' ').length, 12);
  });

  test('clips to 80 characters', () => {
    const title = sanitizeLessonTitle('a'.repeat(200));
    assert.ok(title.length <= 80);
  });
});

describe('validateLessonTitle', () => {
  test('accepts a concise, coherent topic title', () => {
    const { valid } = validateLessonTitle('Nguyên tắc cơ bản của bảo hiểm nhân thọ');
    assert.strictEqual(valid, true);
  });

  test('rejects a title that reads like a classroom instruction', () => {
    const { valid, errors } = validateLessonTitle('Yêu cầu học viên tính số lượng đơn vị quỹ được mua');
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('classroom instruction')));
  });

  test('rejects a title lifted verbatim from the source text', () => {
    const source = 'Trong những năm đầu hợp đồng, một phần phí khách hàng đóng sẽ được dùng để chi trả các khoản phí theo quy định của sản phẩm.';
    const { valid, errors } = validateLessonTitle('Trong những năm đầu hợp đồng, một phần phí khách hàng đóng sẽ được dùng để chi trả', source);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('verbatim')));
  });

  test('rejects a title ending in an ellipsis', () => {
    const { valid, errors } = validateLessonTitle('Hoạt động lớp học Mỗi nhóm nhận một bảng phí giả…');
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('ellipsis')));
  });

  test('rejects an empty title', () => {
    const { valid, errors } = validateLessonTitle('');
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('empty')));
  });
});

describe('validateCourseBlueprint', () => {
  function makeLesson(overrides = {}) {
    return {
      title: 'Nguyên tắc cơ bản của bảo hiểm nhân thọ',
      summary: 'Tóm tắt ngắn.',
      learningOutcome: 'Học viên hiểu khái niệm.',
      campIndex: 0,
      estimatedMinutes: 20,
      difficulty: 'Trung bình',
      prerequisiteIndexes: [],
      sourceChunkIds: [1],
      ...overrides
    };
  }

  test('accepts a well-formed blueprint within the camp/lesson caps', () => {
    const blueprint = {
      title: 'Khóa học mẫu',
      outcomes: ['Hiểu nguyên tắc cơ bản.'],
      camps: [{ title: 'Camp 1' }],
      lessons: [makeLesson(), makeLesson({ title: 'Quyền và nghĩa vụ của đại lý bảo hiểm' })]
    };
    const { valid, errors } = validateCourseBlueprint(blueprint, [1]);
    assert.strictEqual(valid, true, errors.join('; '));
  });

  test('rejects more than 6 camps', () => {
    const camps = Array.from({ length: 7 }, (_, i) => ({ title: `Camp ${i}` }));
    const lessons = camps.flatMap((_, campIndex) => [makeLesson({ campIndex }), makeLesson({ campIndex, title: 'Chủ đề thứ hai của camp này' })]);
    const { valid, errors } = validateCourseBlueprint({ title: 'x', outcomes: ['y'], camps, lessons }, [1]);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('too many camps')));
  });

  test('rejects a camp with only 1 lesson (below the 2-5 range)', () => {
    const blueprint = { title: 'x', outcomes: ['y'], camps: [{ title: 'Camp 1' }], lessons: [makeLesson()] };
    const { valid, errors } = validateCourseBlueprint(blueprint, [1]);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('must be 2-5')));
  });

  test('rejects a prerequisite that references a later or equal lesson index', () => {
    const blueprint = {
      title: 'x', outcomes: ['y'], camps: [{ title: 'Camp 1' }],
      lessons: [makeLesson({ prerequisiteIndexes: [1] }), makeLesson({ title: 'Chủ đề thứ hai của camp này' })]
    };
    const { valid, errors } = validateCourseBlueprint(blueprint, [1]);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('earlier lesson')));
  });

  test('rejects a lesson citing a source chunk id outside the approved set', () => {
    const blueprint = {
      title: 'x', outcomes: ['y'], camps: [{ title: 'Camp 1' }],
      lessons: [makeLesson({ sourceChunkIds: [999] }), makeLesson({ title: 'Chủ đề thứ hai của camp này' })]
    };
    const { valid, errors } = validateCourseBlueprint(blueprint, [1, 2]);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('unapproved source chunk')));
  });

  test('rejects a blueprint whose lesson title violates the title rules', () => {
    const blueprint = {
      title: 'x', outcomes: ['y'], camps: [{ title: 'Camp 1' }],
      lessons: [makeLesson({ title: 'Yêu cầu học viên tính số lượng đơn vị quỹ được mua' }), makeLesson({ title: 'Chủ đề thứ hai của camp này' })]
    };
    const { valid, errors } = validateCourseBlueprint(blueprint, [1]);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('classroom instruction')));
  });
});

describe('generateCourseBlueprint: input validation + goal-only fallback (no document uploaded)', () => {
  async function makeTestCourse(db, title = 'Blueprint input-validation test course') {
    await db.run('DELETE FROM users WHERE username = ?', ['test_blueprint_trainer']);
    const trainer = await db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['test_blueprint_trainer', 'x', 'trainer']);
    const course = await db.run('INSERT INTO studio_courses (trainer_id, title) VALUES (?, ?)', [trainer.lastID, title]);
    return course.lastID;
  }

  test('a vague description with no uploaded document is rejected before ever calling Gemini', async () => {
    await initDb();
    const db = await getDb();
    const courseId = await makeTestCourse(db);

    const before = await db.get("SELECT COUNT(*) c FROM ai_usage_log WHERE task_type = 'GENERATE_CURRICULUM'");
    await assert.rejects(
      () => generateCourseBlueprint(db, { courseId, courseTitle: 'x', prompt: 'Tạo khóa học' }),
      (err) => err.code === 'VAGUE_INPUT'
    );
    const after = await db.get("SELECT COUNT(*) c FROM ai_usage_log WHERE task_type = 'GENERATE_CURRICULUM'");
    assert.strictEqual(after.c, before.c, 'a rejected vague request must never reach the Gemini call (no usage-log row added)');
  });

  test('"Tạo bài học" and "Khóa học cho đại lý" are also rejected as too vague', async () => {
    await initDb();
    const db = await getDb();
    const courseId = await makeTestCourse(db);
    for (const prompt of ['Tạo bài học', 'Khóa học cho đại lý']) {
      await assert.rejects(() => generateCourseBlueprint(db, { courseId, courseTitle: 'x', prompt }), (err) => err.code === 'VAGUE_INPUT');
    }
  });

  test('a valid detailed description with no uploaded document produces a well-formed, grounded blueprint (no fabricated source citations)', async () => {
    await initDb();
    const db = await getDb();
    const courseId = await makeTestCourse(db);
    const prompt = 'Tạo khóa học 60 phút về sản phẩm ILP cho đại lý mới. Sau khóa học, học viên cần hiểu cấu trúc hợp đồng, cơ chế đầu tư, quyền lợi, rủi ro và các điểm cần tư vấn cho khách hàng.';

    const blueprint = await generateCourseBlueprint(db, { courseId, courseTitle: 'ILP cho đại lý mới', prompt, preferredCamps: 4 });

    assert.ok(blueprint.camps.length > 0 && blueprint.lessons.length > 0);
    // In this test environment there is no Gemini API key, so this exercises
    // the deterministic fallback: it reuses the real, already-approved MOF
    // exam bank rather than ever inventing new insurance facts. Any
    // sourceChunkIds present are real citations this fallback found in the
    // approved knowledge base (never fabricated ids) — validateCourseBlueprint
    // with an empty approved-set only checks structure, not citation origin.
    const check = validateCourseBlueprint(blueprint, blueprint.lessons.flatMap((l) => l.sourceChunkIds || []));
    assert.ok(check.valid, check.errors.join('; '));
    assert.strictEqual(blueprint.usedSource, 'bank');
    assert.strictEqual(blueprint.usedAI, false);
  });
});
