import { useEffect, useMemo, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { buildBadgeDefinitions } from '@/lib/badges';
import { useIsMountedRef } from '@/lib/useIsMountedRef';
import { useEditorStore } from '@/store/useEditorStore';
import type { BadgeDefinition } from '@shared/types';

interface Props {
  value: { text: string; className: string };
  onChange: (badge: { text: string; className: string }) => void;
}

export function BadgePickerInline({ value, onChange }: Props) {
  const repoRoot = useEditorStore((state) => state.repoRoot);
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const selected = useMemo(
    () => badges.find((badge) => badge.className === value.className),
    [badges, value.className]
  );

  return (
    <div ref={containerRef} className="badge-picker-inline">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="badge-pill"
        style={{ borderColor: selected?.color ?? '#334155' }}
      >
        <span className="badge-pill-dot" style={{ background: selected?.color ?? '#64748b' }} />
        <span>{value.text || selected?.label || 'Pick badge'}</span>
      </button>
      {open && badges.length > 0 ? (
        <div className="badge-picker-popover">
          {badges.map((badge) => (
            <button
              type="button"
              key={badge.className}
              className={`badge-picker-option ${badge.className === value.className ? 'badge-picker-option-active' : ''}`}
              onClick={() => {
                onChange({ text: badge.label, className: badge.className });
                setOpen(false);
              }}
            >
              <span className="badge-pill-dot" style={{ background: badge.color }} />
              <span>{badge.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
