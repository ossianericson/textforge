import { useRef, useState } from 'react';
import { ModalShell } from '@/components/shared/ModalShell';
import { useIsMountedRef } from '@/lib/useIsMountedRef';
import { useEditorStore } from '@/store/useEditorStore';

export function CommitModal() {
  const toggleCommitModal = useEditorStore((state) => state.toggleCommitModal);
  const repoConnection = useEditorStore((state) => state.repoConnection);
  const commitCurrentSpec = useEditorStore((state) => state.commitCurrentSpec);
  const pushToast = useEditorStore((state) => state.pushToast);
  const [message, setMessage] = useState('Update spec');
  const [branch, setBranch] = useState(repoConnection?.current_branch ?? repoConnection?.branch ?? 'main');
  const [pat, setPat] = useState('');
  const [createPullRequest, setCreatePullRequest] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isMountedRef = useIsMountedRef();
  const messageInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <ModalShell
      labelledBy="commit-modal-title"
      onClose={() => toggleCommitModal(false)}
      initialFocusRef={messageInputRef}
      panelClassName="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
    >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 id="commit-modal-title" className="text-xl font-semibold text-slate-100">Save and Commit</h2>
            <p className="text-sm text-slate-400">Write the current spec, create a Git commit, and push it to the connected repo.</p>
          </div>
          <button type="button" onClick={() => toggleCommitModal(false)} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200">Close</button>
        </div>
        <div className="space-y-4 p-5">
          <label className="block text-sm text-slate-200">
            <span className="mb-2 block font-medium">Commit message</span>
            <input ref={messageInputRef} value={message} onChange={(event) => setMessage(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100" />
          </label>
          <label className="block text-sm text-slate-200">
            <span className="mb-2 block font-medium">Branch</span>
            <input value={branch} onChange={(event) => setBranch(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100" />
          </label>
          <label className="block text-sm text-slate-200">
            <span className="mb-2 block font-medium">PAT (optional)</span>
            <input type="password" value={pat} onChange={(event) => setPat(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100" />
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-200">
            <input type="checkbox" checked={createPullRequest} onChange={(event) => setCreatePullRequest(event.target.checked)} />
            Create a pull request link after push
          </label>
          {resultUrl ? (
            <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              Pull request URL: {resultUrl}
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4">
          <button type="button" onClick={() => toggleCommitModal(false)} className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200">Cancel</button>
          <button
            type="button"
            disabled={isSaving || !message.trim()}
            onClick={() => {
              setIsSaving(true);
              void commitCurrentSpec(message.trim(), branch.trim() || undefined, pat.trim() || undefined, createPullRequest)
                .then((result) => {
                  if (!isMountedRef.current) return;
                  setResultUrl(result?.pull_request_url ?? null);
                })
                .catch((caught) => pushToast(caught instanceof Error ? caught.message : String(caught), 'error'))
                .finally(() => {
                  if (!isMountedRef.current) return;
                  setIsSaving(false);
                });
            }}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {isSaving ? 'Committing…' : 'Save and Commit'}
          </button>
        </div>
    </ModalShell>
  );
}