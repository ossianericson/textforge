import { NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { BlockShell } from './helpers';

export function DropdownPairBodyView({ node }: NodeViewProps) {
  return (
    <BlockShell className="question-body dropdown-pair-body">
      <div className="matrix-meta-row">
        <span>Left: {node.attrs.dropdownLeftLabel || 'Left dropdown'}</span>
        <span>Right: {node.attrs.dropdownRightLabel || 'Right dropdown'}</span>
      </div>
      <NodeViewContent className="question-body-content" />
    </BlockShell>
  );
}
