import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseDocsInline, renderInlineMarkdown } from '#parser-utils/markdown-renderer';

test('parseDocsInline: parses url with label after', () => {
  const docs = parseDocsInline('https://example.com (Example Doc)', 'Service');

  assert.equal(docs.length, 1);
  assert.ok(docs[0]);
  assert.equal(docs[0].label, 'Example Doc');
  assert.equal(docs[0].url, 'https://example.com');
});

test('parseDocsInline: parses url only with default label', () => {
  const docs = parseDocsInline('https://example.com', 'My Service');

  assert.equal(docs.length, 1);
  assert.ok(docs[0]);
  assert.equal(docs[0].label, 'My Service Documentation');
  assert.equal(docs[0].url, 'https://example.com');
});

test('parseDocsInline: parses label and url with colon', () => {
  const docs = parseDocsInline('Guide: https://example.com/docs', 'Service');

  assert.equal(docs.length, 1);
  assert.ok(docs[0]);
  assert.equal(docs[0].label, 'Guide');
  assert.equal(docs[0].url, 'https://example.com/docs');
});

test('parseDocsInline: parses label with url in parens', () => {
  const docs = parseDocsInline('How to use (https://example.com/guide)', 'Service');

  assert.equal(docs.length, 1);
  assert.ok(docs[0]);
  assert.equal(docs[0].label, 'How to use');
  assert.equal(docs[0].url, 'https://example.com/guide');
});

test('parseDocsInline: parses url embedded in text', () => {
  const docs = parseDocsInline('Docs - https://example.com', 'Service');

  assert.equal(docs.length, 1);
  assert.ok(docs[0]);
  assert.equal(docs[0].label, 'Docs');
  assert.equal(docs[0].url, 'https://example.com');
});

test('renderInlineMarkdown: blocks unsafe or invalid hrefs', () => {
  const javascript = renderInlineMarkdown('[Bad](javascript:alert(1))');
  const withSpace = renderInlineMarkdown('[Bad](bad url)');
  const withColon = renderInlineMarkdown('[Bad](foo:bar)');
  const withBackslash = renderInlineMarkdown(String.raw`[Bad](dir\file.html)`);

  [javascript, withSpace, withColon, withBackslash].forEach((output) => {
    assert.ok(output.includes('Bad'));
    assert.ok(!output.includes('href='));
  });
});

test('renderInlineMarkdown: allows relative hrefs with hash', () => {
  const html = renderInlineMarkdown('[Go](docs/page.html#section-1)');

  assert.match(html, /href="docs\/page\.html#section-1"/);
});
