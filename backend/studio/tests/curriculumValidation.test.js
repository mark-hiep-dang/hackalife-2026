import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCurriculum } from '../engines/curriculumValidation.js';

test('curriculumValidation: detects a circular prerequisite', () => {
  const { issues } = validateCurriculum({
    camps: [{ id: 1, title: 'Camp 1' }],
    lessons: [
      { id: 'a', title: 'A', campId: 1, estimatedMinutes: 10, learningOutcome: 'x', skillIds: [1], sourceChunkIds: [1], prerequisiteLessonIds: ['b'] },
      { id: 'b', title: 'B', campId: 1, estimatedMinutes: 10, learningOutcome: 'x', skillIds: [1], sourceChunkIds: [1], prerequisiteLessonIds: ['a'] }
    ]
  });
  assert.ok(issues.some((i) => i.code === 'CIRCULAR_PREREQUISITE'));
});

test('curriculumValidation: flags a lesson with no source and no outcome', () => {
  const { issues } = validateCurriculum({
    camps: [{ id: 1, title: 'Camp 1' }],
    lessons: [{ id: 'a', title: 'A', campId: 1, estimatedMinutes: 10 }]
  });
  assert.ok(issues.some((i) => i.code === 'MISSING_SOURCE'));
  assert.ok(issues.some((i) => i.code === 'MISSING_OUTCOME'));
  assert.ok(issues.some((i) => i.code === 'MISSING_SKILL_MAPPING'));
});

test('curriculumValidation: flags duplicate lesson titles', () => {
  const { issues } = validateCurriculum({
    camps: [{ id: 1, title: 'Camp 1' }],
    lessons: [
      { id: 'a', title: 'Cùng tên', campId: 1, estimatedMinutes: 10, learningOutcome: 'x', skillIds: [1], sourceChunkIds: [1] },
      { id: 'b', title: 'Cùng tên', campId: 1, estimatedMinutes: 10, learningOutcome: 'x', skillIds: [1], sourceChunkIds: [1] }
    ]
  });
  assert.ok(issues.some((i) => i.code === 'DUPLICATE_TITLE'));
});

test('curriculumValidation: flags a large mismatch between total duration and target', () => {
  const { issues } = validateCurriculum({
    camps: [{ id: 1, title: 'Camp 1' }],
    lessons: [{ id: 'a', title: 'A', campId: 1, estimatedMinutes: 15, learningOutcome: 'x', skillIds: [1], sourceChunkIds: [1] }],
    targetDurationMinutes: 300
  });
  assert.ok(issues.some((i) => i.code === 'DURATION_MISMATCH'));
});

test('curriculumValidation: a clean, well-formed curriculum has no issues', () => {
  const { issues } = validateCurriculum({
    camps: [{ id: 1, title: 'Camp 1' }],
    lessons: [{
      id: 'a', title: 'A', campId: 1, estimatedMinutes: 15, learningOutcome: 'x',
      skillIds: [1], sourceChunkIds: [1], prerequisiteLessonIds: []
    }],
    targetDurationMinutes: 15
  });
  assert.equal(issues.length, 0);
});
