import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { compileDecisionTree } from '#compiler/index';
import { getConfig } from '#config';
import { makeTempDir, readFile, writeFile } from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const SPEC_PATH = path.join(FIXTURES_DIR, 'spec-valid.md');
const TEMPLATE_PATH = path.join(FIXTURES_DIR, 'template-golden.html');
const BADGES_PATH = path.join(FIXTURES_DIR, 'badges-golden.yml');
const EXPECTED_PATH = path.join(FIXTURES_DIR, 'expected-golden.html');

function readFixture(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, '\n');
}

test('Decision Tree Compiler: golden HTML output matches fixture', () => {
  const tempDir = makeTempDir();
  const specContents = readFixture(SPEC_PATH);
  const expectedHtml = readFixture(EXPECTED_PATH);
  const specPath = writeFile(tempDir, 'spec.md', specContents);
  const outputPath = path.join(tempDir, 'output.html');

  const config = getConfig();
  const originalBadgePath = config.badgePath;
  config.badgePath = BADGES_PATH;

  try {
    compileDecisionTree({
      specPath,
      templatePath: TEMPLATE_PATH,
      outputPath,
    });
  } finally {
    config.badgePath = originalBadgePath;
  }

  const outputHtml = readFile(outputPath);
  assert.strictEqual(normalizeLineEndings(outputHtml), normalizeLineEndings(expectedHtml));
});
