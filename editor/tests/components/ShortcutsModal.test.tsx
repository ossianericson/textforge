import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ShortcutsModal } from '@/components/shared/ShortcutsModal';

describe('ShortcutsModal', () => {
  it('renders when open', () => {
    render(<ShortcutsModal open={true} onClose={vi.fn()} />);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Quick references for the editor shell.')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ShortcutsModal open={false} onClose={vi.fn()} />);

    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('lists representative keyboard shortcuts', () => {
    render(<ShortcutsModal open={true} onClose={vi.fn()} />);

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+O / Cmd+O')).toBeInTheDocument();
    expect(screen.getByText('Create with AI')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+G / Cmd+G')).toBeInTheDocument();
  });

  it('close button calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ShortcutsModal open={true} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });
});