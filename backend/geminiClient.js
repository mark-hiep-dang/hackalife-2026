// Shared Gemini call helper — used by both LlamaAIService (learner-facing)
// and StudioAIService (trainer-facing). Every caller must still provide its
// own deterministic fallback; this only wraps the network call itself with
// task-based model routing, a timeout, one retry, usage logging, and
// graceful null-on-failure (AI usage audit §4/§6/§10/§11).

import { shouldCallAI, modelNameForTask } from './aiConfig.js';
import { logAIUsage } from './aiUsageLog.js';

// Measured against this project's live key: the configured main model
// (gemini-3.5-flash, a "thinking" model — see aiConfig.js) routinely takes
// 9-20s to respond even to short prompts, well past a naive 6s budget. That
// mismatch was the actual cause of most "AI generation" silently falling
// back to deterministic/empty results — the Gemini call really was being
// attempted, it just kept losing the race against the timeout. Callers on
// the fast light model (aiConfig.js LIGHT_MODEL_TASKS, ~1s observed) still
// get a comfortable safety margin at this value; call sites on the main
// model pass their own longer explicit timeoutMs (see studioAIService.js).
const DEFAULT_TIMEOUT_MS = 10000;
const MAX_ATTEMPTS = 2; // one call + one retry, per audit §10 rule 9

async function requestOnce(model, systemInstruction, userMessage, timeoutMs, history) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const contents = [
      ...(history || []).map((h) => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents
        })
      }
    );
    if (!res.ok) return { text: null, error: `http_${res.status}` };
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    return {
      text,
      inputTokenCount: data.usageMetadata?.promptTokenCount ?? null,
      outputTokenCount: data.usageMetadata?.candidatesTokenCount ?? null
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @param {string} systemInstruction
 * @param {string} userMessage
 * @param {{ task?: import('./aiConfig.js').LlamaAITask, db?: object, timeoutMs?: number, label?: string, history?: {role: string, content: string}[] }} options
 *   `task` drives model routing (aiConfig.selectModelForTask) — every call
 *   site should pass one. `db`, if provided, gets a usage-log row regardless
 *   of outcome (demo/skip/success/failure) — omit only when no db handle is
 *   available yet (usage simply won't be logged for that call). `history`
 *   (optional) carries prior turns for a multi-turn conversation (e.g. Ask
 *   Llama chat) — each entry's `role` is 'user' or 'assistant'.
 */
export async function callGemini(systemInstruction, userMessage, { task, db = null, timeoutMs = DEFAULT_TIMEOUT_MS, label = 'AIService', history } = {}) {
  const start = Date.now();

  if (!shouldCallAI(task)) {
    // No key / AI disabled / demo mode / task routed to "none" (e.g. Llama
    // reactions, which must always come from the local copy library).
    await logAIUsage(db, { taskType: task || 'UNKNOWN', provider: 'demo', success: true, durationMs: 0, cached: false });
    return null;
  }

  const model = modelNameForTask(task);
  let lastErrorCode = null;
  let usage = { inputTokenCount: null, outputTokenCount: null };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { text, error, inputTokenCount, outputTokenCount } = await requestOnce(model, systemInstruction, userMessage, timeoutMs, history);
      usage = { inputTokenCount, outputTokenCount };
      if (text != null) {
        await logAIUsage(db, { taskType: task, provider: 'gemini', model, success: true, durationMs: Date.now() - start, ...usage });
        return text;
      }
      lastErrorCode = error || 'empty_response';
    } catch (err) {
      lastErrorCode = err.name === 'AbortError' ? 'timeout' : (err.message || 'unknown_error');
      console.warn(`${label}: Gemini call failed (attempt ${attempt}/${MAX_ATTEMPTS}). Reason:`, lastErrorCode);
    }
  }

  await logAIUsage(db, { taskType: task, provider: 'gemini', model, success: false, durationMs: Date.now() - start, errorCode: lastErrorCode, ...usage });
  return null;
}

// Minimal manual schema check (no ajv dependency) — verifies required keys
// exist with the right primitive type before trusting an LLM response shape.
export function matchesShape(shape, obj) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.entries(shape).every(([key, type]) => typeof obj[key] === type);
}
