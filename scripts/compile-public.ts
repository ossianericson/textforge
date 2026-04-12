import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileDecisionTree } from '../compiler/index.js';
import { compileQuiz } from '../compiler/quiz-compiler.js';
import { getConfig } from '../config.js';

function getRootDir(): string {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  return path.basename(path.dirname(scriptDir)) === 'dist'
    ? path.resolve(scriptDir, '..', '..')
    : path.resolve(scriptDir, '..');
}

function main(): void {
  const rootDir = getRootDir();
  const config = getConfig();

  compileDecisionTree({
    specPath: path.join(
      rootDir,
      'decision-trees',
      'public',
      'example-multicloud-compute',
      'spec.md'
    ),
    outputPath: path.join(config.outputDir, 'example-multicloud-compute-tree.html'),
  });

  compileDecisionTree({
    specPath: path.join(rootDir, 'decision-trees', 'public', 'example-advanced-inputs', 'spec.md'),
    outputPath: path.join(config.outputDir, 'example-advanced-inputs-tree.html'),
  });

  compileQuiz({
    specPath: path.join(rootDir, 'quiz', 'public', 'example', 'azure-fundamentals', 'spec.md'),
    templatePath: path.join(rootDir, 'core', 'quiz-template.html'),
    outputPath: path.join(config.outputDir, 'example-azure-fundamentals-quiz.html'),
  });

  process.stdout.write('Compiled public decision tree examples and public quiz examples.\n');
}

main();
