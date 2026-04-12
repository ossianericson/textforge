import './__mocks__/tauri';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParsedSpec } from '@shared/types';
import { clearInvokeResponses, invokeMock } from './__mocks__/tauri';
import { buildOutputPath } from '../src/lib/compileUtils';
import { specToDoc } from '../src/lib/spec-to-doc';
import { serialize } from '../src/lib/serializer';
import { useEditorStore } from '../src/store/useEditorStore';

const COMPILED_ROOT = 'C:/Users/test/AppData/Local/textforge/compiled';

function createSpec(title: string): ParsedSpec {
  return {
    title: { main: title, subtitle: '' },
    metadata: { version: '1.0.0' },
    questions: {
      q1: {
        title: 'Question one',
        subtitle: '',
        infoBox: null,
        options: [
          {
            text: 'Continue',
            next: 'result-one',
            recommended: false,
            advanced: false,
          },
        ],
      },
    },
    results: {
      'result-one': {
        title: 'Use the standard path',
        icon: 'check',
        badge: { text: 'Recommended', className: 'recommended' },
        bestFor: ['Default path'],
        keyBenefits: ['Fast to apply'],
        considerations: ['Review before rollout'],
        whenNotToUse: ['When an exception is required'],
        techTags: ['policy'],
        docs: [],
        additionalConsiderations: 'None.',
      },
    },
    progressSteps: { q1: 0 },
  };
}

