import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

describe('Agent role definitions (Engineering Discipline 3.4)', () => {
  it('architect.md exists', () => {
    assert.ok(existsSync(join(ROOT, '.apm/agents/architect.md')));
  });

  it('executor.md exists', () => {
    assert.ok(existsSync(join(ROOT, '.apm/agents/executor.md')));
  });

  it('verifier.md exists', () => {
    assert.ok(existsSync(join(ROOT, '.apm/agents/verifier.md')));
  });

  it('architect cannot execute code', () => {
    const content = readFileSync(join(ROOT, '.apm/agents/architect.md'), 'utf8');
    assert.match(content, /does NOT.*execute/i);
  });

  it('executor cannot commit to main', () => {
    const content = readFileSync(join(ROOT, '.apm/agents/executor.md'), 'utf8');
    assert.match(content, /not commit directly to main/i);
  });

  it('verifier cannot modify source', () => {
    const content = readFileSync(join(ROOT, '.apm/agents/verifier.md'), 'utf8');
    assert.match(content, /[Cc]annot modify source/);
  });
});