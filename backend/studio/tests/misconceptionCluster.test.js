import test from 'node:test';
import assert from 'node:assert/strict';
import { clusterMisconceptions } from '../engines/misconceptionCluster.js';

test('Case E: twelve learners picking the same wrong answer with high confidence form one cluster', () => {
  const answers = Array.from({ length: 12 }, (_, i) => ({
    learnerId: i + 1,
    topic: 'Nghĩa vụ đại lý',
    questionId: 5,
    selectedOption: 2,
    isCorrect: false,
    confidence: i < 9 ? 'certain' : 'fairly_sure',
    mistakeType: 'concept_confusion',
    mastery: 45
  }));
  const clusters = clusterMisconceptions(answers);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].learnerCount, 12);
  assert.equal(clusters[0].highConfidenceCount, 9);
  assert.equal(clusters[0].averageMastery, 45);
});

test('a group smaller than the minimum cluster size is not reported as a cluster', () => {
  const answers = Array.from({ length: 2 }, (_, i) => ({
    learnerId: i + 1, topic: 'A', questionId: 1, selectedOption: 1, isCorrect: false, mistakeType: 'knowledge_gap'
  }));
  assert.equal(clusterMisconceptions(answers).length, 0);
});

test('correct answers are never counted toward a misconception cluster', () => {
  const answers = Array.from({ length: 5 }, (_, i) => ({
    learnerId: i + 1, topic: 'A', questionId: 1, selectedOption: 0, isCorrect: true, mistakeType: null
  }));
  assert.equal(clusterMisconceptions(answers).length, 0);
});

test('clusters are sorted by learner count, largest first', () => {
  const answers = [
    ...Array.from({ length: 3 }, (_, i) => ({ learnerId: i + 1, topic: 'A', questionId: 1, selectedOption: 1, isCorrect: false, mistakeType: 'knowledge_gap' })),
    ...Array.from({ length: 6 }, (_, i) => ({ learnerId: i + 10, topic: 'B', questionId: 2, selectedOption: 1, isCorrect: false, mistakeType: 'concept_confusion' }))
  ];
  const clusters = clusterMisconceptions(answers);
  assert.equal(clusters[0].topic, 'B');
  assert.equal(clusters[0].learnerCount, 6);
});
