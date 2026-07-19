# Personalized Expedition — Implementation Plan

Built in an isolated git worktree (`../LLama-expedition`, branch `personalized-expedition`) so `main` stays demo-safe. Symlinked `node_modules` from the main checkout and copied `mof_exam.db` (not symlinked, so writes here never touch the live database) to work with real seeded data.

## 1. Existing architecture found

- **Stack:** Express 4 + `sqlite`/`sqlite3` (file DB, no ORM) on the backend; React 19 + Vite + Tailwind on the frontend. No TypeScript anywhere, no test framework installed, no state library (plain `useState`/props). Node 24 is available, so `node:test` (built-in) can cover unit tests with zero new dependencies.
- **Auth:** JWT (`authenticateToken` middleware), `req.user.id` on every protected route.
- **DB tables today:** `users` (xp/level/streak/selected_path), `lessons` (4 static camps: fundamentals/products/contracts/regulations, cards stored as JSON blobs — this is the *mountain journey*, separate from real exam content), `user_lessons` (completion), `user_badges`, `user_quizzes` (aggregate score per attempt), `user_quiz_answers` (**only populated for exam-mode attempts today** — practice mode saves no per-question detail), `flashcards` (300+ real cards tagged with one of **8 real exam topics**), `user_flashcard_progress` (known boolean per card), `test_questions` (300 real MCQs, same 8 topics, `difficulty` ∈ {`Dễ`,`Trung bình`,`Khó`}), `knowledge_documents`/`knowledge_chunks`/`knowledge_chunks_fts` (FTS5 RAG for chat).
- **Important taxonomy mismatch:** the mountain journey's 4 camp topics (`fundamentals`/`products`/`contracts`/`regulations`) are *not* the same taxonomy as the 8 real exam topics used by quizzes/flashcards (`"1. Kiến thức chung & quản trị rủi ro"` … `"8. Tình huống tổng hợp"`). All mastery/priority/mistake work must run on the **8 real topics** (that's where all answer evidence lives); the camp view will roll those up for display.
- **Quiz flow:** `/api/quiz/generate` (practice = 5 random Qs, exam = 40 random Qs, no topic filtering yet) → client renders in `Quiz.jsx` → `/api/quiz/submit` (aggregate score/xp only; per-question detail only saved for exam type).
- **Flashcards flow:** `/api/flashcards/topics` (counts + known-count per topic) → `/api/flashcards?topic=` → `/api/flashcards/:id/progress` (upsert known boolean).
- **Chat:** `/api/chat` already does RAG retrieval (`retrieveKnowledge`, FTS5 BM25) + a 3-tier fallback (Gemini → Ollama → deterministic keyword reply). This is the pattern to reuse for `LlamaAIService`.
- **Frontend personality copy already exists** from this session's i18n work: `nagMessages.js` (time/streak-aware greetings + inactivity nags) and `llamaResponses.js` (quiz correct/wrong reaction pools, exam report openers/remarks), both already bilingual (vi/en) and mood-tagged informally. The new `LlamaMood`/`LlamaEvent` service will **wrap and extend** these rather than duplicate them.
- **i18n:** `translations.jsx` (`LanguageProvider`/`useT`) — all new UI copy must go through this, Vietnamese primary.

## 2. New files to be created

Backend (`backend/`):
- `engines/mastery.js` — deterministic mastery score (0–100), evidence-weighted, per spec formula.
- `engines/mistakeDNA.js` — deterministic mistake classifier (6 types).
- `engines/priority.js` — deterministic topic priority score + reason codes.
- `engines/summitReadiness.js` — deterministic overall readiness score.
- `engines/dailyExpedition.js` — allocates today's activities against the learner's daily-minutes budget.
- `engines/rescueTrail.js` — assembles Rescue Trail content deterministically from existing `flashcards`/`test_questions`.
- `engines/reasonCopy.js` — reason-code → Vietnamese sentence templates (topic priority explanations).
- `llamaAIService.js` — `LlamaAIService` interface: Gemini provider + deterministic fallback, timeout, schema validation.
- `seedDemo.js` — one-off script seeding the demo scenario for user `linsu`.
- `tests/mastery.test.js`, `tests/mistakeDNA.test.js`, `tests/priority.test.js`, `tests/summitReadiness.test.js`, `tests/dailyExpedition.test.js`, `tests/llamaAIService.test.js` — `node:test` unit tests.

Frontend (`frontend/src/`):
- `llamaPersonality.js` — centralized `getLlamaReaction(event, context)` service (`LlamaMood`/`LlamaEvent` per spec), delegating to existing `nagMessages.js`/`llamaResponses.js` where content already exists, new pools for the newly-introduced events.
- `components/DailyExpedition.jsx` — Home card.
- `components/SummitReadiness.jsx` — Home widget.
- `components/RescueTrail.jsx` — rescue flow (explanation + comparison + flashcard + 2 questions + checkpoint), launched from Quiz/Flashcards.
- `components/MistakeDnaCard.jsx` — inline reveal after an incorrect practice answer.
- `components/PathUpdatedModal.jsx` — the "Llama vừa đổi đường!" adaptation modal (shown only on meaningful changes, per spec §10).
- `utils/expedition.js` — thin API client additions (preferences, expedition, mastery, rescue trail, summit readiness).

