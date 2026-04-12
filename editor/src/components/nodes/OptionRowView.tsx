import type { NodeViewProps } from '@tiptap/react';
import { NodeViewContent } from '@tiptap/react';
import { TargetSelector } from '@/components/shared/TargetSelector';
import { BlockShell, IconButton } from './helpers';

export function OptionRowView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  return (
    <BlockShell className="option-row">
      <span className="option-bullet">○</span>
      <NodeViewContent className="option-text-content" />
      <span className="option-arrow">→</span>
      <TargetSelector
        value={node.attrs.target ?? ''}
        onChange={(target) => updateAttributes({ target })}
        placeholder="Choose target"
      />
      <IconButton
        title="Toggle recommended"
        active={Boolean(node.attrs.recommended)}
        onClick={() => updateAttributes({ recommended: !node.attrs.recommended })}
      >
        ⭐
      </IconButton>
      <IconButton
        title="Toggle advanced"
        active={Boolean(node.attrs.advanced)}
        onClick={() => updateAttributes({ advanced: !node.attrs.advanced })}
      >
        ⚡
      </IconButton>
      <IconButton title="Remove option" onClick={() => deleteNode()}>
        ×
      </IconButton>
    </BlockShell>
  );
}
