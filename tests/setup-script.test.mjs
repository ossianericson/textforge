import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'child_process';

describe('setup script', () => {
  it('runs --check-only', () => {
    const output = execSync('node scripts/setup.mjs --check-only', { encoding: 'utf8' });
    assert.ok(output.includes('Node.js'));
    assert.ok(output.includes('Git'));
    assert.ok(output.includes('APM'));
  });
});