import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createParsers } from '../../compiler/parsers/factory.ts';
import { buildGraphFromSpec } from '../src/lib/layout';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const SPEC_PATH = resolve(REPO_ROOT, 'decision-trees/public/example-advanced-inputs/spec.md');

function parseSpec(specPath: string) {
  const content = readFileSync(specPath, 'utf-8');
  const lines = content.split('\n');
  const parsers = createParsers();
  const indices = parsers.findSectionIndices(lines);
  return {
    title: parsers.parseTitle(lines, indices.flowStart),
    progressSteps: parsers.parseProgressSteps(lines, indices.progressStart),
    questions: parsers.parseQuestions(lines, indices.flowStart, indices.resultStart),
    results: parsers.parseResults(lines, indices.resultStart, lines.length),
  };
}

describe('layout', () => {
  const spec = parseSpec(SPEC_PATH);
  const { nodes, edges } = buildGraphFromSpec(spec);

  it('creates a node for every question', () => {
    Object.keys(spec.questions).forEach((id) => {
      expect(nodes.some((node) => node.id === id)).toBe(true);
    });
  });

  it('creates a node for every result', () => {
    Object.keys(spec.results).forEach((id) => {
      expect(nodes.some((node) => node.id === id)).toBe(true);
    });
  });

  it('only creates edges between known nodes', () => {
    const nodeIds = new Set(nodes.map((node) => node.id));
    edges.forEach((edge) => {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    });
  });

  it('assigns unique positions to every node', () => {
    const positions = nodes.map((node) => `${node.position.x},${node.position.y}`);
    expect(new Set(positions).size).toBe(positions.length);
  });
});