describe('useEditorStore behaviors', () => {
  beforeEach(() => {
    clearInvokeResponses();
    vi.useRealTimers();
    useEditorStore.setState({
      currentPath: null,
      repoRoot: null,
      isDirty: false,
      spec: null,
      parseError: null,
      validationWarnings: [],
      showValidationPanel: false,
      previewHtml: null,
      previewPath: null,
      showPreview: false,
      isCompiling: false,
      compileStatus: null,
      lastCompileError: null,
      history: [],
      editorInstance: null,
      recentFiles: [],
      savedRepoConnections: [],
      repoConnection: null,
      toasts: [],
    });
  });

  it('compiles the opened file on disk and ignores unsaved editor changes', async () => {
    const originalSpec = createSpec('Original title');
    const editedSpec = createSpec('Edited title');
    const writes: Array<{ path: string; content: string }> = [];
    const sidecarCalls: Array<Record<string, any>> = [];

    invokeMock.mockImplementation((command: string, args?: Record<string, any>) => {
      if (command === 'write_file') {
        writes.push({ path: String(args?.path), content: String(args?.content) });
        return Promise.resolve(null);
      }
      if (command === 'run_sidecar') {
        sidecarCalls.push(args ?? {});
        if (args?.name === 'parse-spec') {
          return Promise.resolve(JSON.stringify(originalSpec));
        }
        if (args?.name === 'validate-spec') {
          return Promise.resolve(JSON.stringify([]));
        }
        if (args?.name === 'compile-spec') {
          return Promise.resolve('ok');
        }
      }
      if (command === 'get_compiled_output_root') {
        return Promise.resolve(COMPILED_ROOT);
      }
      if (command === 'read_file') {
        return Promise.resolve(`<!DOCTYPE html><html><body>${'x'.repeat(700)}</body></html>`);
      }
      if (
        command === 'update_window_title' ||
        command === 'update_recent_file' ||
        command === 'set_repo_root'
      ) {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    useEditorStore.setState({
      currentPath: 'C:/workspace/spec.md',
      spec: originalSpec,
      isDirty: false,
      initialContent: serialize(originalSpec),
      editorInstance: {
        getJSON: () => specToDoc(editedSpec),
      } as any,
    });

    await useEditorStore.getState().compile();

    expect(writes).toHaveLength(0);
    expect(sidecarCalls.some((call) => call.name === 'parse-spec' && call.arg1 === 'C:/workspace/spec.md')).toBe(true);
    expect(sidecarCalls.some((call) => call.name === 'compile-spec' && call.arg1 === 'C:/workspace/spec.md')).toBe(true);
    expect(useEditorStore.getState().showPreview).toBe(false);
    expect(useEditorStore.getState().previewPath).toBe(
      buildOutputPath(COMPILED_ROOT, 'C:/workspace/spec.md', 'Original title')
    );
    expect(invokeMock).toHaveBeenCalledWith('open_path_in_file_manager', {
      path: 'C:/Users/test/AppData/Local/textforge/compiled/645f129f',
    });
  });

  it('compiles using the existing markdown file on disk when the editor is clean', async () => {
    const cleanSpec = createSpec('Clean title');
    const writes: Array<{ path: string; content: string }> = [];
    const sidecarCalls: Array<Record<string, any>> = [];

    invokeMock.mockImplementation((command: string, args?: Record<string, any>) => {
      if (command === 'write_file') {
        writes.push({ path: String(args?.path), content: String(args?.content) });
        return Promise.resolve(null);
      }
      if (command === 'run_sidecar') {
        sidecarCalls.push(args ?? {});
        if (args?.name === 'parse-spec') {
          return Promise.resolve(JSON.stringify(cleanSpec));
        }
        if (args?.name === 'validate-spec') {
          return Promise.resolve(JSON.stringify([]));
        }
        if (args?.name === 'compile-spec') {
          return Promise.resolve('ok');
        }
      }
      if (command === 'get_compiled_output_root') {
        return Promise.resolve(COMPILED_ROOT);
      }
      if (command === 'read_file') {
        return Promise.resolve(`<!DOCTYPE html><html><body>${'x'.repeat(700)}</body></html>`);
      }
      if (
        command === 'update_window_title' ||
        command === 'update_recent_file' ||
        command === 'set_repo_root'
      ) {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    useEditorStore.setState({
      currentPath: 'C:/workspace/spec.md',
      spec: cleanSpec,
      isDirty: false,
      initialContent: serialize(cleanSpec),
      editorInstance: {
        getJSON: () => specToDoc(cleanSpec),
      } as any,
    });

    await useEditorStore.getState().compile();

    expect(writes).toHaveLength(0);
    expect(sidecarCalls.some((call) => call.name === 'compile-spec' && call.arg1 === 'C:/workspace/spec.md')).toBe(true);
    expect(useEditorStore.getState().showPreview).toBe(false);
    expect(useEditorStore.getState().previewPath).toBe(
      buildOutputPath(COMPILED_ROOT, 'C:/workspace/spec.md', 'Clean title')
    );
    expect(invokeMock).toHaveBeenCalledWith('open_path_in_file_manager', {
      path: 'C:/Users/test/AppData/Local/textforge/compiled/645f129f',
    });
  });

  it('does not rewrite compiled HTML even when analytics is enabled', async () => {
    const cleanSpec = createSpec('Parity title');
    const writes: Array<{ path: string; content: string }> = [];

    invokeMock.mockImplementation((command: string, args?: Record<string, any>) => {
      if (command === 'write_file') {
        writes.push({ path: String(args?.path), content: String(args?.content) });
        return Promise.resolve(null);
      }
      if (command === 'run_sidecar') {
        if (args?.name === 'parse-spec') {
          return Promise.resolve(JSON.stringify(cleanSpec));
        }
        if (args?.name === 'validate-spec') {
          return Promise.resolve(JSON.stringify([]));
        }
        if (args?.name === 'compile-spec') {
          return Promise.resolve('ok');
        }
      }
      if (command === 'get_compiled_output_root') {
        return Promise.resolve(COMPILED_ROOT);
      }
      if (command === 'read_file') {
        return Promise.resolve(`<!DOCTYPE html><html><body>${'x'.repeat(700)}</body></html>`);
      }
      if (
        command === 'update_window_title' ||
        command === 'update_recent_file' ||
        command === 'set_repo_root'
      ) {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    useEditorStore.setState({
      currentPath: 'C:/workspace/spec.md',
      spec: cleanSpec,
      isDirty: false,
      analyticsEnabled: true,
      initialContent: serialize(cleanSpec),
      editorInstance: {
        getJSON: () => specToDoc(cleanSpec),
      } as any,
    });

    await useEditorStore.getState().compile();

    expect(writes).toHaveLength(0);
    expect(useEditorStore.getState().previewHtml).toBe(`<!DOCTYPE html><html><body>${'x'.repeat(700)}</body></html>`);
    expect(useEditorStore.getState().previewPath).toBe(
      buildOutputPath(COMPILED_ROOT, 'C:/workspace/spec.md', 'Parity title')
    );
    expect(invokeMock).toHaveBeenCalledWith('open_path_in_file_manager', {
      path: 'C:/Users/test/AppData/Local/textforge/compiled/645f129f',
    });
  });

  it('opens files without saving them again during background validation', async () => {
    vi.useFakeTimers();
    const openedSpec = createSpec('Opened file');
    const commands: string[] = [];

    invokeMock.mockImplementation((command: string, args?: Record<string, any>) => {
      commands.push(command === 'run_sidecar' ? `${command}:${String(args?.name)}` : command);
      if (command === 'run_sidecar') {
        if (args?.name === 'parse-spec') {
          return Promise.resolve(JSON.stringify(openedSpec));
        }
        if (args?.name === 'validate-spec') {
          return Promise.resolve(JSON.stringify([{ line: 1, code: 'warn', message: 'Heads up' }]));
        }
      }
      if (command === 'file_exists') {
        return Promise.resolve(false);
      }
      if (command === 'update_recent_file' || command === 'update_window_title') {
        return Promise.resolve(null);
      }
      if (command === 'write_file') {
        throw new Error('openFile should not write the spec during background validation');
      }
      return Promise.resolve(null);
    });

    await useEditorStore.getState().openFile('C:/workspace/spec.md');
    await vi.runAllTimersAsync();

    expect(useEditorStore.getState().currentPath).toBe('C:/workspace/spec.md');
    expect(useEditorStore.getState().validationWarnings).toEqual([
      { line: 1, code: 'warn', message: 'Heads up' },
    ]);
    expect(commands).toContain('run_sidecar:parse-spec');
    expect(commands).toContain('run_sidecar:validate-spec');
    expect(commands).not.toContain('write_file');
  });
});
