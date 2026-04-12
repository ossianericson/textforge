import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'decision-tree-'));
}

function writeFile(dir: string, name: string, contents: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, contents, 'utf8');
  return filePath;
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

export { makeTempDir, readFile, writeFile };
