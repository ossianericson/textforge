import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateParsedSpec } from '#compiler/schema';
import type { ParsedSpec, Question } from '#compiler/types';

function buildBaseParsedSpec(): ParsedSpec {
  return {
    title: { main: 'Test', subtitle: 'Subtitle' },
    questions: {} as Record<string, Question>,
    results: {
      'result-test': {
        title: 'Result',
        icon: 'x',
        badge: { text: 'Test', className: 'badge-test' },
        bestFor: ['A'],
        keyBenefits: ['B'],
        considerations: ['C'],
        whenNotToUse: ['D'],
        techTags: ['Tag'],
        docs: [{ label: 'Docs', url: 'https://example.com' }],
        additionalConsiderations: 'More',
      },
    },
    progressSteps: { q1: 0, result: 100 },
  };
}

test('validateParsedSpec: accepts button questions with options', () => {
  const parsed = buildBaseParsedSpec();
  parsed.questions.q1 = {
    title: 'Pick',
    subtitle: 'One',
    infoBox: null,
    type: 'buttons',
    options: [{ text: 'Yes', next: 'result-test', recommended: false, advanced: false }],
  };

  const result = validateParsedSpec(parsed);
  assert.equal(result.ok, true);
});

test('validateParsedSpec: rejects dropdown without ranges', () => {
  const parsed = buildBaseParsedSpec();
  parsed.questions.q1 = {
    title: 'Pick',
    subtitle: 'One',
    infoBox: null,
    type: 'dropdown',
    options: [],
  };

  const result = validateParsedSpec(parsed);
  assert.equal(result.ok, false);
  assert.match(result.error, /Dropdown questions must have at least one range/);
});

test('validateParsedSpec: rejects dropdown-pair without matrix', () => {
  const parsed = buildBaseParsedSpec();
  parsed.questions.q1 = {
    title: 'Pick',
    subtitle: 'One',
    infoBox: null,
    type: 'dropdown-pair',
    options: [],
    dropdownLeftRanges: [{ min: 1, max: 1, bucket: 'left', label: 'Left' }],
    dropdownRightRanges: [{ min: 1, max: 1, bucket: 'right', label: 'Right' }],
    dropdownMatrix: {},
  };

  const result = validateParsedSpec(parsed);
  assert.equal(result.ok, false);
  assert.match(result.error, /Dropdown questions must have at least one range/);
});

test('validateParsedSpec: rejects button questions without options', () => {
  const parsed = buildBaseParsedSpec();
  parsed.questions.q1 = {
    title: 'Pick',
    subtitle: 'One',
    infoBox: null,
    type: 'buttons',
    options: [],
  };

  const result = validateParsedSpec(parsed);
  assert.equal(result.ok, false);
  assert.match(result.error, /Dropdown questions must have at least one range/);
});
