import { useEffect, useMemo, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { invoke } from '@tauri-apps/api/core';
import { ModalShell } from '@/components/shared/ModalShell';
import { generateMermaid } from '@/lib/mermaid-export';
import { useIsMountedRef } from '@/lib/useIsMountedRef';
import { useEditorStore } from '@/store/useEditorStore';

function siblingPath(filePath: string, name: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  const dir = lastSlash >= 0 ? normalized.slice(0, lastSlash) : '.';
  return `${dir}/${name}`;
}

export function MermaidExportModal() {
  const spec = useEditorStore((state) => state.spec);
  const currentPath = useEditorStore((state) => state.currentPath);
  const toggleMermaidModal = useEditorStore((state) => state.toggleMermaidModal);
  const pushToast = useEditorStore((state) => state.pushToast);
  const source = useMemo(() => (spec ? generateMermaid(spec) : ''), [spec]);
  const [svg, setSvg] = useState('');
  const isMountedRef = useIsMountedRef();
  const saveButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
  }, []);

  useEffect(() => {
    if (!source) {
      setSvg('');
      return;
    }
    let cancelled = false;
    mermaid
      .render(`textforge-mermaid-${Date.now()}`, source)
      .then((result) => {
        if (!cancelled && isMountedRef.current) {
          setSvg(result.svg);
        }
      })
      .catch((error) => {
        if (!cancelled && isMountedRef.current) {
          setSvg(`<pre>${String(error)}</pre>`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <ModalShell
      labelledBy="mermaid-export-title"
      onClose={toggleMermaidModal}
      initialFocusRef={saveButtonRef}
      panelClassName="flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
    >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <div id="mermaid-export-title" className="text-lg font-semibold text-slate-100">Mermaid Export</div>
            <div className="text-sm text-slate-400">Generate and save a Mermaid flowchart from the current spec.</div>
          </div>
          <button type="button" onClick={toggleMermaidModal} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200">
            Close
          </button>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-0 overflow-hidden">
          <div className="flex flex-col border-r border-slate-800">
            <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-300">
              <span>diagram.mmd</span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(source)
                    .then(() => pushToast('Mermaid source copied.', 'info'))
                    .catch((caught) => pushToast(caught instanceof Error ? caught.message : String(caught), 'error'));
                }}
                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-200"
              >
                Copy
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs text-slate-300">{source}</pre>
          </div>
          <div className="flex flex-col overflow-hidden">
            <div className="px-4 py-3 text-sm text-slate-300">Preview</div>
            <div className="flex-1 overflow-auto bg-white p-4" dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-800 px-4 py-3">
          <button
            ref={saveButtonRef}
            type="button"
            onClick={() => {
              if (!currentPath) {
                pushToast('Open a saved spec before exporting Mermaid files.', 'error');
                return;
              }
              void invoke('write_file', { path: siblingPath(currentPath, 'diagram.mmd'), content: source })
                .then(() => invoke('write_file', { path: siblingPath(currentPath, 'diagram.svg'), content: svg }))
                .then(() => pushToast('Saved Mermaid diagram next to spec.md', 'info'))
                .catch((caught) => pushToast(caught instanceof Error ? caught.message : String(caught), 'error'));
            }}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white"
          >
            Save
          </button>
        </div>
    </ModalShell>
  );
}
