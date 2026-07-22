import test from 'node:test';
import assert from 'node:assert/strict';
import { initDb, getDb } from '../../db.js';
import { generateContentForLesson, generateContentForCourse } from '../studioAIService.js';
import { AI_TASKS } from '../../aiConfig.js';

// Canned Gemini responses, keyed by task — lets these tests prove the full
// generate -> validate -> persist -> link pipeline deterministically, with
// no network call and no dependence on a live API key/quota (see
// studioAIService.js's callGeminiFn seam, added specifically for this).
function makeFakeGemini({ calls = [] } = {}) {
  return async (systemInstruction, userMessage, task) => {
    calls.push(task);
    if (task === AI_TASKS.GENERATE_KNOWLEDGE_SUMMARY) {
      return JSON.stringify({
        title: 'Nguyên tắc bồi thường',
        sections: [
          { heading: 'Khái niệm', body: 'Bồi thường là việc chi trả tổn thất thực tế cho người được bảo hiểm.' },
          { heading: 'Nguyên tắc', body: 'Số tiền bồi thường không vượt quá giá trị tổn thất thực tế.' }
        ],
        keyTakeaways: ['Bồi thường = tổn thất thực tế', 'Không được lợi từ bảo hiểm']
      });
    }
    if (task === AI_TASKS.GENERATE_FLASHCARDS) {
      return JSON.stringify({
        flashcards: [
          { front: 'Bồi thường là gì?', back: 'Chi trả tổn thất thực tế.', keyword: 'Bồi thường' },
          { front: 'Nguyên tắc số tiền bồi thường?', back: 'Không vượt quá tổn thất thực tế.', keyword: 'Nguyên tắc' }
        ]
      });
    }
    if (task === AI_TASKS.GENERATE_MCQ_FROM_SOURCE) {
      return JSON.stringify({
        questions: [
          {
            questionText: 'Bồi thường bảo hiểm dựa trên nguyên tắc nào?', options: ['Tổn thất thực tế', 'Giá trị hợp đồng', 'Mức phí đã đóng', 'Thời gian tham gia'],
            correctOption: 0, explanation: 'Bồi thường dựa trên tổn thất thực tế.', difficulty: 'Dễ', cognitiveLevel: 'Ghi nhớ'
          },
          {
            questionText: 'Số tiền bồi thường tối đa là bao nhiêu?', options: ['Bằng tổn thất thực tế', 'Gấp đôi tổn thất', 'Bằng phí bảo hiểm', 'Không giới hạn'],
            correctOption: 0, explanation: 'Không được vượt quá tổn thất thực tế.', difficulty: 'Trung bình', cognitiveLevel: 'Hiểu'
          }
        ],
        scenario: {
          questionText: 'Một khách hàng yêu cầu bồi thường gấp đôi tổn thất thực tế, trainer nên xử lý thế nào?',
          options: ['Từ chối phần vượt quá', 'Chấp nhận toàn bộ', 'Huỷ hợp đồng', 'Tăng phí bảo hiểm'],
          correctOption: 0, explanation: 'Chỉ bồi thường đúng tổn thất thực tế.', difficulty: 'Khó', cognitiveLevel: 'Vận dụng'
        }
      });
    }
    return null;
  };
}

