import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GenerateModal } from '@/components/ai/GenerateModal';
import { flushPromises } from '../deferred';

const editorStoreMock = vi.hoisted(() => ({
  state: {} as Record<string, any>,
}));

const useAIMock = vi.hoisted(() => ({
  value: {} as Record<string, any>,
}));

vi.mock('@/store/useEditorStore', () => ({
  useEditorStore: (selector: (state: Record<string, any>) => unknown) => selector(editorStoreMock.state),
}));

vi.mock('@/lib/useAI', () => ({
  useAI: () => useAIMock.value,
}));

vi.mock('@/components/ai/TemplateLibrary', () => ({
  TemplateLibrary: () => <div>Template library</div>,
}));

describe('GenerateModal', () => {
  beforeEach(() => {
    editorStoreMock.state = {
      toggleGenerateModal: vi.fn(),
      toggleSettingsModal: vi.fn(),
      openFromGeneratedSpec: vi.fn(),
      openFromGeneratedQuiz: vi.fn(),
      pushToast: vi.fn(),
      isAiConfigured: true,
      aiProvider: 'azure',
      aiAccount: 'user@corp.com',
    };
    useAIMock.value = {
      isLoading: false,
      error: null,
      clearError: vi.fn(),
      generateTree: vi.fn().mockResolvedValue({ title: { main: 'Generated Tree' } }),
      generateQuiz: vi.fn().mockResolvedValue({ title: 'Generated Quiz' }),
    };
  });

  it('renders with the tree tab active by default', async () => {
    render(<GenerateModal />);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /decision tree/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/connected via azure/i)).toBeInTheDocument();
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
    useAIMock.value.error = 'Generation failed';

    render(<GenerateModal />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/ai request failed/i);
    });
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('shows the setup warning when AI is not configured', async () => {
    const user = userEvent.setup();
    editorStoreMock.state.isAiConfigured = false;

    render(<GenerateModal />);
    await screen.findByRole('dialog');

    expect(screen.getByText(/ai is not configured/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open Settings' }));
    expect(editorStoreMock.state.toggleSettingsModal).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled();
  });
});