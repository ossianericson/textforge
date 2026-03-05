import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { compileDecisionTree } from '#compiler/index';
import { makeTempDir, readFile } from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.resolve(__dirname, '..', 'core', 'base-template.html');
const EXAMPLE_SPEC_PATH = path.resolve(
  __dirname,
  '..',
  'decision-trees',
  'example-multicloud-compute',
  'spec.md'
);

test('decision tree output: renders markdown formatting as HTML', () => {
  const tempDir = makeTempDir();
  const outputPath = path.join(tempDir, 'example-multicloud-compute-output.html');

  compileDecisionTree({
    specPath: EXAMPLE_SPEC_PATH,
    templatePath: TEMPLATE_PATH,
    outputPath,
  });

  const html = readFile(outputPath);
  assert.ok(
    html.includes('<strong>Reality check:</strong>') ||
      html.includes('<strong>Reality check:<\\/strong>')
  );
  assert.ok(!html.includes('&lt;strong&gt;Reality check:&lt;/strong&gt;'));
});
