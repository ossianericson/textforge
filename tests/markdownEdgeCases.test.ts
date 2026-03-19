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
    '- Uses [link](https://example.com) with *italics*',
    '',
    '**Key Benefits:**',
    '- **Bold without end',
    '',
    '**Considerations:**',
    '- Value',
    '',
    '**When NOT to use:**',
    '- Never',
    '',
    '**Tech Tags:** Tag1',
    '',
    '**Docs:** https://example.com (Example Doc)',
    '',
    '**Additional Considerations:**',
    'Cleanup **odd** markdown',
    '',
    '---',
  ];
}

test('resultParser: handles malformed markdown gracefully', () => {
  const lines = buildLines();
  const results = parseResults(lines, 0, lines.length);
  const result = results['result-example'];

  assert.ok(result);
  assert.ok(result.docs[0]);
  assert.equal(
    result.bestFor[0],
    'Uses <a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a> with <em>italics</em>'
  );
  assert.equal(result.keyBenefits[0], '**Bold without end');
  assert.equal(result.docs[0].label, 'Example Doc');
  assert.equal(result.docs[0].url, 'https://example.com');
});
