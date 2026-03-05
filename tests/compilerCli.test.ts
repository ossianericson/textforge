import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';

const compilerPath = path.resolve(process.cwd(), 'dist', 'compiler', 'index.js');

function runCompiler(args: string[], envOverrides: Record<string, string> = {}) {
  return spawnSync(process.execPath, [compilerPath, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      LOG_LEVEL: 'info',
      LOG_FORMAT: 'text',
      ...envOverrides,
    },
  });
}

test('compiler CLI: --help prints usage and exits 0', () => {
  const result = runCompiler(['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: node dist\/compiler\/index\.js --topic <topic>/);
});

test('compiler CLI: missing args exits 1 with usage', () => {
  const result = runCompiler([]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Usage: node dist\/compiler\/index\.js --topic <topic>/);
});

test('compiler CLI: compiles example topic', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dtb-output-'));

  try {
    const result = runCompiler(['--topic', 'example-multicloud-compute'], {
      DTB_OUTPUT_DIR: outputDir,
    });

    assert.equal(result.status, 0);
    const outputPath = path.join(outputDir, 'example-multicloud-compute-tree.html');
    assert.ok(fs.existsSync(outputPath));
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('compiler CLI: reports compile error via main catch', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dtb-output-'));
  const templatePath = path.resolve(process.cwd(), 'core', 'base-template.html');
  const missingSpec = path.join(outputDir, 'missing-spec.md');
  const outputPath = path.join(outputDir, 'output.html');

  try {
    const result = runCompiler(
      ['--spec', missingSpec, '--template', templatePath, '--output', outputPath],
      { DTB_OUTPUT_DIR: outputDir }
    );

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Spec file not found/);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});
