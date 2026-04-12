import { useMemo } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

export function MyTreesDashboard() {
  const recentFiles = useEditorStore((state) => state.recentFiles);
  const savedRepoConnections = useEditorStore((state) => state.savedRepoConnections);
  const openFile = useEditorStore((state) => state.openFile);
  const compile = useEditorStore((state) => state.compile);
  const toggleDashboard = useEditorStore((state) => state.toggleDashboard);
  const toggleRepoBrowser = useEditorStore((state) => state.toggleRepoBrowser);

  const sorted = useMemo(
    () => [...recentFiles].sort((left, right) => right.lastCompiled - left.lastCompiled),
    [recentFiles]
  );

  return (
    <div className="fixed inset-0 z-[64] overflow-y-auto bg-slate-950/95 p-6 backdrop-blur">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">My Trees</h2>
            <p className="text-sm text-slate-400">Recent specs, compile activity, and a place for repo integration later in the flow.</p>
          </div>
          <button type="button" onClick={toggleDashboard} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200">Close</button>
        </div>
        <div className="space-y-4 p-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-100">Repo Workspace</div>
                <div className="text-sm text-slate-400">{savedRepoConnections.length} saved connection(s)</div>
              </div>
              <button type="button" onClick={() => toggleRepoBrowser(true)} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200">Browse repo</button>
            </div>
            {savedRepoConnections.length === 0 ? (
              <div className="text-sm text-slate-500">Connect a repository to open specs from a cached working copy and push updates back upstream.</div>
            ) : (
              <div className="space-y-2">
                {savedRepoConnections.slice(0, 3).map((item) => (
                  <div key={item.local_path} className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                    <div className="font-medium text-slate-100">{item.url}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{item.branch} · {new Date(item.last_synced).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">No recent files yet. Open and compile a spec to start building your dashboard.</div>
          ) : (
            sorted.map((file) => (
              <div key={file.path} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-slate-100">{file.title}</div>
                    <div className="text-sm text-slate-500">{file.path}</div>
                  </div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Last compiled {file.lastCompiled ? new Date(file.lastCompiled).toLocaleString() : 'Never'}</div>
                </div>
                <div className="mb-4 flex flex-wrap gap-3 text-sm text-slate-300">
                  <span>{file.questionCount} questions</span>
                  <span>{file.resultCount} results</span>
                  <span>{file.warningCount} warnings</span>
                  <span>{file.usageCount} uses</span>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => void openFile(file.path)} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200">Open</button>
                  <button type="button" onClick={() => void openFile(file.path).then(() => compile())} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200">Compile</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}