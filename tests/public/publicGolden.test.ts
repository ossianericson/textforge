import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { compileDecisionTree } from '#compiler/index';
import { compileQuiz } from '#compiler/quiz-compiler';
import { getBaselineExamples } from '../baselines.js';

const PUBLIC_GOLDENS = getBaselineExamples('public').filter(
  (example) => typeof example.goldenSha256 === 'string'
);

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'textforge-golden-'));
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, '\n');
}

function hashFile(filePath: string): string {
  const content = normalizeLineEndings(fs.readFileSync(filePath, 'utf8'));
  return crypto.createHash('sha256').update(content).digest('hex');
}

PUBLIC_GOLDENS.forEach((example) => {
  test(`public golden: ${example.label} output hash matches snapshot`, () => {
    const tempDir = makeTempDir();

    try {
      const outputPath = path.join(tempDir, example.expectedOutputName);

      if (example.kind === 'decision-tree') {
        compileDecisionTree({ specPath: example.specPath, outputPath });
      } else {
        compileQuiz({
          specPath: example.specPath,
          templatePath: example.templatePath!,
          outputPath,
        });
      }

      assert.strictEqual(hashFile(outputPath), example.goldenSha256);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
