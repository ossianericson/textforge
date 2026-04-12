import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearInvokeResponses, invokeMock, setInvokeResponse } from '../__mocks__/tauri';
import { createDeferred, flushPromises } from '../deferred';

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}));

const generateMermaidMock = vi.hoisted(() => vi.fn());

const editorStoreMock = vi.hoisted(() => ({
  state: {} as Record<string, any>,
}));

vi.mock('mermaid', () => ({
  default: mermaidMock,
}));

vi.mock('@/lib/mermaid-export', () => ({
  generateMermaid: generateMermaidMock,
}));

vi.mock('@/store/useEditorStore', () => ({
  useEditorStore: (selector: (state: Record<string, any>) => unknown) => selector(editorStoreMock.state),
}));

import { MermaidExportModal } from '@/components/toolbar/MermaidExportModal';

describe('MermaidExportModal', () => {
  beforeEach(() => {
    clearInvokeResponses();
    setInvokeResponse('write_file', undefined);
    generateMermaidMock.mockReturnValue('flowchart LR\n  q1([Start]) --> result_aks{{AKS}}');
    mermaidMock.initialize.mockReset();
    mermaidMock.render.mockReset();
    mermaidMock.render.mockResolvedValue({ svg: '<svg data-testid="mermaid-preview"></svg>' });
    editorStoreMock.state = {
      spec: {
        title: { main: 'Azure Compute', subtitle: '' },
        questions: {},
        results: {},
        progressSteps: {},
      },
      currentPath: '/tmp/specs/azure-compute/spec.md',
      toggleMermaidModal: vi.fn(),
      pushToast: vi.fn(),
    };
  });

  it('renders the modal content and mermaid source', () => {
    render(<MermaidExportModal />);

    expect(screen.getByText('Mermaid Export')).toBeInTheDocument();
    expect(screen.getByText(/generate and save a mermaid flowchart/i)).toBeInTheDocument();
    expect(screen.getByText(/flowchart LR/i)).toBeInTheDocument();
    expect(mermaidMock.initialize).toHaveBeenCalledWith({ startOnLoad: false, securityLevel: 'strict' });
  });

  it('renders the SVG preview after mermaid renders', async () => {
    const { container } = render(<MermaidExportModal />);

    await waitFor(() => {
      expect(container.querySelector('[data-testid="mermaid-preview"]')).toBeInTheDocument();
    });
    expect(mermaidMock.render).toHaveBeenCalledWith(expect.stringMatching(/^textforge-mermaid-/), expect.stringContaining('flowchart LR'));
  });

  it('close button calls toggleMermaidModal', async () => {
    const user = userEvent.setup();
    const toggleMermaidModal = vi.fn();
    editorStoreMock.state.toggleMermaidModal = toggleMermaidModal;

    render(<MermaidExportModal />);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(toggleMermaidModal).toHaveBeenCalled();
  });

  it('copy button writes mermaid source to clipboard and pushes a toast', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const pushToast = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    editorStoreMock.state.pushToast = pushToast;

    render(<MermaidExportModal />);

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('flowchart LR'));
    });
    expect(pushToast).toHaveBeenCalledWith('Mermaid source copied.', 'info');
  });

  it('save button writes sibling .mmd and .svg files and pushes a success toast', async () => {
    const user = userEvent.setup();
    const pushToast = vi.fn();
    editorStoreMock.state.pushToast = pushToast;

    render(<MermaidExportModal />);

    await waitFor(() => {
      expect(document.querySelector('[data-testid="mermaid-preview"]')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenNthCalledWith(1, 'write_file', {
        path: '/tmp/specs/azure-compute/diagram.mmd',
        content: expect.stringContaining('flowchart LR'),
      });
    });
    expect(invokeMock).toHaveBeenNthCalledWith(2, 'write_file', {
      path: '/tmp/specs/azure-compute/diagram.svg',
      content: '<svg data-testid="mermaid-preview"></svg>',
    });
    expect(pushToast).toHaveBeenCalledWith('Saved Mermaid diagram next to spec.md', 'info');
  });

  it('save without a current path pushes an error toast and does not write files', async () => {
    const user = userEvent.setup();
    const pushToast = vi.fn();
    editorStoreMock.state = {
      ...editorStoreMock.state,
      currentPath: null,
      pushToast,
    };

    render(<MermaidExportModal />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(pushToast).toHaveBeenCalledWith('Open a saved spec before exporting Mermaid files.', 'error');
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('does not update local state after unmount when mermaid render resolves late', async () => {
    const deferred = createDeferred<{ svg: string }>();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mermaidMock.render.mockReturnValueOnce(deferred.promise);

    const { unmount } = render(<MermaidExportModal />);
    unmount();

    deferred.resolve({ svg: '<svg></svg>' });
    await flushPromises();

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});