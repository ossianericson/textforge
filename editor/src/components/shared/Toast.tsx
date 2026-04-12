import type { ToastItem } from '@shared/types';

const COLORS: Record<ToastItem['level'], string> = {
  info: 'border-slate-500 bg-slate-800/95 text-slate-100',
  warn: 'border-amber-500 bg-amber-900/95 text-amber-100',
  error: 'border-red-500 bg-red-900/95 text-red-100',
};

export function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  return (
    <div className={`flex min-w-[300px] items-center gap-3 rounded-lg border px-3 py-2 text-sm shadow-xl ${COLORS[toast.level]}`}>
      <span className="flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="opacity-60 transition hover:opacity-100">✕</button>
    </div>
  );
}