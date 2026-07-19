import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyMistake, MISTAKE_TYPES } from '../engines/mistakeDNA.js';

test('mistakeDNA: high-confidence wrong answer with reasonable mastery is concept confusion', () => {
  const { type } = classifyMistake({
    question: 'Đại lý bảo hiểm có nghĩa vụ gì đối với khách hàng?',
    previousMastery: 55,
    confidence: 'certain',
    responseTimeMs: 20000,
    expectedTimeMs: 45000
  });
  assert.equal(type, MISTAKE_TYPES.CONCEPT_CONFUSION);
});

test('mistakeDNA: negation-keyword question answered too fast is a reading error', () => {
  const { type } = classifyMistake({
    question: 'Điều nào sau đây KHÔNG đúng về nghĩa vụ đại lý?',
    previousMastery: 60,
    responseTimeMs: 5000,
    expectedTimeMs: 45000
  });
  assert.equal(type, MISTAKE_TYPES.READING_ERROR);
});

test('mistakeDNA: exception-tagged question is an exception error regardless of speed', () => {
  const { type } = classifyMistake({
    question: 'Trường hợp ngoại lệ nào không áp dụng nguyên tắc thế quyền?',
    previousMastery: 60,
    responseTimeMs: 40000,
    expectedTimeMs: 45000
  });
  assert.equal(type, MISTAKE_TYPES.EXCEPTION_ERROR);
});

test('mistakeDNA: answering far faster than expected (no keywords) is time pressure', () => {
  const { type } = classifyMistake({
    question: 'Phí bảo hiểm được đóng theo phương thức nào?',
    previousMastery: 60,
    responseTimeMs: 4000,
    expectedTimeMs: 45000
  });
  assert.equal(type, MISTAKE_TYPES.TIME_PRESSURE);
});

test('mistakeDNA: prior correct evidence plus a long gap is memory decay', () => {
  const { type } = classifyMistake({
    question: 'Thời gian gia hạn đóng phí là bao lâu?',
    previousMastery: 65,
    evidenceCount: 3,
    responseTimeMs: 30000,
    expectedTimeMs: 45000,
    daysSinceLastReview: 21
  });
  assert.equal(type, MISTAKE_TYPES.MEMORY_DECAY);
});

test('mistakeDNA: low mastery with no other signal defaults to knowledge gap', () => {
  const { type, label } = classifyMistake({
    question: 'Nguyên tắc trung thực tuyệt đối là gì?',
    previousMastery: 20,
    responseTimeMs: 30000,
    expectedTimeMs: 45000
  });
  assert.equal(type, MISTAKE_TYPES.KNOWLEDGE_GAP);
  assert.equal(label, 'Chưa vững kiến thức');
});
