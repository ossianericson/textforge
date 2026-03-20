import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import chokidar from 'chokidar';
import { compileDecisionTree } from '#compiler/index';
import { compileQuiz } from '#compiler/quiz-compiler';
import {
  buildQuizOutputName,
  buildTopicOutputName,
  listSpecDirectories,
  listTopics,
} from '#compiler/cli-utils';
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

function compileTopic(config: Config, topic: string, templatePath?: string): void {
  const chalkInstance = getChalk();
  const outputName = buildTopicOutputName(topic);
  const start = Date.now();
  logger.info(chalkInstance.cyan(`Compiling ${topic}...`), { topic });
  compileDecisionTree({
    specPath: path.join(config.decisionTreesDir, ...topic.split('/'), 'spec.md'),
    outputPath: path.join(config.outputDir, outputName),
    ...(templatePath ? { templatePath } : {}),
  });
  logger.info(chalkInstance.green(`Compiled ${topic} in ${Date.now() - start}ms.`), { topic });
}

function compileQuizTopic(config: Config, topic: string): void {
  const chalkInstance = getChalk();
  const outputName = buildQuizOutputName(topic);
  const start = Date.now();
  logger.info(chalkInstance.cyan(`Compiling quiz ${topic}...`), { topic });
  compileQuiz({
    specPath: path.join(config.rootDir, 'quiz', ...topic.split('/'), 'spec.md'),
    templatePath: path.join(config.rootDir, 'core', 'quiz-template.html'),
    outputPath: path.join(config.outputDir, outputName),
  });
  logger.info(chalkInstance.green(`Compiled quiz ${topic} in ${Date.now() - start}ms.`), {
    topic,
  });
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
  treeTopics: Set<string>;
  quizTopics: Set<string>;
}

export async function startWatch(): Promise<void> {
  await loadChalk();
  const config = getConfig();
  const decisionTreesDir = config.decisionTreesDir;
  const quizDir = path.join(config.rootDir, 'quiz');
  const coreDir = path.join(config.rootDir, 'core');
  const renderersDir = path.join(config.rootDir, 'renderers');
  const templatePath = config.templatePathOverride ?? undefined;

  const watcher = chokidar.watch(
    [
      path.join(decisionTreesDir, '**', 'spec.md'),
      path.join(decisionTreesDir, '**', 'render.json'),
      path.join(quizDir, '**', 'spec.md'),
      path.join(coreDir, '**', '*'),
      path.join(renderersDir, '**', '*'),
    ],
    {
      ignoreInitial: true,
    }
  );

  let debounceTimer: NodeJS.Timeout | null = null;
  let pending: PendingBuild = { all: false, treeTopics: new Set(), quizTopics: new Set() };

  function scheduleBuild(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      const chalkInstance = getChalk();
      const treeTopics = pending.all
        ? listTopics(decisionTreesDir)
        : Array.from(pending.treeTopics);
      const quizTopics = pending.all
        ? listSpecDirectories(quizDir)
        : Array.from(pending.quizTopics);
      pending = { all: false, treeTopics: new Set(), quizTopics: new Set() };
      if (!treeTopics.length && !quizTopics.length) {
        logger.warn(chalkInstance.yellow('No topics found to compile.'), {
          decisionTreesDir,
          quizDir,
        });
        return;
      }
      if (!runValidation()) {
        return;
      }
      treeTopics.forEach((topic) => compileTopic(config, topic, templatePath));
      quizTopics.forEach((topic) => compileQuizTopic(config, topic));
    }, 300);
  }

  watcher.on('all', (event: string, filePath: string) => {
    if (filePath.startsWith(coreDir) || filePath.startsWith(renderersDir)) {
      pending.all = true;
      scheduleBuild();
      return;
    }

    if (filePath.startsWith(decisionTreesDir)) {
      const relative = path.relative(decisionTreesDir, filePath);
      const normalized = relative.split(path.sep).join('/');
      if (normalized.endsWith('/spec.md')) {
        const topic = normalized.slice(0, -'/spec.md'.length);
        if (topic) {
          pending.treeTopics.add(topic);
        }
        scheduleBuild();
        return;
      }

      if (normalized.endsWith('/render.json')) {
        const topic = normalized.slice(0, -'/render.json'.length);
        if (topic) {
          pending.treeTopics.add(topic);
        }
        scheduleBuild();
        return;
      }
    }

    if (filePath.startsWith(quizDir)) {
      const relative = path.relative(quizDir, filePath);
      const normalized = relative.split(path.sep).join('/');
      if (normalized.endsWith('/spec.md')) {
        const topic = normalized.slice(0, -'/spec.md'.length);
        if (topic) {
          pending.quizTopics.add(topic);
        }
        scheduleBuild();
        return;
      }
    }

    if (event === 'add' || event === 'unlink') {
      pending.all = true;
      scheduleBuild();
    }
  });

  logger.info(getChalk().green('Watching for changes...'), {
    decisionTreesDir,
    quizDir,
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
