import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, '..', 'config.js');

type ConfigModule = { getConfig: () => ReturnType<(typeof import('../config.js'))['getConfig']> };

function loadConfigModule(): Promise<ConfigModule> {
  const moduleUrl = pathToFileURL(CONFIG_PATH).href;
  return import(`${moduleUrl}?cacheBust=${Math.random()}`) as Promise<ConfigModule>;
}

function withEnv(
  overrides: Record<string, string>,
  run: () => Promise<void> | void
): Promise<void> {
  const previous: Record<string, string | undefined> = {};
  Object.keys(overrides).forEach((key) => {
    previous[key] = process.env[key];
  });
  Object.assign(process.env, overrides);
  return Promise.resolve()
    .then(run)
    .finally(() => {
      Object.keys(overrides).forEach((key) => {
        if (previous[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = previous[key];
        }
      });
    });
}

test('config: uses defaults when env vars are empty', async () => {
  await withEnv(
    {
      DTB_DECISION_TREES_DIR: '   ',
      DTB_OUTPUT_DIR: '',
      DTB_TEMPLATE_PATH: '',
      DTB_BADGE_PATH: '',
    },
    async () => {
      const { getConfig } = await loadConfigModule();
      const config = getConfig();

      assert.ok(config.decisionTreesDir.endsWith(path.join('decision-trees')));
      assert.ok(config.outputDir.endsWith(path.join('output')));
      assert.ok(config.templatePath.endsWith(path.join('core', 'base-template.html')));
      assert.ok(config.badgePath.endsWith(path.join('core', 'badges.yml')));

      const configAgain = getConfig();
      assert.equal(configAgain, config);
    }
  );
});

test('config: uses env overrides when set', async () => {
  const custom = {
    DTB_DECISION_TREES_DIR: path.join('C:', 'temp', 'trees'),
    DTB_OUTPUT_DIR: path.join('C:', 'temp', 'output'),
    DTB_TEMPLATE_PATH: path.join('C:', 'temp', 'template.html'),
    DTB_BADGE_PATH: path.join('C:', 'temp', 'badges.yml'),
  };

  await withEnv(custom, async () => {
    const { getConfig } = await loadConfigModule();
    const config = getConfig();

    assert.equal(config.decisionTreesDir, custom.DTB_DECISION_TREES_DIR);
    assert.equal(config.outputDir, custom.DTB_OUTPUT_DIR);
    assert.equal(config.templatePath, custom.DTB_TEMPLATE_PATH);
    assert.equal(config.badgePath, custom.DTB_BADGE_PATH);
  });
});

test('config: throws on dotenv error in production', async () => {
  const cwd = process.cwd();
  const tempDir = fs.mkdtempSync(path.join(cwd, 'temp-env-'));

  try {
    fs.mkdirSync(path.join(tempDir, '.env'));
    process.chdir(tempDir);

    await withEnv({ NODE_ENV: 'production' }, async () => {
      const { getConfig } = await loadConfigModule();
      assert.throws(() => getConfig(), /Failed to load \.env/);
    });
  } finally {
    process.chdir(cwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
