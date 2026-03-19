import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { loadTopicRenderConfig, resolveRendererTemplatePath } from '#compiler/renderers/registry';
import { makeTempDir, writeFile } from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

test('renderer registry: defaults to html/default-v1 when render.json is missing', () => {
  const tempDir = makeTempDir();
  const specDir = path.join(tempDir, 'topic-a');
  fs.mkdirSync(specDir, { recursive: true });
  const specPath = writeFile(specDir, 'spec.md', '# Test');

  const config = loadTopicRenderConfig(specPath);

  assert.equal(config.renderer, 'html/default-v1');
  assert.deepEqual(config.options, {
    showDocsSection: true,
    showDocsButton: true,
    showCopyLinkButton: true,
    showContactSection: true,
  });
});

test('renderer registry: loads renderer from render.json and merges renderer defaults', () => {
  const tempDir = makeTempDir();
  const specDir = path.join(tempDir, 'topic-b');
  fs.mkdirSync(specDir, { recursive: true });
  const specPath = writeFile(specDir, 'spec.md', '# Test');
  writeFile(
    specDir,
    'render.json',
    JSON.stringify({ renderer: 'html/copy-first-v1', options: { showContactSection: false } })
  );

  const config = loadTopicRenderConfig(specPath);

  assert.equal(config.renderer, 'html/copy-first-v1');
  assert.deepEqual(config.options, {
    showDocsSection: false,
    showDocsButton: false,
    showCopyLinkButton: false,
    showContactSection: false,
  });
});

test('renderer registry: resolves registered renderer template paths', () => {
  const templatePath = resolveRendererTemplatePath('html/default-v1', ROOT_DIR);

  assert.ok(templatePath.endsWith(path.join('renderers', 'html', 'default-v1', 'template.html')));
});

test('renderer registry: resolves reference renderer template paths', () => {
  const templatePath = resolveRendererTemplatePath('html/reference-v1', ROOT_DIR);

  assert.ok(templatePath.endsWith(path.join('renderers', 'html', 'default-v1', 'template.html')));
});

test('renderer registry: copy-first shares the default-v1 template shell', () => {
  const templatePath = resolveRendererTemplatePath('html/copy-first-v1', ROOT_DIR);

  assert.ok(templatePath.endsWith(path.join('renderers', 'html', 'default-v1', 'template.html')));
});

test('renderer registry: rejects invalid render option types', () => {
  const tempDir = makeTempDir();
  const specDir = path.join(tempDir, 'topic-c');
  fs.mkdirSync(specDir, { recursive: true });
  const specPath = writeFile(specDir, 'spec.md', '# Test');
  writeFile(
    specDir,
    'render.json',
    JSON.stringify({
      renderer: 'html/copy-first-v1',
      options: { showCopyLinkButton: 'no' },
    })
  );

  assert.throws(() => loadTopicRenderConfig(specPath), /Invalid render config/);
});
