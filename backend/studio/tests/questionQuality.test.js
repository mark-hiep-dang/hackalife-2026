import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeQuestionQuality } from '../engines/questionQuality.js';

test('Case F: a 92% incorrect rate among both strong and weak learners gets an unclear/misleading warning', () => {
  const answers = [
    ...Array.from({ length: 6 }, () => ({ selectedOption: 1, isCorrect: false, isStrongLearner: true, responseTimeMs: 30000 })),
    { selectedOption: 0, isCorrect: true, isStrongLearner: true, responseTimeMs: 30000 },
    ...Array.from({ length: 5 }, () => ({ selectedOption: 1, isCorrect: false, isStrongLearner: false, responseTimeMs: 30000 }))
  ];
  const result = analyzeQuestionQuality({ questionText: 'Câu hỏi khó hiểu?', difficulty: 'Trung bình', answers });
  assert.equal(result.correctRate, 8);
  assert.ok(result.flags.includes('UNCLEAR_OR_MISLEADING'));
  assert.equal(result.mostSelectedWrongOption, 1);
});

test('a question with near-100% correct rate is flagged as too easy', () => {
  const answers = Array.from({ length: 10 }, () => ({ selectedOption: 0, isCorrect: true }));
  const result = analyzeQuestionQuality({ questionText: 'Dễ quá', difficulty: 'Trung bình', answers });
  assert.ok(result.flags.includes('TOO_EASY'));
});

test('a question strong and weak learners score equally on (mid-range) is flagged for low discrimination', () => {
  const answers = [
    ...Array.from({ length: 5 }, () => ({ selectedOption: 0, isCorrect: true, isStrongLearner: true })),
    ...Array.from({ length: 5 }, () => ({ selectedOption: 1, isCorrect: false, isStrongLearner: true })),
    ...Array.from({ length: 5 }, () => ({ selectedOption: 0, isCorrect: true, isStrongLearner: false })),
    ...Array.from({ length: 5 }, () => ({ selectedOption: 1, isCorrect: false, isStrongLearner: false }))
  ];
  const result = analyzeQuestionQuality({ questionText: 'Câu hỏi trung bình', difficulty: 'Trung bình', answers });
  assert.ok(result.flags.includes('LOW_DISCRIMINATION'));
});

test('a negatively-worded question answered too fast with a low correct rate is flagged as a reading-error risk', () => {
  const answers = [
    ...Array.from({ length: 3 }, () => ({ selectedOption: 0, isCorrect: true, responseTimeMs: 5000 })),
    ...Array.from({ length: 7 }, () => ({ selectedOption: 1, isCorrect: false, responseTimeMs: 5000 }))
  ];
  const result = analyzeQuestionQuality({ questionText: 'Điều nào KHÔNG đúng về nghĩa vụ đại lý?', difficulty: 'Trung bình', answers });
  assert.ok(result.flags.includes('NEGATIVE_WORDING_RISK'));
});

test('a question with zero attempts reports no data instead of crashing', () => {
  const result = analyzeQuestionQuality({ questionText: 'Chưa ai làm', difficulty: 'Trung bình', answers: [] });
  assert.equal(result.correctRate, null);
});