async function seedLesson(db, { genFlashcards = true, genQuiz = true, quizCountPerLesson = 3, flashcardCountPerLesson = 2, withSourceChunks = true, suffix }) {
  const trainer = await db.run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [`lc_trainer_${suffix}`, 'x', 'trainer']);
  const course = await db.run(
    `INSERT INTO studio_courses (trainer_id, title, gen_flashcards, gen_quiz, quiz_count_per_lesson, flashcard_count_per_lesson)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [trainer.lastID, `Course ${suffix}`, genFlashcards ? 1 : 0, genQuiz ? 1 : 0, quizCountPerLesson, flashcardCountPerLesson]
  );
  const camp = await db.run('INSERT INTO studio_camps (course_id, title, order_index) VALUES (?, ?, 0)', [course.lastID, `Camp ${suffix}`]);
  const outcome = await db.run('INSERT INTO studio_learning_outcomes (course_id, description) VALUES (?, ?)', [course.lastID, `Học viên hiểu nguyên tắc bồi thường ${suffix}`]);

  let sourceChunkIds = [];
  if (withSourceChunks) {
    const doc = await db.run('INSERT INTO knowledge_documents (title, source_type, course_id) VALUES (?, ?, ?)', [`Doc ${suffix}`, 'upload', course.lastID]);
    const chunk = await db.run('INSERT INTO knowledge_chunks (document_id, chunk_index, content) VALUES (?, 0, ?)', [doc.lastID, 'Bồi thường là việc chi trả tổn thất thực tế cho người được bảo hiểm, theo nguyên tắc không trục lợi.']);
    // A second, unrelated chunk NOT cited by this lesson — proves grounding
    // stays scoped to only the lesson's own sourceChunkIds, not every chunk
    // in the course.
    await db.run('INSERT INTO knowledge_chunks (document_id, chunk_index, content) VALUES (?, 1, ?)', [doc.lastID, 'Nội dung hoàn toàn không liên quan tới chặng học này.']);
    sourceChunkIds = [chunk.lastID];
  }

  const lesson = await db.run(
    `INSERT INTO studio_lessons (camp_id, title, learning_outcome_id, source_chunk_ids, order_index) VALUES (?, ?, ?, ?, 0)`,
    [camp.lastID, `Lesson ${suffix}`, outcome.lastID, JSON.stringify(sourceChunkIds)]
  );

  return { trainerId: trainer.lastID, courseId: course.lastID, campId: camp.lastID, lessonId: lesson.lastID, learningOutcomeId: outcome.lastID };
}

async function cleanup(db, trainerId) {
  await db.run('DELETE FROM users WHERE id = ?', [trainerId]);
}

test('generateContentForLesson: genQuiz=false and genFlashcards=false skip their Gemini calls entirely, and save nothing', async () => {
  await initDb();
  const db = await getDb();
  const { trainerId, lessonId } = await seedLesson(db, { genFlashcards: false, genQuiz: false, suffix: 'gate' });
  const calls = [];

  await generateContentForLesson(db, { lessonId, contentType: 'all', callGeminiFn: makeFakeGemini({ calls }) });

  assert.ok(!calls.includes(AI_TASKS.GENERATE_FLASHCARDS), 'must not call the flashcard AI task when generateFlashcards is false');
  assert.ok(!calls.includes(AI_TASKS.GENERATE_MCQ_FROM_SOURCE), 'must not call the quiz AI task when generateQuiz is false');
  assert.ok(calls.includes(AI_TASKS.GENERATE_KNOWLEDGE_SUMMARY), 'knowledge generation is independent of the quiz/flashcard flags');

  const items = await db.all('SELECT * FROM studio_content_items WHERE lesson_id = ?', [lessonId]);
  assert.ok(!items.some((i) => i.content_type === 'flashcard'));
  assert.ok(!items.some((i) => ['mcq', 'scenario'].includes(i.content_type)));

  await cleanup(db, trainerId);
});

test('generateContentForLesson: quiz questions are saved as AI_DRAFT with 4 options, 1 correct answer, difficulty, and linked to the lesson + its learning outcome', async () => {
  await initDb();
  const db = await getDb();
  const { trainerId, lessonId, learningOutcomeId } = await seedLesson(db, { quizCountPerLesson: 3, suffix: 'quiz' });

  const result = await generateContentForLesson(db, { lessonId, contentType: 'quiz', callGeminiFn: makeFakeGemini() });
  assert.equal(result.generatedQuestions, 2);
  assert.equal(result.generatedScenario, true);

  const items = await db.all(`SELECT * FROM studio_content_items WHERE lesson_id = ? AND content_type IN ('mcq', 'scenario')`, [lessonId]);
  assert.equal(items.length, 3, 'configured quizCount (3) should produce 3 assessment items total (2 MCQ + 1 scenario)');
  for (const item of items) {
    const options = JSON.parse(item.options);
    assert.equal(options.length, 4, 'every question must have exactly 4 options');
    assert.ok(item.correct_option >= 0 && item.correct_option <= 3, 'correctOption must be a single index 0-3');
    assert.ok(item.explanation, 'must include an explanation');
    assert.ok(['Dễ', 'Trung bình', 'Khó'].includes(item.difficulty), 'must include a valid difficulty');
    assert.equal(item.lesson_id, lessonId, 'must be linked to the correct lesson');
    assert.equal(item.learning_outcome_id, learningOutcomeId, 'must be linked to the lesson\'s learning outcome');
    assert.equal(item.status, 'AI_DRAFT', 'must be persisted as AI_DRAFT, not merely returned to the UI');
    const sourceChunkIds = JSON.parse(item.source_chunk_ids);
    assert.ok(sourceChunkIds.length > 0, 'must cite source chunks');
  }

  // Visible via the same course-bundle query ContentLibrary renders from.
  const lesson = await db.get('SELECT camp_id FROM studio_lessons WHERE id = ?', [lessonId]);
  const camp = await db.get('SELECT course_id FROM studio_camps WHERE id = ?', [lesson.camp_id]);
  const viaJoin = await db.all(
    `SELECT ci.* FROM studio_content_items ci
     JOIN studio_lessons l ON ci.lesson_id = l.id JOIN studio_camps c ON l.camp_id = c.id
     WHERE c.course_id = ? AND ci.content_type IN ('mcq', 'scenario')`,
    [camp.course_id]
  );
  assert.equal(viaJoin.length, 3, 'items resolve back to the correct Course/Camp/Lesson via the FK chain');

  await cleanup(db, trainerId);
});

test('generateContentForLesson: flashcards saved as AI_DRAFT, one concept per card, linked to lesson + sources', async () => {
  await initDb();
  const db = await getDb();
  const { trainerId, lessonId } = await seedLesson(db, { flashcardCountPerLesson: 2, suffix: 'flash' });

  const result = await generateContentForLesson(db, { lessonId, contentType: 'flashcard', callGeminiFn: makeFakeGemini() });
  assert.equal(result.generatedFlashcards, 2);

  const items = await db.all(`SELECT * FROM studio_content_items WHERE lesson_id = ? AND content_type = 'flashcard'`, [lessonId]);
  assert.equal(items.length, 2);
  for (const item of items) {
    assert.ok(item.front && item.back, 'one concept per card: both front and back must be present');
    assert.equal(item.status, 'AI_DRAFT');
    assert.equal(item.lesson_id, lessonId);
    assert.ok(JSON.parse(item.source_chunk_ids).length > 0);
  }

  await cleanup(db, trainerId);
});

test('generateContentForLesson: knowledge block is grounded only in this lesson\'s own cited chunk, not other course chunks', async () => {
  await initDb();
  const db = await getDb();
  const { trainerId, lessonId } = await seedLesson(db, { suffix: 'scope' });
  const seenGrounding = [];
  const spy = async (systemInstruction, userMessage, task) => {
    seenGrounding.push(userMessage);
    return makeFakeGemini()(systemInstruction, userMessage, task);
  };

  await generateContentForLesson(db, { lessonId, contentType: 'knowledge', callGeminiFn: spy });

  assert.ok(seenGrounding.some((m) => m.includes('chi trả tổn thất thực tế')), 'must include the lesson\'s own cited chunk');
  assert.ok(!seenGrounding.some((m) => m.includes('hoàn toàn không liên quan')), 'must NOT include the other, uncited course chunk');

  await cleanup(db, trainerId);
});

test('generateContentForLesson: a failed generation does not delete a previous successful draft (retry-safe)', async () => {
  await initDb();
  const db = await getDb();
  const { trainerId, lessonId } = await seedLesson(db, { suffix: 'retry' });

  await generateContentForLesson(db, { lessonId, contentType: 'flashcard', callGeminiFn: makeFakeGemini() });
  const before = await db.all(`SELECT * FROM studio_content_items WHERE lesson_id = ? AND content_type = 'flashcard'`, [lessonId]);
  assert.ok(before.length > 0);

  // A generation attempt that returns nothing usable (e.g. a Gemini
  // timeout/error) must leave the previous successful draft untouched.
  await generateContentForLesson(db, { lessonId, contentType: 'flashcard', callGeminiFn: async () => null });
  const after = await db.all(`SELECT * FROM studio_content_items WHERE lesson_id = ? AND content_type = 'flashcard'`, [lessonId]);
  assert.deepEqual(after.map((i) => i.id), before.map((i) => i.id), 'failed retry must not delete the earlier successful flashcards');

  await cleanup(db, trainerId);
});

test('generateContentForLesson: retrying successfully replaces the prior AI_DRAFT attempt instead of duplicating it', async () => {
  await initDb();
  const db = await getDb();
  const { trainerId, lessonId } = await seedLesson(db, { flashcardCountPerLesson: 2, suffix: 'replace' });

  await generateContentForLesson(db, { lessonId, contentType: 'flashcard', callGeminiFn: makeFakeGemini() });
  await generateContentForLesson(db, { lessonId, contentType: 'flashcard', callGeminiFn: makeFakeGemini() });
  const items = await db.all(`SELECT * FROM studio_content_items WHERE lesson_id = ? AND content_type = 'flashcard'`, [lessonId]);
  assert.equal(items.length, 2, 'a second successful generation should replace, not pile on top of, the first');

  await cleanup(db, trainerId);
});

test('generateContentForCourse: one lesson failing does not delete another lesson\'s successful results, and reports per-lesson status', async () => {
  await initDb();
  const db = await getDb();
  const { trainerId, courseId, campId, lessonId: goodLessonId } = await seedLesson(db, { suffix: 'camp_good' });
  const badLesson = await db.run('INSERT INTO studio_lessons (camp_id, title, order_index) VALUES (?, ?, 1)', [campId, 'Bad lesson']);

  const summaryGood = await generateContentForLesson(db, { lessonId: goodLessonId, contentType: 'flashcard', callGeminiFn: makeFakeGemini() });
  assert.equal(summaryGood.generatedFlashcards, 2);

  const goodItemsBefore = await db.all(`SELECT * FROM studio_content_items WHERE lesson_id = ?`, [goodLessonId]);
  assert.ok(goodItemsBefore.length > 0);

  // Now run a course-wide batch where the bad lesson's own call throws
  // (simulating a Gemini error on just that one lesson).
  const perLessonGemini = async (systemInstruction, userMessage, task) => {
    if (userMessage.includes('Bad lesson')) throw new Error('simulated Gemini failure');
    return makeFakeGemini()(systemInstruction, userMessage, task);
  };

  const summary = await generateContentForCourse(db, { courseId, contentType: 'flashcard', callGeminiFn: perLessonGemini });
  assert.equal(summary.results.length, 2);
  const goodResult = summary.results.find((r) => r.lessonId === goodLessonId);
  const badResult = summary.results.find((r) => r.lessonId === badLesson.lastID);
  assert.equal(goodResult.success, true);
  assert.equal(badResult.success, false);
  assert.ok(badResult.error);
  assert.equal(summary.successCount, 1);
  assert.equal(summary.failureCount, 1);

  const goodItemsAfter = await db.all(`SELECT * FROM studio_content_items WHERE lesson_id = ?`, [goodLessonId]);
  assert.equal(goodItemsAfter.length, goodItemsBefore.length, 'the failing lesson must not delete/affect the other lesson\'s saved content');

  const badItems = await db.all(`SELECT * FROM studio_content_items WHERE lesson_id = ?`, [badLesson.lastID]);
  assert.equal(badItems.length, 0, 'the failed lesson itself should have nothing half-saved');

  await cleanup(db, trainerId);
});

test('generateContentForCourse: covers every lesson across every camp in the course, not just one camp (the wizard\'s "confirm blueprint" flow)', async () => {
  await initDb();
  const db = await getDb();
  const { trainerId, courseId, campId: camp1Id } = await seedLesson(db, { flashcardCountPerLesson: 2, suffix: 'course_wide' });
  const camp2 = await db.run('INSERT INTO studio_camps (course_id, title, order_index) VALUES (?, ?, 1)', [courseId, 'Camp 2']);
  const lessonInCamp2 = await db.run('INSERT INTO studio_lessons (camp_id, title, order_index) VALUES (?, ?, 0)', [camp2.lastID, 'Lesson in camp 2']);

  const summary = await generateContentForCourse(db, { courseId, contentType: 'flashcard', callGeminiFn: makeFakeGemini() });
  assert.equal(summary.results.length, 2, 'must include lessons from both camps in the course');
  assert.equal(summary.successCount, 2);
  assert.ok(summary.results.some((r) => r.lessonId === lessonInCamp2.lastID));

  const itemsInCamp2Lesson = await db.all(`SELECT * FROM studio_content_items WHERE lesson_id = ?`, [lessonInCamp2.lastID]);
  assert.ok(itemsInCamp2Lesson.length > 0, 'the second camp\'s lesson must have received generated content too');

  await cleanup(db, trainerId);
});
