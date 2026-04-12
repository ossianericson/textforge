import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanInlineText, normalizeText, stripQuotes } from '#parser-utils/text-normalizer';

test('cleanInlineText: strips BOM and wrapping quotes', () => {
  const input = '\uFEFF "Hello"';
  assert.equal(cleanInlineText(input), 'Hello');
});

test('cleanInlineText: preserves bold while removing quotes', () => {
  const input = '**"Hello"**';
  assert.equal(cleanInlineText(input), '**Hello**');
});

test('cleanInlineText: trims quotes around bold text', () => {
  const input = '"**Hello**"';
  assert.equal(cleanInlineText(input), '**Hello**');
});

test('cleanInlineText: removes odd bold markers', () => {
  const input = '**Broken bold';
  assert.equal(cleanInlineText(input), 'Broken bold');
});

test('normalizeText: leaves plain ASCII unchanged', () => {
  assert.equal(normalizeText('Simple text'), 'Simple text');
});

test('normalizeText: returns original when conversion fails', () => {
  const input = 'Bad ÃŁ sequence';
  assert.equal(normalizeText(input), input);
});

test('stripQuotes: removes curly quotes', () => {
  assert.equal(stripQuotes('“Hello”'), 'Hello');
});
