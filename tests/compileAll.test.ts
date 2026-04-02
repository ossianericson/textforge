import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { writeFile } from './helpers.js';

const compileAllPath = path.resolve(process.cwd(), 'dist', 'compiler', 'compile-all.js');

const MINIMAL_SPEC = `# Decision Tree

**Main:** "Compile All Test Tree"
**Subtitle:** "Shared compile coverage"

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

- Compile coverage

**Key Benefits:**

- Exercises the all-content path

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

function runCompileAll(envOverrides: Record<string, string> = {}) {
  return spawnSync(process.execPath, [compileAllPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      LOG_LEVEL: 'info',
      LOG_FORMAT: 'text',
      ...envOverrides,
    },
  });
}

test('compile-all builds decision tree topics and discovered quiz outputs', () => {
  const decisionTreesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'textforge-topics-'));
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'textforge-output-'));

  try {
    const topicDir = path.join(decisionTreesDir, 'internal', 'example-topic');
    fs.mkdirSync(topicDir, { recursive: true });
    writeFile(topicDir, 'spec.md', MINIMAL_SPEC);

    const result = runCompileAll({
      DTB_DECISION_TREES_DIR: decisionTreesDir,
      DTB_OUTPUT_DIR: outputDir,
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(fs.existsSync(path.join(outputDir, 'internal-example-topic-tree.html')));
    assert.ok(fs.existsSync(path.join(outputDir, 'public-example-azure-fundamentals-quiz.html')));
  } finally {
    fs.rmSync(decisionTreesDir, { recursive: true, force: true });
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});
