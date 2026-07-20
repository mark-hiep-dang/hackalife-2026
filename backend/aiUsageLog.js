// AI usage logging (audit §11). Every attempted AI call — cached, demo,
// successful, or failed — gets one row, so cost/latency/failure rate are
// answerable without re-instrumenting anything later. Never logs prompt or
// source content, only counts and metadata.

export async function logAIUsage(db, {
  taskType, provider, model = null, inputTokenCount = null, outputTokenCount = null,
  cached = false, success, durationMs, errorCode = null
}) {
  if (!db) return; // logging is best-effort; callers without a db handle just skip it
  try {
    await db.run(
      `INSERT INTO ai_usage_log (task_type, provider, model, input_token_count, output_token_count, cached, success, duration_ms, error_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [taskType, provider, model, inputTokenCount, outputTokenCount, cached ? 1 : 0, success ? 1 : 0, durationMs, errorCode]
    );
  } catch (err) {
    console.warn('AI usage logging failed (non-fatal):', err.message);
  }
}

export async function getAIUsageSummary(db) {
  const today = new Date().toISOString().split('T')[0];
  const callsToday = await db.get(`SELECT COUNT(*) c FROM ai_usage_log WHERE date(created_at) = ?`, [today]);
  const byTask = await db.all(`SELECT task_type, COUNT(*) c FROM ai_usage_log GROUP BY task_type ORDER BY c DESC`);
  const byModel = await db.all(`SELECT model, COUNT(*) c FROM ai_usage_log WHERE model IS NOT NULL GROUP BY model ORDER BY c DESC`);
  const tokens = await db.get(`SELECT SUM(input_token_count) inputTokens, SUM(output_token_count) outputTokens FROM ai_usage_log`);
  const cacheStats = await db.get(`SELECT AVG(cached) rate FROM ai_usage_log`);
  const failureStats = await db.get(`SELECT AVG(1 - success) rate FROM ai_usage_log`);
  const latency = await db.get(`SELECT AVG(duration_ms) avgMs FROM ai_usage_log WHERE duration_ms IS NOT NULL`);
  return {
    callsToday: callsToday.c,
    byTask,
    byModel,
    inputTokens: tokens.inputTokens || 0,
    outputTokens: tokens.outputTokens || 0,
    cacheHitRate: Math.round((cacheStats.rate || 0) * 100),
    failureRate: Math.round((failureStats.rate || 0) * 100),
    averageLatencyMs: Math.round(latency.avgMs || 0)
  };
}
