import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseTitle } from '#parsers/title-parser';

test('titleParser: parses main and subtitle', () => {
  const lines = [
    '# Decision Tree',
    '',
    '**Main:** "Test Tree"',
    '**Subtitle:** "Subtitle here"',
    '',
    '## Decision Tree Flow',
  ];

  const title = parseTitle(lines, lines.length);

  assert.equal(title.main, 'Test Tree');
  assert.equal(title.subtitle, 'Subtitle here');
});

test('titleParser: stops at limit index', () => {
  const lines = ['# Decision Tree', '', '**Main:** "Late Title"', '**Subtitle:** "Late Subtitle"'];

  const title = parseTitle(lines, 2);

  assert.equal(title.main, '');
  assert.equal(title.subtitle, '');
});
