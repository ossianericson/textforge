import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { compileDecisionTree } from '#compiler/index';
import { compileQuiz } from '#compiler/quiz-compiler';
import { assertCompiledHtml } from './compiledHtmlAssertions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DECISION_TREES_DIR = path.join(ROOT_DIR, 'decision-trees');
const QUIZ_DIR = path.join(ROOT_DIR, 'quiz');
const QUIZ_TEMPLATE_PATH = path.join(ROOT_DIR, 'core', 'quiz-template.html');

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'textforge-corpus-'));
}

function listSpecFiles(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const specPaths: string[] = [];
  const stack = [rootDir];

  while (stack.length) {
    const currentDir = stack.pop();
    if (!currentDir) {
      continue;
    }

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }
      if (entry.isFile() && entry.name === 'spec.md') {
        specPaths.push(entryPath);
      }
    }
  }

  return specPaths.sort((left, right) => left.localeCompare(right));
}

function buildOutputPath(
  tempDir: string,
  rootDir: string,
  specPath: string,
  suffix: string
): string {
  const relativePath = path.relative(rootDir, specPath).replace(/[\\/]/g, '__');
  return path.join(tempDir, relativePath.replace(/spec\.md$/i, suffix));
}

function toSpecLabel(specPath: string): string {
  return path.relative(ROOT_DIR, specPath).replace(/\\/g, '/');
}

const decisionTreeSpecs = listSpecFiles(DECISION_TREES_DIR);
const quizSpecs = listSpecFiles(QUIZ_DIR);

test('corpus compile: discovers real decision tree specs', () => {
  assert.ok(
    decisionTreeSpecs.length > 0,
    'Expected at least one decision tree spec in the repository.'
  );
});

decisionTreeSpecs.forEach((specPath) => {
  const specLabel = toSpecLabel(specPath);

  test(`corpus compile: ${specLabel} compiles with shared invariants`, () => {
    const tempDir = makeTempDir();

    try {
      const outputPath = buildOutputPath(tempDir, DECISION_TREES_DIR, specPath, 'tree.html');
      compileDecisionTree({ specPath, outputPath });

      assert.ok(fs.existsSync(outputPath), `Expected compiled output for ${specLabel}.`);
      const html = fs.readFileSync(outputPath, 'utf8');
      assertCompiledHtml({ html, kind: 'decision-tree', specLabel });
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

test('corpus compile: discovers real quiz specs', () => {
  assert.ok(quizSpecs.length > 0, 'Expected at least one quiz spec in the repository.');
});

quizSpecs.forEach((specPath) => {
  const specLabel = toSpecLabel(specPath);

  test(`corpus compile: ${specLabel} compiles with shared invariants`, () => {
    const tempDir = makeTempDir();

    try {
      const outputPath = buildOutputPath(tempDir, QUIZ_DIR, specPath, 'quiz.html');
      compileQuiz({
        specPath,
        templatePath: QUIZ_TEMPLATE_PATH,
        outputPath,
      });

      assert.ok(fs.existsSync(outputPath), `Expected compiled output for ${specLabel}.`);
      const html = fs.readFileSync(outputPath, 'utf8');
      assertCompiledHtml({ html, kind: 'quiz', specLabel });
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
