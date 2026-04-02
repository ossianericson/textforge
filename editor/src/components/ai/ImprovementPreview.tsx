import { useMemo, useState } from 'react';
import type { Result } from '@shared/types';

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join('\n');
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value ?? '');
}

export function ImprovementPreview({
  original,
  improved,
  onAccept,
  onReject,
}: {
  original: Result;
  improved: Result;
  onAccept: (patch: Partial<Result>) => void;
  onReject: () => void;
}) {
  const changedKeys = useMemo(
    () =>
      Object.keys(improved).filter(
        (key) => JSON.stringify(original[key as keyof Result]) !== JSON.stringify(improved[key as keyof Result])
      ) as Array<keyof Result>,
    [improved, original]
  );
  const [selectedKeys, setSelectedKeys] = useState<Set<keyof Result>>(new Set(changedKeys));

  const toggleKey = (key: keyof Result) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const accept = () => {
    const patch = Object.fromEntries(
      changedKeys
        .filter((key) => selectedKeys.has(key))
        .map((key) => [key, improved[key]])
    ) as Partial<Result>;
    onAccept(patch);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Improvement Preview</h3>
            <p className="text-sm text-slate-400">Compare the original result with the AI-improved version before applying it.</p>
          </div>
          <button type="button" onClick={onReject} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200">
            Close
          </button>
        </div>
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-3 text-sm">
          <button
            type="button"
            onClick={() => setSelectedKeys(new Set(changedKeys))}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={() => setSelectedKeys(new Set())}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200"
          >
            Reject all
          </button>
          <span className="text-slate-500">{changedKeys.length} changed field(s)</span>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-4">
            {changedKeys.map((key) => {
              const selected = selectedKeys.has(key);
              return (
                <div key={String(key)} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-100">{String(key)}</div>
                    <button
                      type="button"
                      onClick={() => toggleKey(key)}
                      className={`rounded-md px-3 py-1 text-xs font-medium ${selected ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200'}`}
                    >
                      {selected ? 'Apply' : 'Ignore'}
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <pre className="overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">{formatValue(original[key])}</pre>
                    <pre className="overflow-auto rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">{formatValue(improved[key])}</pre>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4">
          <button type="button" onClick={onReject} className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200">
            Cancel
          </button>
          <button type="button" onClick={accept} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
            Apply selected changes
          </button>
        </div>
      </div>
    </div>
  );
}