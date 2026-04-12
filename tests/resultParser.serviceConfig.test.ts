import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseResults } from '#parsers/result-parser';

test('resultParser: captures service configuration blocks', () => {
  const lines = [
    '## Result Cards (1 Services)',
    '',
    '#### 1. Tier Result (result-tier-critical)',
    '- Icon: ✅',
    '- Badge: Critical (red)',
    '',
    '**Data Service DR Configuration:**',
    '**[Azure SQL Database]:**',
    '- Use active geo-replication',
    '- Configure failover groups',
    '',
    '**Compute Platform DR Configuration:**',
    '**[Azure App Service]:**',
    '- Enable zone redundancy',
    '',
    '**Platform Fit Warnings:**',
    '- Requires premium tier',
    '',
    '---',
  ];

  const results = parseResults(lines, 0, lines.length);
  const result = results['result-tier-critical'];

  assert.ok(result);
  assert.ok(result.dataServiceConfigs);
  assert.ok(result.computePlatformConfigs);
  assert.equal(result.dataServiceConfigs.length, 1);
  assert.ok(result.dataServiceConfigs[0]);
  assert.equal(result.dataServiceConfigs[0].name, 'Azure SQL Database');
  assert.deepEqual(result.dataServiceConfigs[0].items, [
    'Use active geo-replication',
    'Configure failover groups',
  ]);
  assert.equal(result.computePlatformConfigs.length, 1);
  assert.ok(result.computePlatformConfigs[0]);
  assert.equal(result.computePlatformConfigs[0].name, 'Azure App Service');
  assert.deepEqual(result.computePlatformConfigs[0].items, ['Enable zone redundancy']);
  assert.deepEqual(result.platformFitWarnings, ['Requires premium tier']);
});
