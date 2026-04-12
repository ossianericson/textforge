import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { buildTopicOutputName, listTopics, parseArgs, resolveTopic } from '#compiler/cli-utils';
import { makeTempDir, writeFile } from './helpers.js';

test('cliUtils: parseArgs collects flags and positionals', () => {
  const argv = ['--topic', 'dr-architecture', '--template', 'base.html', 'extra'];
  const { values, positionals } = parseArgs(argv);

  assert.equal(values.topic, 'dr-architecture');
  assert.equal(values.template, 'base.html');
  assert.deepEqual(positionals, ['extra']);
});

test('cliUtils: listTopics finds spec folders recursively', () => {
  const root = makeTempDir();
  const withSpec = path.join(root, 'internal', 'with-spec');
  const publicSpec = path.join(root, 'public', 'example');
  const withoutSpec = path.join(root, 'without-spec');

  fs.mkdirSync(withSpec, { recursive: true });
  fs.mkdirSync(publicSpec, { recursive: true });
  fs.mkdirSync(withoutSpec, { recursive: true });

  writeFile(withSpec, 'spec.md', '# spec');
  writeFile(publicSpec, 'spec.md', '# public spec');
  writeFile(withoutSpec, 'notes.txt', 'no spec');

  const topics = listTopics(root);

  assert.deepEqual(topics, ['internal/with-spec', 'public/example']);
});

test('cliUtils: resolveTopic resolves unique leaf names and exact nested paths', () => {
  const root = makeTempDir();
  const internalSpec = path.join(root, 'internal', 'internal-topic');
  const publicSpec = path.join(root, 'public', 'public-topic');
  const duplicateInternalSpec = path.join(root, 'internal', 'duplicate-topic');
  const duplicatePublicSpec = path.join(root, 'public', 'duplicate-topic');

  fs.mkdirSync(internalSpec, { recursive: true });
  fs.mkdirSync(publicSpec, { recursive: true });
  fs.mkdirSync(duplicateInternalSpec, { recursive: true });
  fs.mkdirSync(duplicatePublicSpec, { recursive: true });
  writeFile(internalSpec, 'spec.md', '# internal spec');
  writeFile(publicSpec, 'spec.md', '# public spec');
  writeFile(duplicateInternalSpec, 'spec.md', '# duplicate internal spec');
  writeFile(duplicatePublicSpec, 'spec.md', '# duplicate public spec');

  assert.equal(resolveTopic(root, 'internal-topic'), 'internal/internal-topic');
  assert.equal(resolveTopic(root, 'public/public-topic'), 'public/public-topic');
  assert.throws(() => resolveTopic(root, 'duplicate-topic'), /ambiguous/);
});

test('cliUtils: buildTopicOutputName flattens nested topic paths', () => {
  assert.equal(buildTopicOutputName('internal/example-topic'), 'internal-example-topic-tree.html');
});
