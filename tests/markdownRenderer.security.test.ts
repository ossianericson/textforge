import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderInlineMarkdown } from '#parser-utils/markdown-renderer';

test('renderInlineMarkdown: encodes quotes inside href URLs', () => {
  const input = '[link](https://evil.example/a"onmouseover="alert(1))';
  const html = renderInlineMarkdown(input);

  assert.match(html, /href="https:\/\/evil\.example\/a%22onmouseover=%22alert\(1"/);
  assert.ok(!html.includes(' onmouseover='));
});

test('renderInlineMarkdown: allows safe relative links', () => {
  const input = '[Data Services](azure-data-services-tree.html)';
  const html = renderInlineMarkdown(input);

  assert.match(html, /href="azure-data-services-tree\.html"/);
});

test('renderInlineMarkdown: allows https links', () => {
  const input = '[Docs](https://example.com/path)';
  const html = renderInlineMarkdown(input);

  assert.match(html, /href="https:\/\/example\.com\/path"/);
});

test('renderInlineMarkdown: drops empty href', () => {
  const html = renderInlineMarkdown('[Empty]()');

  assert.ok(html.includes('Empty'));
  assert.ok(!html.includes('href='));
});
