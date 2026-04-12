import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { compileDecisionTree } from './index.js';
import { compileQuiz } from './quiz-compiler.js';
import {
  buildQuizOutputName,
  buildTopicOutputName,
  listSpecDirectories,
  listTopics,
  parseArgs,
  resolveTopic,
} from './cli-utils.js';
import { getConfig } from '#config';
import { createLogger } from '#logger';

const logger = createLogger({ component: 'compile-all' });

function getQuizRootDir(rootDir: string): string {
  return path.join(rootDir, 'quiz');
}

function getQuizTemplatePath(rootDir: string): string {
  return path.join(rootDir, 'core', 'quiz-template.html');
}

function compileQuizTopic(topic: string): void {
  const config = getConfig();
  const quizRootDir = getQuizRootDir(config.rootDir);

  compileQuiz({
    specPath: path.join(quizRootDir, ...topic.split('/'), 'spec.md'),
    templatePath: getQuizTemplatePath(config.rootDir),
    outputPath: path.join(config.outputDir, buildQuizOutputName(topic)),
  });
}

export function compileAll(templateOverride?: string): void {
  const config = getConfig();
  const decisionTreesDir = config.decisionTreesDir;
  const quizRootDir = getQuizRootDir(config.rootDir);
  const templatePath = templateOverride
    ? path.resolve(templateOverride)
    : (config.templatePathOverride ?? undefined);

  const treeTopics = listTopics(decisionTreesDir);
  const quizTopics = listSpecDirectories(quizRootDir);

  if (!treeTopics.length && !quizTopics.length) {
    logger.error('No content topics found under decision-trees/ or quiz/.', {
      decisionTreesDir,
      quizRootDir,
    });
    process.exit(1);
  }

  treeTopics.forEach((topic) => {
    compileSingle(topic, templatePath);
  });

  quizTopics.forEach((topic) => {
    compileQuizTopic(topic);
  });
}

export function compileSingle(topic: string, templateOverride?: string): void {
  const config = getConfig();
  const decisionTreesDir = config.decisionTreesDir;
  const templatePath = templateOverride
    ? path.resolve(templateOverride)
    : (config.templatePathOverride ?? undefined);
  const resolvedTopic = resolveTopic(decisionTreesDir, topic);

  if (!resolvedTopic) {
    logger.error('Topic not found.', { topic, decisionTreesDir });
    process.exit(1);
  }

  const outputName =
    topic.includes('/') || topic.includes('\\')
      ? buildTopicOutputName(resolvedTopic)
      : `${path.basename(resolvedTopic)}-tree.html`;

  compileDecisionTree({
    specPath: path.join(decisionTreesDir, ...resolvedTopic.split('/'), 'spec.md'),
    outputPath: path.join(config.outputDir, outputName),
    ...(templatePath ? { templatePath } : {}),
  });
}

function main(): void {
  const { values } = parseArgs(process.argv.slice(2));
  if (values.help) {
    logger.info('Usage: node dist/compiler/compile-all.js [--template <template.html>]');
    process.exit(0);
  }

  const templateValue = typeof values.template === 'string' ? values.template : '';
  compileAll(templateValue || undefined);
}

const isDirectRun =
  (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) ||
  process.argv[1]?.endsWith('compile-all.js');

if (isDirectRun) {
  main();
}
