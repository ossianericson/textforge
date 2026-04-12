import { describe, expect, it } from 'vitest';
import { parseParsedSpec, parseValidationWarnings } from '../src/lib/parser';

describe('parser helpers', () => {
  it('parses sidecar ParsedSpec payloads', () => {
    const parsed = parseParsedSpec(
      JSON.stringify({
        title: { main: 'Example', subtitle: 'Subtitle' },
        metadata: { version: 'v1' },
        questions: {},
        results: {},
        progressSteps: {},
      })
    );

    expect(parsed.title.main).toBe('Example');
    expect(parsed.metadata?.version).toBe('v1');
  });

  it('throws on sidecar errors', () => {
    expect(() => parseParsedSpec(JSON.stringify({ error: 'boom' }))).toThrow('boom');
    expect(() => parseValidationWarnings(JSON.stringify({ error: 'bad warnings' }))).toThrow('bad warnings');
  });
});