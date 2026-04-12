import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AIReviewIssue, ParsedSpec, Result } from '@shared/types';
import { getOrDiscoverConfig } from '@/lib/ai-config';
import { emitEvent } from '@/lib/editorEvents';
import { systemLog } from '@/lib/systemLog';
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
    const [providerPref, persistedConfig, apiKey] = await Promise.all([
      invoke<{ provider?: string; custom_endpoint?: string | null } | null>('load_ai_provider_pref'),
      invoke<{ endpoint?: string; deployment?: string; resource_id?: string } | null>('load_ai_config'),
      invoke<string | null>('load_api_key'),
    ]);

    const provider = providerPref?.provider ?? (apiKey ? 'openai' : 'azure');

    if (provider === 'openai') {
      if (!apiKey) {
        throw new Error('AI is not configured — open Settings → AI to connect.');
      }

      const endpoint = providerPref?.custom_endpoint ?? 'https://api.openai.com';
      const deployment = persistedConfig?.deployment ?? 'gpt-4o-mini';
      return invoke<string>('call_openai_with_key', {
        endpoint,
        deployment,
        systemPrompt: BASE_SYSTEM_PROMPT,
        userMessage,
        apiKey,
        maxTokens,
      });
    }

    if (provider === 'custom') {
      if (!persistedConfig?.endpoint) {
        throw new Error('Custom endpoint is not configured — open Settings → AI to connect.');
      }
      if (!apiKey) {
        throw new Error('Custom endpoint requires an API key in this build.');
      }

      return invoke<string>('call_openai_with_key', {
        endpoint: persistedConfig.endpoint,
        deployment: persistedConfig.deployment ?? 'gpt-4o-mini',
        systemPrompt: BASE_SYSTEM_PROMPT,
        userMessage,
        apiKey,
        maxTokens,
      });
    }

    let config = persistedConfig;
    if (!config?.endpoint || !config?.deployment) {
      const discovered = await getOrDiscoverConfig();
      if (discovered.needsPicker || !discovered.config) {
        throw new Error('AI is not configured — open Settings → AI to connect.');
      }
      config = discovered.config;
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

  const runTrackedAIAction = useCallback(
    async <T>(operationName: string, work: () => Promise<T>): Promise<T> => {
      const startTime = Date.now();
      emitEvent('ai.started', 'ai', { operation: operationName });
      systemLog('info', 'ai', `AI ${operationName} started`);

      try {
        const result = await withLoading(work);
        emitEvent('ai.completed', 'ai', { operation: operationName });
        systemLog('info', 'ai', `AI ${operationName} completed`, {
          success: true,
          duration_ms: Date.now() - startTime,
        });
        return result;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : String(caught);
        emitEvent('ai.failed', 'ai', { operation: operationName, error: message });
        systemLog('error', 'ai', `AI ${operationName} failed`, {
          detail: message,
          success: false,
        });
        throw caught;
      }
    },
    [withLoading]
  );

  const runTrackedAuthAction = useCallback(async <T>(work: () => Promise<T>): Promise<T> => {
    const startTime = Date.now();
    emitEvent('auth.started', 'auth', {});
    systemLog('info', 'auth', 'AI auth started');

    try {
      const result = await withLoading(work);
      emitEvent('auth.completed', 'auth', {});
      systemLog('info', 'auth', 'AI auth completed', {
        success: true,
        duration_ms: Date.now() - startTime,
      });
      return result;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      emitEvent('auth.failed', 'auth', { error: message });
      systemLog('error', 'auth', 'AI auth failed', {
        detail: message,
        success: false,
      });
      throw caught;
    }
  }, [withLoading]);

  return {
    isLoading,
    error,
    clearError: useCallback(() => setError(null), []),
    checkAuth: useCallback(
      () =>
        runTrackedAuthAction(async () => {
          const status = await invoke<{ ok: boolean }>('get_ai_auth_status');
          return status.ok;
        }),
      [runTrackedAuthAction]
    ),
    generateTree: useCallback(
      (description: string) =>
        runTrackedAIAction('generateTree', async () => {
          const raw = await callAI(buildGenerateTreePrompt(description), 2400);
          return safeJSON<ParsedSpec>(raw);
        }),
      [callAI, runTrackedAIAction]
    ),
    generateQuiz: useCallback(
      (subject: string, grade: string, material: string) =>
        runTrackedAIAction('generateQuiz', async () => {
          const raw = await callAI(buildGenerateQuizPrompt(subject, grade, material), 2400);
          return safeJSON<object>(raw);
        }),
      [callAI, runTrackedAIAction]
    ),
    improveResult: useCallback(
      (resultId: string, result: Result) =>
        runTrackedAIAction('improveResult', async () => {
          const raw = await callAI(
            buildImproveResultPrompt(resultId, JSON.stringify(result, null, 2)),
            1800
          );
          return safeJSON<Result>(raw);
        }),
      [callAI, runTrackedAIAction]
    ),
    suggestSection: useCallback(
      (resultTitle: string, sectionName: string) =>
        runTrackedAIAction('suggestSection', async () => {
          const raw = await callAI(buildSuggestSectionPrompt(resultTitle, sectionName), 800);
          return safeJSON<string[]>(raw);
        }),
      [callAI, runTrackedAIAction]
    ),
    reviewTree: useCallback(
      (spec: ParsedSpec) =>
        runTrackedAIAction('reviewTree', async () => {
          const raw = await callAI(buildReviewTreePrompt(JSON.stringify(spec, null, 2)), 1800);
          return safeJSON<AIReviewIssue[]>(raw) ?? [];
        }),
      [callAI, runTrackedAIAction]
    ),
    customiseTemplate: useCallback(
      (spec: ParsedSpec, customisation: string) =>
        runTrackedAIAction('customiseTemplate', async () => {
          const raw = await callAI(
            buildCustomiseTemplatePrompt(JSON.stringify(spec, null, 2), customisation),
            2200
          );
          return safeJSON<ParsedSpec>(raw);
        }),
      [callAI, runTrackedAIAction]
    ),
  };
}
