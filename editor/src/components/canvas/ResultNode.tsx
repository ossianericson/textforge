import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

export function ResultNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`rounded-[24px] border p-4 text-xs shadow-[0_16px_38px_rgba(6,11,20,0.3)] backdrop-blur transition ${
        selected
          ? 'border-emerald-200/65 bg-[linear-gradient(180deg,rgba(23,79,68,0.94),rgba(13,42,37,0.94))] ring-1 ring-emerald-200/35'
          : 'border-emerald-400/18 bg-[linear-gradient(180deg,rgba(20,60,53,0.92),rgba(12,35,31,0.9))]'
      }`}
      style={{ width: 260, minHeight: 104 }}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border !border-slate-200/40 !bg-slate-100" />
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-2xl leading-none">{data.icon}</span>
        <span className="rounded-full border border-emerald-100/10 bg-emerald-300/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-emerald-50">
          {data.badge?.text ?? 'Result'}
        </span>
      </div>
      <div className="line-clamp-2 text-[15px] font-semibold leading-snug text-white">{data.label ?? 'Untitled result'}</div>
    </div>
  );
}