import type { NodeViewProps } from '@tiptap/react';
import { useMemo } from 'react';
import { TargetSelector } from '@/components/shared/TargetSelector';
import { BlockShell, IconButton } from './helpers';

export function RangeRowView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const warningClass = useMemo(() => {
    if (typeof node.attrs.min !== 'number' || typeof node.attrs.max !== 'number') {
      return '';
    }
    return node.attrs.min > node.attrs.max ? 'overlap-error' : '';
  }, [node.attrs.max, node.attrs.min]);

  return (
    <BlockShell className="range-row">
      <input
        type="number"
        value={node.attrs.min ?? 0}
        className={`range-input ${warningClass}`}
        onChange={(event) => updateAttributes({ min: Number(event.target.value) })}
      />
      <span className="range-separator">–</span>
      <input
        type="number"
        value={node.attrs.max ?? 0}
        className={`range-input ${warningClass}`}
        onChange={(event) => updateAttributes({ max: Number(event.target.value) })}
      />
      <input
        type="text"
        value={node.attrs.label ?? ''}
        className="range-input range-label-input"
        placeholder="Label"
        onChange={(event) => updateAttributes({ label: event.target.value })}
      />
      <TargetSelector
        value={node.attrs.target ?? ''}
        onChange={(target) => updateAttributes({ target })}
        placeholder="Choose target"
      />
      <IconButton title="Remove range" onClick={() => deleteNode()}>
        ×
      </IconButton>
    </BlockShell>
  );
}
