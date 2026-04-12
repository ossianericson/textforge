import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createParsers } from '#compiler/parsers/factory';
import { compileDecisionTree, compileParsedDecisionTree } from '#compiler/index';
import { specToDoc } from '../editor/src/lib/spec-to-doc.ts';
import { docToSpec } from '../editor/src/lib/doc-to-spec.ts';
import { serialize } from '../editor/src/lib/serializer.ts';

test('editor parsed-spec compile matches direct CLI compile for public multicloud example', () => {
  const specPath = path.resolve('decision-trees/public/example-multicloud-compute/spec.md');
  const raw = fs.readFileSync(specPath, 'utf8');
  const lines = raw.split('\n');
  const parsers = createParsers();
  const indices = parsers.findSectionIndices(lines);
  const parsedSpec = {
    title: parsers.parseTitle(lines, indices.flowStart),
    metadata: parsers.parseSpecMetadata(lines, indices.flowStart),
    progressSteps: parsers.parseProgressSteps(lines, indices.progressStart),
    questions: parsers.parseQuestions(lines, indices.flowStart, indices.resultStart),
    results: parsers.parseResults(lines, indices.resultStart, lines.length),
  };

  const roundTripped = docToSpec(specToDoc(parsedSpec), parsedSpec);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'textforge-editor-parity-'));
  const originalOutputPath = path.join(tempDir, 'original.html');
  const parsedOutputPath = path.join(tempDir, 'parsed.html');

  compileDecisionTree({ specPath, outputPath: originalOutputPath });
  compileParsedDecisionTree({
    specPath,
    parsedSpec: roundTripped,
    outputPath: parsedOutputPath,
  });

  assert.equal(
    fs.readFileSync(parsedOutputPath, 'utf8'),
    fs.readFileSync(originalOutputPath, 'utf8')
  );
});

test('editor serialized markdown preserves option routes and matches CLI compile output', () => {
  const specSource = [
    '# Serializer Parity Decision Tree - Specification',
    '',
    '**Version:** v1.0',
    '---',
    '',
    '## Requirements and Standards',
    '',
    '### Title',
    '',
    '**Main:** "Serializer Parity Decision Tree"',
    '**Subtitle:** "Buttons should compile the same from UI and CLI"',
    '',
    '---',
    '',
    '## Decision Tree Flow',
    '',
    '### Q1: Start here (id="q1")',
    '**Title**: "Start here"',
    '**Subtitle**: "Choose a route"',
    '**Options**:',
    '',
    '1. "Primary path" → go to q2 (recommended)',
    '2. "Fallback path" → result: result-fallback (advanced)',
    '',
    '---',
    '',
    '### Q2: Continue (id="q2")',
    '**Title**: "Continue"',
    '**Subtitle**: "Keep going"',
    '**Options**:',
    '',
    '1. "Finish" → result: result-primary',
    '',
    '---',
    '',
    '## Result Cards (2 Services)',
    '',
    '#### 1. Choose Primary Path (result-primary)',
    '',
    '- Icon: check',
    '- Badge: Primary (primary)',
    '',
    '**Best For:**',
    '',
    '▸ Standard journeys',
    '',
    '**Key Benefits:**',
    '',
    '▸ Preserves expected routing',
    '',
    '**Considerations:**',
    '',
    '▸ Review before rollout',
    '',
    '**When NOT to use:**',
    '',
    '▸ When a custom branch is required',
    '',
    '**Tech Tags:** parity, buttons',
    '',
    '**Additional Considerations:** Use the primary path when possible.',
    '',
    '---',
    '',
    '#### 2. Choose Fallback Path (result-fallback)',
    '',
    '- Icon: alert',
    '- Badge: Fallback (fallback)',
    '',
    '**Best For:**',
    '',
    '▸ Exceptional cases',
    '',
    '**Key Benefits:**',
    '',
    '▸ Handles edge conditions',
    '',
    '**Considerations:**',
    '',
    '▸ May require manual review',
    '',
    '**When NOT to use:**',
    '',
    '▸ When the primary route is available',
    '',
    '**Tech Tags:** parity, fallback',
    '',
    '**Additional Considerations:** Keep this branch available for safety.',
    '',
    '---',
    '',
    '## Progress Steps',
    '',
    '```javascript',
    'const progressSteps = {',
    '  q1: 0,',
    '  q2: 60,',
    '  result: 100,',
    '};',
    '```',
    '',
  ].join('\n');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'textforge-editor-serialized-parity-'));
  const specPath = path.join(tempDir, 'input.md');
  const serializedSpecPath = path.join(tempDir, 'ui-roundtrip.md');
  const cliOutputPath = path.join(tempDir, 'cli.html');
  const uiOutputPath = path.join(tempDir, 'ui.html');

  fs.writeFileSync(specPath, specSource, 'utf8');

  const lines = specSource.split('\n');
  const parsers = createParsers();
  const indices = parsers.findSectionIndices(lines);
  const parsedSpec = {
    title: parsers.parseTitle(lines, indices.flowStart),
    metadata: parsers.parseSpecMetadata(lines, indices.flowStart),
    progressSteps: parsers.parseProgressSteps(lines, indices.progressStart),
    questions: parsers.parseQuestions(lines, indices.flowStart, indices.resultStart),
    results: parsers.parseResults(lines, indices.resultStart, lines.length),
  };

  const roundTripped = docToSpec(specToDoc(parsedSpec), parsedSpec);
  const serialized = serialize(roundTripped);
  fs.writeFileSync(serializedSpecPath, serialized, 'utf8');

  assert.match(serialized, /1\. "Primary path" → go to q2 \(recommended\)/);
  assert.match(serialized, /2\. "Fallback path" → result: result-fallback \(advanced\)/);

  const serializedLines = serialized.split('\n');
  const serializedIndices = parsers.findSectionIndices(serializedLines);
  const reparsed = parsers.parseQuestions(
    serializedLines,
    serializedIndices.flowStart,
    serializedIndices.resultStart
  );

  assert.deepEqual(reparsed.q1?.options, parsedSpec.questions.q1?.options);
  assert.deepEqual(reparsed.q2?.options, parsedSpec.questions.q2?.options);

  compileDecisionTree({ specPath, outputPath: cliOutputPath });
  compileDecisionTree({ specPath: serializedSpecPath, outputPath: uiOutputPath });

  assert.equal(fs.readFileSync(uiOutputPath, 'utf8'), fs.readFileSync(cliOutputPath, 'utf8'));
});