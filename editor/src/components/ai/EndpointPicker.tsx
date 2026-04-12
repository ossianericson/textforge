import type { DiscoveredEndpoint } from '@shared/types';

export function EndpointPicker({
  endpoints,
  onSelect,
  onClose,
}: {
  endpoints: DiscoveredEndpoint[];
  onSelect: (endpoint: DiscoveredEndpoint) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Choose an Azure OpenAI resource</h3>
            <p className="text-sm text-slate-400">Multiple endpoints were discovered. Pick the one this editor should use.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
          >
            Close
          </button>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {endpoints.map((endpoint) => (
            <button
              key={endpoint.resource_id}
              type="button"
              onClick={() => onSelect(endpoint)}
              className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-left transition hover:border-emerald-500/60 hover:bg-slate-800"
            >
              <div className="mb-2 text-sm font-semibold text-slate-100">{endpoint.name}</div>
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-500">{endpoint.location}</div>
              <div className="text-sm text-slate-300">{endpoint.endpoint}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}