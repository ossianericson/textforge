import { useEffect, useMemo, useRef, useState } from 'react';
import { NodeSelection } from '@tiptap/pm/state';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Template } from '@shared/types';
import StarterKit from '@tiptap/starter-kit';
import { EditorErrorBoundary } from '@/components/shared/EditorErrorBoundary';
import { getAllExtensions } from '@/extensions';
import { serialize } from '@/lib/serializer';
import { specToDoc } from '@/lib/spec-to-doc';
import { useIsMountedRef } from '@/lib/useIsMountedRef';
import { useAI } from '@/lib/useAI';
import { templateLibrary } from '@/lib/template-library';
import { useEditorStore } from '@/store/useEditorStore';

function isInternalFirstTemplate(template: Template): boolean {
  const haystack = `${template.id} ${template.domain} ${template.tags.join(' ')} ${template.title}`.toLowerCase();
  const externalMarkers = ['azure', 'aws', 'gcp', 'cloud', 'network', 'compute', 'platform'];
  return !externalMarkers.some((marker) => haystack.includes(marker));
}

function sortTemplatesForQuickStart(templates: Template[]): Template[] {
  return [...templates].sort((left, right) => {
    const priorityDelta = Number(isInternalFirstTemplate(right)) - Number(isInternalFirstTemplate(left));
    if (priorityDelta !== 0) {
      return priorityDelta;
    }
    return right.completeness - left.completeness;
  });
}

