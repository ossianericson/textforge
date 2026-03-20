import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parseBucketRangeLine,
  parseMatrixRouteLine,
  parseMultiSelectRouteLine,
  parseNavigationRangeLine,
  parseTierRouteLine,
  parseTooltipLine,
  shouldEndBlock,
} from '#parsers/question-blocks/shared';

const helpers = {
  extractAfterColon: (line: string) => line.split(':').slice(1).join(':').trim(),
  normalizeText: (text: string) => text.trim(),
  stripQuotes: (text: string) => text.replace(/^"|"$/g, ''),
  renderInlineMarkdown: (text: string) => text,
  parseNavigationTarget: (action: string, target: string) => {
    if (target.trim() === 'missing') {
      return null;
    }

    return action.toLowerCase() === 'result:' ? `result-${target.trim()}` : target.trim();
  },
};

test('question-block shared: shouldEndBlock distinguishes block boundaries', () => {
  assert.equal(shouldEndBlock('### Q2: Next', ['**Dropdown**']), true);
  assert.equal(shouldEndBlock('---', ['**Dropdown**']), true);
  assert.equal(shouldEndBlock('Plain text', ['**Dropdown**']), false);
  assert.equal(shouldEndBlock('**Dropdown**', ['**Dropdown**']), false);
  assert.equal(shouldEndBlock('**Slider**', ['**Dropdown**']), true);
});

test('question-block shared: parseNavigationRangeLine handles defaults, labels, and invalid targets', () => {
  assert.deepEqual(parseNavigationRangeLine('- Range: 10 → go to q2', helpers), {
    min: 10,
    max: 10,
    next: 'q2',
    label: '10',
  });

  assert.deepEqual(
    parseNavigationRangeLine('- Range: 1-5 ("Fast track") → result: premium', helpers),
    {
      min: 1,
      max: 5,
      next: 'result-premium',
      label: 'Fast track',
    }
  );

  assert.equal(parseNavigationRangeLine('- Range: 5 → go to missing', helpers), null);
  assert.equal(parseNavigationRangeLine('- Not a range', helpers), null);
});

test('question-block shared: parseBucketRangeLine handles labels and invalid input', () => {
  assert.deepEqual(parseBucketRangeLine('- Range: 60 → bucket: rpo-1h', helpers), {
    min: 60,
    max: 60,
    bucket: 'rpo-1h',
    label: '60',
  });

  assert.deepEqual(parseBucketRangeLine('- Range: 0-10 ("Rapid") → bucket: rto-10m', helpers), {
    min: 0,
    max: 10,
    bucket: 'rto-10m',
    label: 'Rapid',
  });

  assert.equal(parseBucketRangeLine('- Range: nope → bucket: invalid', helpers), null);
});

test('question-block shared: parseMatrixRouteLine handles valid and rejected routes', () => {
  assert.deepEqual(parseMatrixRouteLine('- left-a + right-b → result: premium', helpers), {
    left: 'left-a',
    right: 'right-b',
    next: 'result-premium',
  });

  assert.equal(parseMatrixRouteLine('- left-a + right-b → go to missing', helpers), null);
  assert.equal(parseMatrixRouteLine('- invalid route', helpers), null);
});

test('question-block shared: parseTierRouteLine handles valid and invalid input', () => {
  assert.deepEqual(parseTierRouteLine('- rto-10m + rpo-1m → tier: critical'), {
    left: 'rto-10m',
    right: 'rpo-1m',
    tier: 'critical',
  });

  assert.equal(parseTierRouteLine('- invalid tier route'), null);
});

test('question-block shared: parseMultiSelectRouteLine filters empty values and invalid routes', () => {
  assert.deepEqual(
    parseMultiSelectRouteLine('- "High availability" + "Budget constrained" → go to q2', helpers),
    {
      values: ['High availability', 'Budget constrained'],
      next: 'q2',
    }
  );

  assert.equal(parseMultiSelectRouteLine('- "" + "" → go to q2', helpers), null);
  assert.equal(parseMultiSelectRouteLine('- fallback → go to missing', helpers), null);
  assert.equal(parseMultiSelectRouteLine('- invalid route', helpers), null);
});

test('question-block shared: parseTooltipLine handles valid and invalid input', () => {
  assert.deepEqual(parseTooltipLine('- "RPO": "Recovery point objective"', helpers), {
    term: 'RPO',
    definition: 'Recovery point objective',
  });

  assert.equal(parseTooltipLine('- invalid tooltip', helpers), null);
});
