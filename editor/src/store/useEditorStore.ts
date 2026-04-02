import { invoke } from '@tauri-apps/api/core';
import { open as dialogOpen, save as dialogSave } from '@tauri-apps/plugin-dialog';
import type { JSONContent } from '@tiptap/core';
import type { Editor } from '@tiptap/react';
import { create } from 'zustand';
import { docToSpec } from '@/lib/doc-to-spec';
import {
  commitAndPush,
  connectRepo,
  listRepoSpecs,
  listSavedConnections,
  pullLatest,
} from '@/lib/git';
import { buildNewQuestionNode, buildNewResultNode, createBlankSpec } from '@/lib/doc-model';
import { parseParsedSpec, parseValidationWarnings } from '@/lib/parser';
import { serialize } from '@/lib/serializer';
import { specToDoc } from '@/lib/spec-to-doc';
import type {
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
  isDirty: boolean;
  spec: ParsedSpec | null;
  parseError: string | null;
  validationWarnings: ValidationWarning[];
  showValidationPanel: boolean;
  showProgressPanel: boolean;
  previewHtml: string | null;
  isCompiling: boolean;
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
  openFile: (path?: string) => Promise<void>;
  createNewSpec: () => void;
  saveFile: () => Promise<void>;
  saveFileAs: () => Promise<void>;
  updateProgressStep: (id: string, value: number) => void;
  addQuestion: () => void;
  addResult: () => void;
  undo: () => void;
  compile: () => Promise<void>;
  validate: () => Promise<void>;
  togglePreview: () => void;
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

function cloneSpec(spec: ParsedSpec): ParsedSpec {
  return JSON.parse(JSON.stringify(spec)) as ParsedSpec;
}

function buildSiblingPath(filePath: string, suffix: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  const dir = lastSlash >= 0 ? normalized.slice(0, lastSlash) : '';
  const base = lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
  const stem = base.endsWith('.md') ? base.slice(0, -3) : base;
  return `${dir}/${stem}${suffix}`;
}

function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildCompiledOutputPath(filePath: string, title: string): string {
  const slug = slugifyTitle(title) || 'compiled';
  return filePath.replace(/spec\.md$/i, `${slug}-tree.html`);
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+$/g, '');
}

