import fs from 'node:fs';
import path from 'node:path';
import { parseArgs as parseArgsNative } from 'node:util';

type ParsedArgs = ReturnType<typeof parseArgsNative>;

function parseArgs(argv: string[]): ParsedArgs {
  const { values, positionals } = parseArgsNative({
    args: argv,
    allowPositionals: true,
    options: {
      spec: { type: 'string' },
      template: { type: 'string' },
      output: { type: 'string' },
      topic: { type: 'string' },
      help: { type: 'boolean' },
    },
    strict: true,
  });

  return { values, positionals } as ParsedArgs;
}

function listTopics(decisionTreesDir: string): string[] {
  if (!fs.existsSync(decisionTreesDir)) {
    return [];
  }

  return fs
    .readdirSync(decisionTreesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(decisionTreesDir, name, 'spec.md')));
}

export { listTopics, parseArgs };
