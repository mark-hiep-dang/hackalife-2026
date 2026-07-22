import { test, describe } from 'node:test';
import assert from 'node:assert';

import { cleanDocumentText, chunkText, buildDocumentMap, classifyDocSection, detectLessonHeadings, SECTION_TYPES } from '../knowledgeBase.js';
import { sanitizeLessonTitle, validateLessonTitle, validateCourseBlueprint } from '../aiValidation.js';
import { initDb, getDb } from '../db.js';
import { generateCourseBlueprint, buildLessonGrounding, dedupeLessonsPreservingPrereqs } from '../studio/studioAIService.js';

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

describe('classifyDocSection', () => {
  test('classifies an explicit Lesson heading', () => {
    assert.strictEqual(classifyDocSection('Bài 1: Tổng quan về sản phẩm ILP'), SECTION_TYPES.LESSON_HEADING);
    assert.strictEqual(classifyDocSection('Chương 2: Cơ chế đầu tư'), SECTION_TYPES.LESSON_HEADING);
  });

  test('classifies a trainer instruction, never as knowledge', () => {
    assert.strictEqual(classifyDocSection('Yêu cầu học viên chia nhóm và tính số lượng đơn vị quỹ được mua.'), SECTION_TYPES.TRAINER_INSTRUCTION);
  });

  test('classifies a class activity', () => {
    assert.strictEqual(classifyDocSection('Hoạt động lớp học: cả lớp thảo luận về ưu và nhược điểm của sản phẩm.'), SECTION_TYPES.CLASS_ACTIVITY);
  });

  test('classifies an exercise', () => {
    assert.strictEqual(classifyDocSection('Bài tập: Tính giá trị quỹ sau 3 năm với lợi suất giả định 8%.'), SECTION_TYPES.EXERCISE);
  });

  test('classifies an example', () => {
    assert.strictEqual(classifyDocSection('Ví dụ: Một khách hàng đóng phí 10 triệu đồng mỗi năm.'), SECTION_TYPES.EXAMPLE);
  });

  test('classifies administrative/cover-page content', () => {
    assert.strictEqual(classifyDocSection('GIÁO ÁN ĐÀO TẠO SẢN PHẨM ILP DÀNH CHO ĐẠI LÝ MỚI'), SECTION_TYPES.ADMINISTRATIVE);
  });

  test('classifies a substantive descriptive paragraph as core knowledge', () => {
    assert.strictEqual(
      classifyDocSection('ILP là sản phẩm bảo hiểm liên kết đơn vị, kết hợp giữa bảo vệ rủi ro và đầu tư cho khách hàng.'),
      SECTION_TYPES.CORE_KNOWLEDGE
    );
  });
});

describe('buildLessonGrounding: excludes non-eligible sections from what Gemini (and the fallback) ever see', () => {
  test('mapText only includes eligible entries; excludedEntries captures the rest; headings are detected', () => {
    const docMap = [
      { chunkId: 1, preview: 'Bài 1: Tổng quan về sản phẩm ILP' },
      { chunkId: 2, preview: 'ILP là sản phẩm bảo hiểm liên kết đơn vị, kết hợp giữa bảo vệ rủi ro và đầu tư.' },
      { chunkId: 3, preview: 'Yêu cầu học viên chia nhóm và tính số lượng đơn vị quỹ được mua.' },
      { chunkId: 4, preview: 'Hoạt động lớp học: Mỗi nhóm thảo luận về ưu nhược điểm của sản phẩm.' },
      { chunkId: 5, preview: 'Bài 2: Cơ chế đầu tư và quản lý quỹ' },
      { chunkId: 6, preview: 'Bài tập: Tính giá trị quỹ sau 3 năm với lợi suất giả định 8%.' }
    ];
    const grounding = buildLessonGrounding(docMap);

    assert.deepEqual(grounding.eligibleEntries.map((e) => e.chunkId), [1, 2, 5]);
    assert.deepEqual(grounding.excludedEntries.map((e) => e.chunkId), [3, 4, 6]);
    assert.ok(!grounding.mapText.includes('Yêu cầu học viên'));
    assert.ok(!grounding.mapText.includes('Hoạt động lớp học'));
    assert.ok(!grounding.mapText.includes('Bài tập'));
    assert.equal(grounding.detectedHeadings.length, 2);
    assert.ok(grounding.headingHintLine.includes('Bài 1'));
    assert.ok(grounding.headingHintLine.includes('Bài 2'));
  });
});

describe('dedupeLessonsPreservingPrereqs', () => {
  test('drops a later lesson whose title normalizes to one already kept, remapping prerequisiteIndexes', () => {
    const lessons = [
      { title: 'Tổng quan về sản phẩm ILP', prerequisiteIndexes: [] },
      { title: 'Cơ chế đầu tư và quản lý quỹ', prerequisiteIndexes: [0] },
      { title: '  tổng quan về sản phẩm ilp  ', prerequisiteIndexes: [] }, // same topic, different casing/whitespace
      { title: 'Quyền lợi và rủi ro của khách hàng', prerequisiteIndexes: [0, 2] } // prereq 2 pointed at the dropped duplicate
    ];
    const deduped = dedupeLessonsPreservingPrereqs(lessons);
    assert.equal(deduped.length, 3);
    assert.deepEqual(deduped.map((l) => l.title), ['Tổng quan về sản phẩm ILP', 'Cơ chế đầu tư và quản lý quỹ', 'Quyền lợi và rủi ro của khách hàng']);
    // The last lesson's prereq on the dropped duplicate (old index 2) is gone; its prereq on index 0 is remapped to new index 0.
    assert.deepEqual(deduped[2].prerequisiteIndexes, [0]);
  });
});

