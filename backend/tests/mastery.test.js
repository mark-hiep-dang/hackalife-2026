import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMastery, masteryStateLabel, CONFIDENCE } from '../engines/mastery.js';

test('mastery: does not master a topic after a single correct answer', () => {
  const { mastery } = calculateMastery({ previousMastery: 0, isCorrect: true, difficulty: 'Trung bình' });
  // 0*0.75 + 100*0.25 = 25, nowhere near "mastered"
  assert.equal(mastery, 25);
  assert.equal(masteryStateLabel(mastery), 'Khu vực dễ trượt chân');
});

test('mastery: converges upward with repeated correct answers, never overshoots 100', () => {
  let mastery = 0;
  for (let i = 0; i < 20; i++) {
    ({ mastery } = calculateMastery({ previousMastery: mastery, isCorrect: true, difficulty: 'Trung bình' }));
  }
  assert.ok(mastery <= 100);
  assert.ok(mastery > 90);
});

test('mastery: a certain-but-wrong answer drops mastery harder than an unsure-wrong answer', () => {
  const certainWrong = calculateMastery({ previousMastery: 70, isCorrect: false, difficulty: 'Trung bình', confidence: CONFIDENCE.CERTAIN });
  const unsureWrong = calculateMastery({ previousMastery: 70, isCorrect: false, difficulty: 'Trung bình', confidence: CONFIDENCE.GUESSING });
  assert.ok(certainWrong.mastery < unsureWrong.mastery);
});

test('mastery: harder questions earn slightly more credit than easier ones when correct', () => {
  const easy = calculateMastery({ previousMastery: 50, isCorrect: true, difficulty: 'Dễ' });
  const hard = calculateMastery({ previousMastery: 50, isCorrect: true, difficulty: 'Khó' });
  assert.ok(hard.mastery > easy.mastery);
});

test('mastery: missing response time never crashes or penalizes (historical rows have none)', () => {
  const { mastery } = calculateMastery({ previousMastery: 50, isCorrect: true, difficulty: 'Trung bình', responseTimeMs: undefined });
  assert.ok(Number.isFinite(mastery));
});

test('mastery: answering much slower than expected earns less credit than on-pace', () => {
  const onPace = calculateMastery({ previousMastery: 50, isCorrect: true, difficulty: 'Trung bình', responseTimeMs: 10000, expectedTimeMs: 45000 });
  const slow = calculateMastery({ previousMastery: 50, isCorrect: true, difficulty: 'Trung bình', responseTimeMs: 90000, expectedTimeMs: 45000 });
  assert.ok(slow.mastery < onPace.mastery);
});

test('mastery: score is always clamped within 0–100', () => {
  const { mastery } = calculateMastery({ previousMastery: 100, isCorrect: true, difficulty: 'Khó', confidence: CONFIDENCE.CERTAIN });
  assert.ok(mastery >= 0 && mastery <= 100);
});
