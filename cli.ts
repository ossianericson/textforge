#!/usr/bin/env node

import path from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    topic: { type: 'string', short: 't' },
    fix: { type: 'boolean', default: false },
    watch: { type: 'boolean', short: 'w', default: false },
    help: { type: 'boolean', short: 'h', default: false },
    mode: { type: 'string' },
    spec: { type: 'string' },
    template: { type: 'string' },
    output: { type: 'string' },
  },
});

const command = positionals[0] ?? (values.mode ? 'compile' : 'help');

async function run(): Promise<void> {
  switch (command) {
    case 'init': {
      const topic = values.topic ?? positionals[1];
      if (!topic) {
        console.error('Usage: dtb init <topic>');
        process.exit(1);
      }
      const { initTopic } = await import('./scripts/init.js');
      await initTopic(topic);
      break;
    }
    case 'validate': {
      const { runValidation } = await import('./tools/validate-spec.js');
      runValidation({ fix: values.fix ?? false });
      break;
    }
    case 'compile': {
      const mode = typeof values.mode === 'string' ? values.mode.trim().toLowerCase() : 'tree';
      if (mode !== 'tree' && mode !== 'quiz') {
        console.error('Invalid --mode value. Use "tree" or "quiz".');
        process.exit(1);
      }

      if (mode === 'quiz') {
        const specPath = typeof values.spec === 'string' ? values.spec.trim() : '';
        const outputPath = typeof values.output === 'string' ? values.output.trim() : '';
        const templateOverride = typeof values.template === 'string' ? values.template.trim() : '';
        if (!specPath || !outputPath) {
          console.error(
            'Usage: dtb compile --mode quiz --spec <quiz-spec.md> --output <output.html> [--template <quiz-template.html>]'
          );
          process.exit(1);
        }

        const { getConfig } = await import('./config.js');
        const { compileQuiz } = await import('./compiler/quiz-compiler.js');
        const config = getConfig();
        const templatePath = templateOverride
          ? path.resolve(templateOverride)
          : path.join(config.rootDir, 'core', 'quiz-template.html');

        compileQuiz({
          specPath: path.resolve(specPath),
          templatePath,
          outputPath: path.resolve(outputPath),
        });
        break;
      }

      if (values.watch) {
        const { startWatch } = await import('./tools/watch.js');
        await startWatch();
      } else {
        const topic = values.topic ?? positionals[1];
        const { compileAll, compileSingle } = await import('./compiler/compile-all.js');
        topic ? compileSingle(topic) : compileAll();
      }
      break;
    }
    case 'help':
    default:
      printHelp();
  }
}

function printHelp(): void {
  process.stdout.write(`
  textforge CLI

  Commands:
    init <topic>          Scaffold a new spec from template
    validate [--fix]      Validate all spec.md files
    compile [--topic X]   Compile one or all trees
    compile --mode quiz   Compile a quiz spec into HTML
    compile --watch       Watch mode (auto-rebuild)

  Examples:
    dtb init networking
    dtb validate --fix
    dtb compile --topic compute
    dtb compile --watch
    dtb compile --mode quiz --spec quiz/public/example/spec.md --output output/example-quiz.html
  `);
}

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
