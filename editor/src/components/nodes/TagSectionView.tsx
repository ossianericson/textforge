import type { NodeViewProps } from '@tiptap/react';
import { BlockShell, SectionLabel } from './helpers';

export function TagSectionView({ node, updateAttributes }: NodeViewProps) {
  const value = Array.isArray(node.attrs.values) ? (node.attrs.values as string[]).join(', ') : '';
  return (
    <BlockShell className="tag-section-card">
      <SectionLabel>{node.attrs.sectionName}</SectionLabel>
      <input
        className="input-sm"
        value={value}
        onChange={(event) =>
          updateAttributes({ values: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })
        }
        placeholder="Comma-separated tags"
      />
    </BlockShell>
  );
}
