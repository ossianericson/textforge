import { useEffect, useMemo, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { generateMermaid } from '@/lib/mermaid-export';
import { useEditorStore } from '@/store/useEditorStore';

export function CanvasSidebar() {
  const spec = useEditorStore((state) => state.spec);
  const source = useMemo(() => (spec ? generateMermaid(spec) : ''), [spec]);
  const [svg, setSvg] = useState('');
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);

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
      .render(`textforge-sidebar-mermaid-${Date.now()}`, source)
      .then((result) => {
        if (!cancelled) {
          setSvg(result.svg);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setSvg(`<pre style="color:#fca5a5;padding:16px;white-space:pre-wrap;">${String(error)}</pre>`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  const fitToScreen = () => {
    setZoom(1);
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    if (typeof viewport.scrollTo === 'function') {
      viewport.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
      return;
    }

    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col border-l border-white/10 bg-[linear-gradient(180deg,rgba(13,20,31,0.98),rgba(10,15,25,0.96))] shadow-[-24px_0_60px_rgba(0,0,0,0.18)]">
      <div className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Live graph</div>
            <div className="mt-1 text-sm text-slate-300">Follow branches, dead ends, and result density while you edit.</div>
          </div>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-medium text-emerald-100">
            Mermaid active
          </span>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden" data-testid="canvas-sidebar-body">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(215,179,106,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(81,133,210,0.08),transparent_28%)]" />
        <div ref={viewportRef} className="h-full overflow-auto p-6">
          {svg ? (
            <div
              className="origin-top-left rounded-[28px] border border-white/10 bg-[#f8fafc] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
              style={{ transform: `scale(${zoom})`, width: 'fit-content' }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] text-sm text-slate-500">
              Open or create a spec to render the Mermaid flow.
            </div>
          )}
        </div>
        <div className="absolute right-4 top-4">
          <GraphControls
            onZoomIn={() => setZoom((current) => Math.min(2.2, Number((current + 0.1).toFixed(2))))}
            onZoomOut={() => setZoom((current) => Math.max(0.5, Number((current - 0.1).toFixed(2))))}
            onFit={fitToScreen}
          />
        </div>
      </div>
    </div>
  );
}

function GraphControls({ onZoomIn, onZoomOut, onFit }: { onZoomIn: () => void; onZoomOut: () => void; onFit: () => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-[22px] border border-white/10 bg-[#121a26]/88 p-2 shadow-[0_20px_45px_rgba(3,8,18,0.34)] backdrop-blur-xl">
      <GraphFabButton label="Zoom in" onClick={onZoomIn}>
        +
      </GraphFabButton>
      <GraphFabButton label="Zoom out" onClick={onZoomOut}>
        −
      </GraphFabButton>
      <GraphFabButton label="Fit to screen" onClick={onFit}>
        ⤢
      </GraphFabButton>
    </div>
  );
}

function GraphFabButton({ children, label, onClick }: { children: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-lg text-slate-100 transition duration-200 hover:border-white/15 hover:bg-white/[0.1]"
    >
      {children}
    </button>
  );
}
