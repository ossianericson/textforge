import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { compileDecisionTree } from '#compiler/index';
import { makeTempDir, readFile } from './helpers.js';
import { DEFAULT_RENDERER_TEMPLATE_PATH } from './templatePaths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKDOWN_SPEC_PATH = path.resolve(__dirname, 'fixtures', 'spec-markdown-format.md');

test('compiler output: renders markdown formatting as HTML', () => {
  const tempDir = makeTempDir();
  const outputPath = path.join(tempDir, 'markdown-format-output.html');

  compileDecisionTree({
    specPath: MARKDOWN_SPEC_PATH,
    templatePath: DEFAULT_RENDERER_TEMPLATE_PATH,
    outputPath,
  });

  const html = readFile(outputPath);
  assert.ok(
    html.includes('<strong>Bold guidance</strong>') ||
      html.includes('<strong>Bold guidance<\\/strong>')
  );
  assert.ok(!html.includes('&lt;strong&gt;Bold guidance&lt;/strong&gt;'));
});
