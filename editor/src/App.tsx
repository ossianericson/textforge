import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { GenerateModal } from '@/components/ai/GenerateModal';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { MyTreesDashboard } from '@/components/dashboard/MyTreesDashboard';
import { DocumentEditor } from '@/components/document/DocumentEditor';
import { CommitModal } from '@/components/repo/CommitModal';
import { RepoBrowser } from '@/components/repo/RepoBrowser';
import { CompileErrorBanner } from '@/components/shared/CompileErrorBanner';
import { EditorErrorBoundary } from '@/components/shared/EditorErrorBoundary';
import { EnvWarningBanner } from '@/components/shared/EnvWarningBanner';
import { ShortcutsModal } from '@/components/shared/ShortcutsModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { onEvent } from '@/lib/editorEvents';
import { useSpecFileWatcher } from '@/lib/useSpecFileWatcher';
import { useWindowCloseGuard } from '@/lib/useWindowCloseGuard';
import { ProgressPanel } from '@/components/panels/ProgressPanel';
import { ValidationPanel } from '@/components/panels/ValidationPanel';
import { CanvasSidebar } from '@/components/sidebar/CanvasSidebar';
import { Toast } from '@/components/shared/Toast';
import { MermaidExportModal } from '@/components/toolbar/MermaidExportModal';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { useEditorStore } from '@/store/useEditorStore';

