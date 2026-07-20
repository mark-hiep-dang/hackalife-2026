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

/**
 * Runs `computeFn` only on a cache miss; logs a cache-hit usage row either way.
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
  const result = await computeFn();
  await setCached(db, fingerprint, fingerprintInput.taskType, result);
  return { result, cached: false };
}
