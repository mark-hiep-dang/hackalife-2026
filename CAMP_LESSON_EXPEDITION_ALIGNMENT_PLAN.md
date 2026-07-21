# Camp / Lesson / Daily Expedition Alignment — Plan

## 1. What actually exists today (verified against the live schema + code, not assumed)

- **"Camp" is not a database entity for the learner app.** The mountain path (`LessonPath.jsx`) renders one node per row in the flat `lessons` table (4 rows total: `lesson_1..4`, topics `fundamentals/products/contracts/regulations`). One lesson = one camp, purely by array index — label ("Trại Nền", "Trại 1", "Đỉnh MOF") and altitude are computed from position, not stored.
- **`lessons.topic` and the real exam taxonomy are two disjoint vocabularies.** `test_questions`, `flashcards`, `topic_mastery`, and the Daily Expedition engine all key on the 8 real MOF topics (`"1. Kiến thức chung & quản trị rủi ro"` … `"8. Tình huống tổng hợp"`). The 4 lesson rows use `fundamentals/products/contracts/regulations` — zero string overlap. A frontend-only, display-only map (`LessonPath.jsx`'s `CAMP_TOPIC_MAP`) already bridges these for the mastery-rollup badge, and its own comment already flags this as a known mismatch.
- **Daily Expedition has zero reference to any `lessons` row.** `focusTopic` (from `computeRankedTopics`) is always one of the 8 real topics. No activity object carries a `lessonId` anywhere in `dailyExpedition.js`, `adaptiveLoop.js`, or the `/api/expedition/*` routes.
- **Clicking a camp opens `Learn.jsx`**, a static bilingual flashcard-style walkthrough of `lessons.cards`, ending in a flat +25 XP via `/api/lessons/:id/complete`. No question bank, no `topic_mastery` write.
- **Quiz has no lesson scoping, and practice-mode topic filtering is currently commented out in `server.js`** — practice mode returns 5 fully random questions regardless of topic. This is a real, separate bug the spec's Case 8 requires fixing regardless of the camp/lesson work.
- **Flashcards is topic-scoped (8-topic taxonomy), not lesson-scoped.**
- **`topic_mastery` is keyed by `(user_id, topic)`** — a topic string, no lesson concept, no lesson-level mastery anywhere.
- **XP is two fully independent paths** (lesson-complete flat 25 XP vs. quiz-submit score-based) — no shared state today, so no double-XP risk yet, but also no reinforcement between the two systems.
- A second, unrelated Camp→Lesson FK hierarchy exists in `studioDb.js` (`studio_camps`/`studio_lessons`) for the trainer-authoring tool (Llama Studio). It is not read by anything the learner sees and is out of scope here — not to be confused with the learner-facing work below.

## 2. The core decision: unify the taxonomy, don't invent a new one

The spec's example (`Trại Nền` containing 4 lessons `Bài 1–4`) is illustrative UX, not a requirement to author new curriculum content. Building a real multi-lesson-per-camp hierarchy from scratch would mean inventing lesson content that doesn't exist today — directly against "do not rebuild," "do not create a second learning-content structure."

Instead: the existing 4-lesson/8-topic split is itself the duplicate structure to remove. `CAMP_TOPIC_MAP` already groups the 8 real topics into exactly 4 buckets that match the 4 existing lessons 2-for-1 (`fundamentals→[topic1,topic3]`, `products→[topic4,topic5]`, `contracts→[topic2,topic6]`, `regulations→[topic7,topic8]`). So:

- **Camp = one existing `lessons` row** (unchanged — this is already the existing convention, just now formalized instead of being an implicit "1 lesson happens to render as 1 camp" accident).
- **`CAMP_TOPIC_MAP` moves to the backend** (`backend/campTopicMap.js`, shared by both the Expedition engine and the frontend) as the single source of truth for "which of the 8 real exam topics does this lesson/camp cover."
- **Daily Expedition's `focusTopic` (8-topic space) resolves to a real `lessons.id`** via reverse lookup through this map — no new content authored, no new table for "camp," just a real join that didn't exist before.
- **Lesson-level mastery** = the average of `topic_mastery` for that lesson's mapped topics (computed, not a new stored column — avoids duplicating what `topic_mastery` already tracks).
- **Practice/Flashcard/Checkpoint activities scope to the lesson's mapped topics** (2 real topics per lesson) rather than the single made-up lesson topic slug, which also happens to fix the "Practice always ignores topic" bug along the way (Case 8's requirement).