## 3. Existing files to be modified

- `backend/db.js` — new tables + `ALTER TABLE` additions (see §4).
- `backend/server.js` — new routes; extend `/api/quiz/submit` to always persist per-question detail (not just exam mode) and to run the adaptive loop (mastery → mistake DNA → priority → expedition → readiness) after every submission; extend `/api/flashcards/:id/progress` to log a review event; extend `/api/chat` to accept optional context (current question/mistake/topic) and use `LlamaAIService.answerQuestion`.
- `frontend/src/components/Settings.jsx` — learner preferences section.
- `frontend/src/components/Dashboard.jsx` — slot in `DailyExpedition` + `SummitReadiness`, keep existing cards/mountain journey.
- `frontend/src/components/LessonPath.jsx` — camp states (mastery %, "cần gia cố", current-focus topic), reuses new mastery data rolled up per camp.
- `frontend/src/components/Quiz.jsx` — confidence selector, response-time tracking, inline Mistake DNA, "Ask Llama about this", rescue trail entry point.
- `frontend/src/components/Flashcards.jsx` — due-for-review list, auto-generated-from-mistake badge, rescue trail link.
- `frontend/src/components/Chat.jsx` — contextual quick prompts, sourced-answer footer.
- `frontend/src/App.jsx` — first-time preferences modal trigger (safe default, non-blocking), wiring new context through to Quiz/Dashboard.
- `frontend/src/utils/api.js` — new endpoint wrappers.

## 4. Data migration

All additive (`CREATE TABLE IF NOT EXISTS` / try-catch `ALTER TABLE ADD COLUMN`, matching the existing `selected_path` migration pattern) — no destructive changes, no data loss risk to the live DB (which this worktree doesn't touch anyway).

- `learner_preferences` (user_id PK, exam_date, daily_minutes, target_score, experience_level, preferred_format, goal, updated_at).
- `topic_mastery` (user_id, topic, mastery_score, evidence_count, last_reviewed_at, updated_at; PK user_id+topic).
- `mastery_history` (id, user_id, topic, mastery_score, created_at) — append-only, for explainability + "improved 42%→68%" copy.
- `user_quiz_answers` gains: `difficulty`, `confidence`, `response_time_ms`, `mistake_type` (nullable columns via ALTER).
- `flashcard_reviews` (id, user_id, flashcard_id, topic, known, created_at) — append-only review log (existing `user_flashcard_progress` only keeps latest state, not history — needed for forgetting-risk/due calculations).
- `daily_expedition` (user_id, date, data JSON, updated_at; PK user_id+date) — caches today's generated expedition so reloading Home doesn't regenerate a different plan mid-day, and tracks per-activity completion.
- `rescue_trail_log` (id, user_id, topic, mistake_type, created_at, completed_at) — lightweight record of when a rescue trail was offered/finished (not a queue; content itself is assembled on demand by `engines/rescueTrail.js`).

## 5. Risks

- **Practice mode never persisted per-question data before** — extending `/api/quiz/submit` to always log answers is the riskiest change to an existing endpoint; must keep the existing response shape 100% backward compatible (additive fields only) so `Quiz.jsx`'s current handling doesn't break.
- **Topic taxonomy mismatch** (4 camps vs 8 real topics) means the mountain journey can only show a *rolled-up* mastery signal per camp, not 1:1 — being upfront about this in the UI copy rather than faking precision.
- **No response-time/confidence data exists historically** — mastery/mistake-DNA formulas must degrscefully default (e.g. `confidence: 'unknown'`, `responseTime: expected`) for all past answers so nothing crashes on old rows.
- **Scope** — this spec is very large; §21 tests and §19 polish (reduced-motion, subtle animations) will be implemented for the core loop but not gold-plated everywhere.
- **LLM dependency** — Gemini quota was previously observed at hard `limit: 0` (from earlier work this session); `LlamaAIService` must work correctly with the deterministic fallback alone, since the real provider may not be usable during the demo.

## 6. Implementation order

1. DB migrations (`db.js`).
2. Deterministic engines + unit tests (mastery → mistake DNA → priority → summit readiness → daily expedition → rescue trail assembly).
3. `LlamaAIService` (Gemini + deterministic fallback + timeout + schema check).
4. Frontend `llamaPersonality.js` (event/mood service).
5. Backend routes wiring (preferences, expedition, mastery, summit-readiness, rescue-trail, extended quiz-submit/flashcard-progress/chat).
6. Frontend: Settings preferences → Dashboard (Daily Expedition + Summit Readiness) → LessonPath camp states → Quiz (confidence + timing + mistake DNA + rescue entry) → Flashcards (due list + rescue link) → Chat (contextual prompts + sources) → adaptation modal.
7. `seedDemo.js` demo scenario for `linsu`.
8. Tests, lint, build; manual smoke test of the full loop on isolated ports (not the live 5005/5173) before reporting back for merge review.
