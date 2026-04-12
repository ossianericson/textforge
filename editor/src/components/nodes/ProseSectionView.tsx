import { NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { BlockShell, SectionLabel } from './helpers';

export function ProseSectionView({ node }: NodeViewProps) {
  return (
    <BlockShell className="prose-section-card">
      <SectionLabel>{node.attrs.sectionName}</SectionLabel>
      <NodeViewContent className="prose-section" />
    </BlockShell>
  );
}
