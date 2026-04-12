import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseBadgeCss } from '#parsers/badge-resolver';

test('badge parser: extracts badge CSS lines', () => {
  const input = [
    'COMPILER INPUT',
    '```css',
    '.badge.storage { background: #000; }',
    '.badge.compute { background: #111; }',
    '```',
    'Other text',
  ].join('\n');

  const css = parseBadgeCss(input);

  assert.ok(css.includes('.badge.storage'));
  assert.ok(css.includes('.badge.compute'));
});
