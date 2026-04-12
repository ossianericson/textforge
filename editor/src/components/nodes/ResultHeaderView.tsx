import type { NodeViewProps } from '@tiptap/react';
import { NodeViewContent } from '@tiptap/react';
import { BadgePickerInline } from '@/components/shared/BadgePickerInline';
import { BlockShell } from './helpers';

export function ResultHeaderView({ node, updateAttributes }: NodeViewProps) {
  return (
    <BlockShell className="result-header-bar">
      <input
        value={node.attrs.icon ?? ''}
        onChange={(event) => updateAttributes({ icon: event.target.value })}
        className="result-icon-input"
      />
      <NodeViewContent className="result-title-node" />
      <BadgePickerInline
        value={{ text: node.attrs.badgeText ?? '', className: node.attrs.badgeClass ?? '' }}
        onChange={(badge) => updateAttributes({ badgeText: badge.text, badgeClass: badge.className })}
      />
    </BlockShell>
  );
}
