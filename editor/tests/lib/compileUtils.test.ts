import { describe, expect, it } from 'vitest';
import {
  buildOutputPath,
  friendlyCompileError,
  hashSpecPath,
  isValidCompiledHtml,
  slugifyTitle,
} from '@/lib/compileUtils';

const COMPILED_ROOT = 'C:/Users/test/AppData/Local/textforge/compiled';

describe('slugifyTitle', () => {
  it('converts spaces and special chars to hyphens', () => {
    expect(slugifyTitle('Azure Networking 2024')).toBe('azure-networking-2024');
  });

  it('returns empty string for all-non-ascii input', () => {
    expect(slugifyTitle('åäö')).toBe('');
  });
});

describe('buildOutputPath', () => {
  it('produces a stable user-local output path for spec.md', () => {
    expect(buildOutputPath(COMPILED_ROOT, 'C:/trees/azure/spec.md', 'Azure Networking')).toBe(
      `${COMPILED_ROOT}/${hashSpecPath('C:/trees/azure/spec.md')}/azure-networking-tree.html`
    );
  });

  it('works for any filename, not just spec.md', () => {
    expect(buildOutputPath(COMPILED_ROOT, 'C:/trees/my-tree.md', 'My Tree')).toBe(
      `${COMPILED_ROOT}/${hashSpecPath('C:/trees/my-tree.md')}/my-tree-tree.html`
    );
  });

  it('normalizes Windows backslash paths', () => {
    const result = buildOutputPath(COMPILED_ROOT, 'C:\\trees\\spec.md', 'My Tree');
    expect(result).not.toContain('\\');
    expect(result).toMatch(/my-tree-tree\.html$/);
  });

  it('never returns a path equal to the input', () => {
    const paths = [
      ['C:/trees/spec.md', 'Spec'],
      ['C:/trees/my-tree.md', 'My Tree'],
      ['/home/user/spec.md', 'Test'],
    ] as const;

    for (const [path, title] of paths) {
      expect(buildOutputPath(COMPILED_ROOT, path, title)).not.toBe(path);
    }
  });

  it('uses compiled as slug fallback for empty title', () => {
    expect(buildOutputPath(COMPILED_ROOT, 'C:/trees/spec.md', '')).toMatch(/compiled-tree\.html$/);
  });

  it('throws for a relative path', () => {
    expect(() => buildOutputPath(COMPILED_ROOT, 'spec.md', 'Test')).toThrow('must be absolute');
  });
});

describe('isValidCompiledHtml', () => {
  it('accepts a minimal valid HTML document', () => {
    const html =
      '<!DOCTYPE html><html lang="en"><head></head><body>' +
      'x'.repeat(600) +
      '</body></html>';
    expect(isValidCompiledHtml(html)).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidCompiledHtml('')).toBe(false);
  });

  it('rejects a short string', () => {
    expect(isValidCompiledHtml('<html></html>')).toBe(false);
  });

  it('rejects a JSON error blob', () => {
    expect(isValidCompiledHtml('{"error":"something went wrong"}')).toBe(false);
  });

  it('rejects a Markdown spec accidentally written to the output path', () => {
    expect(isValidCompiledHtml('# My Decision Tree\n\n## FLOW\n\n### q1\n')).toBe(false);
  });
});

describe('friendlyCompileError', () => {
  it('maps tsx-not-found errors', () => {
    expect(friendlyCompileError('Local tsx CLI not found. Run npm install')).toMatch(
      /npm install/
    );
  });

  it('maps no-questions errors', () => {
    expect(friendlyCompileError('No questions found in flow section')).toMatch(
      /question block/
    );
  });

  it('maps navigation errors', () => {
    expect(friendlyCompileError('Navigation error: unknown target q99')).toMatch(
      /Validation/
    );
  });

  it('truncates very long errors', () => {
    expect(friendlyCompileError('x'.repeat(1000)).length).toBeLessThan(500);
  });
});