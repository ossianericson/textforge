import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { initSpecRepo } from '../scripts/init-spec-repo.js';

test('initSpecRepo creates CI templates and package scripts', async () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'temp-spec-repo-'));

  try {
    await initSpecRepo({ targetDir: tempDir, provider: 'both' });

    assert.ok(fs.existsSync(path.join(tempDir, '.env.example')));
    assert.ok(fs.existsSync(path.join(tempDir, 'textforge.config.json')));
    assert.equal(fs.existsSync(path.join(tempDir, 'scripts', 'publish-confluence.js')), false);
    assert.ok(fs.existsSync(path.join(tempDir, '.github', 'workflows', 'textforge-publish.yml')));
    assert.ok(fs.existsSync(path.join(tempDir, 'azure-pipelines.yml')));
    assert.ok(fs.existsSync(path.join(tempDir, 'decision-trees', 'public', 'sample', 'spec.md')));

    const packageJson = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    assert.equal(packageJson.scripts?.['spec:validate'], 'npx dtb validate');
    assert.equal(packageJson.scripts?.['spec:compile'], 'npx dtb compile');
    assert.equal(packageJson.scripts?.['spec:publish:confluence'], undefined);
    assert.equal(packageJson.scripts?.['spec:ci'], 'npm run spec:validate && npm run spec:compile');
    assert.ok(packageJson.devDependencies?.textforge);

    const textforgeConfig = JSON.parse(
      fs.readFileSync(path.join(tempDir, 'textforge.config.json'), 'utf8')
    ) as { confluence?: unknown };
    assert.equal(textforgeConfig.confluence, undefined);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
