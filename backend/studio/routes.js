// Llama Studio API routes (spec §4-18). Mounted from server.js, reusing the
// existing authenticateToken middleware. Every route additionally requires
// the caller's role to be 'trainer' (except read-only endpoints a learner
// might legitimately hit, of which there are none here — Studio is
// trainer-only end to end).

import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { getDb } from '../db.js';
import { storeDocument, decodeUploadedFilename } from '../knowledgeBase.js';
import {
  generateCourseBlueprint, regenerateCampLessons, regenerateLessonDetails,
  generateContentFromDocument, generateContentForLesson, generateContentForCourse,
  explainCurriculumDecision, suggestQualityFix, suggestQuestionRewrite, generateIntervention, summarizeMockExamInsight, summarizeLearnerInsight, answerTrainerQuestion
} from './studioAIService.js';
import { checkCourseQuality } from './engines/courseQuality.js';
import { calculateCohortOverview, calculateTopicPerformance, classifyTrend } from './engines/mockExamAnalytics.js';
import { detectLearnerRisk, RISK_STATUS } from './engines/learnerRisk.js';
import { detectOutlierPatterns } from './engines/outlierPatterns.js';
import { analyzeQuestionQuality } from './engines/questionQuality.js';
import { clusterMisconceptions } from './engines/misconceptionCluster.js';
import { calculateInterventionEffectiveness } from './engines/interventionEffectiveness.js';
import { computeSummitReadiness } from '../engines/adaptiveLoop.js';

