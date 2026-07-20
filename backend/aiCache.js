// Fingerprint-based generation cache (audit §10). Re-running the exact same
// generation request (same task, same source versions, same trainer input,
// same model) is pure wasted spend — this returns the prior result instead
// of calling the model again.

import crypto from 'crypto';
import { logAIUsage } from './aiUsageLog.js';

export function computeFingerprint({ taskType, sourceChunkIds = [], sourceVersions = [], normalizedInput = '', model = '' }) {
  const raw = [
    taskType,
    [...sourceChunkIds].sort().join(','),
    [...sourceVersions].sort().join(','),
    normalizedInput,
    model
  ].join('|');
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function getCached(db, fingerprint) {
  const row = await db.get('SELECT result FROM ai_generation_cache WHERE fingerprint = ?', [fingerprint]);
  if (!row) return null;
  try { return JSON.parse(row.result); } catch { return null; }
}

export async function setCached(db, fingerprint, taskType, result) {
  await db.run(
    'INSERT OR REPLACE INTO ai_generation_cache (fingerprint, task_type, result) VALUES (?, ?, ?)',
    [fingerprint, taskType, JSON.stringify(result)]
  );
}

// Unambiguous marker for the cache-control wrapper below — plain result
// objects are cached as-is, so opting out of caching can't be duck-typed
// off of an ordinary "value"/"shouldCache" property name (a real result
// could legitimately have either) without risking a false match.
const CACHE_CONTROL_MARKER = Symbol('withCacheControl');

/** Wraps a computeFn's return value with an explicit cache-or-not decision —
 * use when a build may have fallen back to deterministic-only output and a
 * failed AI attempt shouldn't be locked in for this fingerprint. */
export function withCacheControl(value, shouldCache) {
  return { [CACHE_CONTROL_MARKER]: true, value, shouldCache };
}

/**
 * Runs `computeFn` only on a cache miss; logs a cache-hit usage row either way.
 * `computeFn` may return a plain result object (always cached), or the
 * result of `withCacheControl(value, shouldCache)` to opt out when the
 * underlying AI call didn't actually succeed — there's no spend to save by
 * caching a call that never succeeded, and doing so would lock in the
 * fallback for every future request with this fingerprint even after the AI
 * recovers a moment later.
 * @param {import('sqlite').Database} db
 * @param {{ taskType: string, sourceChunkIds?: string[], sourceVersions?: string[], normalizedInput?: string, model?: string }} fingerprintInput
 * @param {() => Promise<object>} computeFn
 */
export async function withGenerationCache(db, fingerprintInput, computeFn) {
  const start = Date.now();
  const fingerprint = computeFingerprint(fingerprintInput);
  const cached = await getCached(db, fingerprint);
  if (cached) {
    await logAIUsage(db, { taskType: fingerprintInput.taskType, provider: 'cache', cached: true, success: true, durationMs: Date.now() - start });
    return { result: cached, cached: true };
  }
  const computed = await computeFn();
  const isControlled = computed && typeof computed === 'object' && computed[CACHE_CONTROL_MARKER] === true;
  const result = isControlled ? computed.value : computed;
  const shouldCache = isControlled ? computed.shouldCache : true;
  if (shouldCache) await setCached(db, fingerprint, fingerprintInput.taskType, result);
  return { result, cached: false };
}
