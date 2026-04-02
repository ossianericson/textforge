import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GenerateModal } from '@/components/ai/GenerateModal';
import { createDeferred, flushPromises } from '../deferred';

const editorStoreMock = vi.hoisted(() => ({
  state: {} as Record<string, any>,
}));

const useAIMock = vi.hoisted(() => ({
  value: {} as Record<string, any>,
}));

const aiConfigMock = vi.hoisted(() => ({
  getOrDiscoverConfig: vi.fn(),
  saveSelectedEndpoint: vi.fn(),
}));

vi.mock('@/store/useEditorStore', () => ({
  useEditorStore: (selector: (state: Record<string, any>) => unknown) => selector(editorStoreMock.state),
}));

vi.mock('@/lib/useAI', () => ({
  useAI: () => useAIMock.value,
}));

vi.mock('@/lib/ai-config', () => ({
  getOrDiscoverConfig: aiConfigMock.getOrDiscoverConfig,
  saveSelectedEndpoint: aiConfigMock.saveSelectedEndpoint,
}));

vi.mock('@/components/ai/TemplateLibrary', () => ({
  TemplateLibrary: () => <div>Template library</div>,
}));

vi.mock('@/components/ai/EndpointPicker', () => ({
  EndpointPicker: () => <div>Endpoint picker</div>,
}));

describe('GenerateModal', () => {
  beforeEach(() => {
    editorStoreMock.state = {
      toggleGenerateModal: vi.fn(),
      toggleSettingsModal: vi.fn(),
      openFromGeneratedSpec: vi.fn(),
      openFromGeneratedQuiz: vi.fn(),
      pushToast: vi.fn(),
    };
    useAIMock.value = {
      isLoading: false,
      error: null,
      clearError: vi.fn(),
      checkAuth: vi.fn().mockResolvedValue(true),
      generateTree: vi.fn().mockResolvedValue({ title: { main: 'Generated Tree' } }),
      generateQuiz: vi.fn().mockResolvedValue({ title: 'Generated Quiz' }),
    };
    aiConfigMock.getOrDiscoverConfig.mockResolvedValue({
      config: { endpoint: 'https://example.openai.azure.com', deployment: 'gpt-4o', resource_id: 'res-1' },
      endpoints: [],
      needsPicker: false,
    });
    aiConfigMock.saveSelectedEndpoint.mockResolvedValue({
      endpoint: 'https://example.openai.azure.com',
      deployment: 'gpt-4o',
      resource_id: 'res-1',
    });
  });

  it('renders with the tree tab active by default', async () => {
    render(<GenerateModal />);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /decision tree/i })).toHaveAttribute('aria-selected', 'true');
    expect(useAIMock.value.checkAuth).not.toHaveBeenCalled();
  });

  it('switches to quiz mode when the quiz tab is clicked', async () => {
    const user = userEvent.setup();
    render(<GenerateModal />);
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('tab', { name: /quiz/i }));

    expect(screen.getByRole('tab', { name: /quiz/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Source material')).toBeInTheDocument();
  });

  it('enables generation after typing a tree description and opens the generated spec', async () => {
    const user = userEvent.setup();
    const generateTree = vi.fn().mockResolvedValue({ title: { main: 'Generated Tree' } });
    const openFromGeneratedSpec = vi.fn();
    const toggleGenerateModal = vi.fn();
    useAIMock.value.generateTree = generateTree;
    editorStoreMock.state.openFromGeneratedSpec = openFromGeneratedSpec;
    editorStoreMock.state.toggleGenerateModal = toggleGenerateModal;

    render(<GenerateModal />);
    await screen.findByRole('dialog');

    const generateButton = screen.getByRole('button', { name: 'Generate' });
    expect(generateButton).toBeDisabled();

    await user.type(
      screen.getByLabelText('Describe the decision tree you want'),
      'Help me choose between Azure VMs and Container Instances'
    );
    expect(generateButton).not.toBeDisabled();

    await user.click(generateButton);

    await waitFor(() => {
      expect(generateTree).toHaveBeenCalledWith('Help me choose between Azure VMs and Container Instances');
    });
    expect(openFromGeneratedSpec).toHaveBeenCalledWith({ title: { main: 'Generated Tree' } });
    expect(toggleGenerateModal).toHaveBeenCalled();
  });

  it('generates a quiz from the quiz tab inputs', async () => {
    const user = userEvent.setup();
    const generateQuiz = vi.fn().mockResolvedValue({ title: 'Generated Quiz' });
    const openFromGeneratedQuiz = vi.fn();
    const pushToast = vi.fn();
    const toggleGenerateModal = vi.fn();
    useAIMock.value.generateQuiz = generateQuiz;
    editorStoreMock.state.openFromGeneratedQuiz = openFromGeneratedQuiz;
    editorStoreMock.state.pushToast = pushToast;
    editorStoreMock.state.toggleGenerateModal = toggleGenerateModal;

    render(<GenerateModal />);
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('tab', { name: /quiz/i }));
    await user.type(screen.getByLabelText('Subject'), 'Azure compute');
    await user.type(screen.getByLabelText('Source material'), 'VMs, AKS, Functions, and App Service');
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => {
      expect(generateQuiz).toHaveBeenCalledWith('Azure compute', 'Technical', 'VMs, AKS, Functions, and App Service');
    });
    expect(openFromGeneratedQuiz).toHaveBeenCalledWith({ title: 'Generated Quiz' });
    expect(pushToast).toHaveBeenCalledWith('Quiz JSON generated.', 'info');
    expect(toggleGenerateModal).toHaveBeenCalled();
  });

  it('renders the current AI error message as an alert', async () => {
    useAIMock.value.error = 'No AAD credential found';

    render(<GenerateModal />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/ai authentication failed/i);
    });
    expect(screen.getByRole('button', { name: 'Open Settings' })).toBeInTheDocument();
  });

  it('opens endpoint selection only when generation needs setup', async () => {
    const user = userEvent.setup();
    useAIMock.value.generateTree = vi.fn().mockRejectedValue(new Error('NEEDS_SETUP'));
    aiConfigMock.getOrDiscoverConfig.mockResolvedValue({
      config: null,
      endpoints: [
        {
          name: 'Primary endpoint',
          endpoint: 'https://example.openai.azure.com',
          location: 'westeurope',
          resource_id: 'res-1',
        },
      ],
      needsPicker: true,
    });

    render(<GenerateModal />);
    await screen.findByRole('dialog');

    await user.type(
      screen.getByLabelText('Describe the decision tree you want'),
      'Help me choose between Azure VMs and Container Instances'
    );
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => {
      expect(aiConfigMock.getOrDiscoverConfig).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('Endpoint picker')).toBeInTheDocument();
    expect(useAIMock.value.checkAuth).not.toHaveBeenCalled();
  });

  it('does not update local state after unmount when startup checks resolve late', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = render(<GenerateModal />);
    await screen.findByRole('dialog');
    unmount();
    await flushPromises();

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});