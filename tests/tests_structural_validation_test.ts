import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import type { ParsedSpec } from '#compiler/types';
import { __testUtils, compileDecisionTree } from '#compiler/index';
import { makeTempDir, writeFile } from './helpers.js';
import { DEFAULT_RENDERER_TEMPLATE_PATH } from './templatePaths.js';

function buildPrompt(): string {
  return `COMPILER INPUT\n\n**Badge Colors:**\n\`\`\`css\n.badge.test { background: #3b82f6; }\n\`\`\`\n`;
}

function buildResultBlock(id: string, title: string): string {
  return [
    `#### 1. ${title} (${id})`,
    '',
    '- Icon: test',
    '- Badge: Test (blue)',
    '',
    '**Best For:**',
    '',
    '- Example use case',
    '',
    '**Key Benefits:**',
    '',
    '- Example benefit',
    '',
    '**Considerations:**',
    '',
    '- Example consideration',
    '',
    '**When NOT to use:**',
    '',
    '- Example scenario',
    '',
    '**Tech Tags:** Tag1',
    '',
    '**Docs:** https://example.com',
    '',
    '**Additional Considerations:**',
    'Use for validation tests only.',
    '',
    '---',
  ].join('\n');
}

function compileSpec(specContent: string): unknown {
  const tempDir = makeTempDir();
  const specPath = writeFile(tempDir, 'spec.md', specContent);
  const promptPath = writeFile(tempDir, 'prompt.md', buildPrompt());
  const outputPath = path.join(tempDir, 'output.html');

  try {
    compileDecisionTree({
      specPath,
      promptPath,
      templatePath: DEFAULT_RENDERER_TEMPLATE_PATH,
      outputPath,
    });
    return null;
  } catch (error) {
    return error;
  }
}

test('Structural validation: warns when a question is unreachable from the root', () => {
  const spec = `# Decision Tree

**Main:** "Structural Validation"
**Subtitle:** "Unreachable question"

## Decision Tree Flow

### Q1: Entry (id="q1")

**Title**: "Choose"
**Subtitle**: "Start"
**Options**:

1. "Continue" → result: result-live

---

### Q2: Detached (id="q2")

**Title**: "Detached"
**Subtitle**: "Never reached"
**Options**:

1. "Finish" → result: result-live

---

## Result Cards (1 Services)

${buildResultBlock('result-live', 'Live Result')}

## Progress Steps

\`\`\`javascript
const progressSteps = {
  q1: 0,
  q2: 50,
  result: 100,
};
\`\`\`
`;

  const caught = compileSpec(spec) as { code?: string; message?: string } | null;
  assert.ok(caught, 'Expected compilation to fail');
  assert.equal(caught.code, 'DTB-006');
  assert.match(caught.message ?? '', /Question "q2" is unreachable from the root question\./);
});

test('Structural validation: warns when a result is unreachable from all questions', () => {
  const spec = `# Decision Tree

**Main:** "Structural Validation"
**Subtitle:** "Unreachable result"

## Decision Tree Flow

### Q1: Entry (id="q1")

**Title**: "Choose"
**Subtitle**: "Start"
**Options**:

1. "Continue" → result: result-live

---

## Result Cards (2 Services)

${buildResultBlock('result-live', 'Live Result')}

${buildResultBlock('result-unused', 'Unused Result')}

## Progress Steps

\`\`\`javascript
const progressSteps = {
  q1: 0,
  result: 100,
};
\`\`\`
`;

  const caught = compileSpec(spec) as { code?: string; message?: string } | null;
  assert.ok(caught, 'Expected compilation to fail');
  assert.equal(caught.code, 'DTB-006');
  assert.match(
    caught.message ?? '',
    /Result "result-unused" is unreachable — no path leads to it\./
  );
});

test('Structural validation: warns when a reachable question strands the user', () => {
  const parsed: ParsedSpec = {
    title: { main: 'Structural Validation', subtitle: 'Stranded question' },
    questions: {
      q1: {
        title: 'Entry',
        subtitle: 'Start',
        infoBox: null,
        type: 'buttons',
        options: [{ text: 'Continue', next: 'q2', recommended: false, advanced: false }],
      },
      q2: {
        title: 'Dead End',
        subtitle: 'No exits',
        infoBox: null,
        type: 'buttons',
        options: [],
      },
    },
    results: {
      'result-live': {
        title: 'Live Result',
        icon: 'test',
        badge: { text: 'Test', className: 'blue' },
        bestFor: ['Example use case'],
        keyBenefits: ['Example benefit'],
        considerations: ['Example consideration'],
        whenNotToUse: ['Example scenario'],
        techTags: ['Tag1'],
        docs: [{ label: 'Documentation', url: 'https://example.com' }],
        additionalConsiderations: 'Use for validation tests only.',
      },
    },
    progressSteps: { q1: 0, q2: 50, result: 100 },
  };

  const warnings = __testUtils.detectDeadEnds(parsed);
  assert.match(
    warnings.join('\n'),
    /Question "q2" has no navigation targets — users will be stranded here\./
  );
});

test('Structural validation: falls back to q1 when multiple root candidates exist', () => {
  const spec = `# Decision Tree

**Main:** "Structural Validation"
**Subtitle:** "q1 root fallback"

## Decision Tree Flow

### Q1: Entry (id="q1")

**Title**: "Choose"
**Subtitle**: "Real root"
**Options**:

1. "Continue" → result: result-live

---

### Q2: Detached root (id="q2")

**Title**: "Detached"
**Subtitle**: "Should stay unreachable"
**Options**:

1. "Finish" → result: result-live

---

## Result Cards (1 Services)

${buildResultBlock('result-live', 'Live Result')}

## Progress Steps

\`\`\`javascript
const progressSteps = {
  q1: 0,
  q2: 50,
  result: 100,
};
\`\`\`
`;

  const caught = compileSpec(spec) as { code?: string; message?: string } | null;
  assert.ok(caught, 'Expected compilation to fail');
  assert.equal(caught.code, 'DTB-006');
  assert.match(caught.message ?? '', /Question "q2" is unreachable from the root question\./);
});
