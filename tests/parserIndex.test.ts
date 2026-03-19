import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { parseSpec, parseSpecFile } from '#parsers/index';
import { makeTempDir, writeFile } from './helpers.js';

const MISSING_FLOW_SPEC = [
  '# Example',
  '',
  '**Main:** "Title"',
  '',
  '## Result Cards (1 Services)',
  '#### 1. Result (result-a)',
  '- Icon: ✅',
  '- Badge: A (blue)',
].join('\n');

test('parseSpecFile: fails when spec file is missing', () => {
  let caught: unknown = null;
  try {
    parseSpecFile(path.join(process.cwd(), 'missing-spec.md'));
  } catch (error) {
    caught = error;
  }

  assert.ok(caught);
  const err = caught as { code?: string };
  assert.equal(err.code, 'DTB-001');
});

test('parseSpecFile: fails without Decision Tree Flow section', () => {
  const tempDir = makeTempDir();
  const specPath = writeFile(tempDir, 'spec.md', MISSING_FLOW_SPEC);

  let caught: unknown = null;
  try {
    parseSpecFile(specPath);
  } catch (error) {
    caught = error;
  }

  assert.ok(caught);
  const err = caught as { code?: string };
  assert.equal(err.code, 'DTB-003');
});

test('parseSpec: returns title, questions, results, and progress steps', () => {
  const contents = [
    '# Example Tree',
    '',
    '**Main:** "Example Tree"',
    '**Subtitle:** "Example Subtitle"',
    '',
    '## Decision Tree Flow',
    '',
    '### Q1: Start (id="q1")',
    '**Title**: "Start"',
    '**Options**:',
    '1. "Go" → result: result-a',
    '',
    '## Result Cards (1 Services)',
    '',
    '#### 1. Result A (result-a)',
    '- Icon: ✅',
    '- Badge: A (blue)',
    '',
    '## Progress Steps',
    '```javascript',
    'q1: 0',
    'result: 100',
    '```',
  ].join('\n');

  const parsed = parseSpec(contents);

  assert.equal(parsed.title.main, 'Example Tree');
  assert.equal(parsed.title.subtitle, 'Example Subtitle');
  assert.ok(parsed.questions.q1);
  assert.ok(parsed.results['result-a']);
  assert.equal(parsed.progressSteps.q1, 0);
  assert.equal(parsed.progressSteps.result, 100);
});
