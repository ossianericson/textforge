import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseResults } from '#parsers/result-parser';

function buildLines(): string[] {
  return [
    '## Result Cards (1 Services)',
    '',
    '#### 1. Example Service (result-example)',
    '- Icon: ✅',
    '- Badge: Example (blue)',
    '',
    '**Best For:**',
    '- Use cases',
    '',
    '**Key Benefits:**',
    '- Speed',
    '',
    '**Considerations:**',
    '- Limits',
    '',
    '**When NOT to use:**',
    '- Costs',
    '',
    '**Tech Tags:** Tag1, Tag2',
    '',
    '**Docs:** https://example.com',
    '',
    '**Additional Considerations:**',
    'Odd **bold without end',
    '',
    '---',
    '',
    '## Progress Steps',
  ];
}

test('resultParser: parses result cards and cleans markdown', () => {
  const lines = buildLines();
  const results = parseResults(lines, 0, lines.length);
  const result = results['result-example'];

  assert.ok(result);
  assert.ok(result.docs[0]);
  assert.equal(result.title, 'Example Service');
  assert.equal(result.badge.text, 'Example');
  assert.equal(result.bestFor[0], 'Use cases');
  assert.equal(result.keyBenefits[0], 'Speed');
  assert.equal(result.whenNotToUse[0], 'Costs');
  assert.equal(result.techTags.join(','), 'Tag1,Tag2');
  assert.equal(result.docs[0].url, 'https://example.com');
  assert.equal(result.additionalConsiderations, 'Odd **bold without end');
});
