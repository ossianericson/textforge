import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const destroyMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const closeMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const askMock = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const onCloseRequestedMock = vi.hoisted(() => vi.fn());
const unlistenMock = vi.hoisted(() => vi.fn());
const editorStoreMock = vi.hoisted(() => ({
  state: {
    isDirty: true,
    flushPendingEditorChanges: vi.fn(),
  },
}));

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    onCloseRequested: onCloseRequestedMock,
    close: closeMock,
    destroy: destroyMock,
  }),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  ask: askMock,
}));

vi.mock('@/store/useEditorStore', () => ({
  useEditorStore: Object.assign(
    (selector?: (state: Record<string, any>) => unknown) =>
      selector ? selector(editorStoreMock.state) : editorStoreMock.state,
    {
      getState: () => editorStoreMock.state,
    }
  ),
}));

import { useWindowCloseGuard } from '@/lib/useWindowCloseGuard';

function TestComponent() {
  useWindowCloseGuard();
  return null;
}

describe('useWindowCloseGuard', () => {
  beforeEach(() => {
    destroyMock.mockClear();
    closeMock.mockClear();
    askMock.mockClear();
    onCloseRequestedMock.mockClear();
    unlistenMock.mockClear();
    onCloseRequestedMock.mockResolvedValue(unlistenMock);
    editorStoreMock.state.isDirty = true;
    editorStoreMock.state.flushPendingEditorChanges.mockReset();
  });

  it('removes the interceptor before destroying the window after confirmation', async () => {
    render(<TestComponent />);

    expect(onCloseRequestedMock).toHaveBeenCalledTimes(1);
    const handler = onCloseRequestedMock.mock.calls[0]?.[0];
    expect(handler).toBeTypeOf('function');

    const preventDefault = vi.fn();
    await handler({ preventDefault });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(askMock).toHaveBeenCalledTimes(1);
    expect(closeMock).not.toHaveBeenCalled();
    expect(unlistenMock).toHaveBeenCalledTimes(1);
    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(unlistenMock.mock.invocationCallOrder[0]).toBeLessThan(
      destroyMock.mock.invocationCallOrder[0]
    );
  });

  it('flushes pending editor changes before deciding whether unsaved work exists', async () => {
    editorStoreMock.state.isDirty = false;
    editorStoreMock.state.flushPendingEditorChanges.mockImplementation(() => {
      editorStoreMock.state.isDirty = true;
    });

    render(<TestComponent />);

    const handler = onCloseRequestedMock.mock.calls[0]?.[0];
    const preventDefault = vi.fn();
    await handler({ preventDefault });

    expect(editorStoreMock.state.flushPendingEditorChanges).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(askMock).toHaveBeenCalledTimes(1);
    expect(unlistenMock).toHaveBeenCalledTimes(1);
    expect(destroyMock).toHaveBeenCalledTimes(1);
  });

  it('removes the interceptor and exits immediately when there are no unsaved changes', async () => {
    editorStoreMock.state.isDirty = false;

    render(<TestComponent />);

    const handler = onCloseRequestedMock.mock.calls[0]?.[0];
    const preventDefault = vi.fn();
    await handler({ preventDefault });

    expect(editorStoreMock.state.flushPendingEditorChanges).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(askMock).not.toHaveBeenCalled();
    expect(unlistenMock).toHaveBeenCalledTimes(1);
    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(closeMock).not.toHaveBeenCalled();
  });
});