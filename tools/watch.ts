import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import chokidar from 'chokidar';
import { compileDecisionTree } from '#compiler/index';
import { listTopics } from '#compiler/cli-utils';
import { getConfig, type Config } from '#config';
import { createLogger } from '#logger';

const logger = createLogger({ component: 'watch' });
let chalk: typeof import('chalk').default | null = null;

async function loadChalk(): Promise<typeof import('chalk').default> {
  if (chalk) {
    return chalk;
  }
  const mod = await import('chalk');
  chalk = mod.default;
  return chalk;
}

function getChalk(): typeof import('chalk').default {
  if (!chalk) {
    throw new Error('Chalk not loaded.');
  }
  return chalk;
}

function compileTopic(config: Config, topic: string, templatePath: string): void {
  const chalkInstance = getChalk();
  const outputName = topic.startsWith('azure-') ? `${topic}-tree.html` : `azure-${topic}-tree.html`;
  const start = Date.now();
  logger.info(chalkInstance.cyan(`Compiling ${topic}...`), { topic });
  compileDecisionTree({
    specPath: path.join(config.decisionTreesDir, topic, 'spec.md'),
    promptPath: path.join(config.rootDir, 'docs', 'prompts', `${topic}-prompt.md`),
    templatePath,
    outputPath: path.join(config.outputDir, outputName),
  });
  logger.info(chalkInstance.green(`Compiled ${topic} in ${Date.now() - start}ms.`), { topic });
}

function runValidation(): boolean {
  const chalkInstance = getChalk();
  logger.info(chalkInstance.cyan('Validating specs...'));
  try {
    execSync('npm run validate:spec', { stdio: 'inherit' });
    logger.info(chalkInstance.green('Validation passed.'));
    return true;
  } catch {
    logger.error(chalkInstance.red('Validation failed. Fix errors before compiling.'));
    return false;
  }
}

interface PendingBuild {
  all: boolean;
  topics: Set<string>;
}

export async function startWatch(): Promise<void> {
  await loadChalk();
  const config = getConfig();
  const decisionTreesDir = config.decisionTreesDir;
  const coreDir = path.join(config.rootDir, 'core');
  const templatePath = config.templatePath;

  const watcher = chokidar.watch(
    [path.join(decisionTreesDir, '**', 'spec.md'), path.join(coreDir, '**', '*')],
    {
      ignoreInitial: true,
    }
  );

  let debounceTimer: NodeJS.Timeout | null = null;
  let pending: PendingBuild = { all: false, topics: new Set() };

  function scheduleBuild(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      const chalkInstance = getChalk();
      const topics = pending.all ? listTopics(decisionTreesDir) : Array.from(pending.topics);
      pending = { all: false, topics: new Set() };
      if (!topics.length) {
        logger.warn(chalkInstance.yellow('No topics found to compile.'), { decisionTreesDir });
        return;
      }
      if (!runValidation()) {
        return;
      }
      topics.forEach((topic) => compileTopic(config, topic, templatePath));
    }, 300);
  }

  watcher.on('all', (event: string, filePath: string) => {
    if (filePath.startsWith(coreDir)) {
      pending.all = true;
      scheduleBuild();
      return;
    }

    const relative = path.relative(decisionTreesDir, filePath);
    const parts = relative.split(path.sep);
    if (parts.length >= 2 && parts[1] === 'spec.md') {
      const topic = parts[0];
      if (topic) {
        pending.topics.add(topic);
      }
      scheduleBuild();
      return;
    }

    if (event === 'add' || event === 'unlink') {
      pending.all = true;
      scheduleBuild();
    }
  });

  logger.info(getChalk().green('Watching for changes...'), {
    decisionTreesDir,
    coreDir,
  });
}

const isDirectRun =
  (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) ||
  process.argv[1]?.endsWith('watch.js');

if (isDirectRun) {
  startWatch().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
