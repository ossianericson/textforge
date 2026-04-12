import { describe, expect, it } from 'vitest';
import { buildCustomiseTemplatePrompt } from '@/lib/ai-prompts';

describe('template customise prompt', () => {
  it('includes both the request and template json', () => {
    const prompt = buildCustomiseTemplatePrompt('{"title":"Example"}', 'Replace placeholders');
    expect(prompt).toContain('Replace placeholders');
    expect(prompt).toContain('{"title":"Example"}');
    expect(prompt).toContain('Return ONLY the JSON');
  });
});
