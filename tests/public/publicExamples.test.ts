import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { compileDecisionTree } from '#compiler/index';
import { compileQuiz } from '#compiler/quiz-compiler';
import { getBaselineExamples } from '../baselines.js';

const PUBLIC_BASELINES = getBaselineExamples('public');
const PUBLIC_TREE = PUBLIC_BASELINES.find((example) => example.id === 'public-compute-tree')!;
const PUBLIC_QUIZ = PUBLIC_BASELINES.find((example) => example.id === 'public-quiz')!;

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'textforge-public-'));
}

test('public baseline: example compute tree compiles successfully', () => {
  const tempDir = makeTempDir();

  try {
    const outputPath = path.join(tempDir, PUBLIC_TREE.expectedOutputName);

    compileDecisionTree({ specPath: PUBLIC_TREE.specPath, outputPath });

    assert.ok(
      fs.existsSync(outputPath),
      'Expected compiled output for the public compute example.'
    );
    const html = fs.readFileSync(outputPath, 'utf8');
    assert.match(html, /<html[\s>]/i, 'Expected an HTML document for the public compute example.');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('public baseline: example quiz compiles successfully', () => {
  const tempDir = makeTempDir();

  try {
    const outputPath = path.join(tempDir, PUBLIC_QUIZ.expectedOutputName);

    compileQuiz({
      specPath: PUBLIC_QUIZ.specPath,
      templatePath: PUBLIC_QUIZ.templatePath!,
      outputPath,
    });

    assert.ok(fs.existsSync(outputPath), 'Expected compiled output for the public quiz example.');
    const html = fs.readFileSync(outputPath, 'utf8');
    assert.match(html, /<html[\s>]/i, 'Expected an HTML document for the public quiz example.');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('public baseline: example compute tree output is deterministic', () => {
  const tempDir = makeTempDir();
  const outputPath1 = path.join(tempDir, 'example-multicloud-compute-1.html');
  const outputPath2 = path.join(tempDir, 'example-multicloud-compute-2.html');

  try {
    compileDecisionTree({
      specPath: PUBLIC_TREE.specPath,
      outputPath: outputPath1,
    });

    compileDecisionTree({
      specPath: PUBLIC_TREE.specPath,
      outputPath: outputPath2,
    });

    assert.strictEqual(fs.readFileSync(outputPath1, 'utf8'), fs.readFileSync(outputPath2, 'utf8'));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
