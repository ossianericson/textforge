import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createParsers } from '../../compiler/parsers/factory.ts';
import { generateMermaid } from '../src/lib/mermaid-export';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const EXAMPLE = resolve(REPO_ROOT, 'decision-trees/public/example-advanced-inputs/spec.md');

function parseSpec(specPath: string) {
  const content = readFileSync(specPath, 'utf-8');
  const lines = content.split('\n');
  const parsers = createParsers();
  const indices = parsers.findSectionIndices(lines);
  return {
    title: parsers.parseTitle(lines, indices.flowStart),
    metadata: parsers.parseSpecMetadata(lines, indices.flowStart),
    progressSteps: parsers.parseProgressSteps(lines, indices.progressStart),
    questions: parsers.parseQuestions(lines, indices.flowStart, indices.resultStart),
    results: parsers.parseResults(lines, indices.resultStart, lines.length),
  };
}

describe('generateMermaid', () => {
  it('starts with a left-to-right flowchart declaration', () => {
    const output = generateMermaid(parseSpec(EXAMPLE));
    expect(output.startsWith('flowchart LR')).toBe(true);
  });

  it('includes question and result nodes', () => {
    const output = generateMermaid(parseSpec(EXAMPLE));
    expect(output).toContain('q1([');
    expect(output).toContain('result_basic{{');
  });

  it('includes navigation edges for known targets', () => {
    const output = generateMermaid(parseSpec(EXAMPLE));
    expect(output).toContain('q1 --> q2');
    expect(output).toContain('q7 --> result_basic');
  });
});
