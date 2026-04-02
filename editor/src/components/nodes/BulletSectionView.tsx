import { useState } from 'react';
import { NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import type { Result } from '@shared/types';
import { useIsMountedRef } from '@/lib/useIsMountedRef';
import { useAI } from '@/lib/useAI';
import { useEditorStore } from '@/store/useEditorStore';
import { BlockShell, SectionLabel } from './helpers';

function extractText(node: NodeViewProps['node']): string[] {
  return node.content.content
    .map((child) => child.textContent.trim())
    .filter(Boolean);
}

function resolveResultContext({ editor, getPos }: NodeViewProps): { resultId: string; result: Result } | null {
  const position = typeof getPos === 'function' ? getPos() : null;
  if (position == null) {
    return null;
  }
  const resolved = editor.state.doc.resolve(position);
  for (let depth = resolved.depth; depth >= 0; depth -= 1) {
    const current = resolved.node(depth);
    if (current.type.name === 'resultBlock') {
      return {
        resultId: String(current.attrs.resultId ?? ''),
        result: (current.attrs.rawData ?? {}) as Result,
      };
    }
  }
  return null;
}

export function BulletSectionView(props: NodeViewProps) {
  const { node } = props;
  const updateResult = useEditorStore((state) => state.updateResult);
  const pushToast = useEditorStore((state) => state.pushToast);
  const { suggestSection, isLoading } = useAI();
  const [ghostItems, setGhostItems] = useState<string[]>([]);
  const isMountedRef = useIsMountedRef();
  const sectionName = String(node.attrs.sectionName ?? '');
  const currentItems = extractText(node);
  const resultContext = resolveResultContext(props);

  return (
    <BlockShell className="bullet-section">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>{sectionName}</SectionLabel>
        {currentItems.length < 2 && resultContext ? (
          <button
            type="button"
            disabled={isLoading}
            className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200"
            onClick={() => {
              void suggestSection(resultContext.result.title, sectionName)
                .then((items) => {
                  if (!isMountedRef.current) return;
                  setGhostItems(items ?? []);
                })
                .catch((caught) => {
                  pushToast(caught instanceof Error ? caught.message : String(caught), 'error');
                });
            }}
          >
            ✨ Suggest
          </button>
        ) : null}
      </div>
      <NodeViewContent className="bullet-section-items" />
      {ghostItems.length > 0 ? (
        <div className="mt-3 space-y-2 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 p-3">
          {ghostItems.map((item) => (
            <div key={item} className="flex items-start justify-between gap-3 rounded-md bg-slate-950/70 px-3 py-2 text-sm text-slate-200">
              <span>{item}</span>
              <button
                type="button"
                className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white"
                onClick={() => {
                  if (!resultContext) {
                    return;
                  }
                  const existing = Array.isArray(resultContext.result[sectionName as keyof Result])
                    ? ([...(resultContext.result[sectionName as keyof Result] as string[]), item])
                    : [item];
                  updateResult(resultContext.resultId, {
                    [sectionName]: existing,
                  } as Partial<Result>);
                  setGhostItems((current) => current.filter((value) => value !== item));
                  pushToast(`Added suggestion to ${sectionName}.`, 'info');
                }}
              >
                +
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </BlockShell>
  );
}
