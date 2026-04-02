import { useMemo, useState } from 'react';
import type { DiscoveredEndpoint } from '@shared/types';
import { EndpointPicker } from '@/components/ai/EndpointPicker';
import { TemplateLibrary } from '@/components/ai/TemplateLibrary';
import { getOrDiscoverConfig, saveSelectedEndpoint } from '@/lib/ai-config';
import { useIsMountedRef } from '@/lib/useIsMountedRef';
import { useAI } from '@/lib/useAI';
import { useEditorStore } from '@/store/useEditorStore';

type TabId = 'tree' | 'quiz' | 'templates';

const treeExamples = [
  'Help our F5 team choose between iRules, iApps, and AS3',
  'Guide network engineers through VNet peering vs VPN vs ExpressRoute',
  'Business impact assessment — classify workloads by RTO, RPO, data sensitivity',
  'Incident severity triage — route to the correct on-call team',
];

const quizExamples = [
  'Explain the trade-offs between VNet peering, VPN Gateway, and ExpressRoute.',
  'Summarise when to choose App Service, AKS, Functions, or VMs.',
  'Cover incident severity classification and escalation expectations.',
  'Describe storage tiers, replication options, and backup choices.',
];

export function GenerateModal() {
  const toggleGenerateModal = useEditorStore((state) => state.toggleGenerateModal);
  const toggleSettingsModal = useEditorStore((state) => state.toggleSettingsModal);
  const openFromGeneratedSpec = useEditorStore((state) => state.openFromGeneratedSpec);
  const openFromGeneratedQuiz = useEditorStore((state) => state.openFromGeneratedQuiz);
  const pushToast = useEditorStore((state) => state.pushToast);
  const { isLoading, error, clearError, checkAuth, generateTree, generateQuiz } = useAI();
  const [activeTab, setActiveTab] = useState<TabId>('tree');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('Technical');
  const [material, setMaterial] = useState('');
  const [authReady, setAuthReady] = useState<boolean | null>(null);
  const [needsPicker, setNeedsPicker] = useState(false);
  const [endpoints, setEndpoints] = useState<DiscoveredEndpoint[]>([]);
  const isMountedRef = useIsMountedRef();

  const showAuthRecovery = Boolean(error && /(az login|aad)/i.test(error));

  async function prepareEndpointSelection(): Promise<boolean> {
    const result = await getOrDiscoverConfig();
    if (!isMountedRef.current) {
      return false;
    }
    setNeedsPicker(result.needsPicker);
    setEndpoints(result.endpoints);
    return Boolean(result.config);
  }

  const title = useMemo(() => {
    if (activeTab === 'tree') return 'Create with AI';
    if (activeTab === 'quiz') return 'Generate Quiz';
    return 'Template Library';
  }, [activeTab]);

  async function handleTreeGenerate() {
    try {
      const spec = await generateTree(description);
      if (!spec) {
        throw new Error('AI returned invalid JSON for the decision tree.');
      }
      setAuthReady(true);
      openFromGeneratedSpec(spec);
      toggleGenerateModal();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      if (message === 'NEEDS_SETUP') {
        const hasConfig = await prepareEndpointSelection();
        if (hasConfig) {
          const spec = await generateTree(description);
          if (!spec) {
            throw new Error('AI returned invalid JSON for the decision tree.');
          }
          setAuthReady(true);
          openFromGeneratedSpec(spec);
          toggleGenerateModal();
        }
        return;
      }
      if (/(az login|aad)/i.test(message)) {
        setAuthReady(false);
      }
      throw caught;
    }
  }

  async function handleQuizGenerate() {
    try {
      const quiz = await generateQuiz(subject, grade, material);
      if (!quiz) {
        throw new Error('AI returned invalid JSON for the quiz.');
      }
      setAuthReady(true);
      openFromGeneratedQuiz(quiz);
      pushToast('Quiz JSON generated.', 'info');
      toggleGenerateModal();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      if (message === 'NEEDS_SETUP') {
        const hasConfig = await prepareEndpointSelection();
        if (hasConfig) {
          const quiz = await generateQuiz(subject, grade, material);
          if (!quiz) {
            throw new Error('AI returned invalid JSON for the quiz.');
          }
          setAuthReady(true);
          openFromGeneratedQuiz(quiz);
          pushToast('Quiz JSON generated.', 'info');
          toggleGenerateModal();
        }
        return;
      }
      if (/(az login|aad)/i.test(message)) {
        setAuthReady(false);
      }
      throw caught;
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="generate-modal-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 id="generate-modal-title" className="text-xl font-semibold text-slate-100">{title}</h2>
            <p className="text-sm text-slate-400">Turn plain-language input into structured editor content.</p>
          </div>
          <button type="button" onClick={toggleGenerateModal} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200">
            Close
          </button>
        </div>

        <div role="tablist" aria-label="Generate mode" className="flex gap-2 border-b border-slate-800 px-5 py-3 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('tree')}
            role="tab"
            aria-selected={activeTab === 'tree'}
            className={`rounded-full px-4 py-1.5 ${activeTab === 'tree' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200'}`}
          >
            🌳 Decision Tree
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            role="tab"
            aria-selected={activeTab === 'quiz'}
            className={`rounded-full px-4 py-1.5 ${activeTab === 'quiz' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200'}`}
          >
            📝 Quiz
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            role="tab"
            aria-selected={activeTab === 'templates'}
            className={`rounded-full px-4 py-1.5 ${activeTab === 'templates' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200'}`}
          >
            📚 Templates
          </button>
        </div>

        {authReady === false ? (
          <div role="alert" className="border-b border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm text-amber-100">
            Azure AI authentication is not ready. Run <span className="font-semibold">az login</span> and try again.
          </div>
        ) : null}

        {showAuthRecovery ? (
          <div role="alert" className="mx-5 mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
            <div className="mb-2 text-base font-semibold">⚠ AI authentication failed</div>
            <div className="mb-3">Option 1 — Sign into Azure (recommended): Open a terminal and run <span className="font-semibold">az login</span>, then try again.</div>
            <div className="mb-4">Option 2 — Use an API key.</div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  void checkAuth()
                    .then((ready) => {
                      if (!isMountedRef.current) return;
                      setAuthReady(ready);
                    })
                    .catch(() => {
                      if (!isMountedRef.current) return;
                      setAuthReady(false);
                    });
                }}
                className="rounded-md border border-amber-400/30 px-3 py-1.5 text-xs font-medium text-amber-100"
              >
                Try again
              </button>
              <button type="button" onClick={toggleSettingsModal} className="rounded-md border border-amber-400/30 px-3 py-1.5 text-xs font-medium text-amber-100">Open Settings</button>
              <button type="button" onClick={clearError} className="rounded-md border border-amber-400/30 px-3 py-1.5 text-xs font-medium text-amber-100">Dismiss</button>
            </div>
          </div>
        ) : error ? (
          <div role="alert" className="mx-5 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            <div className="mb-2 font-semibold">AI request failed</div>
            <div>{error}</div>
            <button type="button" onClick={clearError} className="mt-3 rounded-md border border-red-400/30 px-3 py-1 text-xs text-red-100">
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'tree' ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-200">Describe the decision tree you want</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-label="Describe the decision tree you want"
                placeholder="Describe the audience, the decision criteria, the branches to consider, and the outcomes you want the editor to generate."
                className="min-h-[240px] w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500"
              />
              <div className="grid gap-3 md:grid-cols-2">
                {treeExamples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setDescription(example)}
                    className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-emerald-500/60 hover:bg-slate-800"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : activeTab === 'quiz' ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block font-medium">Subject</span>
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100"
                  />
                </label>
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block font-medium">Level</span>
                  <input
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100"
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-200">Source material</label>
              <textarea
                value={material}
                onChange={(event) => setMaterial(event.target.value)}
                aria-label="Source material"
                placeholder="Paste the material the quiz should cover."
                className="min-h-[220px] w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500"
              />
              <div className="grid gap-3 md:grid-cols-2">
                {quizExamples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setMaterial(example)}
                    className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-emerald-500/60 hover:bg-slate-800"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <TemplateLibrary onClose={toggleGenerateModal} />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-4">
          <span className="text-sm text-slate-400">Uses your corporate Azure identity · No setup required</span>
          <button
            type="button"
            disabled={
              activeTab === 'templates' ||
              isLoading ||
              (activeTab === 'tree' ? !description.trim() : !subject.trim() || !material.trim())
            }
            onClick={() => void (activeTab === 'tree' ? handleTreeGenerate() : handleQuizGenerate())}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {activeTab === 'templates' ? 'Select a template' : isLoading ? 'Generating…' : 'Generate'}
          </button>
        </div>

        {needsPicker ? (
          <EndpointPicker
            endpoints={endpoints}
            onClose={() => setNeedsPicker(false)}
            onSelect={(endpoint) => {
              void saveSelectedEndpoint(endpoint)
                .then(() => {
                  setNeedsPicker(false);
                  pushToast(`Using ${endpoint.name} for AI requests.`, 'info');
                })
                .catch((caught) => {
                  pushToast(caught instanceof Error ? caught.message : String(caught), 'error');
                });
            }}
          />
        ) : null}
      </div>
    </div>
  );
}