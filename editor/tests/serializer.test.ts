import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createParsers } from '../../compiler/parsers/factory.ts';
import { serialize } from '../src/lib/serializer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const EXAMPLE_SPEC = resolve(REPO_ROOT, 'decision-trees/public/example-advanced-inputs/spec.md');
const TEMP_SPEC = resolve(REPO_ROOT, 'editor/tests/_temp_roundtrip.md');

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

describe('serializer', () => {
  it('round-trips the example spec without losing question or result IDs', () => {
    const original = parseSpec(EXAMPLE_SPEC);
    const serialized = serialize(original);
    writeFileSync(TEMP_SPEC, serialized, 'utf-8');
    const reparsed = parseSpec(TEMP_SPEC);
    unlinkSync(TEMP_SPEC);

    expect(Object.keys(reparsed.questions)).toEqual(Object.keys(original.questions));
    expect(Object.keys(reparsed.results)).toEqual(Object.keys(original.results));
  });

  it('uses the Unicode arrow for navigation', () => {
    const output = serialize(parseSpec(EXAMPLE_SPEC));
    expect(output).not.toContain('->');
    expect(output).not.toContain('=>');
    output
      .split('\n')
      .filter((line) => line.includes('→') || /^\s*(?:\d+\.|-|\*\*(On|Off)\*\*)/.test(line))
      .filter((line) => line.includes('go to') || line.includes('result:'))
      .forEach((line) => expect(line).toContain('→'));
  });

  it('uses the Unicode bullet for result lists', () => {
    const output = serialize(parseSpec(EXAMPLE_SPEC));
    output
      .split('\n')
      .filter((line) => line.trim().startsWith('▸ '))
      .forEach((line) => expect(line.trim().startsWith('▸')).toBe(true));
  });

  it('throws on invalid question IDs', () => {
    const spec = parseSpec(EXAMPLE_SPEC);
    spec.questions.q2_bad = spec.questions.q1!;
    expect(() => serialize(spec)).toThrow(/Invalid question ID/);
  });

  it('throws on invalid result IDs', () => {
    const spec = parseSpec(EXAMPLE_SPEC);
    const firstId = Object.keys(spec.results)[0]!;
    spec.results.result_Bad_ID = spec.results[firstId]!;
    expect(() => serialize(spec)).toThrow(/Invalid result ID/);
  });

  it('throws on dropdown ranges with a gap', () => {
    const spec = parseSpec(EXAMPLE_SPEC);
    const firstQuestion = Object.keys(spec.questions)[0]!;
    spec.questions[firstQuestion] = {
      ...spec.questions[firstQuestion]!,
      type: 'dropdown',
      dropdownRanges: [
        { min: 0, max: 3, next: 'q2a', label: '0–3' },
        { min: 5, max: 9, next: 'q2b', label: '5–9' },
      ],
    };
    expect(() => serialize(spec)).toThrow(/gap/);
  });

  it('throws on toggle questions missing an off route', () => {
    const spec = parseSpec(EXAMPLE_SPEC);
    const firstQuestion = Object.keys(spec.questions)[0]!;
    spec.questions[firstQuestion] = {
      ...spec.questions[firstQuestion]!,
      type: 'toggle',
      toggleOnNext: 'q2a',
      toggleOffNext: undefined,
    };
    expect(() => serialize(spec)).toThrow(/toggleOffNext|toggle question/i);
  });

  it('throws on multi-select questions missing a fallback', () => {
    const spec = parseSpec(EXAMPLE_SPEC);
    const firstQuestion = Object.keys(spec.questions)[0]!;
    spec.questions[firstQuestion] = {
      ...spec.questions[firstQuestion]!,
      type: 'multi-select',
      multiSelectOptions: ['A'],
      multiSelectRoutes: [{ values: ['A'], next: 'q2a' }],
      multiSelectFallback: undefined,
    };
    expect(() => serialize(spec)).toThrow(/multiSelectFallback/);
  });

  it('forces q1 to 0 and result to 100 in progress steps', () => {
    const output = serialize(parseSpec(EXAMPLE_SPEC));
    expect(output).toContain('q1: 0');
    expect(output).toContain('result: 100');
  });
});