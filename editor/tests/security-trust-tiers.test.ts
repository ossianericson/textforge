import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const TRUST_TIERS_PATH = join(ROOT, 'docs', 'security', 'trust-tiers.md');

describe('Trust tier classification (Engineering Discipline 1.2)', () => {
  it('trust tiers file exists', () => {
    expect(existsSync(TRUST_TIERS_PATH)).toBe(true);
  });

  it('all new credential commands are classified', () => {
    if (!existsSync(TRUST_TIERS_PATH)) {
      return;
    }

    const content = readFileSync(TRUST_TIERS_PATH, 'utf8');
    const requiredCommands = [
      'load_enterprise_config',
      'get_ai_auth_status',
      'try_silent_azure_auth',
      'test_ai_connection',
      'save_ai_provider_pref',
      'load_ai_provider_pref',
      'start_device_code_auth',
      'poll_device_code_auth',
      'clear_azure_auth',
      'query_audit_log',
    ];

    for (const command of requiredCommands) {
      expect(content).toContain(command);
    }
  });

  it('clear_azure_auth is classified Restricted', () => {
    if (!existsSync(TRUST_TIERS_PATH)) {
      return;
    }

    const content = readFileSync(TRUST_TIERS_PATH, 'utf8');
    const restrictedIndex = content.indexOf('### Restricted');
    expect(restrictedIndex).toBeGreaterThan(-1);
    expect(content.slice(restrictedIndex)).toContain('clear_azure_auth');
  });

  it('start_device_code_auth is classified Controlled', () => {
    if (!existsSync(TRUST_TIERS_PATH)) {
      return;
    }

    const content = readFileSync(TRUST_TIERS_PATH, 'utf8');
    const controlledIndex = content.indexOf('### Controlled');
    const restrictedIndex = content.indexOf('### Restricted');
    const controlledSection = content.slice(controlledIndex, restrictedIndex);
    expect(controlledSection).toContain('start_device_code_auth');
  });
});