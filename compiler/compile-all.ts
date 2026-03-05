import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { compileDecisionTree } from './index.js';
import { listTopics, parseArgs } from './cli-utils.js';
import { getConfig } from '#config';
import { createLogger } from '#logger';

const logger = createLogger({ component: 'compile-all' });

export function compileAll(templateOverride?: string): void {
  const config = getConfig();
  const decisionTreesDir = config.decisionTreesDir;
  const templatePath = templateOverride ? path.resolve(templateOverride) : config.templatePath;

  const topics = listTopics(decisionTreesDir);
  if (!topics.length) {
    logger.error('No decision tree topics found under decision-trees/.', { decisionTreesDir });
    process.exit(1);
  }

  topics.forEach((topic) => {
    compileSingle(topic, templatePath);
  });
}

export function compileSingle(topic: string, templateOverride?: string): void {
  const config = getConfig();
  const decisionTreesDir = config.decisionTreesDir;
  const templatePath = templateOverride ? path.resolve(templateOverride) : config.templatePath;
  const outputName = `${topic}-tree.html`;

  compileDecisionTree({
    specPath: path.join(decisionTreesDir, topic, 'spec.md'),
    templatePath,
    outputPath: path.join(config.outputDir, outputName),
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
