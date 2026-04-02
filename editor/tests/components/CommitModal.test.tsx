import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommitModal } from '@/components/repo/CommitModal';
import { createDeferred, flushPromises } from '../deferred';

const editorStoreMock = vi.hoisted(() => ({
  state: {} as Record<string, any>,
}));

vi.mock('@/store/useEditorStore', () => ({
  useEditorStore: (selector: (state: Record<string, any>) => unknown) => selector(editorStoreMock.state),
}));

describe('CommitModal', () => {
  beforeEach(() => {
    editorStoreMock.state = {
      toggleCommitModal: vi.fn(),
      repoConnection: {
        current_branch: 'main',
        branch: 'main',
      },
      commitCurrentSpec: vi.fn().mockResolvedValue(null),
      pushToast: vi.fn(),
    };
  });

  it('renders the commit dialog', () => {
    render(<CommitModal />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Save and Commit' })).toBeInTheDocument();
  });

  it('disables the submit button when the message is cleared', async () => {
    const user = userEvent.setup();
    render(<CommitModal />);

    const messageInput = screen.getByLabelText('Commit message');
    const commitButton = screen.getByRole('button', { name: 'Save and Commit' });

    expect(commitButton).not.toBeDisabled();

    await user.clear(messageInput);

    expect(commitButton).toBeDisabled();
  });

  it('calls commitCurrentSpec with the typed values', async () => {
    const user = userEvent.setup();
    const commitCurrentSpec = vi.fn().mockResolvedValue({
      pull_request_url: 'https://example.com/pr/123',
    });
    editorStoreMock.state.commitCurrentSpec = commitCurrentSpec;

    render(<CommitModal />);

    await user.clear(screen.getByLabelText('Commit message'));
    await user.type(screen.getByLabelText('Commit message'), 'feat: update editor tests');
    await user.clear(screen.getByLabelText('Branch'));
    await user.type(screen.getByLabelText('Branch'), 'feature/component-tests');
    await user.type(screen.getByLabelText('PAT (optional)'), 'secret');
    await user.click(screen.getByRole('checkbox', { name: /create a pull request link after push/i }));
    await user.click(screen.getByRole('button', { name: 'Save and Commit' }));

    await waitFor(() => {
      expect(commitCurrentSpec).toHaveBeenCalledWith(
        'feat: update editor tests',
        'feature/component-tests',
        'secret',
        true
      );
    });
    expect(screen.getByRole('status')).toHaveTextContent('https://example.com/pr/123');
  });

  it('pushes a toast when the commit fails', async () => {
    const user = userEvent.setup();
    const pushToast = vi.fn();
    editorStoreMock.state.pushToast = pushToast;
    editorStoreMock.state.commitCurrentSpec = vi.fn().mockRejectedValue(new Error('Authentication failed'));

    render(<CommitModal />);

    await user.click(screen.getByRole('button', { name: 'Save and Commit' }));

    await waitFor(() => {
      expect(pushToast).toHaveBeenCalledWith('Authentication failed', 'error');
    });
  });

  it('close and cancel buttons both close the modal', async () => {
    const user = userEvent.setup();
    const toggleCommitModal = vi.fn();
    editorStoreMock.state.toggleCommitModal = toggleCommitModal;

    render(<CommitModal />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(toggleCommitModal).toHaveBeenNthCalledWith(1, false);
    expect(toggleCommitModal).toHaveBeenNthCalledWith(2, false);
  });

  it('does not update local state after unmount when commit resolves late', async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<{ pull_request_url: string | null } | null>();
    editorStoreMock.state.commitCurrentSpec = vi.fn().mockReturnValue(deferred.promise);

    const { unmount } = render(<CommitModal />);

    await user.click(screen.getByRole('button', { name: 'Save and Commit' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Committing…' })).toBeDisabled();
    });
    unmount();

    await act(async () => {
      deferred.resolve({ pull_request_url: 'https://example.com/pr/late' });
      await flushPromises();
    });

    await expect(deferred.promise).resolves.toEqual({ pull_request_url: 'https://example.com/pr/late' });
  });
});