export default function App() {
  const {
    showValidationPanel,
    showProgressPanel,
    isDirty,
    currentPath,
    spec,
    validationWarnings,
    sidebarCollapsed,
    sidebarWidth,
    showMermaidModal,
    showGenerateModal,
    showDashboard,
    showSettingsModal,
    showOnboardingTour,
    showShortcutsModal,
    showRepoBrowser,
    showCommitModal,
    saveFile,
    saveFileAs,
    openFile,
    compile,
    undo,
    toggleValidationPanel,
    toggleProgressPanel,
    toggleMermaidModal,
    toggleGenerateModal,
    toggleDashboard,
    toggleOnboardingTour,
    toggleShortcutsModal,
    loadRecentFiles,
    loadSavedRepoConnections,
    loadEditorPrefs,
    checkEnv,
    autoSaveEnabled,
    toasts,
    dismissToast,
    setSidebarWidth,
    isAiConfigured,
    setAiStatus,
    toggleSettingsModal,
  } = useEditorStore();
  const resizeActiveRef = useRef(false);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
  const [compactWorkspaceView, setCompactWorkspaceView] = useState<'editor' | 'graph'>('editor');
  const [aiStatusLoaded, setAiStatusLoaded] = useState(false);
  const flowItemCount = Object.keys(spec?.questions ?? {}).length + Object.keys(spec?.results ?? {}).length;
  const adaptiveWorkspace = viewportWidth < 1320 || viewportHeight < 860;
  const treeTitle = spec?.title?.main?.trim() || 'Untitled workspace';
  const blockingModalOpen =
    showMermaidModal ||
    showGenerateModal ||
    showDashboard ||
    showSettingsModal ||
    showRepoBrowser ||
    showCommitModal ||
    showShortcutsModal ||
    showOnboardingTour;
  const overlayOpen = blockingModalOpen;

  useWindowCloseGuard();
  useSpecFileWatcher();

  useEffect(() => {
    void loadRecentFiles();
    void loadSavedRepoConnections();
    void loadEditorPrefs();
    void checkEnv();
  }, [checkEnv, loadEditorPrefs, loadRecentFiles, loadSavedRepoConnections]);

  useEffect(() => {
    void (async () => {
      try {
        const [status, pref] = await Promise.all([
          invoke<{ ok: boolean; provider: string; account?: string | null }>('get_ai_auth_status'),
          invoke<{ provider?: string } | null>('load_ai_provider_pref').catch(() => null),
        ]);

        const provider = pref?.provider === 'custom' && status.ok ? 'custom' : status.provider;
        setAiStatus({ ...status, provider });
      } catch {
        setAiStatus({ ok: false, provider: 'none' });
      } finally {
        setAiStatusLoaded(true);
      }
    })();
  }, [setAiStatus]);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    return onEvent((event) => {
      if (event.type.endsWith('.failed')) {
        console.warn(`[Event] ${event.type}`, event.payload);
      }
    });
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    void invoke<boolean>('is_onboarding_complete')
      .then((complete: boolean) => {
        if (!cancelled && !complete) {
          timer = window.setTimeout(() => toggleOnboardingTour(true), 500);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [toggleOnboardingTour]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (overlayOpen) {
        return;
      }

      const modifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (modifier && key === 's' && !event.shiftKey) {
        event.preventDefault();
        void saveFile();
      }
      if (modifier && key === 's' && event.shiftKey) {
        event.preventDefault();
        void saveFileAs();
      }
      if (modifier && key === 'p') {
        event.preventDefault();
        void compile();
      }
      if (modifier && key === 'o') {
        event.preventDefault();
        void openFile();
      }
      if (modifier && key === 'z') {
        event.preventDefault();
        undo();
      }
      if (modifier && key === 'm') {
        event.preventDefault();
        toggleMermaidModal();
      }
      if (modifier && key === 'g') {
        event.preventDefault();
        toggleGenerateModal();
      }
      if (modifier && key === 'd') {
        event.preventDefault();
        toggleDashboard();
      }
      if (modifier && key === 'r') {
        event.preventDefault();
        useEditorStore.getState().toggleRepoBrowser(true);
      }
      if (event.key === 'F1') {
        event.preventDefault();
        toggleOnboardingTour(true);
      }
      if (modifier && (event.key === '?' || (key === '/' && event.shiftKey))) {
        event.preventDefault();
        toggleShortcutsModal(true);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [compile, openFile, overlayOpen, saveFile, saveFileAs, toggleDashboard, toggleGenerateModal, toggleMermaidModal, toggleOnboardingTour, toggleShortcutsModal, undo]);

  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || !currentPath) {
      return;
    }
    const timer = window.setInterval(() => {
      void saveFile();
    }, 120000);
    return () => window.clearInterval(timer);
  }, [autoSaveEnabled, currentPath, isDirty, saveFile]);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (adaptiveWorkspace || sidebarCollapsed) {
      return;
    }

    const maxSidebarWidth = Math.max(320, Math.min(520, Math.round(window.innerWidth * 0.42)));
    if (sidebarWidth > maxSidebarWidth) {
      setSidebarWidth(maxSidebarWidth);
    }
  }, [adaptiveWorkspace, setSidebarWidth, sidebarCollapsed, sidebarWidth]);

  useEffect(() => {
    if (!adaptiveWorkspace) {
      setCompactWorkspaceView('editor');
    }
  }, [adaptiveWorkspace]);

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      if (!resizeActiveRef.current || sidebarCollapsed || adaptiveWorkspace) {
        return;
      }
      setSidebarWidth(window.innerWidth - event.clientX);
    };

    const stopResize = () => {
      resizeActiveRef.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [setSidebarWidth, sidebarCollapsed]);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-transparent text-slate-100">
      <Toolbar />
      <EnvWarningBanner />
      <CompileErrorBanner />
      {aiStatusLoaded && !isAiConfigured ? (
        <div className="border-b border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
            <span>AI is not configured. Open Settings → AI to connect Azure, OpenAI, or a custom endpoint.</span>
            <button
              type="button"
              onClick={toggleSettingsModal}
              className="shrink-0 rounded-full border border-amber-200/30 bg-white/5 px-3 py-1 text-xs font-medium text-amber-50 transition hover:bg-white/10"
            >
              Open Settings → AI
            </button>
          </div>
        </div>
      ) : null}

      <div className={`relative flex flex-1 overflow-hidden bg-editor-grid ${adaptiveWorkspace ? 'flex-col' : ''}`}>
        {adaptiveWorkspace ? (
          <>
            <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(10,18,28,0.92),rgba(8,14,22,0.88))] px-4 py-3 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Adaptive workspace</div>
                  <div className="mt-1 text-sm font-medium text-slate-100">{treeTitle}</div>
                  <div className="mt-1 text-sm text-slate-400">Switch between writing and Mermaid view when the window gets tighter instead of clipping both surfaces.</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-300">
                    {flowItemCount} item{flowItemCount === 1 ? '' : 's'}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${isDirty ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'}`}>
                    {isDirty ? 'Unsaved' : 'Saved'}
                  </span>
                  {!sidebarCollapsed ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                      <button
                        type="button"
                        onClick={() => setCompactWorkspaceView('editor')}
                        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                          compactWorkspaceView === 'editor'
                            ? 'bg-white/[0.12] text-slate-50 shadow-[0_10px_24px_rgba(5,10,18,0.22)]'
                            : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                        }`}
                      >
                        Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompactWorkspaceView('graph')}
                        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                          compactWorkspaceView === 'graph'
                            ? 'bg-white/[0.12] text-slate-50 shadow-[0_10px_24px_rgba(5,10,18,0.22)]'
                            : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                        }`}
                      >
                        Mermaid
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={useEditorStore.getState().toggleSidebar}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08]"
                    >
                      Show graph
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {compactWorkspaceView === 'graph' && !sidebarCollapsed ? (
                <div className="h-full min-h-0">
                  <EditorErrorBoundary name="Graph view" currentPath={currentPath}>
                    <CanvasSidebar />
                  </EditorErrorBoundary>
                </div>
              ) : (
                <div className="h-full min-h-0">
                  <DocumentEditor />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="min-h-0 min-w-0 flex-1">
              <DocumentEditor />
            </div>

            {!sidebarCollapsed ? (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize graph panel"
                onMouseDown={() => {
                  resizeActiveRef.current = true;
                  document.body.style.userSelect = 'none';
                  document.body.style.cursor = 'col-resize';
                }}
                className="relative w-3 shrink-0 cursor-col-resize bg-transparent transition hover:bg-[#d4b36e]/8"
              >
                <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 rounded-full bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              </div>
            ) : null}

            <aside
              className={`${sidebarCollapsed ? 'w-8' : ''} shrink-0 transition-all duration-300`}
              style={sidebarCollapsed ? undefined : { width: `${sidebarWidth}px` }}
            >
              {sidebarCollapsed ? (
                <div className="flex h-full items-center justify-center border-l border-white/10 bg-[#0d1520]/95 text-xs uppercase tracking-[0.24em] text-slate-500 [writing-mode:vertical-rl]">
                  Graph
                </div>
              ) : (
                <EditorErrorBoundary name="Graph view" currentPath={currentPath}>
                  <CanvasSidebar />
                </EditorErrorBoundary>
              )}
            </aside>
          </>
        )}
      </div>

      {showMermaidModal ? (
        <EditorErrorBoundary name="Diagram export" currentPath={currentPath}>
          <MermaidExportModal />
        </EditorErrorBoundary>
      ) : null}
      {showGenerateModal ? (
        <EditorErrorBoundary name="Generate modal" currentPath={currentPath}>
          <GenerateModal />
        </EditorErrorBoundary>
      ) : null}
      {showDashboard ? <MyTreesDashboard /> : null}
      {showSettingsModal ? (
        <EditorErrorBoundary name="Settings modal" currentPath={currentPath}>
          <SettingsModal />
        </EditorErrorBoundary>
      ) : null}
      {showRepoBrowser ? (
        <EditorErrorBoundary name="Repository browser" currentPath={currentPath}>
          <RepoBrowser />
        </EditorErrorBoundary>
      ) : null}
      {showCommitModal ? (
        <EditorErrorBoundary name="Commit modal" currentPath={currentPath}>
          <CommitModal />
        </EditorErrorBoundary>
      ) : null}
      <EditorErrorBoundary name="Shortcuts" currentPath={currentPath}>
        <ShortcutsModal open={showShortcutsModal} onClose={() => toggleShortcutsModal(false)} />
      </EditorErrorBoundary>
      <OnboardingTour
        open={showOnboardingTour}
        onFinish={() => {
          toggleOnboardingTour(false);
          void invoke('mark_onboarding_complete').catch(() => {});
        }}
      />

      {showValidationPanel ? (
        <EditorErrorBoundary name="Validation panel" currentPath={currentPath}>
          <ValidationPanel />
        </EditorErrorBoundary>
      ) : null}
      {showProgressPanel ? <ProgressPanel /> : null}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#0a1019]/88 px-4 py-2 text-xs text-slate-400 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3 pr-4">
          <span className="max-w-[38vw] truncate rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-slate-300">
            {currentPath ?? 'No file open'}
          </span>
          <span className="hidden rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-slate-400 lg:inline-flex">
            {flowItemCount} flow item{flowItemCount === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleValidationPanel}
            className={`rounded-full border px-3 py-1 transition ${
              showValidationPanel
                ? 'border-amber-300/35 bg-amber-300/12 text-amber-100'
                : 'border-white/8 bg-white/[0.04] text-slate-300 hover:border-white/15 hover:bg-white/[0.07]'
            }`}
          >
            {validationWarnings.length} warning{validationWarnings.length === 1 ? '' : 's'}
          </button>
          <button
            type="button"
            onClick={toggleProgressPanel}
            className={`rounded-full border px-3 py-1 transition ${
              showProgressPanel
                ? 'border-emerald-300/35 bg-emerald-300/12 text-emerald-100'
                : 'border-white/8 bg-white/[0.04] text-slate-300 hover:border-white/15 hover:bg-white/[0.07]'
            }`}
          >
            Progress steps
          </button>
          <span className={`rounded-full border px-3 py-1 ${isDirty ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'}`}>
            {isDirty ? 'Unsaved changes' : 'Saved'}
          </span>
        </div>
      </footer>

      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}
