import { invoke } from '@tauri-apps/api/core';
import { open as dialogOpen, save as dialogSave } from '@tauri-apps/plugin-dialog';
import type { JSONContent } from '@tiptap/core';
import type { Editor } from '@tiptap/react';
import { create } from 'zustand';
import {
  buildOutputPath,
  friendlyCompileError,
  getParentPath,
  isPathInside,
  isValidCompiledHtml,
  normalizePath,
} from '@/lib/compileUtils';
import { docToSpec } from '@/lib/doc-to-spec';
import {
  commitAndPush,
  connectRepo,
  listRepoSpecs,
  listSavedConnections,
  pullLatest,
} from '@/lib/git';
import { buildNewQuestionNode, buildNewResultNode, createBlankSpec } from '@/lib/doc-model';
import { emitEvent } from '@/lib/editorEvents';
import { parseParsedSpec, parseValidationWarnings } from '@/lib/parser';
import { serialize } from '@/lib/serializer';
import { specToDoc } from '@/lib/spec-to-doc';
import { systemLog } from '@/lib/systemLog';
import type {
  AIProvider,
  AIStatus,
  AIReviewIssue,
  CommitResult,
  ParsedSpec,
  ProgressSteps,
  RecentFile,
  RepoConnection,
  RepoSpecEntry,
  Result,
  SavedRepoConnection,
  ToastItem,
  ValidationWarning,
} from '@shared/types';

interface EditorPrefs {
  analytics_enabled: boolean;
  auto_save_enabled: boolean;
  template_customize_dismissed: boolean;
}

interface EditorStore {
  currentPath: string | null;
  repoRoot: string | null;
  isAiConfigured: boolean;
  aiProvider: AIProvider;
  aiAccount: string | null;
  isOpening: boolean;
  openingStatus: string | null;
  isDirty: boolean;
  initialContent: string | null;
  spec: ParsedSpec | null;
  parseError: string | null;
  validationWarnings: ValidationWarning[];
  showValidationPanel: boolean;
  showProgressPanel: boolean;
  previewHtml: string | null;
  previewPath: string | null;
  isCompiling: boolean;
  compileStatus: string | null;
  lastCompileError: string | null;
  envReady: boolean | null;
  envWarning: string | null;
  showPreview: boolean;
  toasts: ToastItem[];
  history: ParsedSpec[];
  editorInstance: Editor | null;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  showMermaidModal: boolean;
  showGenerateModal: boolean;
  aiReviewIssues: AIReviewIssue[];
  showDashboard: boolean;
  showSettingsModal: boolean;
  recentFiles: RecentFile[];
  autoSaveEnabled: boolean;
  analyticsEnabled: boolean;
  showOnboardingTour: boolean;
  showShortcutsModal: boolean;
  templateCustomizeDismissed: boolean;
  showTemplateCustomizeBanner: boolean;
  showRepoBrowser: boolean;
  showCommitModal: boolean;
  repoConnection: RepoConnection | null;
  savedRepoConnections: SavedRepoConnection[];
  repoSpecs: RepoSpecEntry[];
  flushPendingEditorChanges: () => boolean;
  openFile: (path?: string) => Promise<void>;
  createNewSpec: () => Promise<void>;
  saveFile: () => Promise<void>;
  saveFileAs: () => Promise<void>;
  setAiStatus: (status: AIStatus) => void;
  setDirty: () => void;
  clearDirty: () => void;
  reloadFile: () => Promise<void>;
  updateProgressStep: (id: string, value: number) => void;
  addQuestion: () => void;
  addResult: () => void;
  undo: () => void;
  compile: () => Promise<void>;
  validate: () => Promise<void>;
  openCompiledOutput: () => Promise<void>;
  openCompiledOutputFolder: () => Promise<void>;
  togglePreview: () => void;
  setPreviewOpen: (open: boolean) => void;
  toggleValidationPanel: () => void;
  toggleProgressPanel: () => void;
  pushToast: (message: string, level: ToastItem['level']) => void;
  dismissToast: (id: string) => void;
  setEditorInstance: (editor: Editor | null) => void;
  updateSpecFromDoc: (doc: JSONContent) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleMermaidModal: () => void;
  toggleGenerateModal: () => void;
  openFromGeneratedSpec: (spec: ParsedSpec) => void;
  openFromGeneratedQuiz: (quiz: object) => void;
  setAIReviewIssues: (issues: AIReviewIssue[]) => void;
  updateResult: (resultId: string, patch: Partial<Result>) => void;
  toggleDashboard: () => void;
  toggleSettingsModal: () => void;
  loadRecentFiles: () => Promise<void>;
  checkEnv: () => Promise<void>;
  setAutoSave: (enabled: boolean) => void;
  setAnalytics: (enabled: boolean) => void;
  toggleOnboardingTour: (open?: boolean) => void;
  toggleShortcutsModal: (open?: boolean) => void;
  loadEditorPrefs: () => Promise<void>;
  saveEditorPrefs: () => Promise<void>;
  dismissTemplateCustomizeBanner: (permanent?: boolean) => void;
  showTemplateBanner: () => void;
  toggleRepoBrowser: (open?: boolean) => void;
  toggleCommitModal: (open?: boolean) => void;
  loadSavedRepoConnections: () => Promise<void>;
  connectToRepo: (url: string, branch?: string, pat?: string) => Promise<void>;
  refreshRepoSpecs: (pat?: string) => Promise<void>;
  openRepoSpec: (specPath: string) => Promise<void>;
  commitCurrentSpec: (
    message: string,
    branch?: string,
    pat?: string,
    createPullRequest?: boolean
  ) => Promise<CommitResult | null>;
}

