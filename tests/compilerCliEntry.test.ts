import assert from 'node:assert/strict';
import { test } from 'node:test';
import { __testUtils } from '#compiler/index';

test('compiler CLI entry runs when invoked directly without arguments', () => {
  assert.equal(
    __testUtils.shouldRunAsCli(['node', 'C:/repo/dist/compiler/index.js'], 'C:/repo/dist/compiler/index.js'),
    true
  );
});

test('compiler CLI entry runs for flagged CLI invocations', () => {
  assert.equal(
    __testUtils.shouldRunAsCli(
      ['node', 'C:/repo/dist/compiler/index.js', '--spec', 'C:/repo/spec.md', '--output', 'C:/repo/out.html'],
      'C:/repo/dist/compiler/index.js'
    ),
    true
  );
});

test('compiler CLI entry does not run for sidecar-style positional arguments', () => {
  assert.equal(
    __testUtils.shouldRunAsCli(
      ['node', 'C:/repo/dist/compiler/index.js', 'C:/repo/spec.md', 'C:/repo/out.html'],
      'C:/repo/dist/compiler/index.js'
    ),
    false
  );
});

test('compiler CLI entry does not run when imported from another entrypoint', () => {
  assert.equal(
    __testUtils.shouldRunAsCli(
      ['node', 'C:/repo/dist/editor/compile-spec.js', '--spec', 'C:/repo/spec.md'],
      'C:/repo/dist/compiler/index.js'
    ),
    false
  );
});