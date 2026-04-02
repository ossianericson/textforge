import { useMemo, useState } from 'react';
import { useIsMountedRef } from '@/lib/useIsMountedRef';
import { useEditorStore } from '@/store/useEditorStore';

export function RepoBrowser() {
  const toggleRepoBrowser = useEditorStore((state) => state.toggleRepoBrowser);
  const connectToRepo = useEditorStore((state) => state.connectToRepo);
  const refreshRepoSpecs = useEditorStore((state) => state.refreshRepoSpecs);
  const openRepoSpec = useEditorStore((state) => state.openRepoSpec);
  const savedRepoConnections = useEditorStore((state) => state.savedRepoConnections);
  const repoConnection = useEditorStore((state) => state.repoConnection);
  const repoSpecs = useEditorStore((state) => state.repoSpecs);
  const pushToast = useEditorStore((state) => state.pushToast);
  const [url, setUrl] = useState(repoConnection?.url ?? '');
  const [branch, setBranch] = useState(repoConnection?.branch ?? 'main');
  const [pat, setPat] = useState('');
  const [query, setQuery] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const isMountedRef = useIsMountedRef();

  const filteredSpecs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return repoSpecs;
    }
    return repoSpecs.filter(
      (item) =>
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.path.toLowerCase().includes(normalizedQuery) ||
        item.kind.toLowerCase().includes(normalizedQuery)
    );
  }, [query, repoSpecs]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="repo-browser-title" className="fixed inset-0 z-[66] overflow-y-auto bg-black/70 p-6 backdrop-blur">
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 id="repo-browser-title" className="text-2xl font-semibold text-slate-100">Repo Browser</h2>
            <p className="text-sm text-slate-400">Clone or sync a spec repo, then open decision trees and quizzes directly from the cached working copy.</p>
          </div>
          <button type="button" onClick={() => toggleRepoBrowser(false)} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200">Close</button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[320px,1fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <h3 className="mb-3 text-lg font-semibold text-slate-100">Connect</h3>
              <div className="space-y-3">
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block font-medium">Repository URL</span>
                  <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://github.com/org/specs.git" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100" />
                </label>
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block font-medium">Branch</span>
                  <input value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="main" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100" />
                </label>
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block font-medium">PAT (optional)</span>
                  <input type="password" value={pat} onChange={(event) => setPat(event.target.value)} placeholder="Used for private clone, pull, and push" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100" />
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={isBusy || !url.trim()}
                    onClick={() => {
                      setIsBusy(true);
                      void connectToRepo(url.trim(), branch.trim() || 'main', pat.trim() || undefined)
                        .catch((caught) => pushToast(caught instanceof Error ? caught.message : String(caught), 'error'))
                        .finally(() => {
                          if (!isMountedRef.current) return;
                          setIsBusy(false);
                        });
                    }}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {isBusy ? 'Connecting…' : 'Connect'}
                  </button>
                  <button
                    type="button"
                    disabled={isBusy || !repoConnection}
                    onClick={() => {
                      setIsBusy(true);
                      void refreshRepoSpecs(pat.trim() || undefined)
                        .catch((caught) => pushToast(caught instanceof Error ? caught.message : String(caught), 'error'))
                        .finally(() => {
                          if (!isMountedRef.current) return;
                          setIsBusy(false);
                        });
                    }}
                    className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
                  >
                    Sync latest
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <h3 className="mb-3 text-lg font-semibold text-slate-100">Saved Connections</h3>
              <div className="space-y-2">
                {savedRepoConnections.length === 0 ? (
                  <div className="text-sm text-slate-500">No saved repos yet.</div>
                ) : (
                  savedRepoConnections.map((item) => (
                    <button
                      key={item.local_path}
                      type="button"
                      onClick={() => {
                        setUrl(item.url);
                        setBranch(item.branch);
                        setIsBusy(true);
                        void connectToRepo(item.url, item.branch, pat.trim() || undefined)
                          .catch((caught) => pushToast(caught instanceof Error ? caught.message : String(caught), 'error'))
                          .finally(() => {
                            if (!isMountedRef.current) return;
                            setIsBusy(false);
                          });
                      }}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-left"
                    >
                      <div className="text-sm font-medium text-slate-100">{item.url}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{item.branch} · {new Date(item.last_synced).toLocaleString()}</div>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Repo Specs</h3>
                <p className="text-sm text-slate-400">{repoConnection ? `${repoConnection.current_branch} · ${repoSpecs.length} specs` : 'Connect a repo to browse specs.'}</p>
              </div>
              <input aria-label="Filter repo specs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by title or path" className="w-full max-w-xs rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100" />
            </div>
            <div className="space-y-3">
              {filteredSpecs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/80 p-8 text-sm text-slate-500">No repo specs loaded yet.</div>
              ) : (
                filteredSpecs.map((item) => (
                  <div key={item.path} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{item.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{item.kind} · {item.path}</div>
                    </div>
                    <button type="button" onClick={() => void openRepoSpec(item.path)} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200">Open</button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}