function EmptyState() {
  const createNewSpec = useEditorStore((state) => state.createNewSpec);
  const openFile = useEditorStore((state) => state.openFile);
  const toggleGenerateModal = useEditorStore((state) => state.toggleGenerateModal);
  const toggleRepoBrowser = useEditorStore((state) => state.toggleRepoBrowser);
  const openFromGeneratedSpec = useEditorStore((state) => state.openFromGeneratedSpec);
  const showTemplateBanner = useEditorStore((state) => state.showTemplateBanner);
  const pushToast = useEditorStore((state) => state.pushToast);
  const recentFiles = useEditorStore((state) => state.recentFiles);
  const recentHighlights = recentFiles.slice(0, 2);
  const quickStarts = useMemo(() => sortTemplatesForQuickStart(templateLibrary).slice(0, 4), []);

  const openTemplate = (template: Template) => {
    openFromGeneratedSpec(template.spec);
    showTemplateBanner();
    pushToast(`Loaded ${template.title}. Tailor the language for your team.`, 'info');
  };

  return (
    <div data-testid="document-empty-state" className="relative flex h-full min-h-0 items-start justify-center overflow-y-auto px-6 py-6 md:px-8 md:py-8 xl:items-center xl:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(210,175,108,0.18),transparent_28%),radial-gradient(circle_at_80%_78%,rgba(70,129,209,0.16),transparent_32%)]" />
      <div className="relative my-auto w-full max-w-6xl rounded-[32px] border border-white/10 bg-[#0c1521]/82 p-6 shadow-[0_28px_80px_rgba(3,8,18,0.46)] backdrop-blur-xl md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7b36a]/25 bg-[#d7b36a]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/90">
              Guided authoring
            </div>
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">Build a decision flow that reads clearly the first time.</h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400 md:text-base">
                Start from a polished internal workflow, open an existing spec, or generate the first draft with AI. The editor will keep the graph, source, and validation view in sync as you work.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={createNewSpec}
                className="rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-3 text-sm font-medium text-slate-50 transition hover:border-white/20 hover:bg-white/[0.12]"
              >
                Start blank spec
              </button>
              <button
                type="button"
                onClick={toggleGenerateModal}
                className="rounded-2xl border border-[#d7b36a]/30 bg-[linear-gradient(135deg,rgba(212,179,110,0.24),rgba(112,87,34,0.22))] px-5 py-3 text-sm font-semibold text-amber-50 transition hover:border-[#e7cb91]/45 hover:bg-[linear-gradient(135deg,rgba(220,190,124,0.34),rgba(122,93,35,0.28))]"
              >
                ✦ Create with AI
              </button>
              <button
                type="button"
                onClick={() => void openFile()}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08]"
              >
                Open existing spec.md
              </button>
              <button
                type="button"
                onClick={() => toggleRepoBrowser(true)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08]"
              >
                Open from repo
              </button>
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-100">Quick starts</div>
                  <div className="text-sm text-slate-400">Internal workflows are surfaced first so teams can land on policy-aligned starting points faster.</div>
                </div>
                <button
                  type="button"
                  onClick={toggleGenerateModal}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/15 hover:bg-white/[0.06]"
                >
                  Browse all templates
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {quickStarts.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => openTemplate(template)}
                    className="group rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 text-left shadow-[0_14px_36px_rgba(3,8,18,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d7b36a]/35 hover:bg-[linear-gradient(180deg,rgba(212,179,110,0.12),rgba(255,255,255,0.03))]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-2xl">
                          {template.icon}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-100">{template.title}</div>
                          <div className="text-xs text-slate-400">{template.domain}</div>
                        </div>
                      </div>
                      {isInternalFirstTemplate(template) ? (
                        <span className="rounded-full border border-[#d7b36a]/35 bg-[#d7b36a]/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                          Internal first
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm leading-6 text-slate-400">{template.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-medium text-slate-300">{template.completeness}% ready</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">First session</div>
              <div className="mt-2 text-2xl font-semibold text-slate-100">A calmer way to start</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">Use a quick start if you already know the workflow shape, or start blank when you want to author every branch from scratch.</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#0a1119]/88 p-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recent work</div>
              {recentHighlights.length > 0 ? (
                <div className="grid gap-3">
                  {recentHighlights.map((file) => (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => void openFile(file.path)}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-white/15 hover:bg-white/[0.06]"
                    >
                      <div className="text-sm font-semibold text-slate-100">{file.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{file.path}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-500">
                  Your recently opened trees will appear here for one-click access.
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">AI ready</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">Uses your corporate Azure identity first, with manual settings only when discovery cannot resolve a deployment.</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Live graph</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">Every question and result immediately appears in the graph panel so authors can validate the flow visually while editing.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentEditor() {
  const spec = useEditorStore((state) => state.spec);
  const currentPath = useEditorStore((state) => state.currentPath);
  const addQuestion = useEditorStore((state) => state.addQuestion);
  const addResult = useEditorStore((state) => state.addResult);
  const updateSpecFromDoc = useEditorStore((state) => state.updateSpecFromDoc);
  const setEditorInstance = useEditorStore((state) => state.setEditorInstance);
  const showTemplateCustomizeBanner = useEditorStore((state) => state.showTemplateCustomizeBanner);
  const dismissTemplateCustomizeBanner = useEditorStore((state) => state.dismissTemplateCustomizeBanner);
  const openFromGeneratedSpec = useEditorStore((state) => state.openFromGeneratedSpec);
  const pushToast = useEditorStore((state) => state.pushToast);
  const isAiConfigured = useEditorStore((state) => state.isAiConfigured);
  const isOpening = useEditorStore((state) => state.isOpening);
  const openingStatus = useEditorStore((state) => state.openingStatus);
  const isCompiling = useEditorStore((state) => state.isCompiling);
  const compileStatus = useEditorStore((state) => state.compileStatus);
  const { customiseTemplate, isLoading } = useAI();
  const [customisation, setCustomisation] = useState('');
  const [showAddQuestionHint, setShowAddQuestionHint] = useState(false);
  const isMountedRef = useIsMountedRef();
  const suppressUpdateRef = useRef(false);
  const hydratedContentRef = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit.configure({ history: false }), ...getAllExtensions()],
    content: null,
    onUpdate: ({ editor: currentEditor }) => {
      if (suppressUpdateRef.current) {
        return;
      }
      updateSpecFromDoc(currentEditor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'textforge-document',
        spellcheck: 'true',
      },
    },
  });

  useEffect(() => {
    setEditorInstance(editor ?? null);
    return () => setEditorInstance(null);
  }, [editor, setEditorInstance]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextContent = spec ? serialize(spec) : '';
    if (hydratedContentRef.current === nextContent) {
      return;
    }

    hydratedContentRef.current = nextContent;
    suppressUpdateRef.current = true;

    if (spec) {
      editor.commands.setContent(specToDoc(spec), false);
    } else {
      editor.commands.clearContent(false);
    }

    queueMicrotask(() => {
      if (isMountedRef.current) {
        suppressUpdateRef.current = false;
      }
    });
  }, [editor, isMountedRef, spec]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string }>;
      const targetId = customEvent.detail?.id;
      if (!targetId) {
        return;
      }

      let targetPos: number | null = null;
      editor.state.doc.descendants((node, pos) => {
        if (node.attrs?.questionId === targetId || node.attrs?.resultId === targetId) {
          targetPos = pos;
          return false;
        }
        return true;
      });

      if (targetPos == null) {
        return;
      }

      editor
        .chain()
        .focus()
        .command(({ tr, dispatch }) => {
          tr.setSelection(NodeSelection.create(tr.doc, targetPos!));
          if (dispatch) {
            dispatch(tr.scrollIntoView());
          }
          return true;
        })
        .run();
    };

    window.addEventListener('textforge:scroll-to-id', handler as EventListener);
    return () => window.removeEventListener('textforge:scroll-to-id', handler as EventListener);
  }, [editor]);

  useEffect(() => {
    if (!spec) {
      setShowAddQuestionHint(false);
      return;
    }

    const hasNodes = Object.keys(spec.questions).length > 0 || Object.keys(spec.results).length > 0;
    const dismissed = window.localStorage.getItem('textforge:add-question-hint-dismissed') === '1';
    setShowAddQuestionHint(!hasNodes && !dismissed);
  }, [spec]);

  const dismissAddQuestionHint = () => {
    window.localStorage.setItem('textforge:add-question-hint-dismissed', '1');
    setShowAddQuestionHint(false);
  };

  const canvasTaskLabel = isOpening
    ? 'Opening spec'
    : isCompiling
      ? 'Compiling preview'
      : null;
  const canvasTaskDetail = isOpening
    ? openingStatus ?? 'Loading the selected file from disk.'
    : isCompiling
      ? compileStatus ?? 'Preparing the latest saved spec for preview.'
      : null;

  if (!spec) {
    return (
      <div className="relative h-full min-h-0">
        <EmptyState />
        {canvasTaskLabel ? <CanvasTaskOverlay label={canvasTaskLabel} detail={canvasTaskDetail} /> : null}
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden" data-tour-id="document-editor">
      <div className="h-full min-h-0 overflow-y-auto bg-[#0b121b] px-8 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-4 shadow-[0_14px_36px_rgba(4,10,20,0.25)]">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Editor</div>
            <div className="mt-1 text-xl font-semibold text-slate-100">Shape the flow beside the live graph.</div>
            <div className="mt-1 text-sm text-slate-400">
              Questions and results stay visually distinct while the graph updates in parallel.
              {currentPath ? ' Changes remain linked to the current spec file.' : ' Save once when you are ready to compile.'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              {showAddQuestionHint ? (
                <div className="absolute -top-24 right-0 z-20 w-72 rounded-[22px] border border-[#d7b36a]/30 bg-[#121a26]/95 p-4 shadow-[0_22px_60px_rgba(3,8,18,0.36)] backdrop-blur-xl">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Start here</div>
                  <div className="text-sm font-medium text-slate-100">Click + Question to create the first branch in your flow.</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">We will use this as the entry point and mirror it into the graph on the right.</div>
                  <button
                    type="button"
                    onClick={dismissAddQuestionHint}
                    className="mt-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-300 transition hover:border-white/15 hover:bg-white/[0.07]"
                  >
                    Dismiss
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  addQuestion();
                  dismissAddQuestionHint();
                }}
                data-tour-id="add-question-button"
                className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                  showAddQuestionHint
                    ? 'textforge-pulse-ring border-[#d7b36a]/40 bg-[linear-gradient(135deg,rgba(212,179,110,0.2),rgba(99,126,208,0.1))] text-amber-50'
                    : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/16'
                }`}
              >
                + Question
              </button>
            </div>
            <button
              type="button"
              onClick={addResult}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08]"
            >
              + Result
            </button>
          </div>
        </div>
        {showTemplateCustomizeBanner && spec ? (
          <div className="mb-5 rounded-[28px] border border-[#d7b36a]/20 bg-[linear-gradient(180deg,rgba(215,179,106,0.12),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_44px_rgba(3,8,18,0.24)]">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/80">Template refinement</div>
                <div className="mt-1 text-base font-semibold text-slate-100">Customise this template with AI</div>
                <div className="mt-1 text-sm text-slate-400">Keep the structure, then rewrite terminology, policy language, and result guidance for your team.</div>
              </div>
              <button type="button" onClick={() => dismissTemplateCustomizeBanner(true)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300 transition hover:border-white/15 hover:bg-white/[0.08]">Dismiss permanently</button>
            </div>
            <textarea
              value={customisation}
              onChange={(event) => setCustomisation(event.target.value)}
              placeholder="Describe how this template should be adapted for your team, terminology, and policy requirements."
              className="min-h-[120px] w-full rounded-[22px] border border-white/10 bg-[#0a1119]/88 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-300/35 focus:outline-none focus:ring-4 focus:ring-emerald-400/10"
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isLoading || !customisation.trim()}
                onClick={() => {
                  if (!isAiConfigured) {
                    pushToast('AI is not configured — open Settings → AI to connect.', 'warn');
                    return;
                  }
                  void customiseTemplate(spec, customisation)
                    .then((nextSpec) => {
                      if (!isMountedRef.current) return;
                      if (!nextSpec) {
                        throw new Error('AI returned invalid JSON while customising the template.');
                      }
                      openFromGeneratedSpec(nextSpec);
                      dismissTemplateCustomizeBanner();
                    })
                    .catch((caught) => pushToast(caught instanceof Error ? caught.message : String(caught), 'error'));
                }}
                className="rounded-2xl border border-emerald-400/30 bg-emerald-400/12 px-4 py-2.5 text-sm font-medium text-emerald-50 transition hover:bg-emerald-400/18 disabled:opacity-40"
              >
                {isLoading ? 'Customising…' : 'Customise'}
              </button>
              <button type="button" onClick={() => dismissTemplateCustomizeBanner()} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08]">Not now</button>
            </div>
          </div>
        ) : null}
        <EditorErrorBoundary name="Document editor" currentPath={currentPath}>
          <EditorContent editor={editor} />
        </EditorErrorBoundary>
      </div>
      </div>
      {canvasTaskLabel ? <CanvasTaskOverlay label={canvasTaskLabel} detail={canvasTaskDetail} /> : null}
    </div>
  );
}

function CanvasTaskOverlay({ label, detail }: { label: string; detail: string | null }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(7,12,20,0.68)] backdrop-blur-sm">
      <div className="min-w-[280px] rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,25,37,0.96),rgba(10,15,24,0.98))] px-6 py-5 text-center shadow-[0_26px_80px_rgba(2,6,14,0.48)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200/25 border-t-emerald-200" />
        </div>
        <div className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-100">{label}</div>
        {detail ? <div className="mt-2 text-sm leading-6 text-slate-300">{detail}</div> : null}
      </div>
    </div>
  );
}
