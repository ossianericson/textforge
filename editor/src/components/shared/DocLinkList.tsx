import type { DocLink } from '@shared/types';

export function DocLinkList({ links, onChange }: { links: DocLink[]; onChange: (links: DocLink[]) => void }) {
  const update = (index: number, field: 'label' | 'url', value: string) => {
    onChange(links.map((link, linkIndex) => (linkIndex === index ? { ...link, [field]: value } : link)));
  };

  return (
    <div className="flex flex-col gap-2">
      {links.map((link, index) => (
        <div key={`${link.label}-${index}`} className="rounded-lg border border-slate-700 bg-slate-900/60 p-2">
          <input className="input-sm mb-2" placeholder="Label" value={link.label} onChange={(event) => update(index, 'label', event.target.value)} />
          <div className="flex items-center gap-2">
            <input
              className={`input-sm flex-1 ${!/^https?:\/\//.test(link.url) ? 'error' : ''}`}
              placeholder="https://…"
              value={link.url}
              onChange={(event) => update(index, 'url', event.target.value)}
            />
            <button onClick={() => onChange(links.filter((_, linkIndex) => linkIndex !== index))} className="text-xs text-red-300 transition hover:text-red-200">
              ✕
            </button>
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...links, { label: '', url: 'https://' }])} className="text-left text-xs text-emerald-300 transition hover:text-emerald-200">
        + Add link
      </button>
    </div>
  );
}