import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

const TYPE_LABELS: Record<string, string> = {
  buttons: 'buttons',
  dropdown: 'dropdown',
  'dropdown-pair': 'pair',
  slider: 'slider',
  'multi-select': 'multi',
  toggle: 'toggle',
  'scoring-matrix': 'matrix',
};

export function QuestionNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`rounded-[24px] border p-4 text-xs shadow-[0_16px_38px_rgba(6,11,20,0.3)] backdrop-blur transition ${
        selected
          ? 'border-sky-200/65 bg-[linear-gradient(180deg,rgba(39,74,116,0.94),rgba(19,34,54,0.94))] ring-1 ring-sky-200/35'
          : 'border-sky-400/18 bg-[linear-gradient(180deg,rgba(27,46,70,0.92),rgba(16,28,45,0.9))]'
      }`}
      style={{ width: 260, minHeight: 104 }}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border !border-slate-200/40 !bg-slate-100" />
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sky-100/65">{data.id}</span>
        <span className="rounded-full border border-sky-200/10 bg-sky-300/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-sky-50">
          {TYPE_LABELS[data.questionType ?? 'buttons'] ?? 'buttons'}
        </span>
      </div>
      <div className="line-clamp-2 text-[15px] font-semibold leading-snug text-white">{data.label ?? 'Untitled question'}</div>
      <div className="mt-3 text-[11px] text-sky-100/70">{data.optionCount ?? 0} option routes</div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border !border-sky-100/30 !bg-sky-300" />
    </div>
  );
}