import assert from 'node:assert/strict';
import { test } from 'node:test';
import { escapeHtml, sanitizeUrl } from '#compiler/utils/sanitize';

test('sanitizeUrl: blocks unsafe protocols', () => {
  assert.equal(sanitizeUrl('javascript:alert(1)'), '#blocked-url');
  assert.equal(sanitizeUrl('data:text/html;base64,abc123'), '#blocked-url');
  assert.equal(sanitizeUrl('vbscript:msgbox("x")'), '#blocked-url');
});

test('sanitizeUrl: allows approved absolute protocols', () => {
  assert.equal(sanitizeUrl('https://example.com/docs?q=1'), 'https://example.com/docs?q=1');
  assert.equal(sanitizeUrl('http://example.com/path'), 'http://example.com/path');
  assert.equal(sanitizeUrl('mailto:user@example.com'), 'mailto:user@example.com');
});

test('sanitizeUrl: blocks unsupported parsed protocols', () => {
  assert.equal(sanitizeUrl('ftp://example.com/file.txt'), '#blocked-url');
});

test('sanitizeUrl: allows safe relative targets and anchors', () => {
  assert.equal(sanitizeUrl('/docs/getting-started'), '/docs/getting-started');
  assert.equal(sanitizeUrl('#section-2'), '#section-2');
});

test('sanitizeUrl: blocks invalid non-url values', () => {
  assert.equal(sanitizeUrl('plain text value'), '#blocked-url');
  assert.equal(sanitizeUrl(''), '#blocked-url');
});

test('escapeHtml: escapes reserved characters and handles empty input', () => {
  assert.equal(
    escapeHtml(`<tag attr="x">Tom & 'Jerry'</tag>`),
    '&lt;tag attr=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/tag&gt;'
  );
  assert.equal(escapeHtml(''), '');
});
