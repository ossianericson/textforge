import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

function outputPath(fileName: string): string {
  return join(REPO_ROOT, 'output', fileName);
}

describe('Compiler HTML output - snapshot baselines', () => {
  const cases = ['public-example-multicloud-compute-tree.html'];

  for (const fileName of cases) {
    it(`${fileName} remains stable`, () => {
      const compiledPath = outputPath(fileName);
      if (!existsSync(compiledPath)) {
        console.warn(`Output not found: ${compiledPath} - run npm run compile first`);
        return;
      }

      const html = readFileSync(compiledPath, 'utf8');
      const normalized = html.replace(
        /<!--\s*Generated:.*?-->/gs,
        '<!-- Generated: [timestamp] -->'
      );

      expect(normalized).toMatchSnapshot();
    });
  }
});
