import test from 'node:test';
import assert from 'node:assert/strict';
import { initDb, getDb } from '../db.js';
import { assembleRescueTrail, getConceptPair } from '../engines/rescueTrail.js';

test('rescueTrail: assembles a flashcard, an easier question, a similar question, and a checkpoint from real content', async () => {
  await initDb();
  const db = await getDb();
  const trail = await assembleRescueTrail(db, {
    topic: '7. Đại lý, đạo đức, quyền & nghĩa vụ',
    mistakeType: 'concept_confusion'
  });
  assert.ok(trail.flashcard);
  assert.equal(typeof trail.flashcard.front, 'string');
  assert.ok(trail.easierQuestion);
  assert.equal(trail.easierQuestion.difficulty, 'Dễ');
  assert.ok(trail.similarQuestion);
  assert.ok(trail.checkpointQuestion);
  // The three questions pulled should be distinct items, not the same one repeated.
  const ids = [trail.easierQuestion.id, trail.similarQuestion.id, trail.checkpointQuestion.id];
  assert.equal(new Set(ids).size, ids.length);
});

test('rescueTrail: known concept-confusion topics resolve a curated comparison pair', () => {
  const pair = getConceptPair('2. Thuật ngữ & chủ thể hợp đồng');
  assert.ok(pair);
  assert.match(pair.left.name, /Bên mua bảo hiểm/);
  assert.match(pair.right.name, /Người được bảo hiểm/);
});

test('rescueTrail: an unmapped topic returns no concept pair rather than a wrong one', () => {
  assert.equal(getConceptPair('999. Không tồn tại'), null);
});
