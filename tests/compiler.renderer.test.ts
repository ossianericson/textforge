import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { compileDecisionTree } from '#compiler/index';
import { makeTempDir, readFile, writeFile } from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf8');
}

test('Decision Tree Compiler: topic render config selects copy-first renderer', () => {
  const tempDir = makeTempDir();
  const topicDir = path.join(tempDir, 'copy-first-topic');
  fs.mkdirSync(topicDir, { recursive: true });
  const specPath = writeFile(topicDir, 'spec.md', readFixture('spec-valid.md'));
  writeFile(topicDir, 'render.json', JSON.stringify({ renderer: 'html/copy-first-v1' }));
  const outputPath = path.join(tempDir, 'output.html');

  compileDecisionTree({
    specPath,
    outputPath,
  });

  const html = readFile(outputPath);
  assert.ok(html.includes('const renderOptions = {'));
  assert.ok(html.includes('"showDocsSection": false'));
  assert.ok(html.includes('"showDocsButton": false'));
  assert.ok(html.includes('"showCopyLinkButton": false'));
  assert.ok(html.includes('"showContactSection": true'));
});

test('Decision Tree Compiler: render options can hide shared result sections', () => {
  const tempDir = makeTempDir();
  const topicDir = path.join(tempDir, 'options-topic');
  fs.mkdirSync(topicDir, { recursive: true });
  const specPath = writeFile(topicDir, 'spec.md', readFixture('spec-valid.md'));
  writeFile(
    topicDir,
    'render.json',
    JSON.stringify({
      renderer: 'html/default-v1',
      options: {
        showDocsSection: false,
        showDocsButton: false,
        showCopyLinkButton: false,
        showContactSection: false,
      },
    })
  );
  const outputPath = path.join(tempDir, 'output.html');

  compileDecisionTree({
    specPath,
    outputPath,
  });

  const html = readFile(outputPath);
  assert.ok(html.includes('const renderOptions = {'));
  assert.ok(html.includes('"showDocsSection": false'));
  assert.ok(html.includes('"showDocsButton": false'));
  assert.ok(html.includes('"showCopyLinkButton": false'));
  assert.ok(html.includes('"showContactSection": false'));
});

test('Decision Tree Compiler: default-v2 renderer exposes advanced feature flags', () => {
  const tempDir = makeTempDir();
  const topicDir = path.join(tempDir, 'advanced-topic');
  fs.mkdirSync(topicDir, { recursive: true });
  const specPath = writeFile(topicDir, 'spec.md', readFixture('spec-valid.md'));
  writeFile(topicDir, 'render.json', JSON.stringify({ renderer: 'html/default-v2' }));
  const outputPath = path.join(tempDir, 'output.html');

  compileDecisionTree({
    specPath,
    outputPath,
  });

  const html = readFile(outputPath);
  assert.ok(html.includes('"enableInlineTooltips": true'));
  assert.ok(html.includes('"enableExpertToggle": true'));
  assert.ok(html.includes('"enableVersionWatermark": true'));
  assert.ok(html.includes('"enableFeedback": true'));
  assert.ok(html.includes('"enableMobileCardUi": true'));
  assert.ok(html.includes('const metadata = {'));
});
