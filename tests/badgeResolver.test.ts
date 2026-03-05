import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyBadgeClasses, parseBadgeCss } from '#parsers/badge-resolver';
import type { Result } from '#compiler/types';

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

test('badge resolver: maps badge text to class', () => {
  const badgeCss = parseBadgeCss(
    '```css\n.badge.storage { background: #000; }\n.badge.compute { background: #111; }\n```'
  );
  const results = {
    'result-a': buildResult('Storage'),
    'result-b': buildResult('Compute'),
  };

  applyBadgeClasses(results, badgeCss);

  assert.equal(results['result-a'].badge.className, 'storage');
  assert.equal(results['result-b'].badge.className, 'compute');
});
