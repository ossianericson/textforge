import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearInvokeResponses, invokeMock, setInvokeResponse } from '../__mocks__/tauri';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { flushPromises } from '../deferred';

const editorStoreMock = vi.hoisted(() => ({
  state: {} as Record<string, any>,
}));

vi.mock('@/store/useEditorStore', () => ({
  useEditorStore: (selector: (state: Record<string, any>) => unknown) => selector(editorStoreMock.state),
}));

describe('SettingsModal', () => {
  beforeEach(() => {
    clearInvokeResponses();
    setInvokeResponse('load_enterprise_config', null);
    setInvokeResponse('load_ai_provider_pref', { provider: 'azure' });
    setInvokeResponse('load_ai_config', {
      endpoint: 'https://example.openai.azure.com',
      deployment: 'gpt-4o',
      resource_id: 'resource-1',
    });
    setInvokeResponse('load_api_key', null);
    setInvokeResponse('get_ai_auth_status', { ok: false, provider: 'none', account: null });
    setInvokeResponse('start_device_code_auth', {
      user_code: 'ABCDEF-GH',
      verification_uri: 'https://microsoft.com/devicelogin',
      expires_in: 900,
      interval: 5,
      message: 'Go sign in',
    });
    editorStoreMock.state = {
      toggleSettingsModal: vi.fn(),
      aiProvider: 'none',
      aiAccount: null,
      analyticsEnabled: false,
      autoSaveEnabled: true,
      setAnalytics: vi.fn(),
      setAutoSave: vi.fn(),
      pushToast: vi.fn(),
      setAiStatus: vi.fn(),
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
    expect(screen.getByRole('button', { name: 'AI' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in with Microsoft' })).toBeInTheDocument();
  });

  it('starts the Azure device code flow', async () => {
    const user = userEvent.setup();
    await renderSettingsModal();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Sign in with Microsoft' }));
      await flushPromises();
    });

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('start_device_code_auth', {
        tenantHint: null,
        clientIdOverride: null,
      });
    });
    expect(screen.getByText('https://microsoft.com/devicelogin')).toBeInTheDocument();
    expect(screen.getByText('ABCDEF-GH')).toBeInTheDocument();
  });

  it('saves an OpenAI key and provider preference', async () => {
    const user = userEvent.setup();

    await renderSettingsModal();

    await user.click(screen.getByText('OpenAI').closest('button') as HTMLButtonElement);
    fireEvent.change(screen.getByLabelText('API key'), {
      target: { value: 'sk-test-save-fixture-not-real' },
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Save key' }));
      await flushPromises();
    });

    expect(invokeMock).toHaveBeenCalledWith('save_api_key', { key: 'sk-test-save-fixture-not-real' });
    expect(invokeMock).toHaveBeenCalledWith('save_ai_provider_pref', { provider: 'openai' });
  });

  it('toggles the local editor preference switches through store actions', async () => {
    const user = userEvent.setup();
    const setAnalytics = vi.fn();
    const setAutoSave = vi.fn();
    editorStoreMock.state.setAnalytics = setAnalytics;
    editorStoreMock.state.setAutoSave = setAutoSave;

    await renderSettingsModal();
    await user.click(screen.getByRole('button', { name: 'Editor' }));

    await user.click(screen.getByRole('switch', { name: 'Track local usage counts' }));
    await user.click(screen.getByRole('switch', { name: 'Auto-save every 2 minutes' }));

    expect(setAnalytics).toHaveBeenCalledWith(true);
    expect(setAutoSave).toHaveBeenCalledWith(false);
  });

  it('clears all AI settings', async () => {
    const user = userEvent.setup();
    const pushToast = vi.fn();
    editorStoreMock.state.pushToast = pushToast;

    await renderSettingsModal();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Clear all AI' }));
      await flushPromises();
    });

    expect(invokeMock).toHaveBeenCalledWith('clear_azure_auth');
    expect(invokeMock).toHaveBeenCalledWith('save_api_key', { key: '' });
    expect(invokeMock).toHaveBeenCalledWith('save_ai_provider_pref', { provider: 'none' });
    expect(pushToast).toHaveBeenCalledWith('AI settings cleared.', 'info');
  });

  it('close button closes the modal', async () => {
    const user = userEvent.setup();
    const toggleSettingsModal = vi.fn();
    editorStoreMock.state.toggleSettingsModal = toggleSettingsModal;

    await renderSettingsModal();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(toggleSettingsModal).toHaveBeenCalled();
  });

});