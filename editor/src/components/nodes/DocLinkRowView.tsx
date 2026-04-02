import type { NodeViewProps } from '@tiptap/react';
import { NodeViewContent } from '@tiptap/react';
import { BlockShell } from './helpers';

export function DocLinkRowView({ node, updateAttributes }: NodeViewProps) {
  return (
    <BlockShell className="doc-link-row">
      <NodeViewContent className="doc-link-label" />
      <input
        className="input-sm doc-link-input"
        value={node.attrs.url ?? ''}
        onChange={(event) => updateAttributes({ url: event.target.value })}
        placeholder="https://example.com"
      />
    </BlockShell>
  );
}
