// Shared Gemini call helper — used by both LlamaAIService (learner-facing)
// and StudioAIService (trainer-facing). Every caller must still provide its
// own deterministic fallback; this only wraps the network call itself with
// a timeout and graceful null-on-failure.

const GEMINI_MODEL = 'gemini-2.0-flash';
const DEFAULT_TIMEOUT_MS = 6000;

export async function callGemini(systemInstruction, userMessage, { timeoutMs = DEFAULT_TIMEOUT_MS, label = 'AIService' } = {}) {
  if (!process.env.GEMINI_API_KEY) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }]
        })
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (err) {
    console.warn(`${label}: Gemini call failed, using deterministic fallback. Reason:`, err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Minimal manual schema check (no ajv dependency) — verifies required keys
// exist with the right primitive type before trusting an LLM response shape.
export function matchesShape(shape, obj) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.entries(shape).every(([key, type]) => typeof obj[key] === type);
}
