import type { NodeViewProps } from '@tiptap/react';
import { TargetSelector } from '@/components/shared/TargetSelector';
import { BlockShell, IconButton } from './helpers';

export function MultiSelectRouteView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const values = Array.isArray(node.attrs.values) ? (node.attrs.values as string[]).join(', ') : '';
  return (
    <BlockShell className="multi-select-route-row">
      <input
        className="input-sm"
        value={values}
        onChange={(event) =>
          updateAttributes({ values: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })
        }
        placeholder="Option values, comma-separated"
      />
      <span className="option-arrow">→</span>
      <TargetSelector value={node.attrs.target ?? ''} onChange={(target) => updateAttributes({ target })} placeholder="Choose target" />
      <IconButton title="Remove route" onClick={() => deleteNode()}>
        ×
      </IconButton>
    </BlockShell>
  );
}
