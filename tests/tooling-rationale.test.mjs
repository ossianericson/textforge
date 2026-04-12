import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DOC = join(ROOT, 'docs', 'tooling-rationale.md');

describe('docs/tooling-rationale.md', () => {
  it('file exists', () => {
    assert.ok(existsSync(DOC), 'docs/tooling-rationale.md must exist');
  });

  it('references all six tools', () => {
    const content = readFileSync(DOC, 'utf8');
    const required = [
      'microsoft/apm',
      'Repomix',
      'Lefthook',
      'git-cliff',
      'Vitest snapshots',
      'Playwright',
    ];
    for (const tool of required) {
      assert.ok(content.includes(tool), `docs/tooling-rationale.md must reference '${tool}'`);
    }
  });

  it('references engineering-discipline.md', () => {
    const content = readFileSync(DOC, 'utf8');
    assert.match(content, /engineering-discipline\.md/);
  });

  it('includes a Principles section', () => {
    const content = readFileSync(DOC, 'utf8');
    assert.match(content, /## Principles for tool selection/);
  });

  it('includes a Summary table', () => {
    const content = readFileSync(DOC, 'utf8');
    assert.match(content, /## Summary table/);
  });

  it('includes a When to revisit section', () => {
    const content = readFileSync(DOC, 'utf8');
    assert.match(content, /## When to revisit/);
  });

  it('includes a How to add a new tool section', () => {
    const content = readFileSync(DOC, 'utf8');
    assert.match(content, /## How to add a new tool/);
  });

  it('each tool references an Engineering Discipline primitive', () => {
    const content = readFileSync(DOC, 'utf8');
    const matches = content.match(/Engineering Discipline primitive/gi) ?? [];
    assert.ok(matches.length >= 6, `Expected at least 6 primitive references, found ${matches.length}`);
  });
});