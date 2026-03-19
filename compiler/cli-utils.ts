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

function normalizeTopicPath(topicPath: string): string {
  return topicPath.split(path.sep).join('/');
}

function findSpecDirectories(rootDir: string, currentDir: string = rootDir): string[] {
  if (!fs.existsSync(currentDir)) {
    return [];
  }

  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const directories: string[] = [];

  entries.forEach((entry) => {
    if (!entry.isDirectory()) {
      return;
    }

    const fullPath = path.join(currentDir, entry.name);
    const specPath = path.join(fullPath, 'spec.md');
    if (fs.existsSync(specPath)) {
      directories.push(normalizeTopicPath(path.relative(rootDir, fullPath)));
      return;
    }

    directories.push(...findSpecDirectories(rootDir, fullPath));
  });

  return directories;
}

function listTopics(decisionTreesDir: string): string[] {
  if (!fs.existsSync(decisionTreesDir)) {
    return [];
  }

  return findSpecDirectories(decisionTreesDir).sort((left, right) => left.localeCompare(right));
}

function resolveTopic(decisionTreesDir: string, topic: string): string | null {
  const normalizedTopic = normalizeTopicPath(topic.trim());
  if (!normalizedTopic) {
    return null;
  }

  const directPath = path.join(decisionTreesDir, ...normalizedTopic.split('/'));
  if (fs.existsSync(path.join(directPath, 'spec.md'))) {
    return normalizedTopic;
  }

  const topics = listTopics(decisionTreesDir);
  const matches = topics.filter((entry) => path.basename(entry) === normalizedTopic);
  if (matches.length === 1) {
    return matches[0] || null;
  }

  if (matches.length > 1) {
    throw new Error(`Topic "${topic}" is ambiguous. Use one of: ${matches.join(', ')}`);
  }

  return null;
}

function buildTopicOutputName(topicPath: string): string {
  return `${normalizeTopicPath(topicPath).replace(/\//g, '-')}-tree.html`;
}

export { buildTopicOutputName, listTopics, parseArgs, resolveTopic };