function isPathInside(root: string, candidate: string): boolean {
  const normalizedRoot = normalizePath(root);
  const normalizedCandidate = normalizePath(candidate);
  return (
    normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}/`)
  );
}

function relativeRepoPath(root: string, fullPath: string): string | null {
  if (!isPathInside(root, fullPath)) {
    return null;
  }
  return normalizePath(fullPath).slice(normalizePath(root).length).replace(/^\//, '');
}

function injectAnalyticsSnippet(html: string): string {
  const snippet = `<script>(function(){var k='tf_'+location.pathname.split('/').pop();var n=parseInt(localStorage.getItem(k)||'0',10)+1;localStorage.setItem(k,n);})();</script>`;
  return html.includes('</body>')
    ? html.replace('</body>', `${snippet}</body>`)
    : `${html}${snippet}`;
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

export const useEditorStore = create<EditorStore>((set, get) => ({
  currentPath: null,
  repoRoot: null,
  isDirty: false,
  spec: null,
  parseError: null,
  validationWarnings: [],
  showValidationPanel: false,
  showProgressPanel: false,
  previewHtml: null,
  isCompiling: false,
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

  openFile: async (providedPath?: string) => {
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

    try {
      const raw = await invoke<string>('run_sidecar', {
        name: 'parse-spec',
        arg1: path,
        arg2: null,
      });
      const parsed = parseParsedSpec(raw);
      const repoRoot = await findRepoRoot(path);
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
        parseError: null,
        validationWarnings: [],
        aiReviewIssues: [],
        previewHtml: null,
        showPreview: false,
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
      await get().validate();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ parseError: message });
      get().pushToast(`Failed to open: ${message}`, 'error');
    }
  },

  createNewSpec: () => {
    const nextSpec = createBlankSpec();
    const editorInstance = get().editorInstance;
    set({
      spec: nextSpec,
      currentPath: null,
      repoRoot: null,
      repoConnection: null,
      isDirty: true,
      parseError: null,
      validationWarnings: [],
      aiReviewIssues: [],
      previewHtml: null,
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
    const { spec, currentPath } = get();
    if (!spec || !currentPath) {
      return;
    }
    try {
      await invoke('write_file', { path: currentPath, content: serialize(spec) });
      set({ isDirty: false });
      await invoke('update_window_title', { title: spec.title.main, dirty: false });
      get().pushToast('Saved', 'info');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      get().pushToast(`Save failed: ${message}`, 'error');
    }
  },

  saveFileAs: async () => {
    const { spec } = get();
    if (!spec) {
      return;
    }
    const path = await promptSpecPath();
    if (!path) {
      return;
    }
    try {
      await invoke('write_file', { path, content: serialize(spec) });
      set({ currentPath: path, isDirty: false });
      await invoke('update_window_title', { title: spec.title.main, dirty: false });
      get().pushToast('Saved', 'info');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      get().pushToast(`Save As failed: ${message}`, 'error');
    }
  },

  updateProgressStep: (id, value) => {
    const { spec, history } = get();
    if (!spec) {
      return;
    }
    set({
      spec: {
        ...spec,
        progressSteps: { ...spec.progressSteps, [id]: value },
      },
      isDirty: true,
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
    const { history, editorInstance } = get();
    if (!history.length) {
      return;
    }
    const previous = history[history.length - 1]!;
    set({ spec: previous, history: history.slice(0, -1), isDirty: true });
    if (editorInstance) {
      editorInstance.commands.setContent(specToDoc(previous), false);
    }
  },

  compile: async () => {
    const { spec, currentPath, analyticsEnabled, recentFiles, validationWarnings } = get();
    if (!spec) {
      get().pushToast('Open or create a spec before compiling.', 'warn');
      return;
    }
    set({ isCompiling: true });
    try {
      let workingPath = currentPath;
      if (!workingPath) {
        const selectedPath = await promptSpecPath();
        if (!selectedPath) {
          set({ isCompiling: false });
          get().pushToast('Save the new spec before compiling.', 'warn');
          return;
        }
        await invoke('write_file', { path: selectedPath, content: serialize(spec) });
        await invoke('update_window_title', { title: spec.title.main, dirty: false });
        set({ currentPath: selectedPath, isDirty: false });
        workingPath = selectedPath;
      }
      const tempSpecPath = buildSiblingPath(workingPath, '_editor_preview.md');
      const tempHtmlPath = buildCompiledOutputPath(workingPath, spec.title.main);
      await invoke('write_file', { path: tempSpecPath, content: serialize(spec) });
      const raw = await invoke<string>('run_sidecar', {
        name: 'compile-spec',
        arg1: tempSpecPath,
        arg2: tempHtmlPath,
      });
      if (raw.trim().startsWith('{')) {
        const parsed = JSON.parse(raw) as { error?: string };
        if (parsed.error) {
          throw new Error(parsed.error);
        }
      }
      const html = await invoke<string>('read_file', { path: tempHtmlPath });
      const finalHtml = analyticsEnabled ? injectAnalyticsSnippet(html) : html;
      if (analyticsEnabled) {
        await invoke('write_file', { path: tempHtmlPath, content: finalHtml });
      }
      const existing = recentFiles.find((item) => item.path === currentPath);
      const recentFile: RecentFile = {
        ...buildRecentFile(spec, workingPath, validationWarnings.length, existing),
        lastCompiled: Date.now(),
      };
      await invoke('update_recent_file', { file: recentFile });
      set((state) => ({
        previewHtml: finalHtml,
        showPreview: true,
        isCompiling: false,
        recentFiles: [recentFile, ...state.recentFiles.filter((item) => item.path !== workingPath)],
      }));
      get().pushToast('Preview ready.', 'info');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ isCompiling: false });
      get().pushToast(`Compile failed: ${message}`, 'error');
    }
  },

  validate: async () => {
    const { spec, currentPath } = get();
    if (!spec) {
      get().pushToast('Open or create a spec before validating.', 'warn');
      return;
    }
    if (!currentPath) {
      get().pushToast('Save the spec once before validating from the editor.', 'warn');
      return;
    }
    try {
      const tempPath = buildSiblingPath(currentPath, '_editor_validate.md');
      await invoke('write_file', { path: tempPath, content: serialize(spec) });
      const raw = await invoke<string>('run_sidecar', {
        name: 'validate-spec',
        arg1: tempPath,
        arg2: null,
      });
      const warnings = parseValidationWarnings(raw).sort(
        (left, right) => left.line - right.line || left.code.localeCompare(right.code)
      );
      set({ validationWarnings: warnings, showValidationPanel: true });
      get().pushToast(
        warnings.length === 0
          ? 'Validation passed with no warnings.'
          : `Validation found ${warnings.length} warning(s).`,
        warnings.length === 0 ? 'info' : 'warn'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ validationWarnings: [], showValidationPanel: true });
      get().pushToast(`Validation failed: ${message}`, 'error');
    }
  },

  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
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
        const previous = currentSpec;
        set((state) => ({
          spec: newSpec,
          isDirty: true,
          history: pushHistory(previous, state.history),
        }));
        void invoke('update_window_title', { title: newSpec.title.main, dirty: true }).catch(
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
      parseError: null,
      validationWarnings: [],
      aiReviewIssues: [],
      previewHtml: null,
      showPreview: false,
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
    const { spec, history, editorInstance } = get();
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
      isDirty: true,
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
