import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { DEFAULT_RENDERER_TEMPLATE_PATH } from './templatePaths.js';
import { writeFile } from './helpers.js';

const compilerPath = path.resolve(process.cwd(), 'dist', 'compiler', 'index.js');
const MINIMAL_SPEC = `# Decision Tree

**Main:** "CLI Test Tree"
**Subtitle:** "CLI coverage"

## Decision Tree Flow

### Q1: Entry (id="q1")

**Title**: "Choose"
**Options**:

1. "Continue" → result: result-ok

---

## Result Cards (1 Services)

#### 1. OK (result-ok)

- Icon: test
- Badge: Test (blue)

**Best For:**

- CLI verification

**Key Benefits:**

- Minimal compile path

**Considerations:**

- Test fixture only

**When NOT to use:**

- Production decisions

**Tech Tags:** Test

**Docs:** https://example.com

---

## Progress Steps

\`\`\`javascript
const progressSteps = {
  q1: 0,
  result: 100,
};
\`\`\`
`;

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

function createTopicSpec(rootDir: string, topicPath: string): void {
  const topicDir = path.join(rootDir, ...topicPath.split('/'));
  fs.mkdirSync(topicDir, { recursive: true });
  writeFile(topicDir, 'spec.md', MINIMAL_SPEC);
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

test('compiler CLI: compiles topic with unique leaf name', () => {
  const decisionTreesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dtb-topics-'));
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dtb-output-'));

  try {
    createTopicSpec(decisionTreesDir, 'internal/example-topic');

    const result = runCompiler(['--topic', 'example-topic'], {
      DTB_DECISION_TREES_DIR: decisionTreesDir,
      DTB_OUTPUT_DIR: outputDir,
    });

    assert.equal(result.status, 0);
    const outputPath = path.join(outputDir, 'example-topic-tree.html');
    assert.ok(fs.existsSync(outputPath));
  } finally {
    fs.rmSync(decisionTreesDir, { recursive: true, force: true });
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('compiler CLI: compiles nested topic path with flattened output name', () => {
  const decisionTreesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dtb-topics-'));
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dtb-output-'));

  try {
    createTopicSpec(decisionTreesDir, 'internal/example-topic');

    const result = runCompiler(['--topic', 'internal/example-topic'], {
      DTB_DECISION_TREES_DIR: decisionTreesDir,
      DTB_OUTPUT_DIR: outputDir,
    });

    assert.equal(result.status, 0);
    const outputPath = path.join(outputDir, 'internal-example-topic-tree.html');
    assert.ok(fs.existsSync(outputPath));
  } finally {
    fs.rmSync(decisionTreesDir, { recursive: true, force: true });
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('compiler CLI: reports compile error via main catch', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dtb-output-'));
  const templatePath = DEFAULT_RENDERER_TEMPLATE_PATH;
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
