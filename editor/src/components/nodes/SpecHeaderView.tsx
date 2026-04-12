import type { NodeViewProps } from '@tiptap/react';
import { BlockShell } from './helpers';

export function SpecHeaderView({ node, updateAttributes }: NodeViewProps) {
  return (
    <BlockShell className="spec-header-card">
      <input
        value={node.attrs.title ?? ''}
        onChange={(event) => updateAttributes({ title: event.target.value })}
        className="spec-title-input"
        placeholder="Document title"
      />
      <input
        value={node.attrs.subtitle ?? ''}
        onChange={(event) => updateAttributes({ subtitle: event.target.value })}
        className="spec-subtitle-input"
        placeholder="Document subtitle"
      />
      <input
        value={node.attrs.version ?? ''}
        onChange={(event) => updateAttributes({ version: event.target.value })}
        className="spec-version-input"
        placeholder="Version"
      />
    </BlockShell>
  );
}
