import test from 'node:test';
import assert from 'node:assert/strict';
import { initDb, getDb } from '../db.js';
import { explainExpedition, explainMistake, generateRescueTrail, answerQuestion } from '../llamaAIService.js';

// Force the deterministic-fallback path regardless of the environment's real
// key, so this suite verifies "demo mode works without an API key" (spec §21).
const savedKey = process.env.GEMINI_API_KEY;
test.before(() => { delete process.env.GEMINI_API_KEY; });
test.after(() => { if (savedKey) process.env.GEMINI_API_KEY = savedKey; });

test('explainExpedition: falls back to the deterministic explanation verbatim (both languages) without a key', async () => {
  const { message, mood } = await explainExpedition({
    focusTopicLabel: 'Nghĩa vụ đại lý',
    deterministicExplanation: {
      vi: 'Llama chọn "Nghĩa vụ đại lý" vì bạn chưa vững phần này.',
      en: 'Llama picked "Nghĩa vụ đại lý" because you haven\'t gotten solid on this part yet.'
    },
    dailyMinutes: 15
  });
  assert.equal(message.vi, 'Llama chọn "Nghĩa vụ đại lý" vì bạn chưa vững phần này.');
  assert.equal(message.en, 'Llama picked "Nghĩa vụ đại lý" because you haven\'t gotten solid on this part yet.');
  assert.equal(mood, 'thinking');
});

test('explainMistake: fallback message includes the mistake label and the exact explanation (facts preserved)', async () => {
  const { message } = await explainMistake({
    mistakeLabel: 'Hai khái niệm đang đổi áo cho nhau',
    explanation: 'Bạn đang nhầm nghĩa vụ của đại lý với nghĩa vụ của doanh nghiệp bảo hiểm.',
    question: 'Đại lý bảo hiểm có nghĩa vụ gì?'
  });
  assert.match(message, /Hai khái niệm đang đổi áo cho nhau/);
  assert.match(message, /nhầm nghĩa vụ của đại lý với nghĩa vụ của doanh nghiệp bảo hiểm/);
});

test('generateRescueTrail: fallback returns a well-formed trail without a key', async () => {
  const trail = await generateRescueTrail({ topic: '7. Đại lý, đạo đức, quyền & nghĩa vụ', mistakeType: 'concept_confusion', conceptPair: null });
  assert.equal(typeof trail.title, 'string');
  assert.equal(typeof trail.introduction, 'string');
  assert.equal(typeof trail.outro, 'string');
  assert.match(trail.title, /Chặng cứu hộ/);
});

test('answerQuestion: grounds an answer from the seeded FAQ knowledge base without a key', async () => {
  await initDb();
  const db = await getDb();
  const result = await answerQuestion(db, { message: 'Thời gian cân nhắc là gì?' });
  assert.equal(result.grounded, true);
  assert.match(result.answer, /21 ngày/);
});

test('answerQuestion: honestly says it lacks information when nothing matches (never fabricates)', async () => {
  await initDb();
  const db = await getDb();
  const result = await answerQuestion(db, { message: 'xyzxyz không tồn tại trong tài liệu nào cả 123123' });
  assert.equal(result.grounded, false);
  assert.match(result.answer, /chưa tìm được đủ thông tin/);
});