// The JWT payload only carries {id, username} (see server.js authenticateToken),
// so role must be re-checked against the DB per request rather than trusted
// from the token — same reasoning authenticateToken itself uses for account
// existence. This also attaches req.db so downstream handlers share one
// connection per request instead of each calling getDb() separately.
async function requireTrainer(req, res, next) {
  try {
    const db = await getDb();
    req.db = db;
    const user = await db.get('SELECT role FROM users WHERE id = ?', [req.user.id]);
    if (!user || user.role !== 'trainer') return res.status(403).json({ error: 'Chỉ trainer mới truy cập được Llama Studio.' });
    req.user.role = user.role;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function parseJSON(value, fallback) {
  if (value == null) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

// PPTX is a zip of slide XML files (ppt/slides/slideN.xml) — no dedicated
// pptx library is needed just for plain-text extraction, only a zip reader.
async function extractPptxText(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  const slideTexts = [];
  for (const name of slideFiles) {
    const xml = await zip.files[name].async('string');
    const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
    if (runs.length) slideTexts.push(runs.join(' '));
  }
  return slideTexts.join('\n\n');
}

function extractXlsxText(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return workbook.SheetNames
    .map((name) => `Sheet: ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`)
    .join('\n\n');
}

async function loadCourseBundle(db, courseId) {
  const course = await db.get('SELECT * FROM studio_courses WHERE id = ?', [courseId]);
  if (!course) return null;
  const camps = await db.all('SELECT * FROM studio_camps WHERE course_id = ? ORDER BY order_index', [courseId]);
  const lessons = await db.all(
    `SELECT l.* FROM studio_lessons l JOIN studio_camps c ON l.camp_id = c.id WHERE c.course_id = ? ORDER BY l.order_index`,
    [courseId]
  );
  const lessonIds = lessons.map((l) => l.id);
  const contentItems = lessonIds.length
    ? await db.all(`SELECT * FROM studio_content_items WHERE lesson_id IN (${lessonIds.join(',')})`)
    : [];
  const prereqRows = lessonIds.length
    ? await db.all(`SELECT lesson_id, prerequisite_lesson_id FROM studio_lesson_prerequisites WHERE lesson_id IN (${lessonIds.join(',')})`)
    : [];
  const prereqMap = new Map();
  for (const row of prereqRows) {
    if (!prereqMap.has(row.lesson_id)) prereqMap.set(row.lesson_id, []);
    prereqMap.get(row.lesson_id).push(row.prerequisite_lesson_id);
  }
  return { course, camps, lessons, contentItems, prereqMap };
}

function toContentItemDTO(c) {
  return {
    id: c.id, lessonId: c.lesson_id, contentType: c.content_type, title: c.title, questionText: c.question_text,
    options: parseJSON(c.options, []), correctOption: c.correct_option, explanation: c.explanation,
    difficulty: c.difficulty, cognitiveLevel: c.cognitive_level, front: c.front, back: c.back, keyword: c.keyword,
    sourceChunkIds: parseJSON(c.source_chunk_ids, []), sourceTitle: c.source_title, sourceVersion: c.source_version,
    generatedAt: c.generated_at, aiGenerated: !!c.ai_generated, status: c.status, trainerEdited: !!c.trainer_edited,
    publishedQuestionId: c.published_question_id, publishedFlashcardId: c.published_flashcard_id
  };
}

function toLessonDTO(l, prereqMap = null) {
  return {
    id: l.id, campId: l.camp_id, title: l.title, description: l.description, learningOutcomeId: l.learning_outcome_id,
    skillIds: parseJSON(l.skill_ids, []), estimatedMinutes: l.estimated_minutes, difficulty: l.difficulty,
    recommendedActivities: parseJSON(l.recommended_activities, []), examWeight: l.exam_weight,
    sourceChunkIds: parseJSON(l.source_chunk_ids, []), status: l.status, aiLocked: !!l.ai_locked, orderIndex: l.order_index,
    prerequisiteLessonIds: prereqMap?.get(l.id) || []
  };
}

const SUPPORTED_UPLOAD_EXTENSIONS = ['.pdf', '.txt', '.docx', '.pptx', '.xlsx', '.xls'];
const studioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = decodeUploadedFilename(file.originalname).toLowerCase();
    if (SUPPORTED_UPLOAD_EXTENSIONS.some((ext) => name.endsWith(ext))) return cb(null, true);
    cb(new Error('Định dạng file không được hỗ trợ. Chỉ nhận PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx/.xls) hoặc .txt.'));
  }
});
// No global multer error-handling middleware exists in server.js, so a
// fileFilter rejection would otherwise fall through to Express's default
// HTML error page instead of this API's usual {error} JSON shape.
function handleKnowledgeUpload(req, res, next) {
  studioUpload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

async function getCohortMockExams(db, cohortId) {
  return db.all('SELECT * FROM studio_mock_exams WHERE cohort_id = ? ORDER BY round_number', [cohortId]);
}

// Roster size for the "attempted N/M" KPI — attemptedCount (from
// calculateCohortOverview) is only ever attempt-row count, never compared
// against how many learners are actually enrolled in the cohort.
export async function getCohortRosterSize(db, cohortId) {
  const row = await db.get('SELECT COUNT(*) c FROM studio_cohort_learners WHERE cohort_id = ?', [cohortId]);
  return row.c;
}

// Interventions assigned to a specific learner, across any cluster/cohort —
// backs the learner-profile detail view's read-only "assigned interventions" card.
export async function getLearnerInterventions(db, learnerId) {
  return db.all(
    `SELECT sia.intervention_id as id, si.title, sia.completed_at
     FROM studio_intervention_assignments sia
     JOIN studio_interventions si ON si.id = sia.intervention_id
     WHERE sia.learner_id = ? ORDER BY sia.assigned_at DESC`,
    [learnerId]
  );
}

// Cohort roster membership — deliberately independent of quiz activity
// (unlike getRealLearnerAccounts below), so a trainer can add a learner the
// moment they enroll, before any attempt exists.
export async function getCohortRoster(db, cohortId) {
  return db.all(
    `SELECT u.id, u.username FROM studio_cohort_learners cl JOIN users u ON u.id = cl.learner_id WHERE cl.cohort_id = ? ORDER BY u.username`,
    [cohortId]
  );
}

export async function addLearnerToCohort(db, cohortId, learnerId) {
  await db.run('INSERT OR IGNORE INTO studio_cohort_learners (cohort_id, learner_id) VALUES (?, ?)', [cohortId, learnerId]);
}

export async function removeLearnerFromCohort(db, cohortId, learnerId) {
  await db.run('DELETE FROM studio_cohort_learners WHERE cohort_id = ? AND learner_id = ?', [cohortId, learnerId]);
}

// All real (non-trainer) accounts, regardless of activity — the pool a
// trainer picks from when adding someone to a cohort roster.
export async function getAllLearnerAccounts(db) {
  return db.all("SELECT id, username FROM users WHERE role IS NULL OR role != 'trainer' ORDER BY username");
}

// Real learners (spec follow-up): reuses the same deterministic engines as
// the cohort/mock-exam demo, but reads from the actual learner-app tables
// (user_quizzes/user_quiz_answers/topic_mastery) instead of the seeded
// studio_mock_exam_* demo data — this is the trainer's real student roster,
// not the hackathon-demo cohort.
async function computeRealLearnerSummary(db, learner) {
  const quizzes = await db.all('SELECT score, total_questions, created_at FROM user_quizzes WHERE user_id = ? ORDER BY created_at', [learner.id]);
  const scores = quizzes.map((q) => Math.round((q.score / q.total_questions) * 100));
  const prefs = await db.get('SELECT target_score, exam_date FROM learner_preferences WHERE user_id = ?', [learner.id]);
  const daysUntilExam = prefs?.exam_date ? Math.max(0, Math.round((new Date(prefs.exam_date) - new Date()) / 86400000)) : undefined;
  const summitReadiness = await computeSummitReadiness(db, learner.id);
  const answers = await db.all(
    `SELECT ua.id, ua.topic, ua.is_correct, ua.confidence, ua.mistake_type, ua.difficulty, ua.response_time_ms
     FROM user_quiz_answers ua JOIN user_quizzes q ON ua.quiz_id = q.id WHERE q.user_id = ? ORDER BY ua.id ASC`,
    [learner.id]
  );
  const wrongAnswers = answers.filter((a) => !a.is_correct);
  const highConfidenceMistakeCount = wrongAnswers.filter((a) => a.confidence === 'certain').length;
  const mistakeCounts = {};
  for (const a of wrongAnswers) if (a.mistake_type) mistakeCounts[a.mistake_type] = (mistakeCounts[a.mistake_type] || 0) + 1;
  const commonMistakeType = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topicMastery = await db.all('SELECT topic, mastery_score FROM topic_mastery WHERE user_id = ? ORDER BY mastery_score ASC', [learner.id]);
  const weakestTopic = topicMastery[0]?.topic?.replace(/^\d+\.\s*/, '') ?? null;

  // Outlier-pattern detection inputs (spec: "học sinh cá biệt" — unusual
  // behavior, not just low mastery, which detectLearnerRisk already covers).
  const masteryHistoryRows = await db.all(
    'SELECT topic, mastery_score, created_at FROM mastery_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 60',
    [learner.id]
  );
  const masteryHistory = masteryHistoryRows.reverse().map((r) => ({ topic: r.topic, masteryScore: r.mastery_score, createdAt: r.created_at }));
  const rescueTrailRows = await db.all('SELECT completed_at FROM rescue_trail_log WHERE user_id = ?', [learner.id]);
  const qualifyingRescueOpportunityCount = wrongAnswers.filter(
    (a) => a.mistake_type === 'concept_confusion' || a.mistake_type === 'memory_decay'
  ).length;
  const topicMasteryByTopic = Object.fromEntries(topicMastery.map((t) => [t.topic, t.mastery_score]));

  const outlierPatterns = detectOutlierPatterns({
    masteryHistory,
    recentActivityCount: quizzes.length,
    answersChronological: answers.map((a) => ({ isCorrect: !!a.is_correct, difficulty: a.difficulty, responseTimeMs: a.response_time_ms, topic: a.topic })),
    topicMasteryByTopic,
    quizTimestampsChronological: quizzes.map((q) => q.created_at),
    qualifyingRescueOpportunityCount,
    rescueTrailOpenedCount: rescueTrailRows.length
  });

  return { quizzes, scores, prefs, daysUntilExam, summitReadiness, answers, highConfidenceMistakeCount, commonMistakeType, weakestTopic, masteryHistory, outlierPatterns };
}

// All real, non-trainer accounts that have actually studied (at least one
// quiz/exam attempt) — the trainer's real student roster. Pass cohortId to
// scope to that cohort's roster only (studio_cohort_learners) instead of
// every real learner account system-wide. Exported for direct node:test
// coverage of the cohort-scoping behavior.
export async function getRealLearnerAccounts(db, cohortId) {
  const learners = cohortId
    ? await db.all(
        `SELECT u.id, u.username FROM users u
         JOIN studio_cohort_learners cl ON cl.learner_id = u.id
         WHERE cl.cohort_id = ? AND (u.role IS NULL OR u.role != 'trainer')`,
        [cohortId]
      )
    : await db.all("SELECT id, username FROM users WHERE role IS NULL OR role != 'trainer'");
  const active = [];
  for (const learner of learners) {
    const hasActivity = await db.get('SELECT 1 FROM user_quizzes WHERE user_id = ? LIMIT 1', [learner.id]);
    if (hasActivity) active.push(learner);
  }
  return active;
}

export async function getRealLearnersWithRisk(db, cohortId) {
  const learners = await getRealLearnerAccounts(db, cohortId);
  const results = [];
  for (const learner of learners) {
    const summary = await computeRealLearnerSummary(db, learner);
    const risk = detectLearnerRisk({
      recentScoresChronological: summary.scores, targetScore: summary.prefs?.target_score || 70,
      summitReadiness: summary.summitReadiness, daysUntilExam: summary.daysUntilExam,
      highConfidenceMistakeCount: summary.highConfidenceMistakeCount,
      hasAttemptedAssigned: true, recentActivityCount: summary.quizzes.length
    });
    results.push({
      id: learner.id, name: learner.username, latestScore: summary.scores[summary.scores.length - 1] ?? null,
      scoreHistory: summary.scores, scoreTrend: classifyTrend(summary.scores), status: risk.status, reasons: risk.reasons,
      recommendedAction: risk.recommendedAction, weakestTopic: summary.weakestTopic, commonMistakeType: summary.commonMistakeType,
      outlierPatterns: summary.outlierPatterns,
      summitReadinessScore: summary.summitReadiness.score,
      lastActivityAt: summary.quizzes[summary.quizzes.length - 1]?.created_at ?? null
    });
  }
  return results;
}

// Cohort Summit Journey (Overview dashboard): buckets learners into stages
// that mirror the real camp COUNT of the course they're actually studying
// (e.g. MOF's 4 camps), rather than an invented generic stage taxonomy — the
// mountain a trainer sees should have as many steps as their learners'
// actual mountain. The final camp is always relabeled "Summit" (reaching it
// means exam-ready), so an N-camp course yields exactly N stages. Labels are
// positional ("Base Camp", "Camp 1", "Camp 2", ..., "Summit") rather than
// parsed from each camp's own title — a trainer renaming a camp (e.g.
// dropping the "Base Camp:"/"Camp 1:" prefix down to just its topic) must
// never silently break this label, since the two are otherwise unrelated.
// Score bands (which decide which stage a learner currently sits in) split
// the real Summit Readiness score (computeSummitReadiness) into N equal
// ranges.
const NON_LAST_STAGE_ICONS = ['⛺', '🧗', '🏕️', '🥾'];

export function buildJourneyStages(camps) {
  return camps.map((camp, i) => {
    const isFirst = i === 0;
    const isLast = i === camps.length - 1;
    const label = isLast ? 'Summit' : (isFirst ? 'Base Camp' : `Camp ${i}`);
    const maxScore = isLast ? 100 : Math.round(((i + 1) / camps.length) * 100) - 1;
    const icon = isLast ? '🏔️' : NON_LAST_STAGE_ICONS[Math.min(i, NON_LAST_STAGE_ICONS.length - 1)];
    return { key: isLast ? 'summit' : `stage${i}`, icon, label, maxScore };
  });
}

export function journeyStageForScore(score, stages) {
  return stages.find((s) => score <= s.maxScore) || stages[stages.length - 1];
}

// A learner's real position on Llama Learner's own Camp Map (LessonPath.jsx)
// is simply how many of the core lessons they've completed in sequence —
// 0 done = still at Base Camp, 1 done = now at Camp 1, etc., capped at the
// last stage (Summit) once every lesson is done. This is the literal same
// signal the learner sees checked off in their own app, unlike an indirect
// mastery-score composite that can lag behind real lesson completion.
export function journeyStageForCompletedCount(completedCount, stages) {
  return stages[Math.min(completedCount, stages.length - 1)];
}

const EMPTY_JOURNEY = { stages: [], total: 0, medianStageKey: null, modeStageKey: null, movedForwardCount: 0, noProgressCount: 0, needsInterventionCount: 0 };

// `learnersWithRisk` is the already-computed getRealLearnersWithRisk(db)
// result (system-wide) — only consulted here for the needsIntervention
// signal, since that risk detection is a distinct (quiz-history-based)
// concern from real lesson-completion progress.
export async function computeCohortJourney(db, learnersWithRisk) {
  const course = await db.get("SELECT * FROM studio_courses WHERE status = 'PUBLISHED' ORDER BY id LIMIT 1");
  if (!course) return EMPTY_JOURNEY;

  // Stage count/labels mirror Llama Learner's own Camp Map — the fixed,
  // real core-lesson sequence (`lessons`, ordered) every learner actually
  // studies through — not the trainer-authored studio_camps (a separate
  // content-authoring system that doesn't drive what a learner sees today).
  const legacyLessons = await db.all('SELECT id FROM lessons ORDER BY order_index ASC');
  if (legacyLessons.length === 0) return EMPTY_JOURNEY;

  const stages = buildJourneyStages(legacyLessons);
  const rosterRows = await db.all(
    `SELECT DISTINCT learner_id FROM studio_cohort_learners WHERE cohort_id IN (SELECT id FROM studio_cohorts WHERE course_id = ?)`,
    [course.id]
  );
  const rosterIds = rosterRows.map((r) => r.learner_id);
  const stageCounts = Object.fromEntries(stages.map((s) => [s.key, 0]));
  let movedForwardCount = 0, noProgressCount = 0, needsInterventionCount = 0;
  const sevenDaysAgo = Date.now() - 7 * 86400000;

  const legacyLessonIds = new Set(legacyLessons.map((l) => l.id));
  const riskByLearnerId = new Map((learnersWithRisk || []).map((l) => [l.id, l]));

  const completionRows = rosterIds.length
    ? await db.all(
        `SELECT user_id, lesson_id, completed_at FROM user_lessons WHERE user_id IN (${rosterIds.map(() => '?').join(',')})`,
        rosterIds
      )
    : [];
  const completionsByLearner = new Map();
  for (const row of completionRows) {
    if (!legacyLessonIds.has(row.lesson_id)) continue;
    if (!completionsByLearner.has(row.user_id)) completionsByLearner.set(row.user_id, []);
    completionsByLearner.get(row.user_id).push(row);
  }

  for (const learnerId of rosterIds) {
    const completions = completionsByLearner.get(learnerId) || [];
    const stage = journeyStageForCompletedCount(completions.length, stages);
    stageCounts[stage.key]++;

    if (completions.length > 0) {
      const latestCompletedAt = completions.reduce((max, r) => (!max || r.completed_at > max ? r.completed_at : max), null);
      const lastMs = new Date(latestCompletedAt).getTime();
      if (lastMs >= sevenDaysAgo) movedForwardCount++;
      else noProgressCount++;
    }
    if (riskByLearnerId.get(learnerId)?.status === RISK_STATUS.NEEDS_HELP_NOW) needsInterventionCount++;
  }

  const stagesOut = stages.map((s) => ({ key: s.key, icon: s.icon, label: s.label, count: stageCounts[s.key] }));
  const total = stagesOut.reduce((sum, s) => sum + s.count, 0);
  let cumulative = 0;
  let medianStageKey = stagesOut[0]?.key ?? null;
  for (const s of stagesOut) {
    cumulative += s.count;
    if (total > 0 && cumulative >= total / 2) { medianStageKey = s.key; break; }
  }
  const modeStage = stagesOut.reduce((best, s) => (s.count > (best?.count ?? -1) ? s : best), null);

  return { stages: stagesOut, total, medianStageKey, modeStageKey: modeStage?.key ?? null, movedForwardCount, noProgressCount, needsInterventionCount };
}

export function mountStudioRoutes(app, authenticateToken) {
  const T = [authenticateToken, requireTrainer];

  // ── Overview ────────────────────────────────────────────────────────────
  app.get('/api/studio/overview', ...T, async (req, res) => {
    const db = req.db;
    try {
      const courses = await db.all('SELECT * FROM studio_courses');
      const cohorts = await db.all('SELECT * FROM studio_cohorts');
      const cohortIds = cohorts.map((c) => c.id);
      const learnerCountRow = cohortIds.length
        ? await db.get(`SELECT COUNT(DISTINCT learner_id) c FROM studio_cohort_learners WHERE cohort_id IN (${cohortIds.join(',')})`)
        : { c: 0 };

      let averageScore = null, averagePassRate = null;
      let mockExamTrend = [];
      if (cohortIds.length) {
        const exams = await db.all(
          `SELECT id, round_number FROM studio_mock_exams WHERE cohort_id IN (${cohortIds.join(',')}) ORDER BY round_number ASC`
        );
        for (const exam of exams) {
          const attempts = await db.all('SELECT * FROM studio_mock_exam_attempts WHERE mock_exam_id = ?', [exam.id]);
          if (attempts.length === 0) continue;
          const overview = calculateCohortOverview(attempts.map((a) => ({ score: a.score, totalQuestions: a.total_questions, completionTimeSeconds: a.completion_time_seconds, summitReadinessBefore: a.summit_readiness_before })), 70);
          mockExamTrend.push({ round: exam.round_number, averageScore: overview.averageScore, passRate: overview.passRate });
        }
        if (mockExamTrend.length > 0) {
          averageScore = mockExamTrend[mockExamTrend.length - 1].averageScore;
          averagePassRate = mockExamTrend[mockExamTrend.length - 1].passRate;
        }
      }

      const clustersOpen = cohortIds.length
        ? await db.get(`SELECT COUNT(*) c FROM studio_misconception_clusters WHERE cohort_id IN (${cohortIds.join(',')}) AND status = 'open'`)
        : { c: 0 };
      const coursesNeedingReview = courses.filter((c) => c.status === 'AI_DRAFT' || (c.health_score ?? 100) < 70).length;

      const learnersWithRisk = await getRealLearnersWithRisk(db);
      const learnersNeedingAttention = learnersWithRisk.filter(
        (l) => l.status === RISK_STATUS.NEEDS_HELP_NOW || l.status === RISK_STATUS.NEEDS_MONITORING || (l.outlierPatterns || []).length > 0
      ).length;

      const cohortResults = [];
      for (const cohort of cohorts) {
        const rosterRow = await db.get('SELECT COUNT(DISTINCT learner_id) c FROM studio_cohort_learners WHERE cohort_id = ?', [cohort.id]);
        const latestExam = await db.get(
          'SELECT id, round_number FROM studio_mock_exams WHERE cohort_id = ? ORDER BY round_number DESC LIMIT 1', [cohort.id]
        );
        let cohortAvgScore = null, cohortPassRate = null;
        if (latestExam) {
          const attempts = await db.all('SELECT * FROM studio_mock_exam_attempts WHERE mock_exam_id = ?', [latestExam.id]);
          if (attempts.length > 0) {
            const cohortOverview = calculateCohortOverview(attempts.map((a) => ({ score: a.score, totalQuestions: a.total_questions, completionTimeSeconds: a.completion_time_seconds, summitReadinessBefore: a.summit_readiness_before })), 70);
            cohortAvgScore = cohortOverview.averageScore;
            cohortPassRate = cohortOverview.passRate;
          }
        }
        const course = courses.find((c) => c.id === cohort.course_id);
        cohortResults.push({
          id: cohort.id, name: cohort.name, courseTitle: course?.title ?? null,
          learnerCount: rosterRow.c, averageScore: cohortAvgScore, passRate: cohortPassRate
        });
      }

      // ── Trainer Action Queue: up to 3 real, actionable items — never
      // filler. Each kind only appears when its underlying data actually
      // exists (an open cluster, an unhealthy checked course, pending
      // drafts) rather than always showing exactly 3.
      const topCluster = cohortIds.length
        ? await db.get(
            `SELECT * FROM studio_misconception_clusters WHERE cohort_id IN (${cohortIds.join(',')}) AND status = 'open' ORDER BY learner_count DESC LIMIT 1`
          )
        : null;

      const worstCourse = courses
        .filter((c) => c.health_score != null && c.health_score < 70)
        .sort((a, b) => a.health_score - b.health_score)[0] || null;
      let worstCourseTopIssue = null;
      if (worstCourse) {
        const latestCheck = await db.get('SELECT id FROM studio_quality_checks WHERE course_id = ? ORDER BY id DESC LIMIT 1', [worstCourse.id]);
        if (latestCheck) {
          worstCourseTopIssue = await db.get(
            `SELECT * FROM studio_quality_issues WHERE quality_check_id = ? AND status = 'open'
             ORDER BY CASE severity WHEN 'BLOCKER' THEN 0 WHEN 'WARNING' THEN 1 WHEN 'SUGGESTION' THEN 2 ELSE 3 END LIMIT 1`,
            [latestCheck.id]
          );
        }
      }
      const aiDraftRow = await db.get("SELECT COUNT(*) c FROM studio_content_items WHERE status = 'AI_DRAFT'");

      const actionQueue = [];
      if (topCluster) {
        actionQueue.push({
          kind: 'urgent', clusterId: topCluster.id, cohortId: topCluster.cohort_id, topic: topCluster.topic,
          mistakeType: topCluster.mistake_type, learnerCount: topCluster.learner_count,
          confidentWrongPercent: topCluster.learner_count > 0 ? Math.round((topCluster.high_confidence_count / topCluster.learner_count) * 100) : 0
        });
      }
      if (worstCourse) {
        actionQueue.push({
          kind: 'courseReview', courseId: worstCourse.id, courseTitle: worstCourse.title, healthScore: worstCourse.health_score,
          topIssueMessage: worstCourseTopIssue?.message ?? null
        });
      }
      if (aiDraftRow.c > 0) {
        actionQueue.push({ kind: 'aiDrafts', count: aiDraftRow.c });
      }

      const cohortJourney = await computeCohortJourney(db, learnersWithRisk);

      res.json({
        activeCourses: courses.length,
        activeLearners: learnerCountRow.c,
        averageMockExamScore: averageScore,
        estimatedPassRate: averagePassRate,
        mockExamTrend,
        coursesNeedingReview,
        misconceptionClustersOpen: clustersOpen.c,
        learnersNeedingAttention,
        courses: courses.map((c) => ({ id: c.id, title: c.title, status: c.status, healthScore: c.health_score })),
        cohortResults,
        cohortJourney,
        actionQueue
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Course creation + AI Course Architect ───────────────────────────────
  app.post('/api/studio/courses', ...T, async (req, res) => {
    const {
      title, description, targetGroup, durationWeeks, examDate, learningGoal, targetScore, preferredCamps, difficultyTarget, assessmentTarget,
      genFlashcards, genQuiz, randomizeQuestions, quizCountPerLesson, flashcardCountPerLesson
    } = req.body;
    const db = req.db;
    try {
      const result = await db.run(
        `INSERT INTO studio_courses (trainer_id, title, description, target_group, duration_weeks, exam_date, learning_goal, target_score, preferred_camps, difficulty_target, assessment_target, gen_flashcards, gen_quiz, randomize_questions, quiz_count_per_lesson, flashcard_count_per_lesson)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id, title, description || '', targetGroup || '', durationWeeks || 4, examDate || null, learningGoal || '', targetScore || 70, preferredCamps || 4, difficultyTarget || 'balanced', assessmentTarget || '',
          genFlashcards === false ? 0 : 1, genQuiz === false ? 0 : 1, randomizeQuestions ? 1 : 0,
          quizCountPerLesson || 3, flashcardCountPerLesson || 5
        ]
      );
      res.status(201).json({ id: result.lastID });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/studio/courses', ...T, async (req, res) => {
    try {
      const courses = await req.db.all('SELECT * FROM studio_courses ORDER BY created_at DESC');
      res.json(courses);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/studio/courses/:id', ...T, async (req, res) => {
    const db = req.db;
    try {
      const bundle = await loadCourseBundle(db, req.params.id);
      if (!bundle) return res.status(404).json({ error: 'Không tìm thấy khóa học' });
      res.json({
        course: { ...bundle.course, outcomes: parseJSON(bundle.course.outcomes, []) },
        camps: bundle.camps,
        lessons: bundle.lessons.map((l) => toLessonDTO(l, bundle.prereqMap)),
        contentItems: bundle.contentItems.map(toContentItemDTO)
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.delete('/api/studio/courses/:id', ...T, async (req, res) => {
    const db = req.db;
    try {
      const course = await db.get('SELECT id FROM studio_courses WHERE id = ?', [req.params.id]);
      if (!course) return res.status(404).json({ error: 'Không tìm thấy khóa học' });
      // knowledge_documents.course_id has no FK/cascade (added via a later
      // ALTER TABLE) — clean those up manually; everything else (camps,
      // lessons, content items, quality history, cohorts + roster) cascades
      // off studio_courses via real foreign keys. Already-published
      // questions/flashcards live in test_questions/flashcards with no link
      // back here, so learners keep whatever was already published.
      await db.run('DELETE FROM knowledge_documents WHERE course_id = ?', [course.id]);
      await db.run('DELETE FROM studio_courses WHERE id = ?', [course.id]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Preview-only: generates a Course Blueprint (title/outcomes/camps/lessons
  // — no lesson content, quizzes, or flashcards) and returns it WITHOUT
  // persisting anything. The wizard's "Start building" and CourseDetail's
  // "Regenerate curriculum" both hit this, then show the result as a
  // Blueprint Preview for the trainer to review/edit before calling
  // blueprint/confirm below to actually save it. Safe to call regardless of
  // existing approved/published content, since nothing changes yet.
  app.post('/api/studio/courses/:id/blueprint/generate', ...T, async (req, res) => {
    const db = req.db;
    try {
      const course = await db.get('SELECT * FROM studio_courses WHERE id = ?', [req.params.id]);
      if (!course) return res.status(404).json({ error: 'Không tìm thấy khóa học' });
      const blueprint = await generateCourseBlueprint(db, {
        courseId: course.id, courseTitle: course.title, prompt: req.body.prompt || '', preferredCamps: course.preferred_camps || 4
      });
      res.json({ blueprint });
    } catch (err) {
      res.status(err.code === 'VAGUE_INPUT' ? 400 : 500).json({ error: err.message, code: err.code });
    }
  });

  // Persists a (possibly trainer-tweaked) Course Blueprint: replaces every
  // camp/lesson/prerequisite for this course and stores the course-level
  // outcomes. Blocked once anything has been approved/published — same
  // "never silently destroy confirmed work" rule as before; manual
  // add/edit/delete or the single-camp/lesson regenerate routes below take
  // over from there.
  app.post('/api/studio/courses/:id/blueprint/confirm', ...T, async (req, res) => {
    const db = req.db;
    try {
      const course = await db.get('SELECT * FROM studio_courses WHERE id = ?', [req.params.id]);
      if (!course) return res.status(404).json({ error: 'Không tìm thấy khóa học' });

      const approvedLesson = await db.get(
        `SELECT 1 FROM studio_lessons l JOIN studio_camps c ON l.camp_id = c.id
         WHERE c.course_id = ? AND l.status IN ('APPROVED', 'PUBLISHED') LIMIT 1`,
        [course.id]
      );
      const approvedContent = await db.get(
        `SELECT 1 FROM studio_content_items ci JOIN studio_lessons l ON ci.lesson_id = l.id JOIN studio_camps c ON l.camp_id = c.id
         WHERE c.course_id = ? AND (ci.status IN ('APPROVED', 'PUBLISHED') OR ci.published_question_id IS NOT NULL OR ci.published_flashcard_id IS NOT NULL) LIMIT 1`,
        [course.id]
      );
      if (approvedLesson || approvedContent) {
        return res.status(400).json({ error: 'Khóa học đã có nội dung được duyệt hoặc publish. Hãy dùng chức năng thêm/sửa/xoá camp và chặng học thủ công thay vì tạo lại toàn bộ, để tránh mất nội dung đã duyệt.' });
      }

      const blueprint = req.body.blueprint;
      if (!blueprint || !Array.isArray(blueprint.camps) || !Array.isArray(blueprint.lessons) || blueprint.camps.length === 0) {
        return res.status(400).json({ error: 'Thiếu dữ liệu blueprint.' });
      }

      await db.run('DELETE FROM studio_camps WHERE course_id = ?', [course.id]); // cascades lessons/content-items/prerequisites
      const campIds = [];
      for (const camp of blueprint.camps) {
        const r = await db.run('INSERT INTO studio_camps (course_id, title, order_index) VALUES (?, ?, ?)', [course.id, camp.title, campIds.length]);
        campIds.push(r.lastID);
      }

      const lessonIds = [];
      for (let i = 0; i < blueprint.lessons.length; i++) {
        const lesson = blueprint.lessons[i];
        const campId = campIds[lesson.campIndex] ?? campIds[0];
        const outcomeResult = await db.run('INSERT INTO studio_learning_outcomes (course_id, description) VALUES (?, ?)', [course.id, lesson.learningOutcome || '']);
        const r = await db.run(
          `INSERT INTO studio_lessons (camp_id, title, description, learning_outcome_id, estimated_minutes, difficulty, recommended_activities, exam_weight, source_chunk_ids, status, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AI_DRAFT', ?)`,
          [campId, lesson.title, lesson.summary || '', outcomeResult.lastID, lesson.estimatedMinutes, lesson.difficulty,
            JSON.stringify(['micro-lesson', 'flashcard', 'mcq']), blueprint.lessons.length ? Math.round((1 / blueprint.lessons.length) * 100) / 100 : 0.1,
            JSON.stringify(lesson.sourceChunkIds || []), i]
        );
        lessonIds.push(r.lastID);
      }
      for (let i = 0; i < blueprint.lessons.length; i++) {
        for (const prereqIndex of blueprint.lessons[i].prerequisiteIndexes || []) {
          if (lessonIds[prereqIndex] != null && lessonIds[prereqIndex] !== lessonIds[i]) {
            await db.run('INSERT OR IGNORE INTO studio_lesson_prerequisites (lesson_id, prerequisite_lesson_id) VALUES (?, ?)', [lessonIds[i], lessonIds[prereqIndex]]);
          }
        }
      }

      await db.run(
        "UPDATE studio_courses SET status = 'AI_DRAFT', outcomes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [JSON.stringify(blueprint.outcomes || []), course.id]
      );

      res.json({ campCount: campIds.length, lessonCount: lessonIds.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Manual camp/lesson CRUD (spec: trainer must be able to add/edit/delete
  // after AI generation, not only review a fixed proposal) ─────────────────
  app.post('/api/studio/courses/:id/camps', ...T, async (req, res) => {
    const db = req.db;
    try {
      const course = await db.get('SELECT id FROM studio_courses WHERE id = ?', [req.params.id]);
      if (!course) return res.status(404).json({ error: 'Không tìm thấy khóa học' });
      const { title } = req.body;
      if (!title?.trim()) return res.status(400).json({ error: 'Cần nhập tên camp' });
      const maxOrder = await db.get('SELECT MAX(order_index) m FROM studio_camps WHERE course_id = ?', [course.id]);
      const result = await db.run('INSERT INTO studio_camps (course_id, title, order_index) VALUES (?, ?, ?)', [course.id, title.trim(), (maxOrder?.m ?? -1) + 1]);
      res.status(201).json({ id: result.lastID });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.put('/api/studio/camps/:id', ...T, async (req, res) => {
    try {
      const { title } = req.body;
      await req.db.run('UPDATE studio_camps SET title = COALESCE(?, title) WHERE id = ?', [title, req.params.id]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.delete('/api/studio/camps/:id', ...T, async (req, res) => {
    const db = req.db;
    try {
      const blocked = await db.get(
        `SELECT 1 FROM studio_lessons l LEFT JOIN studio_content_items ci ON ci.lesson_id = l.id
         WHERE l.camp_id = ? AND (l.status = 'PUBLISHED' OR ci.published_question_id IS NOT NULL OR ci.published_flashcard_id IS NOT NULL) LIMIT 1`,
        [req.params.id]
      );
      if (blocked) return res.status(400).json({ error: 'Camp này có chặng học hoặc nội dung đã publish cho học viên, không thể xoá trực tiếp.' });
      await db.run('DELETE FROM studio_camps WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Regenerates ONLY this camp's lessons (via Gemini) — every other camp in
  // the course is untouched. Blocked if this camp already has an
  // approved/published lesson, same "never silently destroy confirmed work"
  // rule as the camp-delete route above.
  app.post('/api/studio/camps/:id/regenerate', ...T, async (req, res) => {
    const db = req.db;
    try {
      const camp = await db.get('SELECT * FROM studio_camps WHERE id = ?', [req.params.id]);
      if (!camp) return res.status(404).json({ error: 'Không tìm thấy camp' });
      const blocked = await db.get(
        `SELECT 1 FROM studio_lessons l LEFT JOIN studio_content_items ci ON ci.lesson_id = l.id
         WHERE l.camp_id = ? AND (l.status IN ('APPROVED', 'PUBLISHED') OR ci.published_question_id IS NOT NULL OR ci.published_flashcard_id IS NOT NULL) LIMIT 1`,
        [camp.id]
      );
      if (blocked) return res.status(400).json({ error: 'Camp này có chặng học hoặc nội dung đã duyệt/publish, không thể tạo lại tự động.' });

      const { lessons } = await regenerateCampLessons(db, { courseId: camp.course_id, campTitle: camp.title, prompt: req.body.prompt || '' });

      await db.run('DELETE FROM studio_lessons WHERE camp_id = ?', [camp.id]); // cascades content items + prerequisites
      let orderIndex = 0;
      for (const lesson of lessons) {
        const outcomeResult = await db.run('INSERT INTO studio_learning_outcomes (course_id, description) VALUES (?, ?)', [camp.course_id, lesson.learningOutcome || '']);
        await db.run(
          `INSERT INTO studio_lessons (camp_id, title, description, learning_outcome_id, estimated_minutes, difficulty, recommended_activities, exam_weight, source_chunk_ids, status, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AI_DRAFT', ?)`,
          [camp.id, lesson.title, lesson.summary || '', outcomeResult.lastID, lesson.estimatedMinutes, lesson.difficulty,
            JSON.stringify(['micro-lesson', 'flashcard', 'mcq']), Math.round((1 / lessons.length) * 100) / 100, JSON.stringify(lesson.sourceChunkIds || []), orderIndex++]
        );
      }
      res.json({ lessonCount: lessons.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Manually-created lessons start APPROVED — the trainer wrote it
  // themselves, same reasoning as manually-created content items.
  app.post('/api/studio/camps/:id/lessons', ...T, async (req, res) => {
    const db = req.db;
    try {
      const camp = await db.get('SELECT id FROM studio_camps WHERE id = ?', [req.params.id]);
      if (!camp) return res.status(404).json({ error: 'Không tìm thấy camp' });
      const { title, description, estimatedMinutes, difficulty } = req.body;
      if (!title?.trim()) return res.status(400).json({ error: 'Cần nhập tên chặng học' });
      const maxOrder = await db.get('SELECT MAX(order_index) m FROM studio_lessons WHERE camp_id = ?', [camp.id]);
      const result = await db.run(
        `INSERT INTO studio_lessons (camp_id, title, description, estimated_minutes, difficulty, status, order_index)
         VALUES (?, ?, ?, ?, ?, 'APPROVED', ?)`,
        [camp.id, title.trim(), description || '', estimatedMinutes || 15, difficulty || 'Trung bình', (maxOrder?.m ?? -1) + 1]
      );
      res.status(201).json({ id: result.lastID });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.put('/api/studio/lessons/:id', ...T, async (req, res) => {
    try {
      const { title, description, estimatedMinutes, difficulty } = req.body;
      await req.db.run(
        `UPDATE studio_lessons SET title = COALESCE(?, title), description = COALESCE(?, description),
           estimated_minutes = COALESCE(?, estimated_minutes), difficulty = COALESCE(?, difficulty)
         WHERE id = ?`,
        [title, description, estimatedMinutes, difficulty, req.params.id]
      );
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Regenerates ONLY this lesson's framing (title/summary/outcome/duration/
  // difficulty) via Gemini — never its content items (flashcards/quiz have
  // their own per-type regenerate under kit/generate) and never other
  // lessons. Blocked once approved/published, same rule as everywhere else.
  app.post('/api/studio/lessons/:id/regenerate-details', ...T, async (req, res) => {
    const db = req.db;
    try {
      const lesson = await db.get(
        `SELECT l.*, c.course_id, c.title as camp_title FROM studio_lessons l JOIN studio_camps c ON l.camp_id = c.id WHERE l.id = ?`,
        [req.params.id]
      );
      if (!lesson) return res.status(404).json({ error: 'Không tìm thấy chặng học' });
      if (lesson.status === 'APPROVED' || lesson.status === 'PUBLISHED') {
        return res.status(400).json({ error: 'Chặng học đã được duyệt/publish, không thể tạo lại tự động.' });
      }

      const { lesson: updated } = await regenerateLessonDetails(db, {
        courseId: lesson.course_id, lessonTitle: lesson.title, campTitle: lesson.camp_title, prompt: req.body.prompt || ''
      });

      const outcomeResult = await db.run('INSERT INTO studio_learning_outcomes (course_id, description) VALUES (?, ?)', [lesson.course_id, updated.learningOutcome || '']);
      await db.run(
        `UPDATE studio_lessons SET title = ?, description = ?, learning_outcome_id = ?, estimated_minutes = ?, difficulty = ?, source_chunk_ids = ? WHERE id = ?`,
        [updated.title, updated.summary || '', outcomeResult.lastID, updated.estimatedMinutes, updated.difficulty, JSON.stringify(updated.sourceChunkIds || []), lesson.id]
      );
      res.json({ success: true, title: updated.title });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.delete('/api/studio/lessons/:id', ...T, async (req, res) => {
    const db = req.db;
    try {
      const lesson = await db.get('SELECT status FROM studio_lessons WHERE id = ?', [req.params.id]);
      if (!lesson) return res.status(404).json({ error: 'Không tìm thấy chặng học' });
      const blocked = lesson.status === 'PUBLISHED' || await db.get(
        `SELECT 1 FROM studio_content_items WHERE lesson_id = ? AND (published_question_id IS NOT NULL OR published_flashcard_id IS NOT NULL) LIMIT 1`,
        [req.params.id]
      );
      if (blocked) return res.status(400).json({ error: 'Chặng học này đã publish cho học viên, không thể xoá trực tiếp.' });
      await db.run('DELETE FROM studio_lessons WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/studio/courses/:id/publish', ...T, async (req, res) => {
    const db = req.db;
    try {
      const bundle = await loadCourseBundle(db, req.params.id);
      if (!bundle) return res.status(404).json({ error: 'Không tìm thấy khóa học' });

      const latestCheck = await db.get('SELECT * FROM studio_quality_checks WHERE course_id = ? ORDER BY id DESC LIMIT 1', [bundle.course.id]);
      const blockers = latestCheck ? await db.get(`SELECT COUNT(*) c FROM studio_quality_issues WHERE quality_check_id = ? AND severity = 'BLOCKER' AND status = 'open'`, [latestCheck.id]) : { c: 1 };
      if (!latestCheck || blockers.c > 0) {
        return res.status(400).json({ error: 'Vẫn còn vấn đề chặn publish. Hãy chạy Course Quality Check và xử lý các blocker trước.' });
      }
      // Publishing makes approved content live course-wide; which cohorts get
      // access is managed separately (Học viên & Thi thử's roster tools), not
      // chosen at publish time — a course can serve more than one cohort.

      await db.run("UPDATE studio_courses SET status = 'PUBLISHED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [bundle.course.id]);
      await db.run(`UPDATE studio_lessons SET status = 'PUBLISHED' WHERE camp_id IN (SELECT id FROM studio_camps WHERE course_id = ?) AND status = 'APPROVED'`, [bundle.course.id]);

      // Copy-on-publish bridge: an APPROVED content item is a draft until
      // this point — it only becomes something a real learner can practice
      // with once copied into the live test_questions/flashcards tables the
      // learner app actually reads (Quiz.jsx/Flashcards.jsx). Idempotent via
      // published_question_id/published_flashcard_id — republishing a course
      // after adding more approved content never double-inserts what's
      // already out there.
      const lessonTitleById = new Map(bundle.lessons.map((l) => [l.id, l.title]));
      let publishedCount = 0;
      for (const item of bundle.contentItems) {
        if (item.status !== 'APPROVED') continue;
        const topic = lessonTitleById.get(item.lesson_id) || 'Llama Studio';

        if (['mcq', 'scenario', 'checkpoint'].includes(item.content_type) && !item.published_question_id) {
          const options = parseJSON(item.options, []);
          const answer = ['A', 'B', 'C', 'D'][item.correct_option];
          if (options.length !== 4 || !answer) continue; // malformed — skip rather than publish a broken question
          const inserted = await db.run(
            `INSERT INTO test_questions (topic, difficulty, question, optA, optB, optC, optD, answer, explanation, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [topic, item.difficulty || 'Trung bình', item.question_text, options[0], options[1], options[2], options[3], answer, item.explanation || '', item.source_title || 'Llama Studio']
          );
          await db.run('UPDATE studio_content_items SET published_question_id = ? WHERE id = ?', [inserted.lastID, item.id]);
          publishedCount++;
        } else if (item.content_type === 'flashcard' && !item.published_flashcard_id) {
          const inserted = await db.run(
            `INSERT INTO flashcards (topic, card_type, difficulty, front, back, keyword) VALUES (?, ?, ?, ?, ?, ?)`,
            [topic, 'Kiến thức Studio', item.difficulty || 'Trung bình', item.front, item.back, item.keyword || null]
          );
          await db.run('UPDATE studio_content_items SET published_flashcard_id = ? WHERE id = ?', [inserted.lastID, item.id]);
          publishedCount++;
        }
        // 'knowledge' items stay Studio-only — no learner-facing table for
        // standalone lesson prose exists today (the learner app's lessons.cards
        // is a structured flashcard-style array, not free text).
      }

      res.json({ success: true, publishedCount });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Source Documents (giáo án upload → grounds AI content generation) ───
  // Course-scoped, not global — reuses the same storeDocument/chunking/FTS
  // pipeline the learner-chat upload already uses (backend/knowledgeBase.js),
  // just tagging the document with this course. Immediately usable (approved
  // on upload) — a course-scoped document only ever grounds that course's own
  // generation (never the shared learner chat, see retrieveKnowledge's
  // course_id IS NULL filter), and the generated camps/lessons/content still
  // go through their own AI_DRAFT → APPROVED → PUBLISHED review regardless.
  app.post('/api/studio/courses/:id/knowledge', ...T, handleKnowledgeUpload, async (req, res) => {
    const db = req.db;
    try {
      const course = await db.get('SELECT id FROM studio_courses WHERE id = ?', [req.params.id]);
      if (!course) return res.status(404).json({ error: 'Không tìm thấy khóa học' });
      if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file để tải lên' });

      const { buffer } = req.file;
      const originalname = decodeUploadedFilename(req.file.originalname);
      const lowerName = originalname.toLowerCase();
      let text = '';
      let sourceType = 'txt';
      if (lowerName.endsWith('.pdf')) {
        sourceType = 'pdf';
        const parser = new PDFParse({ data: buffer });
        text = (await parser.getText()).text;
        await parser.destroy();
      } else if (lowerName.endsWith('.docx')) {
        sourceType = 'docx';
        text = (await mammoth.extractRawText({ buffer })).value;
      } else if (lowerName.endsWith('.pptx')) {
        sourceType = 'pptx';
        text = await extractPptxText(buffer);
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        sourceType = 'xlsx';
        text = extractXlsxText(buffer);
      } else {
        text = buffer.toString('utf-8');
      }
      if (!text.trim()) return res.status(400).json({ error: 'Không đọc được nội dung văn bản từ file này.' });

      const title = (req.body.title || '').trim() || originalname;
      const result = await storeDocument(db, title, sourceType, text, req.user.id, { courseId: course.id, approved: 1 });
      res.status(201).json({ title, ...result });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/studio/courses/:id/knowledge', ...T, async (req, res) => {
    try {
      const docs = await req.db.all(
        `SELECT d.*, COUNT(c.id) as chunk_count FROM knowledge_documents d
         LEFT JOIN knowledge_chunks c ON c.document_id = d.id
         WHERE d.course_id = ? GROUP BY d.id ORDER BY d.created_at DESC`,
        [req.params.id]
      );
      res.json(docs.map((d) => ({
        id: d.id, title: d.title, sourceType: d.source_type, approved: !!d.approved,
        chunkCount: d.chunk_count, createdAt: d.created_at
      })));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Blocked once the document's own chunks are actually cited by an
  // approved/published lesson (same "don't silently destroy confirmed work"
  // rule as camp/lesson delete above) — otherwise cascades via FK to its chunks.
  app.delete('/api/studio/knowledge/:id', ...T, async (req, res) => {
    const db = req.db;
    try {
      const doc = await db.get('SELECT id FROM knowledge_documents WHERE id = ?', [req.params.id]);
      if (!doc) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
      const blocked = await db.get(
        `SELECT 1 FROM studio_lessons l, json_each(COALESCE(l.source_chunk_ids, '[]')) je
         JOIN knowledge_chunks c ON c.id = je.value
         WHERE c.document_id = ? AND l.status IN ('APPROVED', 'PUBLISHED') LIMIT 1`,
        [req.params.id]
      );
      if (blocked) return res.status(400).json({ error: 'Tài liệu này đang được trích dẫn trong chặng học đã duyệt/publish, không thể xoá trực tiếp.' });
      await db.run('DELETE FROM knowledge_documents WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Real AI generation grounded in a specific document the trainer uploaded
  // for this course — distinct from kit/generate below, which never calls
  // Gemini and only samples the pre-approved exam bank. Results land as
  // AI_DRAFT content-items, same review queue as everything else — never
  // auto-approved. No document-approval gate: uploading it for this course
  // is the review step (see the upload route's comment).
  app.post('/api/studio/lessons/:id/generate-from-document', ...T, async (req, res) => {
    const db = req.db;
    try {
      const lesson = await db.get(
        `SELECT l.*, co.gen_flashcards, co.gen_quiz
         FROM studio_lessons l JOIN studio_camps c ON l.camp_id = c.id JOIN studio_courses co ON c.course_id = co.id
         WHERE l.id = ?`,
        [req.params.id]
      );
      if (!lesson) return res.status(404).json({ error: 'Không tìm thấy chặng học' });
      const { documentId } = req.body;
      const doc = await db.get('SELECT * FROM knowledge_documents WHERE id = ?', [documentId]);
      if (!doc) return res.status(404).json({ error: 'Không tìm thấy tài liệu' });

      const result = await generateContentFromDocument(db, {
        lessonId: lesson.id, documentId: doc.id, documentTitle: doc.title, genFlashcards: !!lesson.gen_flashcards, genQuiz: !!lesson.gen_quiz
      });
      await db.run("UPDATE studio_lessons SET status = 'READY_FOR_REVIEW' WHERE id = ?", [lesson.id]);
      res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Lesson Kit Generator + Lesson Editor ────────────────────────────────
  // `contentType` ('all' | 'knowledge' | 'flashcard' | 'quiz', default 'all')
  // scopes generation to exactly what the trainer asked for — clicking
  // "Regenerate" while on the Quiz tab must only touch quiz items, never
  // silently redo knowledge/flashcards too. For 'all' (the plain "Generate
  // AI content kit" button with no tab context), each category still
  // respects the course-wide gen_flashcards/gen_quiz toggles from step 1 of
  // the wizard; an explicit per-type request always runs regardless of
  // those toggles, since the trainer is asking for that type directly.
  // Every lesson — regardless of course origin — now goes through the real
  // Gemini pipeline (course source documents if any, else the lesson's own
  // goal/description); this used to first check the lesson's title against
  // the legacy MOF exam-bank topics via a SQL LIKE substring match, which
  // could silently route a brand-new AI-authored lesson (e.g. titled "Bảo
  // hiểm nhân thọ") onto the generic legacy bank (topic "Bảo hiểm nhân thọ
  // cơ bản") — real quiz-typed content, but about the wrong course.
  app.post('/api/studio/lessons/:id/kit/generate', ...T, async (req, res) => {
    try {
      const { contentType = 'all' } = req.body || {};
      const result = await generateContentForLesson(req.db, { lessonId: req.params.id, contentType });
      res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Runs automatically once the trainer confirms the Course Blueprint (see
  // the wizard's handleConfirmBlueprint) — generates kit/generate's exact
  // per-lesson content for every lesson in the course, in order, so the
  // trainer never has to visit each lesson individually. Each lesson's
  // failure is caught individually (see generateContentForCourse): one bad
  // Gemini call never deletes another lesson's already-saved AI_DRAFT
  // content, and the per-lesson `results` array lets the trainer retry just
  // the failed lesson (or a single failed asset type on it) via kit/generate.
  app.post('/api/studio/courses/:id/generate-content', ...T, async (req, res) => {
    try {
      const { contentType = 'all' } = req.body || {};
      const summary = await generateContentForCourse(req.db, { courseId: req.params.id, contentType });
      res.json(summary);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/studio/lessons/:id/content', ...T, async (req, res) => {
    try {
      const items = await req.db.all('SELECT * FROM studio_content_items WHERE lesson_id = ?', [req.params.id]);
      res.json(items.map(toContentItemDTO));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Manually-authored content (spec: trainer can add content directly, not
  // only review AI drafts). Skips the AI_DRAFT review step since the trainer
  // wrote it themselves — starts APPROVED, same as anything they've reviewed.
  app.post('/api/studio/lessons/:id/content-items', ...T, async (req, res) => {
    const db = req.db;
    try {
      const lesson = await db.get('SELECT id FROM studio_lessons WHERE id = ?', [req.params.id]);
      if (!lesson) return res.status(404).json({ error: 'Không tìm thấy chặng học' });
      const { contentType, title, front, back, keyword, questionText, options, correctOption, explanation, difficulty, cognitiveLevel } = req.body;
      if (!contentType) return res.status(400).json({ error: 'Thiếu loại nội dung' });
      if (contentType === 'flashcard' && (!front?.trim() || !back?.trim())) {
        return res.status(400).json({ error: 'Flashcard cần có mặt trước và mặt sau.' });
      }
      if (contentType !== 'flashcard' && !questionText?.trim()) {
        return res.status(400).json({ error: contentType === 'knowledge' ? 'Cần nhập nội dung kiến thức.' : 'Cần nhập nội dung câu hỏi.' });
      }
      const result = await db.run(
        `INSERT INTO studio_content_items
           (lesson_id, content_type, title, question_text, options, correct_option, explanation, difficulty, cognitive_level, front, back, keyword, source_title, source_version, status, ai_generated, trainer_edited)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 0, 1)`,
        [lesson.id, contentType, title || null, questionText || null, JSON.stringify(options || []), correctOption ?? null,
          explanation || null, difficulty || 'Trung bình', cognitiveLevel || 'Hiểu',
          front || null, back || null, keyword || null, 'Trainer tự tạo', '1.0']
      );
      res.status(201).json({ id: result.lastID });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.put('/api/studio/content-items/:id', ...T, async (req, res) => {
    // action: approve | reject | edit | toggleCheckpoint
    const { action, title, questionText, explanation, front, back, keyword, options, correctOption } = req.body;
    const db = req.db;
    try {
      const statusMap = { approve: 'APPROVED', reject: 'ARCHIVED', edit: 'TRAINER_EDITING' };

      if (action === 'toggleCheckpoint') {
        // Checkpoint is a designation on an mcq/scenario item, not a separate
        // authored type — flip content_type between 'mcq' and 'checkpoint'
        // rather than duplicating the mcq/scenario add-edit form for it.
        const item = await db.get('SELECT content_type FROM studio_content_items WHERE id = ?', [req.params.id]);
        if (!item) return res.status(404).json({ error: 'Không tìm thấy nội dung' });
        const nextType = item.content_type === 'checkpoint' ? 'mcq' : 'checkpoint';
        await db.run('UPDATE studio_content_items SET content_type = ? WHERE id = ?', [nextType, req.params.id]);
        return res.json({ success: true, contentType: nextType });
      }

      const newStatus = statusMap[action];
      if (!newStatus) return res.status(400).json({ error: 'Hành động không hợp lệ' });

      if (action === 'edit') {
        await db.run(
          `UPDATE studio_content_items SET
             title = COALESCE(?, title), question_text = COALESCE(?, question_text), explanation = COALESCE(?, explanation),
             front = COALESCE(?, front), back = COALESCE(?, back), keyword = COALESCE(?, keyword),
             options = COALESCE(?, options), correct_option = COALESCE(?, correct_option),
             status = ?, trainer_edited = 1
           WHERE id = ?`,
          [title, questionText, explanation, front, back, keyword,
            options ? JSON.stringify(options) : null, correctOption ?? null, newStatus, req.params.id]
        );
      } else {
        await db.run('UPDATE studio_content_items SET status = ? WHERE id = ?', [newStatus, req.params.id]);
      }
      await db.run('INSERT INTO studio_content_reviews (content_item_id, reviewer_id, action) VALUES (?, ?, ?)', [req.params.id, req.user.id, action]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Hard delete — distinct from Reject (which archives, keeping an audit
  // trail for AI drafts a trainer decided not to use). Blocked once an item
  // has been published into the real learner-facing tables (spec: don't
  // silently pull content out from under a learner already practicing with
  // it) — a trainer must edit/archive it there instead.
  app.delete('/api/studio/content-items/:id', ...T, async (req, res) => {
    const db = req.db;
    try {
      const item = await db.get('SELECT published_question_id, published_flashcard_id FROM studio_content_items WHERE id = ?', [req.params.id]);
      if (!item) return res.status(404).json({ error: 'Không tìm thấy nội dung' });
      if (item.published_question_id || item.published_flashcard_id) {
        return res.status(400).json({ error: 'Nội dung đã publish cho học viên, không thể xoá trực tiếp. Hãy sửa hoặc lưu trữ (archive) thay thế.' });
      }
      await db.run('DELETE FROM studio_content_items WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/studio/content-items/:id/rewrite', ...T, async (req, res) => {
    try {
      const item = await req.db.get('SELECT * FROM studio_content_items WHERE id = ?', [req.params.id]);
      if (!item) return res.status(404).json({ error: 'Không tìm thấy nội dung' });
      const result = await suggestQuestionRewrite({ questionText: item.question_text, flags: req.body.flags || [] }, req.db);
      res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/studio/lessons/:id/explain', ...T, async (req, res) => {
    try {
      const lesson = await req.db.get('SELECT l.*, c.title as campTitle FROM studio_lessons l JOIN studio_camps c ON l.camp_id = c.id WHERE l.id = ?', [req.params.id]);
      if (!lesson) return res.status(404).json({ error: 'Không tìm thấy chặng học' });
      const result = await explainCurriculumDecision({ lessonTitle: lesson.title, campTitle: lesson.campTitle, examWeight: lesson.exam_weight }, req.db);
      res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Course Quality Checker ───────────────────────────────────────────────
  app.post('/api/studio/courses/:id/quality-check', ...T, async (req, res) => {
    const db = req.db;
    try {
      const bundle = await loadCourseBundle(db, req.params.id);
      if (!bundle) return res.status(404).json({ error: 'Không tìm thấy khóa học' });

      const quality = checkCourseQuality({
        course: { id: bundle.course.id, targetDurationMinutes: (bundle.course.duration_weeks || 4) * 5 * 20 },
        camps: bundle.camps.map((c) => ({ id: c.id, title: c.title, orderIndex: c.order_index })),
        lessons: bundle.lessons.map((l) => toLessonDTO(l, bundle.prereqMap)),
        learningOutcomes: await db.all('SELECT id, description FROM studio_learning_outcomes WHERE course_id = ?', [bundle.course.id]),
        skills: await db.all('SELECT id, name FROM studio_skills WHERE course_id = ?', [bundle.course.id]),
        contentItems: bundle.contentItems.map((c) => ({
          id: c.id, lessonId: c.lesson_id, contentType: c.content_type, questionText: c.question_text,
          correctOption: c.correct_option, explanation: c.explanation, difficulty: c.difficulty,
          cognitiveLevel: c.cognitive_level, sourceChunkIds: parseJSON(c.source_chunk_ids, []), sourceVersion: c.source_version, status: c.status
        }))
      });

      const qcResult = await db.run('INSERT INTO studio_quality_checks (course_id, health_score) VALUES (?, ?)', [bundle.course.id, quality.healthScore]);
      for (const issue of quality.issues) {
        await db.run(
          'INSERT INTO studio_quality_issues (quality_check_id, category, severity, message, affected_entity_type, affected_entity_id) VALUES (?, ?, ?, ?, ?, ?)',
          [qcResult.lastID, issue.category, issue.severity, issue.message, issue.affectedEntityType || null, issue.affectedEntityId || null]
        );
      }
      await db.run('UPDATE studio_courses SET health_score = ? WHERE id = ?', [quality.healthScore, bundle.course.id]);

      res.json({ qualityCheckId: qcResult.lastID, healthScore: quality.healthScore, canPublish: quality.canPublish, issues: quality.issues });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/studio/courses/:id/quality', ...T, async (req, res) => {
    const db = req.db;
    try {
      const check = await db.get('SELECT * FROM studio_quality_checks WHERE course_id = ? ORDER BY id DESC LIMIT 1', [req.params.id]);
      if (!check) return res.json(null);
      const issues = await db.all('SELECT * FROM studio_quality_issues WHERE quality_check_id = ?', [check.id]);
      const canPublish = !issues.some((i) => i.severity === 'BLOCKER' && i.status === 'open');
      res.json({ healthScore: check.health_score, runAt: check.run_at, issues, canPublish });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/studio/quality-issues/:id/suggest-fix', ...T, async (req, res) => {
    try {
      const issue = await req.db.get('SELECT * FROM studio_quality_issues WHERE id = ?', [req.params.id]);
      if (!issue) return res.status(404).json({ error: 'Không tìm thấy vấn đề' });
      const result = await suggestQualityFix({ category: issue.category, message: issue.message, severity: issue.severity }, req.db);
      res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.put('/api/studio/quality-issues/:id/ignore', ...T, async (req, res) => {
    try {
      await req.db.run("UPDATE studio_quality_issues SET status = 'ignored', ignore_reason = ? WHERE id = ?", [req.body.reason || '', req.params.id]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Cohorts ───────────────────────────────────────────────────────────────
  app.get('/api/studio/cohorts', ...T, async (req, res) => {
    try {
      const cohorts = await req.db.all(
        `SELECT co.*, cr.title as courseTitle, (SELECT COUNT(*) FROM studio_cohort_learners WHERE cohort_id = co.id) as learnerCount
         FROM studio_cohorts co JOIN studio_courses cr ON co.course_id = cr.id ORDER BY co.created_at DESC`
      );
      res.json(cohorts);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/studio/cohorts', ...T, async (req, res) => {
    const db = req.db;
    try {
      const { courseId, name, startDate, deadline } = req.body;
      if (!courseId) return res.status(400).json({ error: 'Cần chọn khóa học' });
      if (!name?.trim()) return res.status(400).json({ error: 'Cần nhập tên nhóm học' });
      const course = await db.get('SELECT id FROM studio_courses WHERE id = ?', [courseId]);
      if (!course) return res.status(404).json({ error: 'Không tìm thấy khóa học' });
      const result = await db.run(
        'INSERT INTO studio_cohorts (course_id, trainer_id, name, start_date, deadline) VALUES (?, ?, ?, ?, ?)',
        [courseId, req.user.id, name.trim(), startDate || null, deadline || null]
      );
      res.status(201).json({ id: result.lastID });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/studio/cohorts/:id', ...T, async (req, res) => {
    const db = req.db;
    try {
      const cohort = await db.get('SELECT * FROM studio_cohorts WHERE id = ?', [req.params.id]);
      if (!cohort) return res.status(404).json({ error: 'Không tìm thấy nhóm học' });
      const learners = await getRealLearnerAccounts(db, cohort.id);
      const mockExams = await db.all('SELECT * FROM studio_mock_exams WHERE cohort_id = ? ORDER BY round_number', [cohort.id]);
      res.json({ cohort, learners, mockExams });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Cohort roster management ─────────────────────────────────────────────
  // Membership is independent of quiz activity (unlike getRealLearnerAccounts,
  // which only ever shows learners who've done at least one quiz) — a trainer
  // must be able to add a real learner to a cohort the moment they enroll,
  // before that learner has attempted anything.
  app.get('/api/studio/cohorts/:id/roster', ...T, async (req, res) => {
    const db = req.db;
    try {
      const cohort = await db.get('SELECT id FROM studio_cohorts WHERE id = ?', [req.params.id]);
      if (!cohort) return res.status(404).json({ error: 'Không tìm thấy nhóm học' });
      res.json(await getCohortRoster(db, cohort.id));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/studio/cohorts/:id/roster', ...T, async (req, res) => {
    const db = req.db;
    try {
      const cohort = await db.get('SELECT id FROM studio_cohorts WHERE id = ?', [req.params.id]);
      if (!cohort) return res.status(404).json({ error: 'Không tìm thấy nhóm học' });
      const { learnerId } = req.body;
      if (!learnerId) return res.status(400).json({ error: 'Cần chọn học viên' });
      await addLearnerToCohort(db, cohort.id, learnerId);
      res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.delete('/api/studio/cohorts/:id/roster/:learnerId', ...T, async (req, res) => {
    try {
      await removeLearnerFromCohort(req.db, req.params.id, req.params.learnerId);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // All real (non-trainer) accounts, regardless of activity — the pool a
  // trainer picks from when adding someone to a cohort roster. Deliberately
  // not filtered by quiz activity like getRealLearnerAccounts is, since a
  // freshly-enrolled learner legitimately has none yet.
  app.get('/api/studio/all-learner-accounts', ...T, async (req, res) => {
    try {
      res.json(await getAllLearnerAccounts(req.db));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Mock Exam Analytics ─────────────────────────────────────────────────
  app.get('/api/studio/cohorts/:id/mock-exam-analytics', ...T, async (req, res) => {
    const db = req.db;
    try {
      const cohort = await db.get('SELECT * FROM studio_cohorts WHERE id = ?', [req.params.id]);
      if (!cohort) return res.status(404).json({ error: 'Không tìm thấy nhóm học' });
      const course = await db.get('SELECT target_score FROM studio_courses WHERE id = ?', [cohort.course_id]);
      const targetScore = course?.target_score || 70;

      const exams = await getCohortMockExams(db, cohort.id);
      if (exams.length === 0) return res.json({ overview: null, topics: [], trend: [], learnerNames: {} });

      const latestExam = exams[exams.length - 1];
      const previousExam = exams.length > 1 ? exams[exams.length - 2] : null;

      const attempts = await db.all('SELECT * FROM studio_mock_exam_attempts WHERE mock_exam_id = ?', [latestExam.id]);
      const previousAttempts = previousExam ? await db.all('SELECT * FROM studio_mock_exam_attempts WHERE mock_exam_id = ?', [previousExam.id]) : [];

      const overview = calculateCohortOverview(
        attempts.map((a) => ({ score: a.score, totalQuestions: a.total_questions, completionTimeSeconds: a.completion_time_seconds, summitReadinessBefore: a.summit_readiness_before })),
        targetScore,
        previousAttempts.map((a) => ({ score: a.score }))
      );

      const answers = await db.all(
        `SELECT a.*, att.learner_id FROM studio_mock_exam_answers a JOIN studio_mock_exam_attempts att ON a.attempt_id = att.id WHERE att.mock_exam_id = ?`,
        [latestExam.id]
      );
      const previousAnswers = previousExam
        ? await db.all(`SELECT a.* FROM studio_mock_exam_answers a JOIN studio_mock_exam_attempts att ON a.attempt_id = att.id WHERE att.mock_exam_id = ?`, [previousExam.id])
        : [];
      const previousTopicAverages = {};
      for (const t of calculateTopicPerformance(previousAnswers.map((a) => ({ topic: a.topic, isCorrect: !!a.is_correct })), 70)) {
        previousTopicAverages[t.topic] = t.correctRate;
      }
      const topics = calculateTopicPerformance(
        answers.map((a) => ({ topic: a.topic, isCorrect: !!a.is_correct, learnerId: a.learner_id, confidence: a.confidence, responseTimeMs: a.response_time_ms, mistakeType: a.mistake_type })),
        70,
        previousTopicAverages
      );

      const trend = exams.map((e) => ({ round: e.round_number, title: e.title }));
      for (const t of trend) {
        const roundAttempts = await db.all('SELECT score FROM studio_mock_exam_attempts WHERE mock_exam_id = (SELECT id FROM studio_mock_exams WHERE cohort_id = ? AND round_number = ?)', [cohort.id, t.round]);
        t.averageScore = roundAttempts.length ? Math.round(roundAttempts.reduce((s, a) => s + a.score, 0) / roundAttempts.length) : null;
      }
      const cohortTrend = classifyTrend(trend.map((t) => t.averageScore).filter((s) => s !== null));

      const insight = await summarizeMockExamInsight({
        averageScore: overview.averageScore, changeFromPrevious: overview.changeFromPrevious,
        weakestTopic: topics[0]?.topic?.replace(/^\d+\.\s*/, ''), passRate: overview.passRate
      }, db);

      overview.rosterSize = await getCohortRosterSize(db, cohort.id);

      res.json({ overview, topics, trend, cohortTrend, insight: insight.summary, latestExamId: latestExam.id, targetScore });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/studio/mock-exams/:id/questions', ...T, async (req, res) => {
    const db = req.db;
    try {
      const answers = await db.all('SELECT * FROM studio_mock_exam_answers WHERE attempt_id IN (SELECT id FROM studio_mock_exam_attempts WHERE mock_exam_id = ?)', [req.params.id]);
      const byQuestion = new Map();
      for (const a of answers) {
        if (!byQuestion.has(a.question_text)) byQuestion.set(a.question_text, []);
        byQuestion.get(a.question_text).push(a);
      }
      const cohort = await db.get('SELECT c.target_score FROM studio_mock_exams m JOIN studio_cohorts co ON m.cohort_id = co.id JOIN studio_courses c ON co.course_id = c.id WHERE m.id = ?', [req.params.id]);

      const results = [];
      for (const [questionText, qAnswers] of byQuestion) {
        // "Strong" vs "weak" learner determined by their overall attempt score.
        const learnerScores = new Map();
        for (const a of qAnswers) {
          const attempt = await db.get('SELECT learner_id, score FROM studio_mock_exam_attempts WHERE id = ?', [a.attempt_id]);
          learnerScores.set(a.id, attempt?.score ?? 0);
        }
        const medianScore = [...learnerScores.values()].sort((a, b) => a - b)[Math.floor(learnerScores.size / 2)] ?? 70;

        const analysis = analyzeQuestionQuality({
          questionText,
          difficulty: 'Trung bình',
          answers: qAnswers.map((a) => ({
            selectedOption: a.selected_option, isCorrect: !!a.is_correct, responseTimeMs: a.response_time_ms,
            isStrongLearner: (learnerScores.get(a.id) ?? 0) >= medianScore, changedAnswer: !!a.changed_answer
          }))
        });
        results.push({ questionText, topic: qAnswers[0].topic, attempts: qAnswers.length, ...analysis });
      }
      res.json(results.sort((a, b) => (a.correctRate ?? 100) - (b.correctRate ?? 100)));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Learner Support List + Individual Profile ────────────────────────────
  // Kept cohort-scoped as a route (Mock Exam Analytics' "learners needing
  // support" tab is nested under a cohort), but backed by the same real
  // learner data as the top-level "Học viên" screen — see getRealLearnersWithRisk.
  app.get('/api/studio/cohorts/:id/learners-at-risk', ...T, async (req, res) => {
    const db = req.db;
    try {
      const cohort = await db.get('SELECT * FROM studio_cohorts WHERE id = ?', [req.params.id]);
      if (!cohort) return res.status(404).json({ error: 'Không tìm thấy nhóm học' });
      res.json(await getRealLearnersWithRisk(db, cohort.id));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/studio/learners', ...T, async (req, res) => {
    const db = req.db;
    try {
      res.json(await getRealLearnersWithRisk(db));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/studio/learners/:id/profile', ...T, async (req, res) => {
    const db = req.db;
    try {
      const learner = await db.get('SELECT id, username FROM users WHERE id = ?', [req.params.id]);
      if (!learner) return res.status(404).json({ error: 'Không tìm thấy học viên' });
      const summary = await computeRealLearnerSummary(db, learner);
      const topicPerf = calculateTopicPerformance(summary.answers.map((a) => ({ topic: a.topic, isCorrect: !!a.is_correct, mistakeType: a.mistake_type })), 70);
      const targetScore = summary.prefs?.target_score || 70;

      const insight = await summarizeLearnerInsight({
        learnerName: learner.username, latestScore: summary.scores[summary.scores.length - 1] ?? null,
        trend: classifyTrend(summary.scores), weakestTopic: summary.weakestTopic, commonMistakeType: summary.commonMistakeType
      }, db);

      const masteryTrend = Object.entries(
        summary.masteryHistory.reduce((acc, m) => { (acc[m.topic] ||= []).push(m.masteryScore); return acc; }, {})
      ).map(([topic, points]) => ({ topic, points: points.slice(-8) }));

      const interventions = await getLearnerInterventions(db, learner.id);

      const risk = detectLearnerRisk({
        recentScoresChronological: summary.scores, targetScore,
        summitReadiness: summary.summitReadiness, daysUntilExam: summary.daysUntilExam,
        highConfidenceMistakeCount: summary.highConfidenceMistakeCount,
        hasAttemptedAssigned: true, recentActivityCount: summary.quizzes.length
      });

      res.json({
        learner, mockExamHistory: summary.scores, latestScore: summary.scores[summary.scores.length - 1] ?? null,
        scoreTrend: classifyTrend(summary.scores), topicPerformance: topicPerf, commonMistakeType: summary.commonMistakeType,
        interventions, insight: insight.summary, targetScore, riskStatus: risk.status,
        outlierPatterns: summary.outlierPatterns, masteryTrend
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Misconception Clusters + Rescue Expedition ───────────────────────────
  app.get('/api/studio/cohorts/:id/misconception-clusters', ...T, async (req, res) => {
    try {
      const clusters = await req.db.all('SELECT * FROM studio_misconception_clusters WHERE cohort_id = ? ORDER BY learner_count DESC', [req.params.id]);
      res.json(clusters);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/studio/cohorts/:id/detect-clusters', ...T, async (req, res) => {
    const db = req.db;
    try {
      const cohort = await db.get('SELECT * FROM studio_cohorts WHERE id = ?', [req.params.id]);
      if (!cohort) return res.status(404).json({ error: 'Không tìm thấy nhóm học' });
      const exams = await getCohortMockExams(db, cohort.id);
      if (exams.length === 0) return res.json({ clusters: [] });
      const latestExam = exams[exams.length - 1];
      const answers = await db.all(
        `SELECT a.*, att.learner_id FROM studio_mock_exam_answers a JOIN studio_mock_exam_attempts att ON a.attempt_id = att.id WHERE att.mock_exam_id = ?`,
        [latestExam.id]
      );
      const clusters = clusterMisconceptions(answers.map((a) => ({
        learnerId: a.learner_id, topic: a.topic, questionId: null, selectedOption: a.selected_option,
        isCorrect: !!a.is_correct, confidence: a.confidence, mistakeType: a.mistake_type, mastery: 50
      })));

      // Persist newly found clusters so they can be acted on (generate an
      // intervention, view learners) — detection without persistence would
      // leave "Tạo Rescue Expedition" with no real cluster id to attach to.
      const created = [];
      for (const cluster of clusters) {
        const existing = await db.get(
          `SELECT id FROM studio_misconception_clusters WHERE cohort_id = ? AND mock_exam_id = ? AND topic = ? AND mistake_type = ?`,
          [cohort.id, latestExam.id, cluster.topic, cluster.mistakeType]
        );
        if (existing) { created.push(existing.id); continue; }
        const title = `${cluster.topic.replace(/^\d+\.\s*/, '')} — nhầm lẫn kiểu ${cluster.mistakeType}`;
        const result = await db.run(
          `INSERT INTO studio_misconception_clusters (cohort_id, mock_exam_id, topic, mistake_type, title, learner_count, high_confidence_count, average_mastery, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
          [cohort.id, latestExam.id, cluster.topic, cluster.mistakeType, title, cluster.learnerCount, cluster.highConfidenceCount, cluster.averageMastery]
        );
        for (const learnerId of cluster.learnerIds) {
          await db.run('INSERT OR IGNORE INTO studio_misconception_cluster_learners (cluster_id, learner_id) VALUES (?, ?)', [result.lastID, learnerId]);
        }
        created.push(result.lastID);
      }

      res.json({ clusters: await db.all('SELECT * FROM studio_misconception_clusters WHERE id IN (' + (created.join(',') || '-1') + ')') });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/studio/misconception-clusters/:id', ...T, async (req, res) => {
    const db = req.db;
    try {
      const cluster = await db.get('SELECT * FROM studio_misconception_clusters WHERE id = ?', [req.params.id]);
      if (!cluster) return res.status(404).json({ error: 'Không tìm thấy cụm nhầm lẫn' });
      const learners = await db.all(
        `SELECT u.id, u.username FROM studio_misconception_cluster_learners cl JOIN users u ON cl.learner_id = u.id WHERE cl.cluster_id = ?`,
        [cluster.id]
      );
      res.json({ cluster, learners });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/studio/misconception-clusters/:id/intervention', ...T, async (req, res) => {
    const db = req.db;
    try {
      const cluster = await db.get('SELECT * FROM studio_misconception_clusters WHERE id = ?', [req.params.id]);
      if (!cluster) return res.status(404).json({ error: 'Không tìm thấy cụm nhầm lẫn' });
      const durationMinutes = req.body.durationMinutes || 10;

      const intervention = await generateIntervention(db, { topic: cluster.topic, mistakeType: cluster.mistake_type, learnerCount: cluster.learner_count, durationMinutes });
      const result = await db.run(
        `INSERT INTO studio_interventions (cluster_id, cohort_id, title, topic, mistake_type, duration_minutes, content, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
        [cluster.id, cluster.cohort_id, intervention.title, cluster.topic, cluster.mistake_type, durationMinutes, JSON.stringify(intervention)]
      );
      res.status(201).json({ id: result.lastID, ...intervention });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/studio/interventions/:id', ...T, async (req, res) => {
    try {
      const intervention = await req.db.get('SELECT * FROM studio_interventions WHERE id = ?', [req.params.id]);
      if (!intervention) return res.status(404).json({ error: 'Không tìm thấy chặng cứu hộ' });
      res.json({ ...intervention, content: parseJSON(intervention.content, {}) });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.put('/api/studio/interventions/:id/approve', ...T, async (req, res) => {
    try {
      await req.db.run("UPDATE studio_interventions SET status = 'approved', approved_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Never auto-assigns — requires an explicit trainer-approved POST (spec §15/§21).
  app.post('/api/studio/interventions/:id/assign', ...T, async (req, res) => {
    const db = req.db;
    try {
      const intervention = await db.get('SELECT * FROM studio_interventions WHERE id = ?', [req.params.id]);
      if (!intervention) return res.status(404).json({ error: 'Không tìm thấy chặng cứu hộ' });
      if (intervention.status !== 'approved') return res.status(400).json({ error: 'Cần duyệt chặng cứu hộ trước khi giao.' });

      const cluster = intervention.cluster_id ? await db.get('SELECT * FROM studio_misconception_clusters WHERE id = ?', [intervention.cluster_id]) : null;
      const learnerIds = req.body.learnerIds || (cluster
        ? (await db.all('SELECT learner_id FROM studio_misconception_cluster_learners WHERE cluster_id = ?', [cluster.id])).map((r) => r.learner_id)
        : []);

      for (const learnerId of learnerIds) {
        await db.run('INSERT OR IGNORE INTO studio_intervention_assignments (intervention_id, learner_id) VALUES (?, ?)', [intervention.id, learnerId]);
        await db.run('INSERT OR IGNORE INTO studio_intervention_results (intervention_id, learner_id, mastery_before) VALUES (?, ?, ?)', [intervention.id, learnerId, cluster?.average_mastery ?? null]);
      }
      await db.run("UPDATE studio_interventions SET status = 'assigned' WHERE id = ?", [intervention.id]);
      res.json({ success: true, assignedCount: learnerIds.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/studio/interventions/:id/results', ...T, async (req, res) => {
    const db = req.db;
    try {
      const results = await db.all('SELECT * FROM studio_intervention_results WHERE intervention_id = ?', [req.params.id]);
      const effectiveness = calculateInterventionEffectiveness(results.map((r) => ({
        masteryBefore: r.mastery_before, masteryAfter: r.mastery_after,
        relatedScoreBefore: r.related_score_before, relatedScoreAfter: r.related_score_after, completed: !!r.completed
      })));
      res.json(effectiveness);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Trainer Copilot ───────────────────────────────────────────────────────
  app.post('/api/studio/copilot/ask', ...T, async (req, res) => {
    try {
      const result = await answerTrainerQuestion(req.db, { message: req.body.message, context: req.body.context || {} });
      res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
}
