import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findSectionIndices, parseProgressSteps } from '#parsers/progress-parser';

test('progressParser: finds section indices', () => {
  const lines = [
    '# Title',
    '## Decision Tree Flow',
    '## Result Cards (1 Services)',
    '## Progress Steps',
  ];

  const indices = findSectionIndices(lines);

  assert.equal(indices.flowStart, 1);
  assert.equal(indices.resultStart, 2);
  assert.equal(indices.progressStart, 3);
});

test('progressParser: parses progress steps', () => {
  const lines = [
    '## Progress Steps',
    '```javascript',
    'const progressSteps = {',
    "  'q1': 0,",
    "  'result': 100",
    '};',
    '```',
  ];

  const progress = parseProgressSteps(lines, 0);

  assert.equal(progress.q1, 0);
  assert.equal(progress.result, 100);
});
