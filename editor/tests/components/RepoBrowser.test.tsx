import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RepoBrowser } from '@/components/repo/RepoBrowser';
import { createDeferred, flushPromises } from '../deferred';

const editorStoreMock = vi.hoisted(() => ({
  state: {} as Record<string, any>,
}));

vi.mock('@/store/useEditorStore', () => ({
  useEditorStore: (selector: (state: Record<string, any>) => unknown) => selector(editorStoreMock.state),
}));

describe('RepoBrowser', () => {
  beforeEach(() => {
    editorStoreMock.state = {
      toggleRepoBrowser: vi.fn(),
      connectToRepo: vi.fn().mockResolvedValue(undefined),
      refreshRepoSpecs: vi.fn().mockResolvedValue(undefined),
      openRepoSpec: vi.fn().mockResolvedValue(undefined),
      savedRepoConnections: [],
      repoConnection: null,
      repoSpecs: [],
      pushToast: vi.fn(),
    };
  });

  it('renders the repo browser dialog', () => {
    render(<RepoBrowser />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Repository URL')).toBeInTheDocument();
  });

  it('connect button is disabled until a repository url is entered', async () => {
    const user = userEvent.setup();
    render(<RepoBrowser />);

    const connectButton = screen.getByRole('button', { name: 'Connect' });
    expect(connectButton).toBeDisabled();

    await user.type(screen.getByLabelText('Repository URL'), 'https://github.com/myorg/specs.git');

    expect(connectButton).not.toBeDisabled();
  });

  it('connects using the typed repository url and branch', async () => {
    const user = userEvent.setup();
    const connectToRepo = vi.fn().mockResolvedValue(undefined);
    editorStoreMock.state.connectToRepo = connectToRepo;

    render(<RepoBrowser />);

    await user.type(screen.getByLabelText('Repository URL'), 'https://github.com/myorg/specs.git');
    await user.clear(screen.getByLabelText('Branch'));
    await user.type(screen.getByLabelText('Branch'), 'develop');
    await user.type(screen.getByLabelText('PAT (optional)'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(connectToRepo).toHaveBeenCalledWith('https://github.com/myorg/specs.git', 'develop', 'secret');
    });
  });

  it('filters the repo spec list and opens a selected spec', async () => {
    const user = userEvent.setup();
    const openRepoSpec = vi.fn().mockResolvedValue(undefined);
    editorStoreMock.state.openRepoSpec = openRepoSpec;
    editorStoreMock.state.repoConnection = {
      current_branch: 'main',
    };
    editorStoreMock.state.repoSpecs = [
      { title: 'Azure Compute', kind: 'tree', path: 'decision-trees/azure-compute/spec.md' },
      { title: 'Storage Review', kind: 'quiz', path: 'quiz/storage/spec.md' },
    ];

    render(<RepoBrowser />);

    await user.type(screen.getByLabelText('Filter repo specs'), 'compute');

    expect(screen.getByText('Azure Compute')).toBeInTheDocument();
    expect(screen.queryByText('Storage Review')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() => {
      expect(openRepoSpec).toHaveBeenCalledWith('decision-trees/azure-compute/spec.md');
    });
  });

  it('reconnects from a saved repo connection', async () => {
    const user = userEvent.setup();
    const connectToRepo = vi.fn().mockResolvedValue(undefined);
    editorStoreMock.state.connectToRepo = connectToRepo;
    editorStoreMock.state.savedRepoConnections = [
      {
        url: 'https://github.com/myorg/specs.git',
        branch: 'main',
        local_path: '/tmp/specs',
        last_synced: '2026-03-22T16:00:00.000Z',
      },
    ];

    render(<RepoBrowser />);

    await user.click(screen.getByRole('button', { name: /https:\/\/github.com\/myorg\/specs.git/i }));

    await waitFor(() => {
      expect(connectToRepo).toHaveBeenCalledWith('https://github.com/myorg/specs.git', 'main', undefined);
    });
  });

  it('does not update local state after unmount when connect resolves late', async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<void>();
    editorStoreMock.state.connectToRepo = vi.fn().mockReturnValue(deferred.promise);

    const { unmount } = render(<RepoBrowser />);

    await user.type(screen.getByLabelText('Repository URL'), 'https://github.com/myorg/specs.git');
    await user.click(screen.getByRole('button', { name: 'Connect' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Connecting…' })).toBeDisabled();
    });
    unmount();

    await act(async () => {
      deferred.resolve(undefined);
      await flushPromises();
    });

    await expect(deferred.promise).resolves.toBeUndefined();
  });
});