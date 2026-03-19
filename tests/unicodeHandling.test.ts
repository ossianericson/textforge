import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseQuestions } from '#parsers/question-parser';

function buildLines(): string[] {
  return [
    '## Decision Tree Flow',
    '',
    '### Q1: Entry (id="q1")',
    '**Title**: "CafÃ©"',
    '**Subtitle**: "ResumeÃ©"',
    '**Options**:',
    '1. "Continue" → result: result-service',
  ];
}

test('questionParser: normalizes cp1252-encoded text', () => {
  const lines = buildLines();
  const questions = parseQuestions(lines, 0, lines.length);
  const q1 = questions.q1;

  assert.ok(q1);
  assert.equal(q1.title, 'Café');
  assert.equal(q1.subtitle, 'Resumeé');
});
