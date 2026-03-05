import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyBadgeClasses } from '#parsers/badge-resolver';
import type { Result } from '#compiler/types';

function buildBadgeCss(lines: string[]): string {
  return lines.map((line) => `.badge.${line} { background: #000; }`).join('\n');
}

function buildResult(badgeText: string): Result {
  return {
    title: 'Result',
    icon: '',
    badge: { text: badgeText, className: '' },
    bestFor: [],
    keyBenefits: [],
    considerations: [],
    whenNotToUse: [],
    techTags: [],
    docs: [],
    additionalConsiderations: '',
  };
}

test('applyBadgeClasses: exact match wins', () => {
  const results = {
    'result-a': buildResult('Storage Hot'),
  };
  const badgeCss = buildBadgeCss(['storage', 'storage-hot']);

  applyBadgeClasses(results, badgeCss);

  assert.equal(results['result-a'].badge.className, 'storage-hot');
});

test('applyBadgeClasses: exact match wins over startsWith', () => {
  const results = {
    'result-a': buildResult('Blob'),
  };
  const badgeCss = buildBadgeCss(['blob', 'blob-storage']);

  applyBadgeClasses(results, badgeCss);

  assert.equal(results['result-a'].badge.className, 'blob');
});

test('applyBadgeClasses: startsWith selects longest match without exact', () => {
  const results = {
    'result-a': buildResult('Blob Storage'),
  };
  const badgeCss = buildBadgeCss(['blob', 'blob-storage']);

  applyBadgeClasses(results, badgeCss);

  assert.equal(results['result-a'].badge.className, 'blob-storage');
});

test('applyBadgeClasses: substring match used when no exact/startsWith', () => {
  const results = {
    'result-a': buildResult('Storage'),
  };
  const badgeCss = buildBadgeCss(['cold-storage']);

  applyBadgeClasses(results, badgeCss);

  assert.equal(results['result-a'].badge.className, 'cold-storage');
});
