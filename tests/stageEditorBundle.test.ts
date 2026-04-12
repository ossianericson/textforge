import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { __testUtils } from '../scripts/stage-editor-bundle.ts';

test('resolveRefreshDestination uses -refresh when available', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'textforge-stage-refresh-'));

  try {
    const destination = path.join(rootDir, 'windows-x64-portable');
    assert.equal(
      __testUtils.resolveRefreshDestination(destination),
      `${destination}-refresh`
    );
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test('resolveRefreshDestination increments when refresh folders already exist', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'textforge-stage-refresh-'));

  try {
    const destination = path.join(rootDir, 'windows-x64-portable');
    fs.mkdirSync(`${destination}-refresh`, { recursive: true });
    fs.mkdirSync(`${destination}-refresh-2`, { recursive: true });

    assert.equal(
      __testUtils.resolveRefreshDestination(destination),
      `${destination}-refresh-3`
    );
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test('isRetryableStagingError recognizes Windows lock-style fs errors', () => {
  assert.equal(
    __testUtils.isRetryableStagingError(Object.assign(new Error('locked'), { code: 'EPERM' })),
    true
  );
  assert.equal(
    __testUtils.isRetryableStagingError(Object.assign(new Error('busy'), { code: 'EBUSY' })),
    true
  );
  assert.equal(
    __testUtils.isRetryableStagingError(Object.assign(new Error('other'), { code: 'ENOENT' })),
    false
  );
});