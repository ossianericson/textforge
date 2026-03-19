import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { compileDecisionTree } from '#compiler/index';
import { makeTempDir, writeFile } from './helpers.js';
import { DEFAULT_RENDERER_TEMPLATE_PATH } from './templatePaths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf8');
}

function buildPrompt(): string {
  return `COMPILER INPUT\n\n**Badge Colors:**\n\`\`\`css\n.badge.test { background: #3b82f6; }\n\`\`\`\n`;
}

test('Decision Tree Compiler: fails on missing navigation target', () => {
  const tempDir = makeTempDir();
  const specPath = writeFile(tempDir, 'spec.md', readFixture('spec-missing-target.md'));
  const promptPath = writeFile(tempDir, 'prompt.md', buildPrompt());
  const outputPath = path.join(tempDir, 'output.html');

  let caught: unknown = null;
  try {
    compileDecisionTree({
      specPath,
      promptPath,
      templatePath: DEFAULT_RENDERER_TEMPLATE_PATH,
      outputPath,
    });
  } catch (error) {
    caught = error;
  }

  assert.ok(caught, 'Expected compilation to fail');
  const err = caught as { code?: string };
  assert.equal(err.code, 'DTB-006');
});
