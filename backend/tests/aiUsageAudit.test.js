import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { AI_TASKS, selectModelForTask, modelNameForTask, shouldCallAI } from '../aiConfig.js';
import { validateCurriculumProposal, validateGeneratedQuestion, validateInterventionProposal } from '../aiValidation.js';
import { computeFingerprint, withGenerationCache } from '../aiCache.js';
import { generateRescueTrail } from '../llamaAIService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('AI task router', () => {
  test('main-model tasks route to "main"', () => {
    for (const task of [
      AI_TASKS.GENERATE_CURRICULUM, AI_TASKS.GENERATE_LESSON_KIT, AI_TASKS.GENERATE_COMPLEX_SCENARIO,
      AI_TASKS.GENERATE_RESCUE_EXPEDITION, AI_TASKS.SUGGEST_COMPLEX_QUALITY_FIX, AI_TASKS.TRAINER_COPILOT_COMPLEX
    ]) {
      assert.strictEqual(selectModelForTask(task), 'main', `${task} should route to main`);
    }
  });

  test('light-model tasks route to "light"', () => {
    for (const task of [
      AI_TASKS.REWRITE_QUESTION, AI_TASKS.GENERATE_FLASHCARDS, AI_TASKS.SUMMARIZE_INSIGHT,
      AI_TASKS.EXPLAIN_METRIC, AI_TASKS.TRAINER_COPILOT_SIMPLE, AI_TASKS.LEARNER_CHAT
    ]) {
      assert.strictEqual(selectModelForTask(task), 'light', `${task} should route to light`);
    }
  });

  test('Llama copy/reaction task never calls AI', () => {
    assert.strictEqual(selectModelForTask(AI_TASKS.GENERATE_LLAMA_COPY), 'none');
  });

  test('an unknown/undefined task defaults to "none" rather than guessing a tier', () => {
    assert.strictEqual(selectModelForTask('SOMETHING_NOT_IN_THE_ENUM'), 'none');
    assert.strictEqual(selectModelForTask(undefined), 'none');
  });

  test('modelNameForTask resolves to the configured main/light model name, or null for "none"', () => {
    assert.strictEqual(modelNameForTask(AI_TASKS.GENERATE_CURRICULUM), process.env.GEMINI_MAIN_MODEL || 'gemini-2.0-flash');
    assert.strictEqual(modelNameForTask(AI_TASKS.REWRITE_QUESTION), process.env.GEMINI_LIGHT_MODEL || 'gemini-2.0-flash-lite');
    assert.strictEqual(modelNameForTask(AI_TASKS.GENERATE_LLAMA_COPY), null);
  });
});

describe('Demo mode / zero-quota short-circuit', () => {
  test('shouldCallAI is false with no GEMINI_API_KEY set (this repo\'s actual dev/CI state)', () => {
    assert.strictEqual(process.env.GEMINI_API_KEY, undefined, 'test assumes no key is set in this environment');
    assert.strictEqual(shouldCallAI(AI_TASKS.GENERATE_CURRICULUM), false);
  });

  test('shouldCallAI is false when DEMO_MODE=true even with a key', () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-test';
    process.env.DEMO_MODE = 'true';
    try {
      assert.strictEqual(shouldCallAI(AI_TASKS.GENERATE_CURRICULUM), false);
    } finally {
      delete process.env.GEMINI_API_KEY;
      delete process.env.DEMO_MODE;
    }
  });

  test('shouldCallAI is false when AI_ENABLED=false even with a key', () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-test';
    process.env.AI_ENABLED = 'false';
    try {
      assert.strictEqual(shouldCallAI(AI_TASKS.GENERATE_CURRICULUM), false);
    } finally {
      delete process.env.GEMINI_API_KEY;
      delete process.env.AI_ENABLED;
    }
  });

  test('shouldCallAI is true only when a key exists, AI is enabled, not demo mode, and the task actually routes to a model', () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-test';
    try {
      assert.strictEqual(shouldCallAI(AI_TASKS.GENERATE_CURRICULUM), true);
      assert.strictEqual(shouldCallAI(AI_TASKS.GENERATE_LLAMA_COPY), false, 'GENERATE_LLAMA_COPY always stays local even with a key');
    } finally {
      delete process.env.GEMINI_API_KEY;
    }
  });
});

