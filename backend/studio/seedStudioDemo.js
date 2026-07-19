// Llama Studio demo data seed (spec §23). Run with: node studio/seedStudioDemo.js
// Creates a dedicated trainer + 20 dedicated demo learners — never touches
// real accounts. Safe to re-run; clears its own previous seed first.

import bcrypt from 'bcryptjs';
import { initDb, getDb } from '../db.js';
import { generateCurriculum, generateLessonKit, generateIntervention } from './studioAIService.js';
import { checkCourseQuality } from './engines/courseQuality.js';
import { clusterMisconceptions } from './engines/misconceptionCluster.js';
import { MISTAKE_TYPES } from '../engines/mistakeDNA.js';

const TRAINER_USERNAME = 'trainer_demo';
const TRAINER_PASSWORD = 'trainerpass123';
const LEARNER_COUNT = 20;
const LEARNER_PASSWORD = 'learnerpass123';
const WEAK_TOPIC = '7. Đại lý, đạo đức, quyền & nghĩa vụ';
const ROUND_TARGET_AVERAGES = [58, 67, 73];

function rand(min, max) { return Math.round(min + Math.random() * (max - min)); }
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

async function upsertDemoUser(db, username, password, role, xp = 0) {
  const hash = await bcrypt.hash(password, 10);
  const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) {
    await db.run('UPDATE users SET password_hash = ?, role = ? WHERE id = ?', [hash, role, existing.id]);
    return existing.id;
  }
  const result = await db.run(
    'INSERT INTO users (username, password_hash, xp, streak, last_login_date, role) VALUES (?, ?, ?, 1, ?, ?)',
    [username, hash, xp, new Date().toISOString().split('T')[0], role]
  );
  return result.lastID;
}

