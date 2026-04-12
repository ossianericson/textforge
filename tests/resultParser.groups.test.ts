import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseResults } from '#parsers/result-parser';

function buildLines(): string[] {
  return [
    '## Result Cards (2 Services)',
    '',
    '#### Blob Storage',
    '**Blob Storage (result-blob)**',
    '- Icon: ✅',
    '- Badge: Storage (blue)',
    '',
    '**Tech Tags:** Tag1',
    '',
    '**File Storage (result-file)**',
    '- Icon: ✅',
    '- Badge: Storage (blue)',
    '',
    '**Tech Tags:** Tag2',
    '',
    '---',
  ];
}

test('resultParser: applies group titles and tech tags', () => {
  const lines = buildLines();
  const results = parseResults(lines, 0, lines.length);

  const blob = results['result-blob'];
  const file = results['result-file'];

  assert.ok(blob);
  assert.ok(file);
  assert.equal(blob.title, 'Blob Storage - Storage');
  assert.equal(blob.techTags.join(','), 'Tag2');
  assert.equal(file.techTags.join(','), 'Tag2');
});
