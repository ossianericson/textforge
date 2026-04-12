import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: `file://${REPO_ROOT}/output/`,
    headless: true,
    screenshot: 'only-on-failure',
  },
  reporter: [['list'], ['json', { outputFile: 'playwright-results.json' }]],
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
