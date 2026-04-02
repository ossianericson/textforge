import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { buildBadgeDefinitions } from '@/lib/badges';
import { useIsMountedRef } from '@/lib/useIsMountedRef';
import { useEditorStore } from '@/store/useEditorStore';
import type { BadgeDefinition } from '@shared/types';

interface Props {
  value: { text: string; className: string };
  onChange: (badge: { text: string; className: string }) => void;
}

export function BadgePicker({ value, onChange }: Props) {
  const repoRoot = useEditorStore((state) => state.repoRoot);
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [open, setOpen] = useState(false);
  const isMountedRef = useIsMountedRef();

  useEffect(() => {
    if (!repoRoot) {
      return;
    }
    invoke<string>('read_file', { path: `${repoRoot}/core/badges.yml` })
      .then((content) => {
        if (!isMountedRef.current) return;
        setBadges(buildBadgeDefinitions(content));
      })
      .catch(() => {
        if (!isMountedRef.current) return;
        setBadges([]);
      });
  }, [repoRoot]);

  const selected = badges.find((badge) => badge.className === value.className);

  return (
    <div className="relative">
      <button onClick={() => setOpen((current) => !current)} className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100 transition hover:bg-slate-700">
        <span className="inline-block h-3 w-3 rounded-full" style={{ background: selected?.color ?? '#64748b' }} />
        <span>{value.text || value.className}</span>
        <span>▾</span>
      </button>
      {open && badges.length > 0 ? (
        <div className="absolute left-0 top-full z-30 mt-1 grid min-w-[220px] grid-cols-2 gap-1 rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-2xl">
          {badges.map((badge) => (
            <button
              key={badge.className}
              onClick={() => {
                onChange({ text: badge.label, className: badge.className });
                setOpen(false);
              }}
              className={`flex items-center gap-2 rounded px-2 py-1 text-left text-xs transition hover:bg-slate-700 ${badge.className === value.className ? 'bg-slate-700' : ''}`}
            >
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: badge.color }} />
              <span>{badge.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}