import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearInvokeResponses, invokeMock, setInvokeResponse } from '../__mocks__/tauri';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { createDeferred, flushPromises } from '../deferred';

const editorStoreMock = vi.hoisted(() => ({
  state: {} as Record<string, any>,
}));

const aiConfigMock = vi.hoisted(() => ({
  clearConfig: vi.fn(),
  getOrDiscoverConfig: vi.fn(),
  setCachedConfig: vi.fn(),
}));

const useAIMock = vi.hoisted(() => ({
  value: {} as Record<string, any>,
}));

vi.mock('@/store/useEditorStore', () => ({
  useEditorStore: (selector: (state: Record<string, any>) => unknown) => selector(editorStoreMock.state),
}));

vi.mock('@/lib/ai-config', () => ({
  clearConfig: aiConfigMock.clearConfig,
  getOrDiscoverConfig: aiConfigMock.getOrDiscoverConfig,
  setCachedConfig: aiConfigMock.setCachedConfig,
}));

vi.mock('@/lib/useAI', () => ({
  useAI: () => useAIMock.value,
}));

describe('SettingsModal', () => {
  beforeEach(() => {
    clearInvokeResponses();
    setInvokeResponse('load_ai_config', {
      endpoint: 'https://example.openai.azure.com',
      deployment: 'gpt-4o',
      resource_id: 'resource-1',
    });
    // Test fixture only - not a real key
    setInvokeResponse('load_api_key', 'sk-test-fixture-not-real');
    editorStoreMock.state = {
      toggleSettingsModal: vi.fn(),
      analyticsEnabled: false,
      autoSaveEnabled: true,
      setAnalytics: vi.fn(),
      setAutoSave: vi.fn(),
      pushToast: vi.fn(),
    };
    aiConfigMock.clearConfig.mockResolvedValue(undefined);
    aiConfigMock.getOrDiscoverConfig.mockResolvedValue({
      config: {
        endpoint: 'https://example.openai.azure.com',
        deployment: 'gpt-4o',
        resource_id: 'resource-1',
      },
      endpoints: [],
      needsPicker: false,
    });
    aiConfigMock.setCachedConfig.mockReset();
    useAIMock.value = {
      checkAuth: vi.fn().mockResolvedValue(true),
    };
  });

  async function renderSettingsModal() {
    await act(async () => {
      render(<SettingsModal />);
      await flushPromises();
    });
    await screen.findByRole('dialog');
  }

  it('renders the settings dialog', async () => {
    await renderSettingsModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Saved config')).toBeInTheDocument();
    expect(useAIMock.value.checkAuth).not.toHaveBeenCalled();
  });

  it('saves manual endpoint, deployment, and api key', async () => {
    const user = userEvent.setup();
    await renderSettingsModal();

    await user.click(screen.getByRole('button', { name: /advanced/i }));
    fireEvent.change(screen.getByLabelText('Manual endpoint override'), {
      target: { value: 'https://manual.example.com' },
    });
    fireEvent.change(screen.getByLabelText('Deployment name'), {
      target: { value: 'gpt-4.1' },
    });
    fireEvent.change(screen.getByLabelText('API key'), {
      target: { value: 'sk-test-save-fixture-not-real' },
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Save manual config' }));
      await flushPromises();
    });

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('save_ai_config', {
        endpoint: 'https://manual.example.com',
        deployment: 'gpt-4.1',
        resource_id: 'resource-1',
      });
    });
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('save_api_key', { key: 'sk-test-save-fixture-not-real' });
    });
    expect(aiConfigMock.setCachedConfig).toHaveBeenCalledWith({
      endpoint: 'https://manual.example.com',
      deployment: 'gpt-4.1',
      resource_id: 'resource-1',
    });
  });

  it('toggles the local editor preference switches through store actions', async () => {
    const user = userEvent.setup();
    const setAnalytics = vi.fn();
    const setAutoSave = vi.fn();
    editorStoreMock.state.setAnalytics = setAnalytics;
    editorStoreMock.state.setAutoSave = setAutoSave;

    await renderSettingsModal();

    await user.click(screen.getByRole('switch', { name: 'Track local usage counts' }));
    await user.click(screen.getByRole('switch', { name: 'Auto-save every 2 minutes' }));

    expect(setAnalytics).toHaveBeenCalledWith(true);
    expect(setAutoSave).toHaveBeenCalledWith(false);
  });

  it('resets discovered AI config', async () => {
    const user = userEvent.setup();
    const pushToast = vi.fn();
    editorStoreMock.state.pushToast = pushToast;

    await renderSettingsModal();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Reset' }));
      await flushPromises();
    });

    await waitFor(() => {
      expect(aiConfigMock.clearConfig).toHaveBeenCalled();
    });
    expect(pushToast).toHaveBeenCalledWith('Saved Azure AI config cleared. Refresh when you want to discover it again.', 'info');
  });

  it('refreshes Azure discovery only when requested', async () => {
    const user = userEvent.setup();

    await renderSettingsModal();

    expect(aiConfigMock.getOrDiscoverConfig).not.toHaveBeenCalled();
    expect(useAIMock.value.checkAuth).not.toHaveBeenCalled();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Refresh from Azure' }));
      await flushPromises();
    });

    await waitFor(() => {
      expect(aiConfigMock.getOrDiscoverConfig).toHaveBeenCalledTimes(1);
    });
    expect(useAIMock.value.checkAuth).toHaveBeenCalledTimes(1);
  });

  it('close button closes the modal', async () => {
    const user = userEvent.setup();
    const toggleSettingsModal = vi.fn();
    editorStoreMock.state.toggleSettingsModal = toggleSettingsModal;

    await renderSettingsModal();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(toggleSettingsModal).toHaveBeenCalled();
  });

  it('does not update local state after unmount when startup discovery resolves late', async () => {
    const keyDeferred = createDeferred<string | null>();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    setInvokeResponse('load_api_key', keyDeferred.promise);

    const { unmount } = render(<SettingsModal />);
    await screen.findByRole('dialog');
    unmount();
    await act(async () => {
      keyDeferred.resolve('sk-late');
      await flushPromises();
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});