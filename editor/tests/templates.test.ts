import { describe, expect, it } from 'vitest';
import { serialize } from '@/lib/serializer';
import { templateLibrary } from '@/lib/template-library';

describe('template-library', () => {
  it('contains at least five templates with required fields', () => {
    expect(templateLibrary.length).toBeGreaterThanOrEqual(5);
    templateLibrary.forEach((template) => {
      expect(template.id).toBeTruthy();
      expect(template.title).toBeTruthy();
      expect(template.spec).toBeTruthy();
      expect(template.completeness).toBeGreaterThanOrEqual(0);
      expect(template.completeness).toBeLessThanOrEqual(100);
    });
  });

  it('serializes every template without throwing', () => {
    templateLibrary.forEach((template) => {
      expect(() => serialize(template.spec)).not.toThrow();
    });
  });
});
