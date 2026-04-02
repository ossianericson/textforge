import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createParsers } from '../../compiler/parsers/factory';
import { docToSpec } from '@/lib/doc-to-spec';
import { serialize } from '@/lib/serializer';
import { specToDoc } from '@/lib/spec-to-doc';

describe('serializer corpus compatibility', () => {
  it('round-trips the ai-approval internal spec without requiring docs links on every result', () => {
    const specPath = '../decision-trees/' + 'internal/ai-approval/spec.md';
    const raw = readFileSync(specPath, 'utf8');
    const lines = raw.split('\n');
    const parsers = createParsers();
    const indices = parsers.findSectionIndices(lines);
    const parsedSpec = {
      title: parsers.parseTitle(lines, indices.flowStart),
      metadata: parsers.parseSpecMetadata(lines, indices.flowStart),
      progressSteps: parsers.parseProgressSteps(lines, indices.progressStart),
      questions: parsers.parseQuestions(lines, indices.flowStart, indices.resultStart),
      results: parsers.parseResults(lines, indices.resultStart, lines.length),
    };

    const doc = specToDoc(parsedSpec);
    const roundTripped = docToSpec(doc, parsedSpec);

    expect(() => serialize(roundTripped)).not.toThrow();
    expect(roundTripped.results['result-email-stuck']?.docs ?? []).toHaveLength(0);
  });
});
