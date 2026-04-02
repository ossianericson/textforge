import type { ParsedSpec, ValidationWarning } from '@shared/types';

function parseJson<T>(raw: string): T {
  return JSON.parse(raw) as T;
}

export function parseParsedSpec(raw: string): ParsedSpec {
  const parsed = parseJson<ParsedSpec & { error?: string }>(raw);
  if (parsed && typeof parsed === 'object' && 'error' in parsed && parsed.error) {
    throw new Error(parsed.error);
  }
  return parsed;
}

export function parseValidationWarnings(raw: string): ValidationWarning[] {
  const parsed = parseJson<ValidationWarning[] & { error?: string }>(raw);
  if (parsed && typeof parsed === 'object' && 'error' in parsed && parsed.error) {
    throw new Error(parsed.error);
  }
  return Array.isArray(parsed) ? parsed : [];
}