import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { __testUtils } from '../scripts/export-public.js';
import { makeTempDir, writeFile } from './helpers.js';

test('public export detects the newest staged portable artifact', () => {
  const rootDir = makeTempDir();

  try {
    fs.mkdirSync(path.join(rootDir, 'artifacts', 'editor', '0.1.0', 'windows-x64-portable'), {
      recursive: true,
    });
    fs.mkdirSync(path.join(rootDir, 'artifacts', 'editor', '0.2.0', 'windows-x64-portable'), {
      recursive: true,
    });
    writeFile(
      path.join(rootDir, 'artifacts', 'editor', '0.1.0', 'windows-x64-portable'),
      'textforge-editor.exe',
      'old'
    );
    writeFile(
      path.join(rootDir, 'artifacts', 'editor', '0.2.0', 'windows-x64-portable'),
      'textforge-editor.exe',
      'new'
    );

    const entry = __testUtils.resolvePortableExportEntry(rootDir);

    assert.deepEqual(entry, {
      source: 'artifacts/editor/0.2.0/windows-x64-portable',
      destination: 'artifacts/editor/0.2.0/windows-x64-portable',
    });
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test('public export skips portable artifact when none is staged', () => {
  const rootDir = makeTempDir();

  try {
    fs.mkdirSync(path.join(rootDir, 'artifacts', 'editor'), { recursive: true });
    assert.equal(__testUtils.resolvePortableExportEntry(rootDir), null);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});