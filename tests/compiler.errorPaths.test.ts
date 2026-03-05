import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { compileDecisionTree } from '#compiler/index';
import { getConfig } from '#config';
import { makeTempDir, writeFile } from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.resolve(__dirname, '..', 'core', 'base-template.html');
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf8');
}

test('Decision Tree Compiler: fails on missing badge config', () => {
  const tempDir = makeTempDir();
  const specPath = writeFile(tempDir, 'spec.md', readFixture('spec-valid.md'));
  const outputPath = path.join(tempDir, 'output.html');

  const config = getConfig();
  const originalBadgePath = config.badgePath;
  config.badgePath = path.join(tempDir, 'missing-badges.yml');

  let caught: unknown = null;
  try {
    compileDecisionTree({
      specPath,
      templatePath: TEMPLATE_PATH,
      outputPath,
    });
  } catch (error) {
    caught = error;
  } finally {
    config.badgePath = originalBadgePath;
  }

  assert.ok(caught, 'Expected compilation to fail');
  const err = caught as { code?: string };
  assert.equal(err.code, 'DTB-007');
});

test('Decision Tree Compiler: fails on output write error', () => {
  const tempDir = makeTempDir();
  const specPath = writeFile(tempDir, 'spec.md', readFixture('spec-valid.md'));
  const outputDir = path.join(tempDir, 'output-dir');
  fs.mkdirSync(outputDir, { recursive: true });

  let caught: unknown = null;
  try {
    compileDecisionTree({
      specPath,
      templatePath: TEMPLATE_PATH,
      outputPath: outputDir,
    });
  } catch (error) {
    caught = error;
  }

  assert.ok(caught, 'Expected compilation to fail');
  const err = caught as { code?: string };
  assert.equal(err.code, 'DTB-005');
});
