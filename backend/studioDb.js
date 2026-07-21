// Llama Studio schema — all additive (CREATE TABLE IF NOT EXISTS / ALTER TABLE
// ADD COLUMN with try/catch), matching the migration pattern already used for
// Personalized Expedition. Called once from db.js's initDb().
export async function initStudioDb(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trainer_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_group TEXT,
      duration_weeks INTEGER,
      exam_date TEXT,
      learning_goal TEXT,
      target_score INTEGER DEFAULT 70,
      preferred_camps INTEGER DEFAULT 4,
      difficulty_target TEXT DEFAULT 'balanced',
      assessment_target TEXT,
      status TEXT DEFAULT 'AI_DRAFT',
      health_score INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_competencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (course_id) REFERENCES studio_courses(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      competency_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (course_id) REFERENCES studio_courses(id) ON DELETE CASCADE,
      FOREIGN KEY (competency_id) REFERENCES studio_competencies(id) ON DELETE SET NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_learning_outcomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      skill_id INTEGER,
      description TEXT NOT NULL,
      FOREIGN KEY (course_id) REFERENCES studio_courses(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES studio_skills(id) ON DELETE SET NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_camps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (course_id) REFERENCES studio_courses(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camp_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      learning_outcome_id INTEGER,
      skill_ids TEXT,
      estimated_minutes INTEGER DEFAULT 15,
      difficulty TEXT DEFAULT 'Trung bình',
      recommended_activities TEXT,
      exam_weight REAL DEFAULT 0.1,
      source_chunk_ids TEXT,
      status TEXT DEFAULT 'AI_DRAFT',
      ai_locked INTEGER DEFAULT 0,
      order_index INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (camp_id) REFERENCES studio_camps(id) ON DELETE CASCADE,
      FOREIGN KEY (learning_outcome_id) REFERENCES studio_learning_outcomes(id) ON DELETE SET NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_lesson_prerequisites (
      lesson_id INTEGER NOT NULL,
      prerequisite_lesson_id INTEGER NOT NULL,
      PRIMARY KEY (lesson_id, prerequisite_lesson_id),
      FOREIGN KEY (lesson_id) REFERENCES studio_lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (prerequisite_lesson_id) REFERENCES studio_lessons(id) ON DELETE CASCADE
    )
  `);

  // Polymorphic content (flashcard/mcq/scenario/checkpoint) — one table with a
  // discriminator instead of four near-identical ones, keeping the same
  // status lifecycle and citation fields spec §7 requires either way.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_content_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      content_type TEXT NOT NULL,
      question_text TEXT,
      options TEXT,
      correct_option INTEGER,
      explanation TEXT,
      difficulty TEXT DEFAULT 'Trung bình',
      skill_id INTEGER,
      cognitive_level TEXT DEFAULT 'Hiểu',
      known_confusion_tag TEXT,
      exception_tag TEXT,
      expected_response_time_ms INTEGER DEFAULT 45000,
      front TEXT,
      back TEXT,
      keyword TEXT,
      source_chunk_ids TEXT,
      source_title TEXT,
      source_section TEXT,
      source_version TEXT,
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ai_generated INTEGER DEFAULT 1,
      status TEXT DEFAULT 'AI_DRAFT',
      trainer_edited INTEGER DEFAULT 0,
      published_question_id INTEGER,
      published_flashcard_id INTEGER,
      FOREIGN KEY (lesson_id) REFERENCES studio_lessons(id) ON DELETE CASCADE
    )
  `);
  // Short title for a 'knowledge' content item (core lesson text) — every
  // other content type is fine without one (a flashcard/mcq/checkpoint is
  // self-describing), but a knowledge block reads much better with a heading.
  try { await db.exec('ALTER TABLE studio_content_items ADD COLUMN title TEXT'); } catch (err) { /* already exists */ }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_content_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_item_id INTEGER NOT NULL,
      reviewer_id INTEGER,
      action TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (content_item_id) REFERENCES studio_content_items(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_quality_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      health_score INTEGER NOT NULL,
      run_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES studio_courses(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_quality_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quality_check_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      affected_entity_type TEXT,
      affected_entity_id INTEGER,
      status TEXT DEFAULT 'open',
      ignore_reason TEXT,
      FOREIGN KEY (quality_check_id) REFERENCES studio_quality_checks(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_cohorts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      trainer_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      start_date TEXT,
      deadline TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES studio_courses(id) ON DELETE CASCADE,
      FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_cohort_learners (
      cohort_id INTEGER NOT NULL,
      learner_id INTEGER NOT NULL,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (cohort_id, learner_id),
      FOREIGN KEY (cohort_id) REFERENCES studio_cohorts(id) ON DELETE CASCADE,
      FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_mock_exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cohort_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      round_number INTEGER NOT NULL,
      scheduled_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cohort_id) REFERENCES studio_cohorts(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_mock_exam_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mock_exam_id INTEGER NOT NULL,
      learner_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      unanswered_count INTEGER DEFAULT 0,
      completion_time_seconds INTEGER,
      started_at TEXT,
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      summit_readiness_before REAL,
      summit_readiness_after REAL,
      FOREIGN KEY (mock_exam_id) REFERENCES studio_mock_exams(id) ON DELETE CASCADE,
      FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_mock_exam_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      selected_option INTEGER,
      correct_option INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      response_time_ms INTEGER,
      confidence TEXT,
      changed_answer INTEGER DEFAULT 0,
      mistake_type TEXT,
      skill_name TEXT,
      topic TEXT,
      FOREIGN KEY (attempt_id) REFERENCES studio_mock_exam_attempts(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_misconception_clusters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cohort_id INTEGER NOT NULL,
      mock_exam_id INTEGER,
      topic TEXT NOT NULL,
      mistake_type TEXT NOT NULL,
      title TEXT NOT NULL,
      learner_count INTEGER NOT NULL,
      high_confidence_count INTEGER NOT NULL,
      average_mastery REAL,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cohort_id) REFERENCES studio_cohorts(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_misconception_cluster_learners (
      cluster_id INTEGER NOT NULL,
      learner_id INTEGER NOT NULL,
      PRIMARY KEY (cluster_id, learner_id),
      FOREIGN KEY (cluster_id) REFERENCES studio_misconception_clusters(id) ON DELETE CASCADE,
      FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_interventions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cluster_id INTEGER,
      cohort_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      topic TEXT,
      mistake_type TEXT,
      duration_minutes INTEGER DEFAULT 10,
      content TEXT,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      approved_at TEXT,
      FOREIGN KEY (cluster_id) REFERENCES studio_misconception_clusters(id) ON DELETE SET NULL,
      FOREIGN KEY (cohort_id) REFERENCES studio_cohorts(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_intervention_assignments (
      intervention_id INTEGER NOT NULL,
      learner_id INTEGER NOT NULL,
      assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      PRIMARY KEY (intervention_id, learner_id),
      FOREIGN KEY (intervention_id) REFERENCES studio_interventions(id) ON DELETE CASCADE,
      FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS studio_intervention_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intervention_id INTEGER NOT NULL,
      learner_id INTEGER NOT NULL,
      mastery_before REAL,
      mastery_after REAL,
      related_score_before REAL,
      related_score_after REAL,
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      FOREIGN KEY (intervention_id) REFERENCES studio_interventions(id) ON DELETE CASCADE,
      FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // AI usage audit (§10/§11) — one row per attempted AI call (cached, demo,
  // success, or failure), and a fingerprint-keyed cache of prior generations
  // so re-running the same request never re-spends a real API call.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ai_usage_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_type TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT,
      input_token_count INTEGER,
      output_token_count INTEGER,
      cached INTEGER DEFAULT 0,
      success INTEGER DEFAULT 1,
      duration_ms INTEGER,
      error_code TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS ai_generation_cache (
      fingerprint TEXT PRIMARY KEY,
      task_type TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
