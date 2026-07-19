import test from 'node:test';
import assert from 'node:assert/strict';
import { checkCourseQuality, SEVERITY } from '../engines/courseQuality.js';

function baseBundle(overrides = {}) {
  return {
    course: { id: 1, title: 'Test Course' },
    camps: [{ id: 1, title: 'Camp 1', orderIndex: 0 }],
    lessons: [{ id: 1, campId: 1, title: 'Lesson 1', orderIndex: 0, estimatedMinutes: 15, difficulty: 'Trung bình', learningOutcomeId: 1, sourceChunkIds: [1], skillIds: [1], prerequisiteLessonIds: [] }],
    learningOutcomes: [{ id: 1, description: 'Hiểu quy định cơ bản', skillId: 1 }],
    skills: [{ id: 1, name: 'Kiến thức chung' }],
    contentItems: [],
    ...overrides
  };
}

test('Case A: a learning outcome with no assessment creates a warning', () => {
  const { issues } = checkCourseQuality(baseBundle({ contentItems: [] }));
  const found = issues.find((i) => i.category === 'COVERAGE' && i.message.includes('chưa có câu hỏi'));
  assert.ok(found);
  assert.equal(found.severity, SEVERITY.WARNING);
});

test('Case B: an unapproved AI draft blocks publishing', () => {
  const { canPublish, issues } = checkCourseQuality(baseBundle({
    contentItems: [{ id: 1, lessonId: 1, contentType: 'mcq', questionText: 'Q?', correctOption: 0, explanation: 'exp', difficulty: 'Trung bình', cognitiveLevel: 'Hiểu', sourceChunkIds: [1], sourceVersion: '1.0', status: 'AI_DRAFT' }]
  }));
  assert.equal(canPublish, false);
  assert.ok(issues.some((i) => i.severity === SEVERITY.BLOCKER && i.category === 'GOVERNANCE'));
});

test('Case C: a course with only recall questions receives a quality issue', () => {
  const mcqs = Array.from({ length: 5 }, (_, i) => ({
    id: i, lessonId: 1, contentType: 'mcq', questionText: `Q${i}?`, correctOption: 0, explanation: 'exp',
    difficulty: 'Trung bình', cognitiveLevel: 'Ghi nhớ', sourceChunkIds: [1], sourceVersion: '1.0', status: 'APPROVED'
  }));
  const { issues } = checkCourseQuality(baseBundle({ contentItems: mcqs }));
  assert.ok(issues.some((i) => i.category === 'ASSESSMENT' && i.message.includes('Ghi nhớ')));
});

test('a fully-approved, well-covered course can publish with a high health score', () => {
  const bundle = baseBundle({
    contentItems: [
      { id: 1, lessonId: 1, contentType: 'mcq', questionText: 'Câu hỏi vận dụng thực tế ra sao?', correctOption: 0, explanation: 'exp', difficulty: 'Trung bình', cognitiveLevel: 'Vận dụng', sourceChunkIds: [1], sourceVersion: '1.0', status: 'APPROVED' },
      { id: 2, lessonId: 1, contentType: 'scenario', questionText: 'Tình huống ứng dụng', correctOption: 0, explanation: 'exp', difficulty: 'Khó', cognitiveLevel: 'Phân tích', sourceChunkIds: [1], sourceVersion: '1.0', status: 'APPROVED' },
      { id: 3, lessonId: 1, contentType: 'checkpoint', questionText: 'Checkpoint', correctOption: 0, explanation: 'exp', difficulty: 'Trung bình', cognitiveLevel: 'Hiểu', sourceChunkIds: [1], sourceVersion: '1.0', status: 'APPROVED' }
    ]
  });
  const { canPublish, healthScore } = checkCourseQuality(bundle);
  assert.equal(canPublish, true);
  assert.ok(healthScore >= 80);
});

test('missing explanation and missing source on a question are both flagged', () => {
  const { issues } = checkCourseQuality(baseBundle({
    contentItems: [{ id: 1, lessonId: 1, contentType: 'mcq', questionText: 'Q?', correctOption: 0, explanation: '', difficulty: 'Trung bình', cognitiveLevel: 'Hiểu', sourceChunkIds: [], sourceVersion: null, status: 'APPROVED' }]
  }));
  assert.ok(issues.some((i) => i.message.includes('chưa có phần giải thích')));
  assert.ok(issues.some((i) => i.message.includes('chưa gắn nguồn')));
});

test('an expired source reference is flagged under governance', () => {
  const { issues } = checkCourseQuality(baseBundle({
    contentItems: [{ id: 1, lessonId: 1, contentType: 'mcq', questionText: 'Q?', correctOption: 0, explanation: 'exp', difficulty: 'Trung bình', cognitiveLevel: 'Hiểu', sourceChunkIds: [99], sourceVersion: '1.0', status: 'APPROVED' }],
    expiredSourceChunkIds: [99]
  }));
  assert.ok(issues.some((i) => i.category === 'GOVERNANCE' && i.message.includes('hết hạn')));
});