describe('Structured output validation', () => {
  test('rejects a curriculum proposal missing lessons', () => {
    const { valid, errors } = validateCurriculumProposal({ summary: 'x', camps: [{ title: 'a' }], lessons: [] }, []);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('lessons')));
  });

  test('rejects a lesson that cites a source chunk id outside the approved set', () => {
    const proposal = {
      summary: 'x', camps: [{ title: 'a' }],
      lessons: [{ title: 'L1', estimatedMinutes: 20, sourceChunkIds: [999] }]
    };
    const { valid, errors } = validateCurriculumProposal(proposal, [1, 2, 3]);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('unknown/unapproved')));
  });

  test('rejects a lesson with a non-positive duration', () => {
    const proposal = { summary: 'x', camps: [{ title: 'a' }], lessons: [{ title: 'L1', estimatedMinutes: 0, sourceChunkIds: [1] }] };
    const { valid, errors } = validateCurriculumProposal(proposal, [1]);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('duration')));
  });

  test('accepts a well-formed curriculum proposal', () => {
    const proposal = { summary: 'x', camps: [{ title: 'a' }], lessons: [{ title: 'L1', estimatedMinutes: 20, sourceChunkIds: [1] }] };
    const { valid } = validateCurriculumProposal(proposal, [1]);
    assert.strictEqual(valid, true);
  });

  test('rejects a generated question without exactly 4 options', () => {
    const { valid, errors } = validateGeneratedQuestion({ questionText: 'Q?', options: ['a', 'b', 'c'], correctOption: 0 });
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('4 options')));
  });

  test('rejects a generated question with an out-of-range correct option', () => {
    const { valid, errors } = validateGeneratedQuestion({ questionText: 'Q?', options: ['a', 'b', 'c', 'd'], correctOption: 7 });
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('correctOption')));
  });

  test('rejects an intervention proposal with a non-positive duration', () => {
    const { valid } = validateInterventionProposal({ title: 'T', durationMinutes: 0, trainerSummary: 's', learnerIntroduction: 'i' });
    assert.strictEqual(valid, false);
  });
});

describe('Generation caching', () => {
  test('computeFingerprint is stable for the same input and different for different input', () => {
    const a = computeFingerprint({ taskType: 'GENERATE_CURRICULUM', normalizedInput: '{"preferredCamps":4}' });
    const b = computeFingerprint({ taskType: 'GENERATE_CURRICULUM', normalizedInput: '{"preferredCamps":4}' });
    const c = computeFingerprint({ taskType: 'GENERATE_CURRICULUM', normalizedInput: '{"preferredCamps":3}' });
    assert.strictEqual(a, b);
    assert.notStrictEqual(a, c);
  });

  test('withGenerationCache only invokes computeFn once for repeated identical requests', async () => {
    const rows = new Map();
    const fakeDb = {
      get: async (sql, params) => (rows.has(params[0]) ? { result: rows.get(params[0]) } : undefined),
      run: async (sql, params) => { rows.set(params[0], params[2]); }
    };
    let calls = 0;
    const compute = async () => { calls++; return { value: 'generated' }; };
    const fp = { taskType: 'GENERATE_CURRICULUM', normalizedInput: 'same-input' };

    const first = await withGenerationCache(fakeDb, fp, compute);
    const second = await withGenerationCache(fakeDb, fp, compute);

    assert.strictEqual(calls, 1, 'computeFn must not run twice for the same fingerprint');
    assert.strictEqual(first.cached, false);
    assert.strictEqual(second.cached, true);
    assert.deepStrictEqual(second.result, first.result);
  });
});

describe('Llama reaction copy stays local (no AI call)', () => {
  test('generateRescueTrail never calls the network and returns instantly', () => {
    const before = Date.now();
    const trail = generateRescueTrail({ topic: '7. Đại lý, đạo đức, quyền & nghĩa vụ', mistakeType: 'concept_confusion', conceptPair: null });
    assert.ok(Date.now() - before < 50, 'must resolve synchronously/instantly — no network round trip');
    assert.strictEqual(typeof trail.title, 'string');
    assert.strictEqual(typeof trail.introduction, 'string');
    assert.strictEqual(typeof trail.outro, 'string');
  });
});

describe('Deterministic engines never import the Gemini client', () => {
  const engineDirs = [path.join(__dirname, '..', 'engines'), path.join(__dirname, '..', 'studio', 'engines')];
  for (const dir of engineDirs) {
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
      test(`${path.relative(path.join(__dirname, '..'), dir)}/${file} does not import geminiClient`, () => {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        assert.ok(!content.includes('geminiClient'), `${file} must stay pure/deterministic — no AI import`);
      });
    }
  }
});
