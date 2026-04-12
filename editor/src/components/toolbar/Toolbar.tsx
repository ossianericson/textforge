import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAI } from '@/lib/useAI';
import { useEditorStore } from '@/store/useEditorStore';

export function Toolbar() {
  const {
    createNewSpec,
    openFile,
    saveFile,
    saveFileAs,
    compile,
    validate,
    openCompiledOutput,
    isDirty,
    isOpening,
    openingStatus,
    isCompiling,
    compileStatus,
    toggleSidebar,
    toggleMermaidModal,
    toggleGenerateModal,
    setAIReviewIssues,
    toggleDashboard,
    toggleSettingsModal,
    toggleOnboardingTour,
    toggleShortcutsModal,
    toggleRepoBrowser,
    toggleCommitModal,
    sidebarCollapsed,
    spec,
    showValidationPanel,
    currentPath,
    previewPath,
    repoConnection,
    isAiConfigured,
    pushToast,
  } = useEditorStore();
  const { reviewTree, isLoading } = useAI();
  const [openMenu, setOpenMenu] = useState<'file' | 'edit' | 'tools' | 'help' | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const treeTitle = spec?.title?.main?.trim() || 'Untitled workspace';

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [openMenu]);

  const closeMenu = () => setOpenMenu(null);

  return (
    <header
      ref={menuRef}
      className="relative z-[110] flex min-h-[76px] shrink-0 flex-wrap items-center gap-3 border-b border-white/10 bg-[#0a1019]/85 px-4 py-3 backdrop-blur-xl"
      data-tour-id="toolbar"
    >
      <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] max-md:w-full">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200">
          TF
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-300/90">textforge</div>
          <div className="truncate text-xs text-slate-400">Visual editor for trees and quizzes</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <MenuButton label="File" active={openMenu === 'file'} onClick={() => setOpenMenu((current) => (current === 'file' ? null : 'file'))} />
          {openMenu === 'file' ? (
            <MenuSurface align="left">
              <MenuSectionLabel>Workspace</MenuSectionLabel>
              <MenuItem label="New spec" description="Start a blank decision tree" onClick={() => { createNewSpec(); closeMenu(); }} />
              <MenuItem label="Open spec" description="Open a local spec.md file" onClick={() => { void openFile(); closeMenu(); }} disabled={isOpening} />
              <MenuItem label="My Trees" description="Jump into recent trees and templates" onClick={() => { toggleDashboard(); closeMenu(); }} />
              <MenuItem label="Open from repo" description="Browse a connected repository" onClick={() => { toggleRepoBrowser(true); closeMenu(); }} />
              <MenuDivider />
              <MenuSectionLabel>Save</MenuSectionLabel>
              <MenuItem label={isDirty ? 'Save changes' : 'Save'} description="Write the current spec to disk" onClick={() => { void saveFile(); closeMenu(); }} disabled={!isDirty || isOpening || isCompiling} />
              <MenuItem label="Save as" description="Save under a different file name" onClick={() => { void saveFileAs(); closeMenu(); }} disabled={isOpening || isCompiling} />
              <MenuItem label="Save and commit" description="Create a repository commit for the current spec" onClick={() => { toggleCommitModal(true); closeMenu(); }} disabled={!repoConnection || !currentPath} />
            </MenuSurface>
          ) : null}
        </div>
        <div className="relative">
          <MenuButton label="Edit" active={openMenu === 'edit'} onClick={() => setOpenMenu((current) => (current === 'edit' ? null : 'edit'))} />
          {openMenu === 'edit' ? (
            <MenuSurface align="left">
              <MenuSectionLabel>Authoring</MenuSectionLabel>
              <MenuItem label="Validate spec" description="Run the compiler validation rules" onClick={() => { void validate(); closeMenu(); }} />
              <MenuItem label="AI review" description="Scan the tree for logic and UX issues" onClick={() => {
                if (!isAiConfigured) {
                  pushToast('AI is not configured — open Settings → AI to connect.', 'warn');
                  closeMenu();
                  return;
                }
                if (!spec) {
                  return;
                }
                void reviewTree(spec)
                  .then((issues) => {
                    setAIReviewIssues(issues);
                    if (!showValidationPanel) {
                      useEditorStore.getState().toggleValidationPanel();
                    }
                    closeMenu();
                  })
                  .catch(() => {
                    closeMenu();
                  });
              }} disabled={!spec || isLoading} />
              <MenuDivider />
              <MenuSectionLabel>Guidance</MenuSectionLabel>
              <MenuItem label="Take the tour" description="Replay the first-run onboarding" onClick={() => { toggleOnboardingTour(true); closeMenu(); }} />
              <MenuItem label="Keyboard shortcuts" description="Open the shortcut reference" onClick={() => { toggleShortcutsModal(true); closeMenu(); }} />
            </MenuSurface>
          ) : null}
        </div>
        <div className="relative">
          <MenuButton label="Tools" active={openMenu === 'tools'} onClick={() => setOpenMenu((current) => (current === 'tools' ? null : 'tools'))} />
          {openMenu === 'tools' ? (
            <MenuSurface align="left">
              <MenuSectionLabel>Visualization</MenuSectionLabel>
              <MenuItem label="Export Mermaid diagram" description="Copy or save the current Mermaid source" onClick={() => { toggleMermaidModal(); closeMenu(); }} />
              <MenuItem label={sidebarCollapsed ? 'Expand graph panel' : 'Collapse graph panel'} description="Show or hide the interactive graph" onClick={() => { toggleSidebar(); closeMenu(); }} />
            </MenuSurface>
          ) : null}
        </div>
      </div>

      <div className="hidden min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] xl:flex">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace</div>
        <div className="h-4 w-px bg-white/10" />
        <div className="max-w-[240px] truncate text-sm font-medium text-slate-200">{treeTitle}</div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${isDirty ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'}`}>
          {isDirty ? 'Draft' : 'Saved'}
        </span>
      </div>

      <div className="mx-1 hidden h-9 w-px bg-white/10 xl:block" />

      <div className="flex flex-wrap items-center gap-2">
        <PrimaryActionButton onClick={toggleGenerateModal} title="Create with AI (Ctrl+G)" dataTourId="create-ai-button">
          ✦ Create with AI
        </PrimaryActionButton>
        <ActionButton
          onClick={() => void compile()}
          title={isCompiling ? compileStatus ?? 'Compiling...' : isOpening ? openingStatus ?? 'Opening spec...' : 'Compile and show output folder (Ctrl+P)'}
          disabled={!spec || isCompiling || isOpening}
          dataTourId="preview-button"
          emphasis
        >
          <span className="flex items-center gap-2">
            {isCompiling ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-100/25 border-t-slate-50" /> : null}
            <span>{isCompiling ? compileStatus ?? 'Compiling...' : 'Compile & Show Output'}</span>
          </span>
        </ActionButton>
        <ActionButton
          onClick={() => void openCompiledOutput()}
          title="Open the folder that contains the last compiled HTML file"
          disabled={!previewPath || isCompiling || isOpening}
        >
          Show Output Folder
        </ActionButton>
        <ActionButton
          onClick={() => {
            if (!isAiConfigured) {
              pushToast('AI is not configured — open Settings → AI to connect.', 'warn');
              return;
            }
            if (!spec) {
              return;
            }
            void reviewTree(spec)
              .then((issues) => {
                setAIReviewIssues(issues);
                if (!showValidationPanel) {
                  useEditorStore.getState().toggleValidationPanel();
                }
              })
              .catch(() => {
                // The hook already stores the error.
              });
          }}
          title="AI review"
          disabled={!spec || isLoading}
        >
          Review
        </ActionButton>
        {isOpening ? (
          <div className="flex items-center gap-2 rounded-2xl border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs text-sky-100 shadow-[0_10px_24px_rgba(8,12,20,0.18)]">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-100/25 border-t-sky-50" />
            <span>{openingStatus ?? 'Opening spec...'}</span>
          </div>
        ) : null}
        {isCompiling ? (
          <div className="min-w-[220px] rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-slate-100 shadow-[0_10px_24px_rgba(8,12,20,0.18)]">
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
              <span>Compile</span>
              <span>{compileStatus ?? 'Working'}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 rounded-full bg-emerald-300 animate-pulse" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-2 max-md:ml-0 max-md:w-full max-md:justify-end">
        <UtilityButton onClick={toggleSidebar} title={sidebarCollapsed ? 'Expand graph panel' : 'Collapse graph panel'}>
          ⟷
        </UtilityButton>
        <div className="relative">
          <UtilityButton onClick={() => setOpenMenu((current) => (current === 'help' ? null : 'help'))} title="Help and shortcuts">
            ?
          </UtilityButton>
          {openMenu === 'help' ? (
            <MenuSurface align="right">
              <MenuItem label="Take the tour" description="Replay the guided product walkthrough" onClick={() => { toggleOnboardingTour(true); closeMenu(); }} />
              <MenuItem label="Keyboard shortcuts" description="Review editor keyboard commands" onClick={() => { toggleShortcutsModal(true); closeMenu(); }} />
            </MenuSurface>
          ) : null}
        </div>
        <UtilityButton onClick={toggleSettingsModal} title="Settings">
          ⚙
        </UtilityButton>
      </div>
    </header>
  );
}

function PrimaryActionButton({
  children,
  onClick,
  title,
  disabled,
  dataTourId,
}: {
  children: ReactNode;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  dataTourId?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      data-tour-id={dataTourId}
      className="rounded-2xl border border-[#d7b36a]/40 bg-[linear-gradient(135deg,rgba(204,168,95,0.22),rgba(109,84,31,0.18))] px-4 py-2 text-sm font-semibold text-amber-50 shadow-[0_10px_30px_rgba(12,18,30,0.28)] transition duration-200 hover:border-[#e6c98c]/55 hover:bg-[linear-gradient(135deg,rgba(220,185,110,0.32),rgba(116,88,30,0.28))] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  disabled,
  dataTourId,
  emphasis = false,
}: {
  children: ReactNode;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  dataTourId?: string;
  emphasis?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      data-tour-id={dataTourId}
      className={`rounded-2xl px-4 py-2 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        emphasis
          ? 'border border-white/15 bg-white/[0.08] text-slate-50 shadow-[0_10px_26px_rgba(8,12,20,0.24)] hover:border-emerald-300/30 hover:bg-emerald-400/10'
          : 'border border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/15 hover:bg-white/[0.07]'
      }`}
    >
      {children}
    </button>
  );
}

function UtilityButton({ children, onClick, title }: { children: ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-slate-200 transition duration-200 hover:border-white/15 hover:bg-white/[0.08]"
    >
      {children}
    </button>
  );
}

function MenuButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-2 text-sm font-medium transition duration-200 ${
        active
          ? 'border border-white/15 bg-white/[0.08] text-slate-50 shadow-[0_8px_24px_rgba(8,12,20,0.2)]'
          : 'border border-white/8 bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.06]'
      }`}
    >
      {label}
    </button>
  );
}

function MenuSurface({ children, align }: { children: ReactNode; align: 'left' | 'right' }) {
  return (
    <div
      data-testid="toolbar-menu-surface"
      className={`absolute top-[calc(100%+12px)] z-[130] isolate w-[280px] overflow-hidden rounded-[22px] border border-white/12 bg-[#111923] p-2 shadow-[0_32px_72px_rgba(0,0,0,0.48)] ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
    >
      {children}
    </div>
  );
}

function MenuSectionLabel({ children }: { children: ReactNode }) {
  return <div className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">{children}</div>;
}

function MenuDivider() {
  return <div className="my-2 h-px bg-white/8" />;
}

function MenuItem({ label, description, onClick, disabled = false }: { label: string; description: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-start justify-between rounded-2xl px-3 py-3 text-left transition duration-200 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <div>
        <div className="text-sm font-medium text-slate-100">{label}</div>
        <div className="mt-1 text-xs leading-5 text-slate-400">{description}</div>
      </div>
    </button>
  );
}