This satisfies every architectural principle in the spec (Camp/Lesson as source of truth, Expedition references not copies, no duplicate content structure) while touching the minimum surface area: no new curriculum authoring, reuse of `lessons`/`user_lessons`/`topic_mastery`/`test_questions`/`flashcards` exactly as they are, only new *referential* plumbing and UI.

## 3. New DB additions (all additive, no destructive migration)

- `daily_expedition` (existing table, stores a JSON blob per user/date) — the JSON payload gains `focusLessonId`, and each activity gains `lessonId`, `activityId` (stable per slot), `status`. No schema change needed (already a JSON blob column) — this is a payload-shape change, versioned so old cached blobs without these fields degrade gracefully (treated as legacy, re-generated on next fetch rather than crashing).
- New `lesson_activity_progress` table: `(user_id, expedition_date, activity_id, status, completed_at)` — tracks per-activity completion within a day's expedition, since the existing `daily_expedition` blob is single-row-per-day and activity-level state needs its own rows for idempotency checks or ok. Given this could also be encoded in the blob (blob is quicker/no new table). **After weighing this, `daily_expedition`'s own JSON blob will carry per-activity status/completedAt directly (already how `completed` is stored today) — no new table needed.** No new table required this way.
- No changes to `lessons`, `user_lessons`, `topic_mastery`, `test_questions`, `flashcards` schemas.

## 4. Files to add

- `backend/campTopicMap.js` — the shared Camp↔Topic map + helpers (`getTopicsForLesson(lessonId)`, `getLessonForTopic(topic)`).
- `backend/engines/lessonMastery.js` — computes a lesson's rollup mastery from its mapped topics' `topic_mastery` rows (pure function over already-fetched rows, following the existing engine convention).
- `backend/completionService.js` — the central `completeLearningActivity(...)` idempotent service.
- `frontend/src/components/ExpeditionPlayer.jsx` — the new screen opened by "Bắt đầu chặng."
- `frontend/src/expeditionCopy.js` — centralized local copy pool for the new dynamic activity labels/Llama reactions (mirrors `llamaPersonality.js`'s pattern).

## 5. Files to modify

- `backend/engines/dailyExpedition.js` — resolve `focusLessonId`, dynamic activity sequencing by learner status, drop the generic "Khởi động nhanh"/"Checkpoint" labels in favor of context-aware ones.
- `backend/server.js` — `/api/expedition/daily` wires lesson resolution + real topic lists into the plan; fix the commented-out practice-mode topic filter; `/api/lessons/:id/complete` and `/api/quiz/submit` route through the new completion service instead of duplicating XP/progress logic inline.
- `frontend/src/components/DailyExpedition.jsx` — dashboard card redesign (camp/lesson header, per-activity subtitles, "Bắt đầu chặng"/"Tiếp tục leo · n/4"/"Xem kết quả chặng").
- `frontend/src/components/LessonPath.jsx` — "Llama chọn hôm nay" badge on the focus lesson, richer camp-state labels.
- `frontend/src/App.jsx` — routes activities through the Expedition Player instead of the raw Quiz/Flashcards tabs; carries `{expeditionId, activityId, source, returnTo}` context.
- `frontend/src/components/Quiz.jsx`, `Flashcards.jsx` — accept lesson/topic-list scoping + expedition context, return to the player on finish instead of the dashboard.
- `frontend/src/translations.jsx` — new copy keys, remove/replace "Khởi động nhanh"/"Checkpoint"/"Bắt đầu leo".

## 6. What is explicitly out of scope (documented, not silently dropped)

- No new curriculum content is authored — still exactly 4 lessons/camps, now properly bridged to the 8-topic exam taxonomy instead of living beside it.
- No unification with the Llama Studio trainer-authoring `studio_camps`/`studio_lessons` tables — separate subsystem, separate audience, not touched.
- "Chốt bài" (checkpoint) questions are drawn fresh from the lesson's mapped topics via the existing `test_questions` bank, not a new hand-authored checkpoint bank.
