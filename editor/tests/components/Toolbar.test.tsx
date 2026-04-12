import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Toolbar } from '@/components/toolbar/Toolbar';

const editorStoreMock = vi.hoisted(() => ({
  state: {} as Record<string, any>,
}));

const useAIMock = vi.hoisted(() => ({
  reviewTree: vi.fn(),
  isLoading: false,
}));

const useEditorStoreMock = vi.hoisted(() =>
  Object.assign(
    (selector?: (state: Record<string, any>) => unknown) =>
      selector ? selector(editorStoreMock.state) : editorStoreMock.state,
    {
      getState: () => editorStoreMock.state,
    }
  )
);

vi.mock('@/store/useEditorStore', () => ({
  useEditorStore: useEditorStoreMock,
}));

vi.mock('@/lib/useAI', () => ({
  useAI: () => useAIMock,
}));

describe('Toolbar', () => {
  beforeEach(() => {
    useAIMock.reviewTree.mockReset();
    editorStoreMock.state = {
      createNewSpec: vi.fn(),
      openFile: vi.fn(),
      saveFile: vi.fn(),
      saveFileAs: vi.fn(),
      compile: vi.fn(),
      validate: vi.fn(),
      openCompiledOutput: vi.fn(),
      isDirty: false,
      isCompiling: false,
      toggleValidationPanel: vi.fn(),
      toggleProgressPanel: vi.fn(),
      toggleSidebar: vi.fn(),
      toggleMermaidModal: vi.fn(),
      toggleGenerateModal: vi.fn(),
      setAIReviewIssues: vi.fn(),
      toggleDashboard: vi.fn(),
      toggleSettingsModal: vi.fn(),
      toggleOnboardingTour: vi.fn(),
      toggleShortcutsModal: vi.fn(),
      toggleRepoBrowser: vi.fn(),
      toggleCommitModal: vi.fn(),
      sidebarCollapsed: false,
      validationWarnings: [],
      spec: null,
      showValidationPanel: false,
      currentPath: null,
      previewPath: null,
      repoConnection: null,
      isAiConfigured: true,
      pushToast: vi.fn(),
    };
  });

  it('shows grouped menu actions and disables compile when no spec is open', () => {
    render(<Toolbar />);

    expect(screen.getByRole('button', { name: 'File' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tools' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compile & Show Output' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: '+ Question' })).not.toBeInTheDocument();
  });

  it('enables compiled output actions when a compiled file exists', () => {
    editorStoreMock.state.spec = {
      title: { main: 'Example', subtitle: '' },
      metadata: { version: '1.0.0' },
      questions: {},
      results: {},
      progressSteps: {},
    };
    editorStoreMock.state.previewPath = 'C:/Users/test/AppData/Local/textforge/compiled/abcd/example-tree.html';

    render(<Toolbar />);

    expect(screen.getByRole('button', { name: 'Show Output Folder' })).toBeEnabled();
  });

  it('opens the File menu and triggers file actions', async () => {
    const user = userEvent.setup();
    render(<Toolbar />);

    await user.click(screen.getByRole('button', { name: 'File' }));
    expect(screen.getByTestId('toolbar-menu-surface').className).toContain('bg-[#111923]');
    expect(screen.getByTestId('toolbar-menu-surface').className).toContain('isolate');
    await user.click(screen.getByRole('button', { name: /Open spec/i }));

    expect(editorStoreMock.state.openFile).toHaveBeenCalled();
  });

  it('opens the Edit menu and triggers validation actions', async () => {
    const user = userEvent.setup();
    editorStoreMock.state.spec = {
      title: { main: 'Example', subtitle: '' },
      metadata: { version: '1.0.0' },
      questions: {},
      results: {},
      progressSteps: {},
    };

    render(<Toolbar />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: /Validate spec/i }));

    expect(editorStoreMock.state.validate).toHaveBeenCalled();
  });

  it('opens the Tools menu and triggers Mermaid export', async () => {
    const user = userEvent.setup();
    render(<Toolbar />);

    await user.click(screen.getByRole('button', { name: 'Tools' }));
    await user.click(screen.getByRole('button', { name: /Export Mermaid diagram/i }));

    expect(editorStoreMock.state.toggleMermaidModal).toHaveBeenCalled();
  });

  it('blocks AI review when AI is not configured', async () => {
    const user = userEvent.setup();
    editorStoreMock.state.isAiConfigured = false;
    editorStoreMock.state.spec = {
      title: { main: 'Example', subtitle: '' },
      metadata: { version: '1.0.0' },
      questions: {},
      results: {},
      progressSteps: {},
    };

    render(<Toolbar />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: /AI review/i }));

    expect(editorStoreMock.state.pushToast).toHaveBeenCalledWith(
      'AI is not configured — open Settings → AI to connect.',
      'warn'
    );
  });
});