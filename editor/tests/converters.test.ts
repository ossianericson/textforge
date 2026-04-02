import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createParsers } from '../../compiler/parsers/factory.ts';
import { docToSpec } from '../src/lib/doc-to-spec';
import { specToDoc } from '../src/lib/spec-to-doc';
import { serialize } from '../src/lib/serializer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');

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

const EXAMPLE = resolve(REPO_ROOT, 'decision-trees/public/example-advanced-inputs/spec.md');

function stripCompiledAt<T extends { metadata?: { compiledAt?: string } }>(value: T): T {
  const cloned = JSON.parse(JSON.stringify(value)) as T;
  if (cloned.metadata && 'compiledAt' in cloned.metadata) {
    delete cloned.metadata.compiledAt;
  }
  return cloned;
}

describe('specToDoc -> docToSpec round-trip', () => {
  it('preserves all question IDs', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    const restored = docToSpec(doc, original);
    expect(Object.keys(restored.questions).sort()).toEqual(Object.keys(original.questions).sort());
  });

  it('preserves all result IDs', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    const restored = docToSpec(doc, original);
    expect(Object.keys(restored.results).sort()).toEqual(Object.keys(original.results).sort());
  });

  it('preserves question types', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    const restored = docToSpec(doc, original);
    Object.entries(original.questions).forEach(([id, question]) => {
      expect(restored.questions[id]?.type).toBe(question.type ?? 'buttons');
    });
  });

  it('preserves dropdown ranges', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    const restored = docToSpec(doc, original);
    Object.entries(original.questions).forEach(([id, question]) => {
      if (question.dropdownRanges) {
        expect(restored.questions[id]?.dropdownRanges).toEqual(question.dropdownRanges);
      }
    });
  });

  it('preserves toggle routes', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    const restored = docToSpec(doc, original);
    Object.entries(original.questions).forEach(([id, question]) => {
      if (question.type === 'toggle') {
        expect(restored.questions[id]?.toggleOnNext).toBe(question.toggleOnNext);
        expect(restored.questions[id]?.toggleOffNext).toBe(question.toggleOffNext);
      }
    });
  });

  it('preserves multi-select fallback', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    const restored = docToSpec(doc, original);
    Object.entries(original.questions).forEach(([id, question]) => {
      if (question.type === 'multi-select') {
        expect(restored.questions[id]?.multiSelectFallback).toBe(question.multiSelectFallback);
      }
    });
  });

  it('preserves result titles', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    const restored = docToSpec(doc, original);
    Object.entries(original.results).forEach(([id, result]) => {
      expect(restored.results[id]?.title).toBe(result.title);
    });
  });

  it('preserves badge class names', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    const restored = docToSpec(doc, original);
    Object.entries(original.results).forEach(([id, result]) => {
      expect(restored.results[id]?.badge.className).toBe(result.badge.className);
    });
  });

  it('preserves bestFor lists', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    const restored = docToSpec(doc, original);
    Object.entries(original.results).forEach(([id, result]) => {
      expect(restored.results[id]?.bestFor).toEqual(result.bestFor);
    });
  });

  it('preserves progress steps', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    const restored = docToSpec(doc, original);
    expect(restored.progressSteps.q1).toBe(original.progressSteps.q1);
    expect(restored.progressSteps.result).toBe(100);
  });

  it('preserves edited header metadata from the document view', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    const headerNode = doc.content?.find((node) => node.type === 'specHeader');
    if (!headerNode) {
      throw new Error('Expected a specHeader node in the editor document.');
    }

    headerNode.attrs = {
      ...headerNode.attrs,
      title: 'Updated title',
      subtitle: 'Updated subtitle',
      version: '9.9.9',
    };

    const restored = docToSpec(doc, original);
    expect(restored.title).toEqual({ main: 'Updated title', subtitle: 'Updated subtitle' });
    expect(restored.metadata?.version).toBe('9.9.9');
  });

  it('falls back to the existing title when the header is temporarily missing', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    doc.content = (doc.content ?? []).filter((node) => node.type !== 'specHeader');

    const restored = docToSpec(doc, original);
    expect(restored.title).toEqual(original.title);
    expect(restored.metadata?.version).toBe(original.metadata?.version);
  });

  it('full spec survives serialize after round-trip', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    const restored = docToSpec(doc, original);
    expect(() => serialize(restored)).not.toThrow();
  });

  it('round-trips the example spec without semantic loss', () => {
    const original = parseSpec(EXAMPLE);
    const doc = specToDoc(original);
    const restored = docToSpec(doc, original);
    expect(stripCompiledAt(restored)).toEqual(stripCompiledAt(original));
  });
});
