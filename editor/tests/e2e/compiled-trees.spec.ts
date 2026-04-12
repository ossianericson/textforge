import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'output');

function fileUrl(name: string): string {
  return `file://${path.join(OUTPUT_DIR, name)}`;
}

test.describe('public example tree', () => {
  const htmlFile = 'public-example-multicloud-compute-tree.html';

  test('page loads and shows first question', async ({ page }) => {
    if (!fs.existsSync(path.join(OUTPUT_DIR, htmlFile))) {
      test.skip();
      return;
    }

    await page.goto(fileUrl(htmlFile));
    await expect(page.locator('.question-card:not([hidden]) .question-title').first()).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveTitle(/.+/);
  });

  test('clicking first option advances the tree', async ({ page }) => {
    if (!fs.existsSync(path.join(OUTPUT_DIR, htmlFile))) {
      test.skip();
      return;
    }

    await page.goto(fileUrl(htmlFile));
    const firstOption = page.locator('.question-card:not([hidden]) .option-btn').first();
    await expect(firstOption).toBeVisible({ timeout: 5000 });
    await firstOption.click();
    await page.waitForTimeout(300);
    await expect(page.locator('[role="progressbar"]').first()).toBeVisible({ timeout: 3000 });
  });

  test('tree reaches a result card within 20 clicks', async ({ page }) => {
    if (!fs.existsSync(path.join(OUTPUT_DIR, htmlFile))) {
      test.skip();
      return;
    }

    await page.goto(fileUrl(htmlFile));

    for (let index = 0; index < 20; index += 1) {
      const result = page.locator('.result-card:not([hidden])').first();
      if (await result.isVisible().catch(() => false)) {
        break;
      }

      const option = page.locator('.question-card:not([hidden]) .option-btn').first();
      if (!(await option.isVisible().catch(() => false))) {
        break;
      }

      await option.click();
      await page.waitForTimeout(200);
    }

    await expect(page.locator('.result-card:not([hidden])').first()).toBeVisible({ timeout: 3000 });
  });
});