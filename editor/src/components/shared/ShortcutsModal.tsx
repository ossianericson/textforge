import { useRef } from 'react';
import { ModalShell } from '@/components/shared/ModalShell';

const shortcuts = [
  ['Open', 'Ctrl+O / Cmd+O'],
  ['Save', 'Ctrl+S / Cmd+S'],
  ['Save As', 'Ctrl+Shift+S / Cmd+Shift+S'],
  ['Undo', 'Ctrl+Z / Cmd+Z'],
  ['Preview', 'Ctrl+P / Cmd+P'],
  ['Mermaid export', 'Ctrl+M / Cmd+M'],
  ['Sidebar', 'Toolbar button'],
  ['My Trees dashboard', 'Ctrl+D / Cmd+D'],
  ['Create with AI', 'Ctrl+G / Cmd+G'],
  ['Take the tour', 'F1'],
  ['Shortcuts', 'Ctrl+? / Cmd+?'],
];

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  if (!open) {
    return null;
  }

  return (
    <ModalShell
      labelledBy="shortcuts-modal-title"
      onClose={onClose}
      initialFocusRef={closeButtonRef}
      panelClassName="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
    >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 id="shortcuts-modal-title" className="text-xl font-semibold text-slate-100">Keyboard Shortcuts</h2>
            <p className="text-sm text-slate-400">Quick references for the editor shell.</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200">Close</button>
        </div>
        <div className="grid gap-3 p-5">
          {shortcuts.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[1fr_auto] gap-4 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-slate-200">{label}</span>
              <span className="font-mono text-slate-400">{value}</span>
            </div>
          ))}
        </div>
    </ModalShell>
  );
}