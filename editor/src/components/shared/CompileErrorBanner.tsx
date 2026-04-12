import { useEditorStore } from '@/store/useEditorStore';

export function CompileErrorBanner() {
  const lastCompileError = useEditorStore((state) => state.lastCompileError);
  const isCompiling = useEditorStore((state) => state.isCompiling);
  const compile = useEditorStore((state) => state.compile);

  if (!lastCompileError) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 border-b border-red-800 bg-red-950/80 px-4 py-3 text-sm text-red-200"
    >
      <span className="mt-0.5 shrink-0 text-red-400" aria-hidden="true">
        !
      </span>
      <span className="flex-1 leading-relaxed">
        <strong className="font-semibold text-red-100">Compile failed - </strong>
        {lastCompileError}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => void compile()}
          disabled={isCompiling}
          className="rounded border border-red-700 bg-red-900/60 px-2.5 py-1 text-xs font-medium text-red-100 hover:bg-red-800/60 disabled:opacity-50"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={() => useEditorStore.setState({ lastCompileError: null })}
          aria-label="Dismiss compile error"
          className="rounded border border-red-800 px-2 py-1 text-xs text-red-400 hover:text-red-200"
        >
          x
        </button>
      </div>
    </div>
  );
}