async function main() {
  await initDb();
  const db = await getDb();

  console.log('Seeding Llama Studio demo data...');

  const trainerId = await upsertDemoUser(db, TRAINER_USERNAME, TRAINER_PASSWORD, 'trainer');

  // Clean up any previous demo course by this trainer (idempotent re-seed).
  const oldCourses = await db.all('SELECT id FROM studio_courses WHERE trainer_id = ?', [trainerId]);
  for (const c of oldCourses) await db.run('DELETE FROM studio_courses WHERE id = ?', [c.id]);

  // ── 1. Course + AI-proposed curriculum ─────────────────────────────────
  const courseResult = await db.run(
    `INSERT INTO studio_courses (trainer_id, title, description, target_group, duration_weeks, exam_date, learning_goal, target_score, preferred_camps, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')`,
    [
      trainerId, 'Chứng chỉ Đại lý Bảo hiểm MOF', 'Khóa học chuẩn bị thi chứng chỉ đại lý bảo hiểm nhân thọ cơ bản do Bộ Tài chính cấp.',
      'Đại lý mới, cần chứng chỉ MOF', 4, new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      'Đủ điểm vượt qua kỳ thi MOF', 70, 4
    ]
  );
  const courseId = courseResult.lastID;

  const curriculum = await generateCurriculum(db, { preferredCamps: 4 });
  const skillIdMap = new Map();
  for (const skill of curriculum.skills) {
    const r = await db.run('INSERT INTO studio_skills (course_id, name) VALUES (?, ?)', [courseId, skill.name]);
    skillIdMap.set(skill.id, r.lastID);
  }
  const campIdMap = new Map();
  for (const camp of curriculum.camps) {
    const r = await db.run('INSERT INTO studio_camps (course_id, title, order_index) VALUES (?, ?, ?)', [courseId, camp.title, camp.orderIndex]);
    campIdMap.set(camp.id, r.lastID);
  }
  const lessonIdMap = new Map();
  const lessonTopics = new Map();
  for (const lesson of curriculum.lessons) {
    const outcomeResult = await db.run('INSERT INTO studio_learning_outcomes (course_id, skill_id, description) VALUES (?, ?, ?)', [
      courseId, skillIdMap.get(lesson.skillIds[0]), lesson.learningOutcome
    ]);
    const r = await db.run(
      `INSERT INTO studio_lessons (camp_id, title, description, learning_outcome_id, skill_ids, estimated_minutes, difficulty, recommended_activities, exam_weight, source_chunk_ids, status, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?)`,
      [
        campIdMap.get(lesson.campId), lesson.title, lesson.description, outcomeResult.lastID,
        JSON.stringify(skillIdMap.get(lesson.skillIds[0]) ? [skillIdMap.get(lesson.skillIds[0])] : []),
        lesson.estimatedMinutes, lesson.difficulty, JSON.stringify(lesson.recommendedActivities), lesson.examWeight,
        JSON.stringify(lesson.sourceChunkIds || []), curriculum.lessons.indexOf(lesson)
      ]
    );
    lessonIdMap.set(lesson.id, r.lastID);
    lessonTopics.set(r.lastID, lesson.topic);
  }

  // ── 2. Lesson Kit content for every lesson (approved, so Course Quality is clean) ──
  for (const [dbLessonId, topic] of lessonTopics) {
    const kit = await generateLessonKit(db, { topic, lessonTitle: topic });
    const insertItem = (type, fields) => db.run(
      `INSERT INTO studio_content_items
         (lesson_id, content_type, question_text, options, correct_option, explanation, difficulty, cognitive_level, front, back, keyword, source_chunk_ids, source_title, source_version, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`,
      [dbLessonId, type, fields.questionText || null, JSON.stringify(fields.options || []), fields.correctOption ?? null,
        fields.explanation || null, fields.difficulty || 'Trung bình', fields.cognitiveLevel || 'Hiểu',
        fields.front || null, fields.back || null, fields.keyword || null,
        JSON.stringify(fields.sourceChunkIds || []), fields.sourceTitle || 'Giáo trình MOF', fields.sourceVersion || '1.0']
    );
    for (const f of kit.flashcards) await insertItem('flashcard', f);
    for (const q of kit.easyQuestions) await insertItem('mcq', q);
    for (const q of kit.mediumQuestions) await insertItem('mcq', q);
    for (const q of kit.hardQuestions) await insertItem('mcq', q);
    if (kit.scenario) await insertItem('scenario', kit.scenario);
    if (kit.checkpoint) await insertItem('checkpoint', kit.checkpoint);
  }

  // ── 3. Course Quality Check ─────────────────────────────────────────────
  const campsForQuality = curriculum.camps.map((c) => ({ id: campIdMap.get(c.id), title: c.title, orderIndex: c.orderIndex }));
  const lessonsForQuality = curriculum.lessons.map((l) => ({
    id: lessonIdMap.get(l.id), campId: campIdMap.get(l.campId), title: l.title, orderIndex: curriculum.lessons.indexOf(l),
    estimatedMinutes: l.estimatedMinutes, difficulty: l.difficulty, learningOutcomeId: 1, sourceChunkIds: l.sourceChunkIds || [], prerequisiteLessonIds: []
  }));
  const contentItemsForQuality = await db.all('SELECT * FROM studio_content_items WHERE lesson_id IN (' + [...lessonIdMap.values()].join(',') + ')');
  const quality = checkCourseQuality({
    course: { id: courseId },
    camps: campsForQuality,
    lessons: lessonsForQuality,
    learningOutcomes: [],
    skills: [],
    contentItems: contentItemsForQuality.map((c) => ({
      id: c.id, lessonId: c.lesson_id, contentType: c.content_type, questionText: c.question_text,
      correctOption: c.correct_option, explanation: c.explanation, difficulty: c.difficulty,
      cognitiveLevel: c.cognitive_level, sourceChunkIds: JSON.parse(c.source_chunk_ids || '[]'), sourceVersion: c.source_version, status: c.status
    }))
  });
  const qcResult = await db.run('INSERT INTO studio_quality_checks (course_id, health_score) VALUES (?, ?)', [courseId, quality.healthScore]);
  for (const issue of quality.issues) {
    await db.run(
      'INSERT INTO studio_quality_issues (quality_check_id, category, severity, message, affected_entity_type, affected_entity_id) VALUES (?, ?, ?, ?, ?, ?)',
      [qcResult.lastID, issue.category, issue.severity, issue.message, issue.affectedEntityType || null, issue.affectedEntityId || null]
    );
  }
  await db.run('UPDATE studio_courses SET health_score = ? WHERE id = ?', [quality.healthScore, courseId]);

  // ── 4. Cohort + 20 demo learners ────────────────────────────────────────
  const cohortResult = await db.run(
    `INSERT INTO studio_cohorts (course_id, trainer_id, name, start_date, deadline) VALUES (?, ?, ?, ?, ?)`,
    [courseId, trainerId, 'MOF Cohort July', '2026-07-01', new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0]]
  );
  const cohortId = cohortResult.lastID;

  const learnerIds = [];
  const learnerNames = [
    'Linh Nguyễn', 'Minh Trần', 'Hà Phạm', 'Tuấn Lê', 'Mai Vũ', 'Đức Hoàng', 'Trang Đỗ', 'Nam Bùi', 'Thảo Đặng', 'Phong Ngô',
    'An Dương', 'Huy Đinh', 'Ngọc Lý', 'Sơn Phan', 'Vy Trịnh', 'Khoa Chu', 'Linh Chi Vương', 'Bảo Lâm', 'Yến Cao', 'Quang Hồ'
  ];
  for (let i = 0; i < LEARNER_COUNT; i++) {
    const id = await upsertDemoUser(db, `mof_learner_${String(i + 1).padStart(2, '0')}`, LEARNER_PASSWORD, 'learner', rand(200, 800));
    learnerIds.push({ id, name: learnerNames[i] });
    await db.run('INSERT OR IGNORE INTO studio_cohort_learners (cohort_id, learner_id) VALUES (?, ?)', [cohortId, id]);
  }

  // ── 5. Three mock exam rounds with a realistic score trend and a seeded misconception ──
  const topics = [
    '1. Kiến thức chung & quản trị rủi ro', '2. Thuật ngữ & chủ thể hợp đồng', '3. Nguyên tắc & phân loại bảo hiểm',
    '4. Bảo hiểm nhân thọ cơ bản', '5. Bảo hiểm sức khỏe', '6. Hợp đồng bảo hiểm & pháp luật', WEAK_TOPIC, '8. Tình huống tổng hợp'
  ];
  const weakQuestion = await db.get(`SELECT * FROM test_questions WHERE topic = ? ORDER BY RANDOM() LIMIT 1`, [WEAK_TOPIC]);
  const clusterQuestion = await db.get(`SELECT * FROM test_questions WHERE topic = ? AND id != ? ORDER BY RANDOM() LIMIT 1`, [WEAK_TOPIC, weakQuestion?.id ?? -1]);

  // Learners flagged to form the misconception cluster in round 3 (spec: 12 learners, 9 high-confidence).
  const clusterLearnerIndices = new Set(Array.from({ length: 12 }, (_, i) => i));
  const strongLearnerIndices = new Set(Array.from({ length: 8 }, (_, i) => LEARNER_COUNT - 1 - i));

  let mockExamIds = [];
  for (let round = 0; round < 3; round++) {
    const mockExamResult = await db.run(
      `INSERT INTO studio_mock_exams (cohort_id, title, round_number, scheduled_at) VALUES (?, ?, ?, ?)`,
      [cohortId, `Thi thử vòng ${round + 1}`, round + 1, new Date(Date.now() - (2 - round) * 14 * 86400000).toISOString()]
    );
    mockExamIds.push(mockExamResult.lastID);
    const targetAvg = ROUND_TARGET_AVERAGES[round];

    for (let li = 0; li < learnerIds.length; li++) {
      const { id: learnerId } = learnerIds[li];
      const isStrong = strongLearnerIndices.has(li);
      const isInCluster = clusterLearnerIndices.has(li) && round === 2; // cluster manifests in the latest round
      const personalOffset = isStrong ? rand(8, 15) : rand(-10, 5);
      const score = clamp(targetAvg + personalOffset + rand(-5, 5), 20, 98);
      const totalQuestions = 40;
      const correctCount = Math.round((score / 100) * totalQuestions);

      const attemptResult = await db.run(
        `INSERT INTO studio_mock_exam_attempts (mock_exam_id, learner_id, score, total_questions, correct_count, unanswered_count, completion_time_seconds, summit_readiness_before)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [mockExamIds[round], learnerId, score, totalQuestions, correctCount, rand(0, 2), rand(1800, 3400), clamp(score - rand(0, 15), 10, 95)]
      );
      const attemptId = attemptResult.lastID;

      // A representative sample of per-topic answers (not all 40 — enough for meaningful analytics).
      for (const topic of topics) {
        const isWeakTopic = topic === WEAK_TOPIC;
        let correctChance = isWeakTopic ? 0.5 : 0.78;
        if (isStrong) correctChance += 0.15;
        if (!isStrong && !isWeakTopic) correctChance -= 0.05;

        const isCorrect = Math.random() < clamp(correctChance, 0.05, 0.97);
        const confidence = Math.random() < 0.4 ? 'certain' : Math.random() < 0.7 ? 'fairly_sure' : 'guessing';
        let mistakeType = null;
        let questionText = `Câu hỏi mẫu về ${topic.replace(/^\d+\.\s*/, '')}`;
        let selectedOption = isCorrect ? 0 : 1;
        let correctOption = 0;

        if (!isCorrect) mistakeType = isWeakTopic ? MISTAKE_TYPES.CONCEPT_CONFUSION : MISTAKE_TYPES.KNOWLEDGE_GAP;

        // Seed the exact misconception cluster + the "92% incorrect" question in round 3.
        if (round === 2 && isWeakTopic && isInCluster && clusterQuestion) {
          questionText = clusterQuestion.question;
          selectedOption = 2;
          correctOption = ['A', 'B', 'C', 'D'].indexOf(clusterQuestion.answer);
          const forcedCorrect = false;
          await db.run(
            `INSERT INTO studio_mock_exam_answers (attempt_id, question_text, selected_option, correct_option, is_correct, response_time_ms, confidence, mistake_type, skill_name, topic)
             VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
            [attemptId, questionText, selectedOption, correctOption, rand(15000, 30000), li < 9 ? 'certain' : 'fairly_sure', MISTAKE_TYPES.CONCEPT_CONFUSION, 'Nghĩa vụ đại lý', WEAK_TOPIC]
          );
          continue;
        }

        // Seed the "question with 92% incorrect rate" scenario for every learner in round 3.
        if (round === 2 && isWeakTopic && weakQuestion && Math.random() < 0.92) {
          await db.run(
            `INSERT INTO studio_mock_exam_answers (attempt_id, question_text, selected_option, correct_option, is_correct, response_time_ms, confidence, mistake_type, skill_name, topic)
             VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
            [attemptId, weakQuestion.question, (['A', 'B', 'C', 'D'].indexOf(weakQuestion.answer) + 1) % 4, ['A', 'B', 'C', 'D'].indexOf(weakQuestion.answer), rand(10000, 25000), confidence, MISTAKE_TYPES.KNOWLEDGE_GAP, 'Nghĩa vụ đại lý', WEAK_TOPIC]
          );
          continue;
        }

        await db.run(
          `INSERT INTO studio_mock_exam_answers (attempt_id, question_text, selected_option, correct_option, is_correct, response_time_ms, confidence, mistake_type, skill_name, topic)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [attemptId, questionText, selectedOption, correctOption, isCorrect ? 1 : 0, rand(15000, 60000), confidence, mistakeType, topic.replace(/^\d+\.\s*/, ''), topic]
        );
      }
    }
  }

  // ── 6. Misconception cluster detection + persistence ────────────────────
  const round3Answers = await db.all(
    `SELECT a.*, att.learner_id FROM studio_mock_exam_answers a
     JOIN studio_mock_exam_attempts att ON a.attempt_id = att.id
     WHERE att.mock_exam_id = ?`,
    [mockExamIds[2]]
  );
  const clusters = clusterMisconceptions(round3Answers.map((a) => ({
    learnerId: a.learner_id, topic: a.topic, questionId: null, selectedOption: a.selected_option,
    isCorrect: !!a.is_correct, confidence: a.confidence, mistakeType: a.mistake_type, mastery: 43
  })));

  let interventionId = null;
  if (clusters.length > 0) {
    const topCluster = clusters[0];
    const clusterResult = await db.run(
      `INSERT INTO studio_misconception_clusters (cohort_id, mock_exam_id, topic, mistake_type, title, learner_count, high_confidence_count, average_mastery)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [cohortId, mockExamIds[2], topCluster.topic, topCluster.mistakeType, 'Đại lý và doanh nghiệp — ai chịu trách nhiệm?', topCluster.learnerCount, topCluster.highConfidenceCount, topCluster.averageMastery]
    );
    for (const learnerId of topCluster.learnerIds) {
      await db.run('INSERT OR IGNORE INTO studio_misconception_cluster_learners (cluster_id, learner_id) VALUES (?, ?)', [clusterResult.lastID, learnerId]);
    }

    // ── 7. Intervention generated, approved, assigned, with before/after results ──
    const intervention = await generateIntervention(db, { topic: topCluster.topic, mistakeType: topCluster.mistakeType, learnerCount: topCluster.learnerCount, durationMinutes: 10 });
    const interventionResult = await db.run(
      `INSERT INTO studio_interventions (cluster_id, cohort_id, title, topic, mistake_type, duration_minutes, content, status, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'assigned', CURRENT_TIMESTAMP)`,
      [clusterResult.lastID, cohortId, intervention.title, topCluster.topic, topCluster.mistakeType, 10, JSON.stringify(intervention)]
    );
    interventionId = interventionResult.lastID;

    for (let i = 0; i < topCluster.learnerIds.length; i++) {
      const learnerId = topCluster.learnerIds[i];
      const completed = i < 10; // 10 of 12 completed, matching spec §23's demo numbers
      await db.run(
        `INSERT INTO studio_intervention_assignments (intervention_id, learner_id, completed_at) VALUES (?, ?, ?)`,
        [interventionId, learnerId, completed ? new Date().toISOString() : null]
      );
      await db.run(
        `INSERT INTO studio_intervention_results (intervention_id, learner_id, mastery_before, mastery_after, completed, completed_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [interventionId, learnerId, rand(38, 48), completed ? rand(60, 75) : null, completed ? 1 : 0, completed ? new Date().toISOString() : null]
      );
    }
  }

  console.log('\nLlama Studio demo scenario ready:');
  console.log(`  Trainer login: ${TRAINER_USERNAME} / ${TRAINER_PASSWORD}`);
  console.log(`  Course: "Chứng chỉ Đại lý Bảo hiểm MOF" (${curriculum.camps.length} camps, ${curriculum.lessons.length} lessons), health score ${quality.healthScore}/100`);
  console.log(`  Cohort: "MOF Cohort July" — ${LEARNER_COUNT} learners, 3 mock exam rounds (avg ${ROUND_TARGET_AVERAGES.join(' → ')})`);
  console.log(`  Weakest topic: "${WEAK_TOPIC}"`);
  if (interventionId) console.log(`  Misconception cluster + Rescue Expedition (id ${interventionId}) seeded with before/after results.`);
  process.exit(0);
}

main().catch((err) => { console.error('Studio demo seed failed:', err); process.exit(1); });
