import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../src/store/useEditorStore';

describe('AI status', () => {
  beforeEach(() =>
    useEditorStore.setState({ isAiConfigured: false, aiProvider: 'none', aiAccount: null })
  );

  it('starts unconfigured', () => {
    expect(useEditorStore.getState().isAiConfigured).toBe(false);
  });

  it('setAiStatus azure', () => {
    useEditorStore.getState().setAiStatus({ ok: true, provider: 'azure', account: 'u@corp.com' });
    expect(useEditorStore.getState().isAiConfigured).toBe(true);
    expect(useEditorStore.getState().aiAccount).toBe('u@corp.com');
  });

  it('setAiStatus ok=false clears', () => {
    useEditorStore.getState().setAiStatus({ ok: true, provider: 'openai' });
    useEditorStore.getState().setAiStatus({ ok: false, provider: 'none' });
    expect(useEditorStore.getState().isAiConfigured).toBe(false);
    expect(useEditorStore.getState().aiProvider).toBe('none');
  });
});