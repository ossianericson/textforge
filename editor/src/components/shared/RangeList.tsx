import type { DropdownRange } from '@shared/types';

interface RangeListProps {
  ranges: DropdownRange[];
  onChange: (ranges: DropdownRange[]) => void;
  targets: string[];
}

export function RangeList({ ranges, onChange, targets }: RangeListProps) {
  const update = (index: number, patch: Partial<DropdownRange>) => {
    onChange(ranges.map((range, rangeIndex) => (rangeIndex === index ? { ...range, ...patch } : range)));
  };

  return (
    <div className="flex flex-col gap-2">
      {ranges.map((range, index) => (
        <div key={`${range.min}-${range.max}-${index}`} className="grid grid-cols-[68px_68px_1fr_1fr_24px] items-center gap-2">
          <input type="number" className="input-sm" value={range.min} onChange={(event) => update(index, { min: Number(event.target.value) })} />
          <input type="number" className="input-sm" value={range.max} onChange={(event) => update(index, { max: Number(event.target.value) })} />
          <input className="input-sm" value={range.label} placeholder="Label" onChange={(event) => update(index, { label: event.target.value })} />
          <select className="input-sm" value={range.next} onChange={(event) => update(index, { next: event.target.value })}>
            <option value="">Select target…</option>
            {targets.map((target) => (
              <option key={target} value={target}>{target}</option>
            ))}
          </select>
          <button onClick={() => onChange(ranges.filter((_, rangeIndex) => rangeIndex !== index))} className="text-xs text-red-300 transition hover:text-red-200">
            ✕
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...ranges, { min: 0, max: 0, next: '', label: '' }])} className="text-left text-xs text-emerald-300 transition hover:text-emerald-200">
        + Add range
      </button>
    </div>
  );
}