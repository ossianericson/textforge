import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compileDecisionTree } from '#compiler/index';
import { makeTempDir, readFile, writeFile } from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.resolve(__dirname, '..', 'core', 'base-template.html');
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf8');
}

function buildPrompt(): string {
  return `COMPILER INPUT\n\n**Badge Colors:**\n\`\`\`css\n.badge.test { background: #3b82f6; }\n\`\`\`\n`;
}

test('Decision Tree Compiler: deterministic output', () => {
  const tempDir = makeTempDir();
  const specPath = writeFile(tempDir, 'spec.md', readFixture('spec-valid.md'));
  const promptPath = writeFile(tempDir, 'prompt.md', buildPrompt());
  const outputPath1 = path.join(tempDir, 'output-1.html');
  const outputPath2 = path.join(tempDir, 'output-2.html');

  compileDecisionTree({
    specPath,
    promptPath,
    templatePath: TEMPLATE_PATH,
    outputPath: outputPath1,
  });

  compileDecisionTree({
    specPath,
    promptPath,
    templatePath: TEMPLATE_PATH,
    outputPath: outputPath2,
  });

  const html1 = readFile(outputPath1);
  const html2 = readFile(outputPath2);

  assert.strictEqual(html1, html2);
});

test('Decision Tree Compiler: rejects malformed spec input', () => {
  const tempDir = makeTempDir();
  const specPath = writeFile(tempDir, 'spec.md', readFixture('spec-invalid.md'));
  const promptPath = writeFile(tempDir, 'prompt.md', buildPrompt());
  const outputPath = path.join(tempDir, 'output.html');

  let caught: unknown = null;
  try {
    compileDecisionTree({
      specPath,
      promptPath,
      templatePath: TEMPLATE_PATH,
      outputPath,
    });
  } catch (error) {
    caught = error;
  }

  assert.ok(caught, 'Expected compilation to fail');
  const err = caught as { code?: string };
  assert.equal(err.code, 'DTB-003');
});

test('Decision Tree Compiler: fails on missing template file', () => {
  const tempDir = makeTempDir();
  const specPath = writeFile(tempDir, 'spec.md', readFixture('spec-valid.md'));
  const promptPath = writeFile(tempDir, 'prompt.md', buildPrompt());
  const outputPath = path.join(tempDir, 'output.html');
  const missingTemplate = path.join(tempDir, 'missing-template.html');

  let caught: unknown = null;
  try {
    compileDecisionTree({
      specPath,
      promptPath,
      templatePath: missingTemplate,
      outputPath,
    });
  } catch (error) {
    caught = error;
  }

  assert.ok(caught, 'Expected compilation to fail');
  const err = caught as { code?: string };
  assert.equal(err.code, 'DTB-002');
});
