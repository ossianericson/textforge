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

test('Decision Tree Compiler: auto-creates output directory', () => {
  const tempDir = makeTempDir();
  const specPath = writeFile(tempDir, 'spec.md', readFixture('spec-valid.md'));
  const promptPath = writeFile(tempDir, 'prompt.md', buildPrompt());
  const outputDir = path.join(tempDir, 'nested', 'output');
  const outputPath = path.join(outputDir, 'tree.html');

  compileDecisionTree({
    specPath,
    promptPath,
    templatePath: DEFAULT_RENDERER_TEMPLATE_PATH,
    outputPath,
  });

  assert.ok(fs.existsSync(outputPath));
});
