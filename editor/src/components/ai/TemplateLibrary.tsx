import { useMemo, useState } from 'react';
import { templateLibrary } from '@/lib/template-library';
import { useEditorStore } from '@/store/useEditorStore';

function isInternalFirstTemplate(id: string, domain: string, tags: string[]): boolean {
  const haystack = `${id} ${domain} ${tags.join(' ')}`.toLowerCase();
  const externalMarkers = ['azure', 'aws', 'gcp', 'cloud', 'network', 'compute', 'platform'];
  return !externalMarkers.some((marker) => haystack.includes(marker));
}

export function TemplateLibrary({ onClose }: { onClose: () => void }) {
  const openFromGeneratedSpec = useEditorStore((state) => state.openFromGeneratedSpec);
  const showTemplateBanner = useEditorStore((state) => state.showTemplateBanner);
  const pushToast = useEditorStore((state) => state.pushToast);
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('All');

  const domains = useMemo(() => ['All', ...new Set(templateLibrary.map((template) => template.domain))], []);
  const filtered = useMemo(
    () =>
      templateLibrary
        .filter((template) => {
          const matchesDomain = domain === 'All' || template.domain === domain;
          const haystack = `${template.title} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
          const matchesSearch = haystack.includes(search.toLowerCase());
          return matchesDomain && matchesSearch;
        })
        .sort((left, right) => {
          const priorityDelta = Number(isInternalFirstTemplate(right.id, right.domain, right.tags)) - Number(isInternalFirstTemplate(left.id, left.domain, left.tags));
          if (priorityDelta !== 0) {
            return priorityDelta;
          }
          return right.completeness - left.completeness;
        }),
    [domain, search]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search templates"
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-300/35 focus:outline-none focus:ring-4 focus:ring-emerald-400/10"
        />
        <select
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 focus:border-emerald-300/35 focus:outline-none focus:ring-4 focus:ring-emerald-400/10"
        >
          {domains.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((template) => (
          <div key={template.id} className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_14px_36px_rgba(4,10,20,0.22)]">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-3xl">{template.icon}</div>
              <div className="flex items-center gap-2">
                {isInternalFirstTemplate(template.id, template.domain, template.tags) ? (
                  <span className="rounded-full border border-[#d7b36a]/35 bg-[#d7b36a]/12 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-amber-100">Internal first</span>
                ) : null}
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-400">{template.domain}</span>
              </div>
            </div>
            <div className="mb-2 text-lg font-semibold text-slate-100">{template.title}</div>
            <p className="mb-4 text-sm text-slate-400">{template.description}</p>
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Completeness</span>
                <span>{template.completeness}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06]">
                <div className="h-2 rounded-full bg-[linear-gradient(90deg,#8ad0b6,#d7b36a)]" style={{ width: `${template.completeness}%` }} />
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                openFromGeneratedSpec(template.spec);
                showTemplateBanner();
                pushToast('Template loaded. Customise for your domain.', 'info');
                onClose();
              }}
              className="rounded-2xl border border-emerald-400/30 bg-emerald-400/12 px-4 py-2.5 text-sm font-medium text-emerald-50 transition hover:bg-emerald-400/18"
            >
              Use this template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}