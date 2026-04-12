import { useEditorStore } from '@/store/useEditorStore';

export function EnvWarningBanner() {
  const envReady = useEditorStore((state) => state.envReady);
  const envWarning = useEditorStore((state) => state.envWarning);
  const checkEnv = useEditorStore((state) => state.checkEnv);

  if (envReady !== false || !envWarning) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-amber-700 bg-amber-950/80 px-4 py-3 text-sm text-amber-200"
    >
      <span className="mt-0.5 shrink-0 text-amber-400" aria-hidden="true">
        !
      </span>
      <span className="flex-1 leading-relaxed">
        <strong className="font-semibold text-amber-100">Compiler not ready - </strong>
        {envWarning}
      </span>
      <button
        type="button"
        onClick={() => void checkEnv()}
        className="shrink-0 rounded border border-amber-700 bg-amber-900/60 px-2.5 py-1 text-xs font-medium text-amber-100 hover:bg-amber-800/60"
      >
        Re-check
      </button>
    </div>
  );
}