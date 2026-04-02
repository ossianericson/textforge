import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AIReviewIssue, ParsedSpec, Result } from '@shared/types';
import { getOrDiscoverConfig } from '@/lib/ai-config';
import {
  BASE_SYSTEM_PROMPT,
  buildGenerateQuizPrompt,
  buildGenerateTreePrompt,
  buildImproveResultPrompt,
  buildReviewTreePrompt,
  buildSuggestSectionPrompt,
  buildCustomiseTemplatePrompt,
} from '@/lib/ai-prompts';

function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }
  return trimmed
    .replace(/^```[a-zA-Z]*\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
}

export function safeJSON<T>(raw: string): T | null {
  try {
    return JSON.parse(stripJsonFences(raw)) as T;
  } catch {
    const sanitized = stripJsonFences(raw);
    const start = Math.max(
      sanitized.indexOf('{') === -1 ? Number.MAX_SAFE_INTEGER : sanitized.indexOf('{'),
      sanitized.indexOf('[') === -1 ? Number.MAX_SAFE_INTEGER : sanitized.indexOf('[')
    );
    const openIndex = Number.isFinite(start) ? start : -1;
    if (openIndex < 0) {
      return null;
    }
    const closeIndex = Math.max(sanitized.lastIndexOf('}'), sanitized.lastIndexOf(']'));
    if (closeIndex <= openIndex) {
      return null;
    }
    try {
      return JSON.parse(sanitized.slice(openIndex, closeIndex + 1)) as T;
    } catch {
      return null;
    }
  }
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withLoading = useCallback(async <T>(work: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await work();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      setError(message);
      throw caught;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const callAI = useCallback(async (userMessage: string, maxTokens?: number): Promise<string> => {
    const [{ config, needsPicker }, apiKey] = await Promise.all([
      getOrDiscoverConfig(),
      invoke<string | null>('load_api_key'),
    ]);

    if (needsPicker) {
      throw new Error('NEEDS_SETUP');
    }

    if (apiKey) {
      const endpoint = config?.endpoint ?? 'https://api.openai.com';
      const deployment = config?.deployment ?? 'gpt-4o-mini';
      return invoke<string>('call_openai_with_key', {
        endpoint,
        deployment,
        systemPrompt: BASE_SYSTEM_PROMPT,
        userMessage,
        apiKey,
        maxTokens,
      });
    }

    if (config) {
      return invoke<string>('call_azure_openai', {
        endpoint: config.endpoint,
        deployment: config.deployment,
        systemPrompt: BASE_SYSTEM_PROMPT,
        userMessage,
        maxTokens,
      });
    }

    throw new Error('NEEDS_SETUP');
  }, []);

  return {
    isLoading,
    error,
    clearError: useCallback(() => setError(null), []),
    checkAuth: useCallback(
      () => withLoading(() => invoke<boolean>('check_ai_auth')),
      [withLoading]
    ),
    generateTree: useCallback(
      (description: string) =>
        withLoading(async () => {
          const raw = await callAI(buildGenerateTreePrompt(description), 2400);
          return safeJSON<ParsedSpec>(raw);
        }),
      [callAI, withLoading]
    ),
    generateQuiz: useCallback(
      (subject: string, grade: string, material: string) =>
        withLoading(async () => {
          const raw = await callAI(buildGenerateQuizPrompt(subject, grade, material), 2400);
          return safeJSON<object>(raw);
        }),
      [callAI, withLoading]
    ),
    improveResult: useCallback(
      (resultId: string, result: Result) =>
        withLoading(async () => {
          const raw = await callAI(
            buildImproveResultPrompt(resultId, JSON.stringify(result, null, 2)),
            1800
          );
          return safeJSON<Result>(raw);
        }),
      [callAI, withLoading]
    ),
    suggestSection: useCallback(
      (resultTitle: string, sectionName: string) =>
        withLoading(async () => {
          const raw = await callAI(buildSuggestSectionPrompt(resultTitle, sectionName), 800);
          return safeJSON<string[]>(raw);
        }),
      [callAI, withLoading]
    ),
    reviewTree: useCallback(
      (spec: ParsedSpec) =>
        withLoading(async () => {
          const raw = await callAI(buildReviewTreePrompt(JSON.stringify(spec, null, 2)), 1800);
          return safeJSON<AIReviewIssue[]>(raw) ?? [];
        }),
      [callAI, withLoading]
    ),
    customiseTemplate: useCallback(
      (spec: ParsedSpec, customisation: string) =>
        withLoading(async () => {
          const raw = await callAI(
            buildCustomiseTemplatePrompt(JSON.stringify(spec, null, 2), customisation),
            2200
          );
          return safeJSON<ParsedSpec>(raw);
        }),
      [callAI, withLoading]
    ),
  };
}
