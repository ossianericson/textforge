import { NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { BlockShell } from './helpers';

export function ScoringMatrixBodyView({ node }: NodeViewProps) {
  const categories = Array.isArray(node.attrs.scoringMatrixCategories)
    ? (node.attrs.scoringMatrixCategories as string[]).join(', ')
    : '';
  return (
    <BlockShell className="question-body scoring-matrix-body">
      <div className="matrix-meta-row">
        <span>Categories: {categories || 'None'}</span>
        <span>
          Scale: {node.attrs.scoringMatrixScaleMin ?? 0}–{node.attrs.scoringMatrixScaleMax ?? 0}
        </span>
      </div>
      <NodeViewContent className="question-body-content" />
    </BlockShell>
  );
}
