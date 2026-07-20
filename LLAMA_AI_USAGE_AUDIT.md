# Llama AI Usage Audit

Scope: every place the app calls (or could call) an LLM, across the learner app and Llama Studio. Written after inspecting the actual repository — not a plan, a record of what exists and what changed.

## 1. Architecture before this pass

- `backend/geminiClient.js` — one shared `callGemini(systemInstruction, userMessage, opts)`, hardcoded to `gemini-2.0-flash`, no retry, no usage log, no caching, no task concept at all. Every caller passed only a `label` for console warnings.
- `backend/llamaAIService.js` (learner) and `backend/studio/studioAIService.js` (trainer) each wrap it with their own personality system prompt.
- Every deterministic engine (`engines/*.js`, `studio/engines/*.js`) already had **zero** AI calls — mastery, mistake DNA, priority ranking, Summit Readiness, daily-expedition allocation, course quality, mock-exam analytics, learner risk, misconception clustering, intervention effectiveness were already 100% deterministic. This was true before this audit and is now also **proven by a test** (see §7).
- No model routing, no task typing, no structured-output validation beyond a shallow `matchesShape()` type-check, no generation cache, no usage logging, no explicit `DEMO_MODE` flag. **Correction from an earlier draft of this audit**: I had initially assumed the configured Gemini key still had zero quota (true for most of this session) and shipped `gemini-2.0-flash`/`gemini-2.0-flash-lite` as the model defaults on that assumption. The user pointed out the key now has quota — I re-checked directly against the live API (`GET /v1beta/models` + a real `generateContent` call) rather than trusting the earlier assumption, confirmed `gemini-3.1-flash-lite` returns real responses and `gemini-3.5-flash` is a valid model for this key (currently returning transient `503 UNAVAILABLE` — high demand on Google's side, not a quota/auth problem), and corrected the defaults to match — see §5.
- `knowledgeBase.js`'s `retrieveKnowledge()` had **no `approved` filter at all** — it could retrieve chunks from an unapproved/draft document into a generation prompt. This was a real gap against the grounding requirement, now fixed (§3).

## 2. Every AI call site — before → after

| Call site | Necessary? | Task (after) | Tier | Notes |
|---|---|---|---|---|
| `generateCurriculum` (curriculum summary rewrite) | Yes — synthesizes prose across multiple camps/topics | `GENERATE_CURRICULUM` | main | Now cached by `{preferredCamps, targetDurationMinutes}` fingerprint; output validated (§4) |
| `generateLessonKit` | **No AI call, by design** — see §2.1 | — | none | Deliberately deterministic |
| `explainCurriculumDecision` | Yes, marginal — simple rewrite of an existing deterministic sentence | `EXPLAIN_METRIC` | light | |
| `suggestQualityFix` | Yes | `SUGGEST_COMPLEX_QUALITY_FIX` (BLOCKER/WARNING) or `EXPLAIN_METRIC` (SUGGESTION/INFO) | main or light | Now routes by the issue's own deterministic severity |
| `suggestQuestionRewrite` | Yes | `REWRITE_QUESTION` | light | |
| `generateIntervention` (Rescue Expedition) | Yes — synthesizes trainer summary + learner intro from aggregated data | `GENERATE_RESCUE_EXPEDITION` | main | Now cached by `{topic, mistakeType, durationMinutes}`; output validated (§4); only aggregate learner count sent, never names (§6) |
| `summarizeMockExamInsight` | Yes | `SUMMARIZE_INSIGHT` | light | |
| `summarizeLearnerInsight` | Yes | `SUMMARIZE_INSIGHT` | light | |
| `answerTrainerQuestion` (Trainer Copilot) | Yes | `TRAINER_COPILOT_SIMPLE` | light | Copilot cannot write data today, so `TRAINER_COPILOT_COMPLEX` is defined but unused until the Copilot gains a generation action |
| `explainExpedition` (learner) | Yes, marginal | `EXPLAIN_METRIC` | light | |
| `explainMistake` (learner) | Yes, marginal | `EXPLAIN_METRIC` | light | |
| `generateRescueTrail` (learner, title/intro/outro) | **Removed** — see §2.2 | — | none (local copy) | |
| `answerQuestion` (learner "Hỏi Llama" chat) | Yes | `LEARNER_CHAT` | light | Not in the original Studio-only task enum; added since the learner app has the same grounded-Q&A shape |

### 2.1 Why Lesson Kit generation makes zero AI calls

`generateLessonKit` pulls real flashcards/questions from the trainer-approved MOF exam bank (`flashcards`/`test_questions` tables) rather than generating new ones. This was already true before the audit; it's kept exactly as-is, deliberately, for two reasons: fabricating new insurance-exam questions carries real legal/accuracy risk that a single-shot generation call can't safely absorb, and the existing bank is both higher-quality and already trainer-approved by construction. The micro-lesson/memory-tip copy is template text, not a second AI call — the copy already reads fine, and errors there would only be a style nit, not a fact risk, which doesn't clear the bar in §15 of the original spec ("do not add AI merely to make the product appear more AI-powered").

### 2.2 Why `generateRescueTrail`'s AI call was removed

This function only produced a title/introduction/outro wrapper around the Rescue Trail's already-assembled factual content (flashcard, questions — all sourced elsewhere). This is exactly the "Llama reaction to a known event" case: a local copy pool (`RESCUE_INTROS`, keyed by mistake type) already existed as the fallback and reads fine. Calling an API for wrapper copy that never carries new facts is the textbook "AI to look more AI-powered" case the audit is meant to catch — removed, `generateRescueTrail` is now a plain synchronous deterministic function.

## 3. Grounded content pipeline

- `knowledgeBase.js`'s `retrieveKnowledge()` now joins to `knowledge_documents` and filters `WHERE d.approved = 1` — **fixed**, this was previously missing entirely. Both the learner chat and Trainer Copilot go through this same function, so both are now actually grounded-to-approved-sources, not just grounded-to-whatever-was-uploaded.
- `findSourceChunkForTopic()` (Studio) already only reads through `retrieveKnowledge`, so it inherits the same fix automatically.
- Curriculum/Lesson Kit generation already required a non-empty `sourceChunkIds` array per lesson/question (unchanged) — now also checked by `validateCurriculumProposal` (§4).
- No document-processing/OCR pipeline exists in this repo (PDF text extraction via `pdf-parse` already happens once at upload, chunked, stored — not re-sent per generation). No changes needed here; this was already correct.

## 4. Structured output validation (`backend/aiValidation.js` — new)

No Zod in this repo (plain JS, no TypeScript) — added small dependency-free validators in the same spirit:

- `validateCurriculumProposal(proposal, approvedChunkIds)` — rejects missing camps/lessons, a lesson with no title, a non-positive `estimatedMinutes`, a lesson with no `sourceChunkIds`, or a lesson citing a chunk ID outside the approved set.
- `validateGeneratedQuestion(q)` — rejects a question without exactly 4 options or with `correctOption` outside 0–3.
- `validateInterventionProposal(intervention)` — rejects a missing title, non-positive duration, or missing summary/introduction.

These run after `generateCurriculum`/`generateIntervention` build their result (cached or fresh) and log a warning on failure — they don't hard-block the response today since the deterministic build path can't actually produce invalid output, but they're the seam a future "let AI restructure the lesson list" feature would need to hook into before trusting model output.

## 5. Model routing (`backend/aiConfig.js` — new)

Central, single source of truth. Every AI call goes through `selectModelForTask(task)`:

- **Main model** (`GEMINI_MAIN_MODEL`, default `gemini-3.5-flash`): `GENERATE_CURRICULUM`, `GENERATE_LESSON_KIT` (defined, currently unused per §2.1), `GENERATE_COMPLEX_SCENARIO` (defined, not yet wired to a call site), `GENERATE_RESCUE_EXPEDITION`, `SUGGEST_COMPLEX_QUALITY_FIX`, `TRAINER_COPILOT_COMPLEX` (defined, not yet wired).
- **Light model** (`GEMINI_LIGHT_MODEL`, default `gemini-3.1-flash-lite`): `REWRITE_QUESTION`, `GENERATE_FLASHCARDS` (defined, not yet wired — flashcards are deterministic per §2.1), `SUMMARIZE_INSIGHT`, `EXPLAIN_METRIC`, `TRAINER_COPILOT_SIMPLE`, `LEARNER_CHAT`.
- **None**: `GENERATE_LLAMA_COPY` — always the local copy library, never a call.
- `AI_ENABLED`, `DEMO_MODE`, `GEMINI_MAIN_MODEL`, `GEMINI_LIGHT_MODEL` are read live from `process.env` (getters, not a frozen snapshot) so they're actually testable and could be flipped without a redeploy.

**On the specific model names**: verified directly against the live API with the project's real key — `GET /v1beta/models` lists both `gemini-3.5-flash` and `gemini-3.1-flash-lite`, and a real `generateContent` call to `gemini-3.1-flash-lite` returned genuine AI output (confirmed live: a question-rewrite request produced natural, contextually-correct Vietnamese phrasing, logged with `provider: gemini`, real token counts). `gemini-3.5-flash` is also a valid model for this key but is currently returning `503 UNAVAILABLE` ("high demand") on Google's side most of the time — not a quota or auth problem, just the model being temporarily overloaded globally; every call site using it degrades to its deterministic fallback exactly as designed when that happens. Both are set as the actual defaults now. If a configured name ever turns out invalid, the call fails and the deterministic fallback takes over automatically.

**Bug found and fixed while verifying this live**: the generation cache (§7) originally cached a request's result unconditionally, including when the AI call had failed and the deterministic fallback was used. That meant a transient `gemini-3.5-flash` outage got "locked in" as the cached result for that fingerprint even after the model recovered — regenerating with the same inputs kept returning the stale fallback instead of trying AI again. Fixed: `withGenerationCache` now only persists a result when the caller explicitly marks it cacheable via `withCacheControl(value, shouldCache)`; `generateCurriculum`/`generateIntervention` pass `shouldCache: false` whenever their Gemini call didn't return text. Verified live — two consecutive identical curriculum-generate requests during the `gemini-3.5-flash` outage each made a fresh real attempt (`timeout`, then `http_503`) rather than the second one silently reusing a cached failure.

## 6. Privacy

- `generateIntervention`'s prompt sends `topic`, `mistakeType`, `learnerCount`, `durationMinutes` — never learner names or IDs. Confirmed by reading the actual prompt text (§2, table).
- `answerTrainerQuestion`/`answerQuestion` send only the trainer's/learner's own message plus retrieved approved source text — no other users' data ever enters a prompt.
- `ai_usage_log` stores task/model/token-counts/timing only — never prompt or source content.

## 7. Cost control

- **Caching** (`backend/aiCache.js`, new): `generateCurriculum` and `generateIntervention` — the two priciest, most likely to be re-run with identical inputs — are wrapped in `withGenerationCache()`, keyed by a SHA-256 fingerprint of `{taskType, sourceChunkIds, sourceVersions, normalizedInput, model}`. A cache hit skips the AI call entirely and is itself logged (`provider: 'cache'`) so the hit-rate metric is real. Verified live: two identical `generate-curriculum` requests produced exactly one Gemini attempt and one cache-hit log row.
- **One retry, not more**: `geminiClient.js`'s `callGemini` now retries once on failure/timeout, then gives up and returns `null` (deterministic fallback takes over).
- **No AI on page load**: nothing in Overview, Mock Exam Analytics, Course Quality (the check itself), Learner Risk, or Misconception Clustering ever imports `geminiClient` — proven by the new engine-import test (§9).
- Retrieved source chunks are already limited (`retrieveKnowledge(..., limit)`, typically 1–6) — unchanged, was already reasonable.
- Not implemented (see §10): idempotency keys against double-click, per-trainer rate limiting, and per-task hard token-output caps. The existing UI already disables the triggering button while a request is in flight for every generation action, which covers the common double-click case in practice; a server-side idempotency key would be the more rigorous version of the same guarantee.

## 8. Usage logging (`backend/aiUsageLog.js`, `ai_usage_log` table — new)

Every attempted call — demo-mode skip, cache hit, success, or failure — writes one row: `task_type, provider ('gemini'|'demo'|'cache'), model, input_token_count, output_token_count, cached, success, duration_ms, error_code, created_at`. `getAIUsageSummary(db)` computes calls-today, calls-by-task, calls-by-model, total tokens, cache-hit rate, failure rate, and average latency — no route exposes this yet (no admin UI was built this pass; the summary function exists and is ready to wire to a route if/when a Studio "AI usage" screen is wanted).

## 9. Tests added (`backend/tests/aiUsageAudit.test.js`, 36 tests)

- Router: every task routes to the tier the spec's own table specifies; unknown task defaults to `none`; `GENERATE_LLAMA_COPY` always `none`.
- Demo/zero-quota: `shouldCallAI` is false with no key (this repo's actual state), false under `DEMO_MODE=true`, false under `AI_ENABLED=false`, true only when a key exists AND the task actually routes to a model.
- Validation: curriculum/question/intervention validators reject the specific malformed shapes the spec calls out (missing lessons, unapproved citation, non-positive duration, wrong option count, out-of-range correct answer) and accept a well-formed proposal.
- Caching: fingerprint is stable for identical input, differs for different input; `withGenerationCache` invokes the compute function exactly once across two identical requests.
- `generateRescueTrail` resolves synchronously with no network call.
- Every file in `engines/` and `studio/engines/` is scanned and asserted to not import `geminiClient` — this is the closest a static test can get to "opening these screens never calls Gemini," since none of these deterministic modules can reach the network at all.

Full suite: **112/112 passing** (76 pre-existing + 36 new), zero regressions. Frontend production build unaffected (no frontend files touched this pass).

## 10. What was not implemented (explicit scope cut)

- **Admin/developer usage dashboard UI** — `getAIUsageSummary()` exists and is tested indirectly via the logging tests, but no Studio screen renders it. Wiring a route + a simple Studio page is straightforward follow-up work if wanted.
- **Idempotency keys / server-side double-click prevention** — relies on the existing UI's disable-while-busy pattern instead of a server-enforced key. Real but lower-risk gap given the UI-level protection already there.
- **Per-trainer rate limiting** — not implemented; this is a single-tenant personal app today, not a multi-trainer SaaS, so the risk this protects against (one trainer exhausting shared quota) doesn't currently apply. Worth adding before any multi-trainer deployment.
- **Retry-with-repair-instruction** — implemented as a plain second attempt with the same prompt, not a distinct "here's what was wrong, fix it" repair prompt. Simpler, still bounded to one retry.
- **Multimodal/scanned-PDF document understanding** — not present before or after; the existing pipeline is text-extract → chunk → approve, which covers this repo's actual source materials (typed exam-prep PDFs, not scanned images).
- **`GENERATE_COMPLEX_SCENARIO`, `GENERATE_FLASHCARDS`, `TRAINER_COPILOT_COMPLEX`** are defined in the router (so the enum matches the full spec) but have no call site yet, since the corresponding features (AI-generated scenarios/flashcards distinct from the exam bank, and a Copilot action that actually writes data) don't exist in the product today. Nothing routes to them, so they cost nothing — they're there so a future feature has an obvious slot rather than inventing a new one.
- **Verified against a real, quota-available Gemini call** (this was previously listed as a limitation — corrected after the user flagged that the key now has quota): a real `content-items/:id/rewrite` request returned genuine AI-authored text via `gemini-3.1-flash-lite`, logged as `provider: gemini` with real input/output token counts. `gemini-3.5-flash` (main tier) is a valid model for this key but is presently returning transient `503 UNAVAILABLE` most of the time — every main-tier call site was confirmed to degrade to its deterministic fallback correctly when that happens, and to retry fresh (not serve a stale cached failure) on the next identical request.
