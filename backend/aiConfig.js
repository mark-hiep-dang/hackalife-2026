// Central AI configuration + task router (AI usage audit, spec §4/§16).
// Every AI call in the app must go through selectModelForTask() rather than
// hardcoding a model name — this is the single place that decides which
// tasks get the (more capable, more expensive) main model, which get the
// (cheap, fast) light model, and which should never call an LLM at all.
//
// Model IDs are read from env so they can be swapped without a code change;
// the defaults below are confirmed live against this project's actual key
// (GET /v1beta/models lists both, and gemini-3.1-flash-lite returns a real
// generateContent response — gemini-3.5-flash is a valid model for this key
// too, occasionally 503 "high demand" at the moment, which the existing
// retry+deterministic-fallback path already handles). If an operator sets
// GEMINI_MAIN_MODEL/GEMINI_LIGHT_MODEL to a model name that doesn't exist,
// the API call fails and the deterministic fallback in geminiClient.js takes
// over — it does not break the app.

// Getters, not plain fields — read process.env live on every access rather
// than freezing a snapshot at import time. Without this, tests (and any
// runtime env change) couldn't affect behavior after the module first loads.
export const AI_CONFIG = {
  get mainModel() { return process.env.GEMINI_MAIN_MODEL || 'gemini-3.5-flash'; },
  get lightModel() { return process.env.GEMINI_LIGHT_MODEL || 'gemini-3.1-flash-lite'; },
  get enabled() { return process.env.AI_ENABLED !== 'false'; },
  get demoMode() { return process.env.DEMO_MODE === 'true'; }
};

// @typedef {"GENERATE_CURRICULUM"|"GENERATE_LESSON_KIT"|"GENERATE_COMPLEX_SCENARIO"|"GENERATE_RESCUE_EXPEDITION"|"SUGGEST_COMPLEX_QUALITY_FIX"|"REWRITE_QUESTION"|"GENERATE_FLASHCARDS"|"GENERATE_MCQ_FROM_SOURCE"|"GENERATE_KNOWLEDGE_SUMMARY"|"SUMMARIZE_INSIGHT"|"EXPLAIN_METRIC"|"GENERATE_LLAMA_COPY"|"TRAINER_COPILOT_SIMPLE"|"TRAINER_COPILOT_COMPLEX"|"LEARNER_CHAT"} LlamaAITask
export const AI_TASKS = Object.freeze({
  GENERATE_CURRICULUM: 'GENERATE_CURRICULUM',
  GENERATE_LESSON_KIT: 'GENERATE_LESSON_KIT',
  GENERATE_COMPLEX_SCENARIO: 'GENERATE_COMPLEX_SCENARIO',
  GENERATE_RESCUE_EXPEDITION: 'GENERATE_RESCUE_EXPEDITION',
  SUGGEST_COMPLEX_QUALITY_FIX: 'SUGGEST_COMPLEX_QUALITY_FIX',
  REWRITE_QUESTION: 'REWRITE_QUESTION',
  GENERATE_FLASHCARDS: 'GENERATE_FLASHCARDS',
  // Document-grounded generation (trainer-uploaded giáo án → draft content).
  // Split from GENERATE_FLASHCARDS/GENERATE_COMPLEX_SCENARIO since inventing
  // a plausible-but-wrong distractor set for an MCQ is the highest-risk part
  // of this pipeline — worth its own main-tier task rather than reusing the
  // lighter-weight scenario task.
  GENERATE_MCQ_FROM_SOURCE: 'GENERATE_MCQ_FROM_SOURCE',
  GENERATE_KNOWLEDGE_SUMMARY: 'GENERATE_KNOWLEDGE_SUMMARY',
  SUMMARIZE_INSIGHT: 'SUMMARIZE_INSIGHT',
  EXPLAIN_METRIC: 'EXPLAIN_METRIC',
  GENERATE_LLAMA_COPY: 'GENERATE_LLAMA_COPY',
  TRAINER_COPILOT_SIMPLE: 'TRAINER_COPILOT_SIMPLE',
  TRAINER_COPILOT_COMPLEX: 'TRAINER_COPILOT_COMPLEX',
  // Not in the original Studio-only task list, but the learner app has the
  // same "grounded Q&A" shape as Trainer Copilot Simple — kept as its own
  // task rather than overloading TRAINER_COPILOT_SIMPLE across two audiences.
  LEARNER_CHAT: 'LEARNER_CHAT'
});

const MAIN_MODEL_TASKS = new Set([
  AI_TASKS.GENERATE_CURRICULUM,
  AI_TASKS.GENERATE_LESSON_KIT,
  AI_TASKS.GENERATE_COMPLEX_SCENARIO,
  AI_TASKS.GENERATE_RESCUE_EXPEDITION,
  AI_TASKS.SUGGEST_COMPLEX_QUALITY_FIX,
  AI_TASKS.GENERATE_MCQ_FROM_SOURCE,
  AI_TASKS.TRAINER_COPILOT_COMPLEX
]);

const LIGHT_MODEL_TASKS = new Set([
  AI_TASKS.REWRITE_QUESTION,
  AI_TASKS.GENERATE_FLASHCARDS,
  AI_TASKS.GENERATE_KNOWLEDGE_SUMMARY,
  AI_TASKS.SUMMARIZE_INSIGHT,
  AI_TASKS.EXPLAIN_METRIC,
  AI_TASKS.TRAINER_COPILOT_SIMPLE,
  AI_TASKS.LEARNER_CHAT
]);

/**
 * @param {LlamaAITask} task
 * @returns {"main"|"light"|"none"}
 */
export function selectModelForTask(task) {
  // Llama's canned reactions (greetings, empty states, "generation complete",
  // etc.) always come from the local copy library — never worth an API call.
  if (task === AI_TASKS.GENERATE_LLAMA_COPY) return 'none';
  if (MAIN_MODEL_TASKS.has(task)) return 'main';
  if (LIGHT_MODEL_TASKS.has(task)) return 'light';
  return 'none';
}

export function modelNameForTask(task) {
  const tier = selectModelForTask(task);
  if (tier === 'main') return AI_CONFIG.mainModel;
  if (tier === 'light') return AI_CONFIG.lightModel;
  return null;
}

/** True when a real Gemini call should even be attempted for this task. */
export function shouldCallAI(task) {
  if (!AI_CONFIG.enabled || AI_CONFIG.demoMode) return false;
  if (!process.env.GEMINI_API_KEY) return false;
  return selectModelForTask(task) !== 'none';
}
