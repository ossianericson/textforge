import { useEditorStore } from '@/store/useEditorStore';

export function ValidationPanel() {
  const validationWarnings = useEditorStore((state) => state.validationWarnings);
  const aiReviewIssues = useEditorStore((state) => state.aiReviewIssues);
  const items = [
    ...validationWarnings.map((warning) => ({
      key: `${warning.code}-${warning.line}-${warning.message}`,
      line: warning.line,
      code: warning.code,
      message: warning.message,
      nodeId: warning.nodeId,
      kind: warning.code.startsWith('E') ? 'error' : warning.code.startsWith('W') ? 'warning' : 'suggestion',
    })),
    ...aiReviewIssues.map((issue, index) => ({
      key: `ai-${index}-${issue.message}`,
      line: 0,
      code: `✨ ${issue.type.toUpperCase()}`,
      message: issue.message,
      nodeId: issue.nodeId ?? undefined,
      kind: issue.type,
    })),
  ];

  return (
    <div className="fixed bottom-7 left-0 right-0 z-30 h-48 border-t border-slate-700 bg-slate-950/95 backdrop-blur">
      <div className="flex h-full flex-col px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Validation</h2>
          <span className="text-xs text-slate-500">{items.length} item(s)</span>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-200">
            ✓ No warnings
          </div>
        ) : (
          <div className="flex-1 space-y-2 overflow-y-auto">
            {items
              .slice()
              .sort((left, right) => left.line - right.line || left.code.localeCompare(right.code))
              .map((warning) => {
                const color = warning.kind === 'error'
                  ? 'border-red-500/40 bg-red-500/10 text-red-100'
                  : warning.kind === 'warning'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                    : 'border-blue-500/40 bg-blue-500/10 text-blue-100';
                return (
                  <button
                    key={warning.key}
                    onClick={() => {
                      if (warning.nodeId) {
                        window.dispatchEvent(
                          new CustomEvent('textforge:scroll-to-id', { detail: { id: warning.nodeId } })
                        );
                      }
                    }}
                    className={`grid w-full grid-cols-[70px_80px_1fr] gap-3 rounded-lg border px-3 py-2 text-left text-xs ${color}`}
                  >
                    <span>[{warning.line || '—'}]</span>
                    <span className="font-mono">{warning.code}</span>
                    <span>{warning.message}</span>
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}