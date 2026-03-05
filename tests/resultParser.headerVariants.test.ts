import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseResults } from '#parsers/result-parser';

test('resultParser: handles shared/networking header variants', () => {
  const lines = [
    '## Result Cards (1 Services)',
    '',
    '#### 1. Variant Result (result-variant)',
    '- Icon: ✅',
    '- Badge: Variant (blue)',
    '',
    '**Networking Essentials (applies to all strategies):**',
    '- Use dedicated DNS',
    '',
    '**Shared Services Essentials (applies to all strategies):**',
    '- Replicate Key Vault',
    '',
    '---',
  ];

  const results = parseResults(lines, 0, lines.length);
  const result = results['result-variant'];

  assert.ok(result);
  assert.ok(result.networkingEssentials);
  assert.ok(result.sharedServicesEssentials);
  assert.equal(result.networkingEssentials[0], 'Use dedicated DNS');
  assert.equal(result.sharedServicesEssentials[0], 'Replicate Key Vault');
});
