import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompileErrorBanner } from '@/components/shared/CompileErrorBanner';

const storeMock = vi.hoisted(() => ({ state: {} as Record<string, any> }));

vi.mock('@/store/useEditorStore', () => ({
  useEditorStore: Object.assign(
    (selector: (state: Record<string, any>) => unknown) => selector(storeMock.state),
    { getState: () => storeMock.state, setState: vi.fn() }
  ),
}));

describe('CompileErrorBanner', () => {
  beforeEach(() => {
    storeMock.state = {
      lastCompileError: null,
      isCompiling: false,
      compile: vi.fn(),
    };
  });

  it('renders nothing when lastCompileError is null', () => {
    const { container } = render(<CompileErrorBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the error message', () => {
    storeMock.state.lastCompileError = 'Your spec has no questions.';

    render(<CompileErrorBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/your spec has no questions/i)).toBeInTheDocument();
  });

  it('Retry calls compile()', async () => {
    storeMock.state.lastCompileError = 'Something failed.';

    render(<CompileErrorBanner />);

    await userEvent.setup().click(screen.getByRole('button', { name: /retry/i }));

    expect(storeMock.state.compile).toHaveBeenCalled();
  });

  it('Retry is disabled while compiling', () => {
    storeMock.state.lastCompileError = 'Something failed.';
    storeMock.state.isCompiling = true;

    render(<CompileErrorBanner />);

    expect(screen.getByRole('button', { name: /retry/i })).toBeDisabled();
  });
});