describe('generateCourseBlueprint (document-grounded, real mixed-content upload)', () => {
  async function makeIlpCourse(db) {
    await db.run('DELETE FROM users WHERE username = ?', ['test_ilp_trainer']);
    const trainer = await db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['test_ilp_trainer', 'x', 'trainer']);
    const course = await db.run('INSERT INTO studio_courses (trainer_id, title) VALUES (?, ?)', [trainer.lastID, 'ILP verification course']);
    return course.lastID;
  }

  // One row per paragraph (bypassing chunkText's own merge-by-length
  // behavior, which is unrelated, pre-existing, and orthogonal to this
  // test) — mirrors exactly the mixed content the spec calls out: a real
  // Lesson heading repeated verbatim, core knowledge, a trainer instruction,
  // a class activity, a second heading, and an exercise.
  async function seedMixedContentDocument(db, courseId) {
    const doc = await db.run('INSERT INTO knowledge_documents (title, source_type, course_id, approved) VALUES (?, ?, ?, 0)', ['Giáo án ILP', 'upload', courseId]);
    const paragraphs = [
      'Bài 1: Tổng quan về sản phẩm ILP',
      'ILP là sản phẩm bảo hiểm liên kết đơn vị, kết hợp giữa bảo vệ rủi ro và đầu tư cho khách hàng tham gia vào hợp đồng.',
      'Yêu cầu học viên chia nhóm và tính số lượng đơn vị quỹ được mua dựa trên số phí đã đóng của khách hàng.',
      'Hoạt động lớp học: Mỗi nhóm thảo luận về ưu và nhược điểm của sản phẩm ILP so với bảo hiểm truyền thống.',
      'Bài 1: Tổng quan về sản phẩm ILP',
      'Bài 2: Cơ chế đầu tư và quản lý quỹ',
      'Giá trị tài khoản hợp đồng ILP biến động theo kết quả hoạt động của quỹ đầu tư mà khách hàng đã lựa chọn từ đầu.',
      'Bài tập: Tính giá trị quỹ đầu tư sau 3 năm với giả định lợi suất 8% mỗi năm và phí duy trì hợp đồng.',
      'Ví dụ: Một khách hàng đóng phí 10 triệu đồng mỗi năm và lựa chọn quỹ cân bằng để đầu tư dài hạn.'
    ];
    const rows = [];
    for (let i = 0; i < paragraphs.length; i++) {
      const chunk = await db.run('INSERT INTO knowledge_chunks (document_id, chunk_index, content) VALUES (?, ?, ?)', [doc.lastID, i, paragraphs[i]]);
      rows.push({ id: chunk.lastID, content: paragraphs[i] });
    }
    await db.run('UPDATE knowledge_documents SET doc_map = ? WHERE id = ?', [JSON.stringify(buildDocumentMap(rows)), doc.lastID]);
    return doc.lastID;
  }

  test('only main-knowledge/heading content becomes Lessons; instructions/activities/exercises/examples are excluded; repeated heading is deduped; camps get real names', async () => {
    await initDb();
    const db = await getDb();
    const courseId = await makeIlpCourse(db);
    await seedMixedContentDocument(db, courseId);

    const blueprint = await generateCourseBlueprint(db, {
      courseId, courseTitle: 'ILP',
      prompt: 'Tạo khóa học ILP cho đại lý mới, tập trung vào cơ chế sản phẩm và quản lý quỹ đầu tư',
      preferredCamps: 4
    });

    // No Gemini API key in this test environment — exercises the real
    // deterministic fallback end to end (document -> grounding -> fallback).
    assert.strictEqual(blueprint.usedAI, false);
    assert.strictEqual(blueprint.usedSource, 'document');

    const titles = blueprint.lessons.map((l) => l.title.toLowerCase());
    assert.ok(!titles.some((t) => t.includes('yêu cầu học viên')), `trainer instruction leaked into a Lesson title: ${titles}`);
    assert.ok(!titles.some((t) => t.includes('mỗi nhóm') || t.includes('hoạt động lớp học')), `class activity leaked into a Lesson title: ${titles}`);
    assert.ok(!titles.some((t) => t.includes('bài tập')), `exercise leaked into a Lesson title: ${titles}`);
    assert.ok(!titles.some((t) => t.includes('ví dụ')), `example leaked into a Lesson title: ${titles}`);
    assert.ok(!titles.some((t) => /^phần\s*\d+$/.test(t.trim())), `a generic "Phần N" section label was used as a Lesson title: ${titles}`);

    // The repeated "Bài 1" heading collapses to a single Lesson — only the
    // two genuinely distinct headings/topics survive.
    assert.equal(titles.filter((t) => t.includes('tổng quan về sản phẩm ilp')).length, 1);
    assert.ok(titles.some((t) => t.includes('cơ chế đầu tư')));
    assert.equal(blueprint.lessons.length, 2);

    // Camps never fall back to a bare "Phần N" — deriveCampTitle pulls a
    // real topic from the camp's own content.
    for (const camp of blueprint.camps) {
      assert.ok(!/^phần\s*\d+$/i.test(camp.title.trim()), `camp got a generic name: "${camp.title}"`);
    }

    // Every Lesson still cites only real, eligible source chunks (never an
    // instruction/activity/exercise/example chunk).
    for (const lesson of blueprint.lessons) {
      assert.ok(lesson.sourceChunkIds.length > 0, `Lesson "${lesson.title}" has no source citation`);
    }
  });
});
