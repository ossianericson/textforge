#!/usr/bin/env npx tsx

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const TESTS_DIR = path.join(ROOT_DIR, 'tests');
const EXCLUDED_FILES = new Set(['compiler-snapshots.test.ts']);

const testFiles = fs
  .readdirSync(TESTS_DIR)
  .filter((entry) => entry.endsWith('.test.ts') && !EXCLUDED_FILES.has(entry))
  .map((entry) => path.join('tests', entry));

if (testFiles.length === 0) {
  console.error('No shared Node test files found.');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ['--test', '--import', 'tsx', '--conditions=development', ...testFiles],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV ?? 'test',
    },
  }
);

process.exit(result.status ?? 1);
