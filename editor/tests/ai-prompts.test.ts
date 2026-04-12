import { describe, expect, it } from 'vitest';
import {
  BASE_SYSTEM_PROMPT,
  buildGenerateQuizPrompt,
  buildGenerateTreePrompt,
  buildReviewTreePrompt,
} from '@/lib/ai-prompts';

describe('ai-prompts', () => {
  it('includes the required unicode characters and result sections', () => {
    expect(BASE_SYSTEM_PROMPT).toContain('→');
    expect(BASE_SYSTEM_PROMPT).toContain('▸');
    expect(BASE_SYSTEM_PROMPT).toContain('Best For');
    expect(BASE_SYSTEM_PROMPT).toContain('Key Benefits');
    expect(BASE_SYSTEM_PROMPT).toContain('Considerations');
    expect(BASE_SYSTEM_PROMPT).toContain('When NOT to use');
    expect(BASE_SYSTEM_PROMPT).toContain('Tech Tags');
    expect(BASE_SYSTEM_PROMPT).toContain('Additional Considerations');
  });

  it('includes user content in generation prompts', () => {
    expect(buildGenerateTreePrompt('route between peering and VPN')).toContain(
      'route between peering and VPN'
    );
    const quizPrompt = buildGenerateQuizPrompt('Networking', 'Technical', 'Material body');
    expect(quizPrompt).toContain('Networking');
    expect(quizPrompt).toContain('Material body');
  });

  it('includes spec json in the review prompt', () => {
    expect(buildReviewTreePrompt('{"title":"Example"}')).toContain('{"title":"Example"}');
  });

  it('forces json-only output in all prompts', () => {
    expect(buildGenerateTreePrompt('x')).toContain('Return ONLY the JSON');
    expect(buildGenerateQuizPrompt('a', 'b', 'c')).toContain('Return ONLY the JSON');
    expect(buildReviewTreePrompt('{}')).toContain('Return ONLY the JSON');
  });
});