let toastCounter = 0;
let docUpdateTimer: number = 0;

type EditorStoreSetter = (
  partial: EditorStore | Partial<EditorStore> | ((state: EditorStore) => EditorStore | Partial<EditorStore>),
  replace?: boolean
) => void;

type EditorStoreGetter = () => EditorStore;

function cloneSpec(spec: ParsedSpec): ParsedSpec {
  return JSON.parse(JSON.stringify(spec)) as ParsedSpec;
}

function relativeRepoPath(root: string, fullPath: string): string | null {
  if (!isPathInside(root, fullPath)) {
    return null;
  }
  return normalizePath(fullPath).slice(normalizePath(root).length).replace(/^\//, '');
}

function buildRecentFile(
  spec: ParsedSpec,
  path: string,
  warningCount: number,
  existing?: RecentFile
): RecentFile {
  return {
    path,
    title: spec.title.main,
    lastOpened: Date.now(),
    lastCompiled: existing?.lastCompiled ?? 0,
    questionCount: Object.keys(spec.questions).length,
    resultCount: Object.keys(spec.results).length,
    warningCount,
    usageCount: existing?.usageCount ?? 0,
  };
}

function serializeSpecSnapshot(spec: ParsedSpec): string {
  return serialize(spec);
}

function computeDirtyState(initialContent: string | null, currentContent: string): boolean {
  return initialContent === null ? true : currentContent !== initialContent;
}

function nextQuestionId(progressSteps: ProgressSteps, questions: ParsedSpec['questions']): string {
  const ids = [...Object.keys(progressSteps), ...Object.keys(questions)];
  const maxNumber = ids.reduce((currentMax, id) => {
    const match = id.match(/^q(\d+)/i);
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);
  return `q${maxNumber + 1}`;
}

function nextResultId(results: ParsedSpec['results']): string {
  const ids = Object.keys(results);
  let nextNumber = ids.length + 1;
  while (results[`result-new-${nextNumber}`]) {
    nextNumber += 1;
  }
  return `result-new-${nextNumber}`;
}

async function findRepoRoot(specPath: string): Promise<string | null> {
  const parts = specPath.replace(/\\/g, '/').split('/');
  for (let index = parts.length - 1; index > 0; index -= 1) {
    const candidate = parts.slice(0, index).join('/');
    if (!candidate) {
      continue;
    }
    try {
      const exists = await invoke<boolean>('file_exists', { path: `${candidate}/core/badges.yml` });
      if (exists) {
        return candidate;
      }
    } catch {
      // Ignore and keep walking upward.
    }
  }
  return null;
}

async function checkEnvironment(): Promise<{ ok: boolean; message: string | null }> {
  try {
    const result = await invoke<string>('run_sidecar', {
      name: 'parse-spec',
      arg1: '/textforge-env-probe-nonexistent-path-12345.md',
      arg2: null,
    });

    if (
      result.includes('error') ||
      result.includes('No spec path') ||
      result.includes('ENOENT')
    ) {
      return { ok: true, message: null };
    }

    return { ok: true, message: null };
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    const normalized = raw.toLowerCase();

    if (
      normalized.includes('tsx not found') ||
      normalized.includes('npm install') ||
      normalized.includes('local tsx cli')
    ) {
      return {
        ok: false,
        message:
          'tsx is not installed. Open a terminal in the editor/ directory and run: npm install - then restart.',
      };
    }
    if (
      normalized.includes('failed to start') ||
      normalized.includes('failed to spawn') ||
      normalized.includes('node') ||
      normalized.includes('enoent')
    ) {
      return {
        ok: false,
        message:
          'Node.js could not be started. Ensure Node.js 22 or later is installed and visible in your PATH.',
      };
    }
    if (normalized.includes('file path must be absolute')) {
      return { ok: true, message: null };
    }

    return {
      ok: false,
      message: `Compiler environment check failed: ${raw.slice(0, 200)}`,
    };
  }
}

function pushHistory(current: ParsedSpec, history: ParsedSpec[]): ParsedSpec[] {
  return [...history.slice(-49), cloneSpec(current)];
}

function buildRepoConnection(saved: SavedRepoConnection): RepoConnection {
  return {
    ...saved,
    current_branch: saved.branch,
  };
}

async function promptSpecPath(defaultPath = 'spec.md'): Promise<string | null> {
  const selectedPath = await dialogSave({
    filters: [{ name: 'Markdown spec', extensions: ['md'] }],
    defaultPath,
  });
  return typeof selectedPath === 'string' ? selectedPath : null;
}

function normalizeAiProvider(provider: string): AIProvider {
  if (provider === 'azure' || provider === 'openai' || provider === 'custom') {
    return provider;
  }

  return 'none';
}

async function confirmDiscardUnsavedChanges(isDirty: boolean): Promise<boolean> {
  if (!isDirty) {
    return true;
  }

  const { ask } = await import('@tauri-apps/plugin-dialog');
  return ask('You have unsaved changes. Open a different file anyway?', {
    title: 'Unsaved changes',
    kind: 'warning',
  });
}

function dispatchFileSaved(path: string): void {
  window.dispatchEvent(new CustomEvent('textforge:file-saved'));
  emitEvent('file.saved', 'file', { path });
  systemLog('info', 'file', 'File saved', { detail: path, success: true });
}

async function persistCurrentSpecToDisk(
  set: EditorStoreSetter,
  get: EditorStoreGetter,
  options: { forcePrompt: boolean }
): Promise<{ path: string; spec: ParsedSpec } | null> {
  get().flushPendingEditorChanges();

  const { spec, currentPath } = get();
  if (!spec) {
    return null;
  }

  const targetPath = options.forcePrompt
    ? await promptSpecPath(currentPath ?? 'spec.md')
    : currentPath ?? (await promptSpecPath('spec.md'));

  if (!targetPath) {
    return null;
  }

  const serializedSpec = serializeSpecSnapshot(spec);

  await invoke('write_file', { path: targetPath, content: serializedSpec });

  const repoRoot = await findRepoRoot(targetPath);
  if (repoRoot) {
    await invoke('set_repo_root', { path: repoRoot }).catch(() => {});
  }

  set({
    currentPath: targetPath,
    repoRoot,
    lastCompileError: null,
    initialContent: serializedSpec,
    isDirty: false,
  });
  dispatchFileSaved(targetPath);
  await invoke('update_window_title', { title: spec.title.main, dirty: false }).catch(() => {});

  return { path: targetPath, spec };
}

function flushPendingEditorChangesNow(
  set: EditorStoreSetter,
  get: EditorStoreGetter
): boolean {
  clearTimeout(docUpdateTimer);

  const currentSpec = get().spec;
  const editorInstance = get().editorInstance;
  if (!currentSpec || !editorInstance) {
    return false;
  }

  try {
    const nextSpec = docToSpec(editorInstance.getJSON(), currentSpec);
    const nextSerialized = serializeSpecSnapshot(nextSpec);
    if (nextSerialized === serializeSpecSnapshot(currentSpec)) {
      return false;
    }

    const previous = currentSpec;
    const isDirty = computeDirtyState(get().initialContent, nextSerialized);
    set((state) => ({
      spec: nextSpec,
      isDirty,
      history: pushHistory(previous, state.history),
    }));
    void invoke('update_window_title', { title: nextSpec.title.main, dirty: isDirty }).catch(
      () => {}
    );
    return true;
  } catch {
    return false;
  }
}

async function runValidationSidecar(
  path: string,
  options: { revealPanel: boolean; notify: boolean }
): Promise<ValidationWarning[]> {
  const raw = await invoke<string>('run_sidecar', {
    name: 'validate-spec',
    arg1: path,
    arg2: null,
  });
  const warnings = parseValidationWarnings(raw).sort(
    (left, right) => left.line - right.line || left.code.localeCompare(right.code)
  );

  if (options.revealPanel) {
    systemLog('info', 'validate', 'Validation completed', {
      detail: `${warnings.length} warnings`,
      success: true,
    });
    emitEvent('validate.completed', 'validate', { warnings: warnings.length });
  }

  return warnings;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  currentPath: null,
  repoRoot: null,
  isAiConfigured: false,
  aiProvider: 'none',
  aiAccount: null,
  isOpening: false,
  openingStatus: null,
  isDirty: false,
  initialContent: null,
  spec: null,
  parseError: null,
  validationWarnings: [],
  showValidationPanel: false,
  showProgressPanel: false,
  previewHtml: null,
  previewPath: null,
  isCompiling: false,
  compileStatus: null,
  lastCompileError: null,
  envReady: null,
  envWarning: null,
  showPreview: false,
  toasts: [],
  history: [],
  editorInstance: null,
  sidebarCollapsed: false,
  sidebarWidth: 360,
  showMermaidModal: false,
  showGenerateModal: false,
  aiReviewIssues: [],
  showDashboard: false,
  showSettingsModal: false,
  recentFiles: [],
  autoSaveEnabled: true,
  analyticsEnabled: false,
  showOnboardingTour: false,
  showShortcutsModal: false,
  templateCustomizeDismissed: false,
  showTemplateCustomizeBanner: false,
  showRepoBrowser: false,
  showCommitModal: false,
  repoConnection: null,
  savedRepoConnections: [],
  repoSpecs: [],

  flushPendingEditorChanges: () => flushPendingEditorChangesNow(set, get),

  setAiStatus: (status) =>
    set({
      isAiConfigured: status.ok,
      aiProvider: status.ok ? normalizeAiProvider(status.provider) : 'none',
      aiAccount: status.ok ? status.account ?? null : null,
    }),

  setDirty: () => {
    const spec = get().spec;
    if (!spec) {
      set({ isDirty: true });
      return;
    }

    const currentContent = serializeSpecSnapshot(spec);
    set({ isDirty: computeDirtyState(get().initialContent, currentContent) });
  },

  clearDirty: () => {
    const spec = get().spec;
    if (!spec) {
      set({ isDirty: false });
      return;
    }

    set({ initialContent: serializeSpecSnapshot(spec), isDirty: false });
  },

  reloadFile: async () => {
    const path = get().currentPath;
    if (!path) {
      return;
    }

    try {
      set({ isOpening: true, openingStatus: 'Reloading spec...' });
      const raw = await invoke<string>('read_file', { path });
      const spec = parseParsedSpec(raw);
      set({
        spec,
        isDirty: false,
        initialContent: serializeSpecSnapshot(spec),
        parseError: null,
        history: [],
      });
      emitEvent('file.reloaded', 'file', { path });
      systemLog('info', 'file', 'File reloaded from disk', { detail: path, success: true });
      await invoke('update_window_title', { title: spec.title.main, dirty: false }).catch(() => {});
    } catch (error) {
      get().pushToast(
        error instanceof Error ? error.message : 'Failed to reload file.',
        'error'
      );
    } finally {
      set({ isOpening: false, openingStatus: null });
    }
  },

  openFile: async (providedPath?: string) => {
    get().flushPendingEditorChanges();

    let path = providedPath;
    if (!path) {
      const selected = await dialogOpen({
        filters: [{ name: 'Markdown spec', extensions: ['md'] }],
        multiple: false,
      });
      if (!selected || typeof selected !== 'string') {
        return;
      }
      path = selected;
    }

    set({ isOpening: true, openingStatus: 'Opening spec...' });

    try {
      if (!(await confirmDiscardUnsavedChanges(get().isDirty))) {
        return;
      }

      set({ openingStatus: 'Parsing spec...' });
      const raw = await invoke<string>('run_sidecar', {
        name: 'parse-spec',
        arg1: path,
        arg2: null,
      });
      const parsed = parseParsedSpec(raw);
      const initialContent = serializeSpecSnapshot(parsed);
      const repoRoot = await findRepoRoot(path);
      if (repoRoot) {
        await invoke('set_repo_root', { path: repoRoot }).catch(() => {});
      }
      const matchedConnection = get().savedRepoConnections.find((item) =>
        isPathInside(item.local_path, path)
      );
      set({
        spec: parsed,
        currentPath: path,
        repoRoot,
        repoConnection: matchedConnection
          ? buildRepoConnection(matchedConnection)
          : get().repoConnection,
        isDirty: false,
        initialContent,
        parseError: null,
        validationWarnings: [],
        aiReviewIssues: [],
        previewHtml: null,
        previewPath: null,
        showPreview: false,
        lastCompileError: null,
        history: [],
      });
      const existing = get().recentFiles.find((item) => item.path === path);
      const recentFile = buildRecentFile(parsed, path, 0, existing);
      await invoke('update_recent_file', { file: recentFile });
      set((state) => ({
        recentFiles: [
          recentFile,
          ...state.recentFiles.filter((item) => item.path !== recentFile.path),
        ],
      }));
      await invoke('update_window_title', { title: parsed.title.main, dirty: false });
      window.setTimeout(() => {
        void runValidationSidecar(path, { revealPanel: false, notify: false })
          .then((warnings) => {
            if (get().currentPath !== path || get().isDirty) {
              return;
            }
            set({ validationWarnings: warnings });
          })
          .catch(() => {});
      }, 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ parseError: message });
      get().pushToast(`Failed to open: ${message}`, 'error');
    } finally {
      set({ isOpening: false, openingStatus: null });
    }
  },

  createNewSpec: async () => {
    get().flushPendingEditorChanges();

    if (!(await confirmDiscardUnsavedChanges(get().isDirty))) {
      return;
    }

    const nextSpec = createBlankSpec();
    const editorInstance = get().editorInstance;
    set({
      spec: nextSpec,
      currentPath: null,
      repoRoot: null,
      repoConnection: null,
      isDirty: true,
      initialContent: null,
      parseError: null,
      validationWarnings: [],
      aiReviewIssues: [],
      previewHtml: null,
      previewPath: null,
      showPreview: false,
      history: [],
      showDashboard: false,
    });
    if (editorInstance) {
      editorInstance.commands.setContent(specToDoc(nextSpec), false);
      editorInstance.commands.focus('start');
    }
    void invoke('update_window_title', { title: nextSpec.title.main, dirty: true }).catch(() => {});
    get().pushToast('Started a blank decision tree.', 'info');
  },

  saveFile: async () => {
    if (!get().spec) {
      return;
    }

    try {
      const saved = await persistCurrentSpecToDisk(set, get, { forcePrompt: false });
      if (!saved) {
        return;
      }
      get().pushToast('Saved', 'info');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      get().pushToast(`Save failed: ${message}`, 'error');
    }
  },

  saveFileAs: async () => {
    if (!get().spec) {
      return;
    }

    try {
      const saved = await persistCurrentSpecToDisk(set, get, { forcePrompt: true });
      if (!saved) {
        return;
      }
      get().pushToast('Saved', 'info');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      get().pushToast(`Save As failed: ${message}`, 'error');
    }
  },

  updateProgressStep: (id, value) => {
    const { spec, history, initialContent } = get();
    if (!spec) {
      return;
    }
    const nextSpec = {
      ...spec,
      progressSteps: { ...spec.progressSteps, [id]: value },
    };
    const nextContent = serializeSpecSnapshot(nextSpec);
    set({
      spec: nextSpec,
      isDirty: computeDirtyState(initialContent, nextContent),
      history: pushHistory(spec, history),
    });
  },

  addQuestion: () => {
    const { spec, editorInstance } = get();
    if (!spec || !editorInstance) {
      return;
    }
    const id = nextQuestionId(spec.progressSteps, spec.questions);
    editorInstance.commands.insertContent(buildNewQuestionNode(id, 50));
    editorInstance.commands.focus('end');
  },

  addResult: () => {
    const { spec, editorInstance } = get();
    if (!spec || !editorInstance) {
      return;
    }
    const id = nextResultId(spec.results);
    editorInstance.commands.insertContent(buildNewResultNode(id));
    editorInstance.commands.focus('end');
  },

  undo: () => {
    const { history, editorInstance, initialContent } = get();
    if (!history.length) {
      return;
    }
    const previous = history[history.length - 1]!;
    set({
      spec: previous,
      history: history.slice(0, -1),
      isDirty: computeDirtyState(initialContent, serializeSpecSnapshot(previous)),
    });
    if (editorInstance) {
      editorInstance.commands.setContent(specToDoc(previous), false);
    }
  },

  compile: async () => {
    if (get().isCompiling) {
      get().pushToast('Already compiling - please wait.', 'warn');
      return;
    }

    const { currentPath, recentFiles, envReady, isDirty } = get();

    if (!currentPath) {
      get().pushToast('Save the spec to disk before compiling. UI compile only runs against the saved markdown file.', 'warn');
      return;
    }

    if (envReady === false) {
      get().pushToast(
        'Environment warning - compile may fail. See the warning banner for details.',
        'warn'
      );
    }

    const startTime = Date.now();
    set({ isCompiling: true, compileStatus: 'Reading saved file...', lastCompileError: null });
    emitEvent('compile.started', 'compile', { path: currentPath });
    systemLog('info', 'compile', 'Compile started', { detail: currentPath });

    try {
      const workingPath = currentPath;
      const rawParsed = await invoke<string>('run_sidecar', {
        name: 'parse-spec',
        arg1: workingPath,
        arg2: null,
      });
      const compiledSpec = parseParsedSpec(rawParsed);
      const questionCount = Object.keys(compiledSpec.questions).length;
      const resultCount = Object.keys(compiledSpec.results).length;

      if (questionCount === 0) {
        const message = 'No questions found in the saved markdown file. Add at least one question block and save before compiling.';
        set({ lastCompileError: message, showValidationPanel: true });
        get().pushToast(message, 'warn');
        return;
      }

      if (resultCount === 0) {
        const message = 'No result cards found in the saved markdown file. Add at least one result card and save before compiling.';
        set({ lastCompileError: message, showValidationPanel: true });
        get().pushToast(message, 'warn');
        return;
      }

      let outputPath: string;
      try {
        const compiledOutputRoot = await invoke<string>('get_compiled_output_root');
        outputPath = buildOutputPath(compiledOutputRoot, workingPath, compiledSpec.title.main);
      } catch (pathError) {
        throw new Error(
          `Cannot compute output path: ${pathError instanceof Error ? pathError.message : String(pathError)}`
        );
      }

      set({ compileStatus: 'Validating...' });
      emitEvent('compile.validating', 'compile', {});
      try {
        const freshWarnings = await runValidationSidecar(workingPath, {
          revealPanel: false,
          notify: false,
        });
        set({ validationWarnings: freshWarnings });
      } catch {
        // Non-fatal. Compilation still proceeds.
      }

      set({ compileStatus: 'Compiling...' });
      emitEvent('compile.compiling', 'compile', {});

      const compileTimeoutMs = 60_000;
      const sidecarCall = invoke<string>('run_sidecar', {
        name: 'compile-spec',
        arg1: workingPath,
        arg2: outputPath,
      });

      let timeoutId: number | undefined;
      const timeoutFence = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(
            new Error(
              `Compile did not finish within ${compileTimeoutMs / 1000}s. The UI has been unfrozen. Try again - if this repeats on every compile, run 'npm run compile' from the terminal to see the raw error.`
            )
          );
        }, compileTimeoutMs);
      });

      let raw: string;
      try {
        raw = await Promise.race([sidecarCall, timeoutFence]);
      } finally {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
      }

      if (raw.trim().startsWith('{')) {
        const parsed = JSON.parse(raw.trim()) as { error?: string };
        if (parsed.error) {
          throw new Error(parsed.error);
        }
      }

      set({ compileStatus: 'Loading preview...' });
      emitEvent('compile.verifying', 'compile', {});

      const html = await invoke<string>('read_file', { path: outputPath });
      if (!isValidCompiledHtml(html)) {
        throw new Error(
          'output empty or invalid html - the compiler ran but produced an incomplete document. This may mean the spec structure has an issue. Run Validate (Tools -> Validate) to check for warnings.'
        );
      }

      const currentWarnings = get().validationWarnings;
      const existing = recentFiles.find((item) => item.path === workingPath);
      const recentFile: RecentFile = {
        ...buildRecentFile(compiledSpec, workingPath, currentWarnings.length, existing),
        lastCompiled: Date.now(),
      };
      await invoke('update_recent_file', { file: recentFile });

      const duration = Date.now() - startTime;
      emitEvent('compile.completed', 'compile', {
        path: outputPath,
        questions: questionCount,
        results: resultCount,
        duration_ms: duration,
      });
      systemLog('info', 'compile', 'Compile completed', {
        detail: outputPath,
        success: true,
        duration_ms: duration,
      });
      set((state) => ({
        previewHtml: html,
        previewPath: outputPath,
        showPreview: false,
        lastCompileError: null,
        recentFiles: [recentFile, ...state.recentFiles.filter((item) => item.path !== workingPath)],
      }));

      set({ compileStatus: 'Opening output folder...' });
      try {
        await invoke('open_path_in_file_manager', { path: getParentPath(outputPath) });
      } catch (openError) {
        get().pushToast(
          `Compiled successfully, but could not open the output folder: ${openError instanceof Error ? openError.message : String(openError)}`,
          'warn'
        );
      }

      get().pushToast(
        currentWarnings.length === 0
          ? `Compiled and opened the output folder - ${questionCount} questions, ${resultCount} results.`
          : `Compiled and opened the output folder - ${questionCount} questions, ${resultCount} results, ${currentWarnings.length} warning(s).`,
        currentWarnings.length === 0 ? 'info' : 'warn'
      );
      if (isDirty) {
        get().pushToast('Compiled the saved markdown file on disk. Unsaved editor changes were ignored.', 'info');
      }
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      const friendly = friendlyCompileError(raw);
      set({ lastCompileError: friendly, showValidationPanel: true });
      emitEvent('compile.failed', 'compile', { error: friendly });
      systemLog('error', 'compile', 'Compile failed', {
        detail: friendly,
        success: false,
        duration_ms: Date.now() - startTime,
      });
      get().pushToast(`Compile failed: ${friendly}`, 'error');
    } finally {
      set({ isCompiling: false, compileStatus: null });
    }
  },

  validate: async () => {
    get().flushPendingEditorChanges();

    const { spec, isDirty, currentPath } = get();

    if (!spec) {
      get().pushToast('Open or create a spec before validating.', 'warn');
      return;
    }

    let workingPath = currentPath;
    if (!workingPath) {
      get().pushToast('Save the spec once before validating.', 'warn');
      return;
    }

    emitEvent('validate.started', 'validate', { path: workingPath });

    if (isDirty) {
      try {
        await invoke('write_file', { path: workingPath, content: serialize(spec) });
        dispatchFileSaved(workingPath);
        get().clearDirty();
        await invoke('update_window_title', { title: spec.title.main, dirty: false }).catch(
          () => {}
        );
      } catch (writeError) {
        get().pushToast(
          `Could not save before validating: ${writeError instanceof Error ? writeError.message : String(writeError)}`,
          'error'
        );
        return;
      }
    }

    try {
      const warnings = await runValidationSidecar(workingPath, {
        revealPanel: true,
        notify: true,
      });
      set({ validationWarnings: warnings, showValidationPanel: true });
      get().pushToast(
        warnings.length === 0
          ? 'Validation passed - no warnings.'
          : `Validation found ${warnings.length} warning(s).`,
        warnings.length === 0 ? 'info' : 'warn'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      emitEvent('validate.failed', 'validate', { error: message });
      systemLog('error', 'validate', 'Validation failed', {
        detail: message,
        success: false,
      });
      set({ validationWarnings: [], showValidationPanel: true });
      get().pushToast(`Validation failed: ${message}`, 'error');
    }
  },

  openCompiledOutput: async () => {
    const { previewPath } = get();

    if (!previewPath) {
      get().pushToast('Compile a spec first to create HTML output.', 'warn');
      return;
    }

    try {
      await invoke('open_path_in_file_manager', { path: getParentPath(previewPath) });
    } catch (error) {
      get().pushToast(
        `Could not open the compiled output folder: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
    }
  },

  openCompiledOutputFolder: async () => {
    const { previewPath } = get();

    if (!previewPath) {
      get().pushToast('Compile a spec first to create an output folder.', 'warn');
      return;
    }

    try {
      await invoke('open_path_in_file_manager', { path: getParentPath(previewPath) });
    } catch (error) {
      get().pushToast(
        `Could not open the compiled output folder: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      );
    }
  },

  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
  setPreviewOpen: (open) => set({ showPreview: open }),
  toggleValidationPanel: () =>
    set((state) => ({ showValidationPanel: !state.showValidationPanel })),
  toggleProgressPanel: () => set((state) => ({ showProgressPanel: !state.showProgressPanel })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarWidth: (width) =>
    set({ sidebarWidth: Math.min(720, Math.max(320, Math.round(width))) }),
  toggleMermaidModal: () => set((state) => ({ showMermaidModal: !state.showMermaidModal })),
  toggleGenerateModal: () => set((state) => ({ showGenerateModal: !state.showGenerateModal })),

  pushToast: (message, level) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, level }] }));
    setTimeout(() => get().dismissToast(id), 4000);
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  setEditorInstance: (editor) => set({ editorInstance: editor }),

  updateSpecFromDoc: (doc) => {
    clearTimeout(docUpdateTimer);
    docUpdateTimer = window.setTimeout(() => {
      const currentSpec = get().spec;
      if (!currentSpec) {
        return;
      }

      try {
        const newSpec = docToSpec(doc, currentSpec);
        const nextContent = serializeSpecSnapshot(newSpec);
        if (nextContent === serializeSpecSnapshot(currentSpec)) {
          return;
        }
        const previous = currentSpec;
        const isDirty = computeDirtyState(get().initialContent, nextContent);
        set((state) => ({
          spec: newSpec,
          isDirty,
          history: pushHistory(previous, state.history),
        }));
        void invoke('update_window_title', { title: newSpec.title.main, dirty: isDirty }).catch(
          () => {}
        );
      } catch {
        // Ignore transient parse failures while the user is still editing the document.
      }
    }, 400);
  },

  openFromGeneratedSpec: (spec) => {
    const editorInstance = get().editorInstance;
    set({
      spec: cloneSpec(spec),
      currentPath: null,
      repoRoot: null,
      isDirty: true,
      initialContent: null,
      parseError: null,
      validationWarnings: [],
      aiReviewIssues: [],
      previewHtml: null,
      previewPath: null,
      showPreview: false,
      lastCompileError: null,
      history: [],
      showGenerateModal: false,
      showTemplateCustomizeBanner: false,
    });
    if (editorInstance) {
      editorInstance.commands.setContent(specToDoc(spec), false);
    }
    get().pushToast('Loaded AI-generated spec.', 'info');
  },

  openFromGeneratedQuiz: () => {
    get().pushToast(
      'Quiz generated. Quiz editing support will be wired into the dashboard flow.',
      'info'
    );
  },

  setAIReviewIssues: (issues) => set({ aiReviewIssues: issues }),

  updateResult: (resultId, patch) => {
    const { spec, history, editorInstance, initialContent } = get();
    if (!spec || !spec.results[resultId]) {
      return;
    }
    const nextSpec: ParsedSpec = {
      ...spec,
      results: {
        ...spec.results,
        [resultId]: {
          ...spec.results[resultId],
          ...patch,
        },
      },
    };
    set({
      spec: nextSpec,
      isDirty: computeDirtyState(initialContent, serializeSpecSnapshot(nextSpec)),
      history: pushHistory(spec, history),
    });
    if (editorInstance) {
      editorInstance.commands.setContent(specToDoc(nextSpec), false);
    }
  },

  toggleDashboard: () => set((state) => ({ showDashboard: !state.showDashboard })),
  toggleSettingsModal: () => set((state) => ({ showSettingsModal: !state.showSettingsModal })),
  toggleOnboardingTour: (open) =>
    set((state) => ({
      showOnboardingTour: typeof open === 'boolean' ? open : !state.showOnboardingTour,
    })),
  toggleShortcutsModal: (open) =>
    set((state) => ({
      showShortcutsModal: typeof open === 'boolean' ? open : !state.showShortcutsModal,
    })),
  loadRecentFiles: async () => {
    const recentFiles = await invoke<RecentFile[]>('load_recent_files');
    set({ recentFiles });
  },
  checkEnv: async () => {
    const result = await checkEnvironment();
    set({ envReady: result.ok, envWarning: result.message });
  },
  loadEditorPrefs: async () => {
    const prefs = await invoke<EditorPrefs>('load_editor_prefs');
    set({
      analyticsEnabled: prefs.analytics_enabled,
      autoSaveEnabled:
        prefs.auto_save_enabled || prefs.auto_save_enabled === false
          ? prefs.auto_save_enabled
          : true,
      templateCustomizeDismissed: prefs.template_customize_dismissed,
    });
  },
  saveEditorPrefs: async () => {
    const { analyticsEnabled, autoSaveEnabled, templateCustomizeDismissed } = get();
    await invoke('save_editor_prefs', {
      prefs: {
        analytics_enabled: analyticsEnabled,
        auto_save_enabled: autoSaveEnabled,
        template_customize_dismissed: templateCustomizeDismissed,
      },
    });
  },
  setAutoSave: (enabled) => {
    set({ autoSaveEnabled: enabled });
    void get().saveEditorPrefs();
  },
  setAnalytics: (enabled) => {
    set({ analyticsEnabled: enabled });
    void get().saveEditorPrefs();
  },
  dismissTemplateCustomizeBanner: (permanent) => {
    set({
      showTemplateCustomizeBanner: false,
      templateCustomizeDismissed: permanent ? true : get().templateCustomizeDismissed,
    });
    if (permanent) {
      void get().saveEditorPrefs();
    }
  },
  showTemplateBanner: () => {
    if (!get().templateCustomizeDismissed) {
      set({ showTemplateCustomizeBanner: true });
    }
  },
  toggleRepoBrowser: (open) =>
    set((state) => ({
      showRepoBrowser: typeof open === 'boolean' ? open : !state.showRepoBrowser,
    })),
  toggleCommitModal: (open) =>
    set((state) => ({
      showCommitModal: typeof open === 'boolean' ? open : !state.showCommitModal,
    })),
  loadSavedRepoConnections: async () => {
    const savedRepoConnections = await listSavedConnections();
    set({ savedRepoConnections });
  },
  connectToRepo: async (url, branch, pat) => {
    const connection = await connectRepo({ url, branch, pat });
    const repoSpecs = await listRepoSpecs(connection.local_path);
    set((state) => ({
      repoConnection: connection,
      repoSpecs,
      showRepoBrowser: true,
      savedRepoConnections: [
        {
          url: connection.url,
          branch: connection.branch,
          local_path: connection.local_path,
          last_synced: connection.last_synced,
        },
        ...state.savedRepoConnections.filter((item) => item.local_path !== connection.local_path),
      ],
    }));
    get().pushToast(`Connected to ${connection.url}`, 'info');
  },
  refreshRepoSpecs: async (pat) => {
    const connection = get().repoConnection;
    if (!connection) {
      return;
    }
    const nextConnection = await pullLatest(connection.local_path, pat);
    const repoSpecs = await listRepoSpecs(nextConnection.local_path);
    set((state) => ({
      repoConnection: nextConnection,
      repoSpecs,
      savedRepoConnections: [
        {
          url: nextConnection.url,
          branch: nextConnection.branch,
          local_path: nextConnection.local_path,
          last_synced: nextConnection.last_synced,
        },
        ...state.savedRepoConnections.filter(
          (item) => item.local_path !== nextConnection.local_path
        ),
      ],
    }));
    get().pushToast('Repository synced.', 'info');
  },
  openRepoSpec: async (specPath) => {
    const connection = get().repoConnection;
    if (!connection) {
      return;
    }
    await get().openFile(`${normalizePath(connection.local_path)}/${specPath}`);
    set({ showRepoBrowser: false });
  },
  commitCurrentSpec: async (message, branch, pat, createPullRequest) => {
    const { spec, currentPath, repoConnection } = get();
    if (!spec || !currentPath || !repoConnection) {
      return null;
    }
    const specPath = relativeRepoPath(repoConnection.local_path, currentPath);
    if (!specPath) {
      throw new Error(
        'The current file is not inside the connected repository. Open a repo file before committing.'
      );
    }
    const result = await commitAndPush({
      localPath: repoConnection.local_path,
      specPath,
      content: serialize(spec),
      message,
      branch,
      pat,
      createPullRequest,
    });
    set({
      isDirty: false,
      initialContent: serializeSpecSnapshot(spec),
      showCommitModal: false,
    });
    get().pushToast(result.message, 'info');
    return result;
  },
}));

export function useAllTargetIds() {
  return useEditorStore((state) => ({
    questionIds: Object.keys(state.spec?.questions ?? {}),
    resultIds: Object.keys(state.spec?.results ?? {}),
  }));
}
