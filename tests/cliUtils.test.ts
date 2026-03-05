import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { listTopics, parseArgs } from '#compiler/cli-utils';
import { makeTempDir, writeFile } from './helpers.js';

test('cliUtils: parseArgs collects flags and positionals', () => {
  const argv = ['--topic', 'dr-architecture', '--template', 'base.html', 'extra'];
  const { values, positionals } = parseArgs(argv);

  assert.equal(values.topic, 'dr-architecture');
  assert.equal(values.template, 'base.html');
  assert.deepEqual(positionals, ['extra']);
});

test('cliUtils: listTopics finds spec folders only', () => {
  const root = makeTempDir();
  const withSpec = path.join(root, 'with-spec');
  const withoutSpec = path.join(root, 'without-spec');

  fs.mkdirSync(withSpec, { recursive: true });
  fs.mkdirSync(withoutSpec, { recursive: true });

  writeFile(withSpec, 'spec.md', '# spec');
  writeFile(withoutSpec, 'notes.txt', 'no spec');

  const topics = listTopics(root);

  assert.deepEqual(topics, ['with-spec']);
});
