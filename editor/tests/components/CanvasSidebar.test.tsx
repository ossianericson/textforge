import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { CanvasSidebar } from '@/components/sidebar/CanvasSidebar';

describe('CanvasSidebar', () => {
  beforeEach(() => {
    generateMermaidMock.mockReturnValue('flowchart LR\n  q1([Start]) --> result_a{{Result}}');
    mermaidMock.initialize.mockReset();
    mermaidMock.render.mockReset();
    mermaidMock.render.mockResolvedValue({ svg: '<svg data-testid="sidebar-mermaid"></svg>' });
    editorStoreMock.state = {
      spec: {
        title: { main: 'Example', subtitle: '' },
        metadata: { version: '1.0.0' },
        questions: {},
        results: {},
        progressSteps: {},
      },
    };
  });

  async function renderCanvasSidebar() {
    await act(async () => {
      render(<CanvasSidebar />);
      await Promise.resolve();
    });
  }

  it('renders the Mermaid panel and zoom controls', async () => {
    await renderCanvasSidebar();

    expect(screen.getByText('Live graph')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-sidebar-body')).toHaveClass('flex-1');
    expect(screen.getByTestId('canvas-sidebar-body')).toHaveClass('min-h-0');
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fit to screen' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('sidebar-mermaid')).toBeInTheDocument();
    });
  });

  it('keeps controls interactive after render', async () => {
    const user = userEvent.setup();
    await renderCanvasSidebar();

    await waitFor(() => {
      expect(screen.getByTestId('sidebar-mermaid')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    await user.click(screen.getByRole('button', { name: 'Fit to screen' }));

    expect(screen.getByTestId('sidebar-mermaid')).toBeInTheDocument();
  });
});