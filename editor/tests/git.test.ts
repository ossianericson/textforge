import { beforeEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

describe('git wrappers', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('connectRepo maps arguments to the Tauri command', async () => {
    invokeMock.mockResolvedValue({ local_path: '/tmp/repo' });
    const { connectRepo } = await import('@/lib/git');

    await connectRepo({ url: 'https://example.com/repo.git', branch: 'main', pat: 'secret' });

    expect(invokeMock).toHaveBeenCalledWith('connect_repo', {
      url: 'https://example.com/repo.git',
      branch: 'main',
      pat: 'secret',
    });
  });

  it('commitAndPush forwards the commit payload', async () => {
    invokeMock.mockResolvedValue({ commit_oid: 'abc123' });
    const { commitAndPush } = await import('@/lib/git');

    await commitAndPush({
      localPath: '/tmp/repo',
      specPath: 'decision-trees/public/sample/spec.md',
      content: '# Demo',
      message: 'Update spec',
      branch: 'feature/demo',
      pat: 'secret',
      createPullRequest: true,
    });

    expect(invokeMock).toHaveBeenCalledWith('commit_and_push', {
      localPath: '/tmp/repo',
      specPath: 'decision-trees/public/sample/spec.md',
      content: '# Demo',
      message: 'Update spec',
      branch: 'feature/demo',
      pat: 'secret',
      createPullRequest: true,
    });
  });
});
