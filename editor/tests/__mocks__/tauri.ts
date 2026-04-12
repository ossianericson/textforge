import { vi } from 'vitest';

export const invokeMock = vi.fn();
export const openShellMock = vi.fn().mockResolvedValue(undefined);

const responses = new Map<string, unknown>();
const errors = new Map<string, unknown>();

function applyDefaultImplementation() {
  invokeMock.mockImplementation((command: string) => {
    if (errors.has(command)) {
      return Promise.reject(errors.get(command));
    }
    if (responses.has(command)) {
      return Promise.resolve(responses.get(command));
    }
    return Promise.resolve(null);
  });
}

export function setInvokeResponse(command: string, value: unknown) {
  responses.set(command, value);
}

export function setInvokeError(command: string, error: unknown) {
  errors.set(command, error);
}

export function clearInvokeResponses() {
  responses.clear();
  errors.clear();
  invokeMock.mockReset();
  applyDefaultImplementation();
}

applyDefaultImplementation();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn().mockResolvedValue(null),
  save: vi.fn().mockResolvedValue(null),
  ask: vi.fn().mockResolvedValue(true),
}));

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: openShellMock,
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn().mockResolvedValue(''),
  writeTextFile: vi.fn().mockResolvedValue(undefined),
  exists: vi.fn().mockResolvedValue(false),
  watch: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn().mockReturnValue({
    onCloseRequested: vi.fn().mockResolvedValue(() => {}),
    destroy: vi.fn().mockResolvedValue(undefined),
  }),
}));
