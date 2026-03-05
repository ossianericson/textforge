import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

function listHtmlFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((name) => name.toLowerCase().endsWith('.html'))
    .map((name) => path.join(dirPath, name));
}

test('output html: no escaped formatting tags', () => {
  const outputDir = path.join(ROOT_DIR, 'output');
  const productionDir = path.join(ROOT_DIR, 'output', 'production');
  const files = [...listHtmlFiles(outputDir), ...listHtmlFiles(productionDir)].filter(
    (filePath) => !filePath.endsWith(path.join('output', 'production'))
  );

  assert.ok(files.length > 0, 'Expected HTML outputs to be present.');

  const offenders: string[] = [];
  const pattern = /&lt;\/?(strong|em|code)&gt;/i;

  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    if (pattern.test(content)) {
      offenders.push(path.relative(ROOT_DIR, filePath));
    }
  });

  assert.equal(
    offenders.length,
    0,
    `Escaped formatting tags found in: ${offenders.join(', ')}`
  );
});
