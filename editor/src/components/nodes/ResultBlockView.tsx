import { useState } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewContent } from '@tiptap/react';
import type { Result } from '@shared/types';
import { ImprovementPreview } from '@/components/ai/ImprovementPreview';
import { useIsMountedRef } from '@/lib/useIsMountedRef';
import { useAI } from '@/lib/useAI';
import { useEditorStore } from '@/store/useEditorStore';
import { BlockShell } from './helpers';

export function ResultBlockView({ node, deleteNode }: NodeViewProps) {
  const updateResult = useEditorStore((state) => state.updateResult);
  const pushToast = useEditorStore((state) => state.pushToast);
  const { improveResult, isLoading } = useAI();
  const [improvedResult, setImprovedResult] = useState<Result | null>(null);
  const isMountedRef = useIsMountedRef();
  const resultId = String(node.attrs.resultId ?? '');
  const rawData = (node.attrs.rawData ?? {}) as Result;

  return (
    <BlockShell className="result-block">
      <div className="node-block-actions">
        <span className="drag-handle" draggable>
          ⋮⋮
        </span>
        <button
          type="button"
          className="node-icon-btn"
          disabled={isLoading}
          onClick={() => {
            void improveResult(resultId, rawData)
              .then((result) => {
                if (!isMountedRef.current) return;
                if (!result) {
                  throw new Error('AI returned invalid JSON for the result improvement.');
                }
                setImprovedResult(result);
              })
              .catch((caught) => {
                pushToast(caught instanceof Error ? caught.message : String(caught), 'error');
              });
          }}
        >
          ✨ Improve
        </button>
        <button
          type="button"
          className="node-delete-btn"
          onClick={() => {
            if (window.confirm('Delete this result block?')) {
              deleteNode();
            }
          }}
        >
          ×
        </button>
      </div>
      <div data-tour-id="result-block">
        <NodeViewContent className="result-block-content" />
      </div>
      {improvedResult ? (
        <ImprovementPreview
          original={rawData}
          improved={improvedResult}
          onReject={() => setImprovedResult(null)}
          onAccept={(patch) => {
            updateResult(resultId, patch);
            setImprovedResult(null);
            pushToast('Applied AI result improvements.', 'info');
          }}
        />
      ) : null}
    </BlockShell>
  );
}
