import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseResults } from '#parsers/result-parser';

function buildLines(): string[] {
  return [
    '## Result Cards (2 Services)',
    '',
    '### Storage Services',
    '',
    '#### Blob Storage',
    '**Blob Archive (result-blob-archive)**',
    '- Icon: ✅',
    '',
    '**Warning Box**',
    'Important',
    'Use for cold storage only.',
    '```',
    '',
    '**Support Section - platform contact information**',
    '- Contact [Blob Team](https://example.com)',
    '',
    '---',
    '',
    '#### 2. Regular Service (result-regular)',
    '- Icon: ✅',
    '- Badge: Regular (blue)',
    '',
    '**Best For:**',
    '- General use',
    '',
    '---',
  ];
}

test('resultParser: handles group and warning/support sections', () => {
  const lines = buildLines();
  const results = parseResults(lines, 0, lines.length);

  const grouped = results['result-blob-archive'];
  assert.ok(grouped);
  assert.ok(grouped.warning);
  assert.ok(grouped.supportSection);
  assert.ok(grouped.supportSection.links[0]);
  assert.equal(grouped.title, 'Blob Storage - Archive');
  assert.equal(grouped.badge.text, 'Storage');
  assert.equal(grouped.warning.title, 'Important');
  assert.equal(grouped.warning.text, 'Use for cold storage only.');
  assert.equal(grouped.supportSection.title, 'platform contact information');
  assert.equal(grouped.supportSection.lines[0], 'Contact Blob Team');
  assert.equal(grouped.supportSection.links[0].url, 'https://example.com');

  const regular = results['result-regular'];
  assert.ok(regular);
  assert.equal(regular.badge.text, 'Regular');
  assert.equal(regular.bestFor[0], 'General use');
});

test('resultParser: captures inline warning before section header', () => {
  const lines = [
    '## Result Cards (1 Services)',
    '',
    '#### 1. Example Service (result-example)',
    '- Icon: test',
    '- Badge: Example (blue)',
    '',
    '**WARNING:** "Use caution"',
    'This is line one.',
    'This is line two.',
    '',
    '**Best For:**',
    '- Safe usage',
    '',
    '---',
  ];

  const results = parseResults(lines, 0, lines.length);
  const result = results['result-example'];

  assert.ok(result);
  assert.ok(result.warning);
  assert.equal(result.warning.title, 'Use caution');
  assert.equal(result.warning.text, 'This is line one. This is line two.');
  assert.equal(result.bestFor[0], 'Safe usage');
});

test('resultParser: resumes parsing after warning box', () => {
  const lines = [
    '## Result Cards (1 Services)',
    '',
    '#### 1. Example Service (result-example)',
    '- Icon: test',
    '- Badge: Example (blue)',
    '',
    '**Warning Box**',
    'Important',
    'Use for cold storage only.',
    '```',
    '',
    '**Considerations:**',
    '- Not supported in region',
    '',
    '---',
  ];

  const results = parseResults(lines, 0, lines.length);
  const result = results['result-example'];

  assert.ok(result);
  assert.ok(result.warning);
  assert.equal(result.warning.title, 'Important');
  assert.equal(result.warning.text, 'Use for cold storage only.');
  assert.equal(result.considerations[0], 'Not supported in region');
});

test('resultParser: captures DR section lists and continuations', () => {
  const lines = [
    '## Result Cards (1 Services)',
    '',
    '#### 1. DR Tier (result-tier)',
    '- Icon: test',
    '- Badge: Tier (blue)',
    '',
    '**Platform Fit Warnings:**',
    '- Requires premium tier',
    '',
    '**Cost Profile:**',
    '- Higher storage replication costs',
    '',
    '**Tier Comparison:**',
    '- Next tier adds active-active',
    '',
    '**Networking Essentials (applies to all strategies):**',
    '- Separate failover DNS',
    '',
    '**Shared Services Essentials (applies to all strategies):**',
    '- Replicate Key Vault',
    '',
    '**IaC Requirement:**',
    '- Use Terraform modules',
    '',
    '**DR Testing Cadence:**',
    '- Run failover drills quarterly',
    '',
    '**Next Steps:**',
    '- Review with platform team',
    '',
    '**Additional Considerations:**',
    'Handle legacy DNS gaps.',
    'Ensure monitoring is regional.',
    '',
    '- Performance: Low latency',
    '- Note: Validate backup retention',
    '',
    '---',
  ];

  const results = parseResults(lines, 0, lines.length);
  const result = results['result-tier'];

  assert.ok(result);
  assert.ok(result.platformFitWarnings);
  assert.ok(result.costProfile);
  assert.ok(result.tierComparison);
  assert.ok(result.networkingEssentials);
  assert.ok(result.sharedServicesEssentials);
  assert.ok(result.iacRequirement);
  assert.ok(result.drTestingCadence);
  assert.ok(result.nextSteps);
  assert.equal(result.platformFitWarnings[0], 'Requires premium tier');
  assert.equal(result.costProfile[0], 'Higher storage replication costs');
  assert.equal(result.tierComparison[0], 'Next tier adds active-active');
  assert.equal(result.networkingEssentials[0], 'Separate failover DNS');
  assert.equal(result.sharedServicesEssentials[0], 'Replicate Key Vault');
  assert.equal(result.iacRequirement[0], 'Use Terraform modules');
  assert.equal(result.drTestingCadence[0], 'Run failover drills quarterly');
  assert.equal(result.nextSteps[0], 'Review with platform team');
  assert.equal(
    result.additionalConsiderations,
    'Handle legacy DNS gaps. Ensure monitoring is regional.'
  );
  assert.equal(result.keyBenefits[0], 'Performance: Low latency');
  assert.equal(result.considerations[0], 'Validate backup retention');
});
