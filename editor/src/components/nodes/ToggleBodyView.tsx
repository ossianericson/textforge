import type { NodeViewProps } from '@tiptap/react';
import { TargetSelector } from '@/components/shared/TargetSelector';
import { BlockShell } from './helpers';

export function ToggleBodyView({ node, updateAttributes }: NodeViewProps) {
  return (
    <BlockShell className="toggle-body">
      <input
        className="input-sm toggle-label-input"
        value={node.attrs.label ?? ''}
        onChange={(event) => updateAttributes({ label: event.target.value })}
        placeholder="Toggle label"
      />
      <div className="toggle-route-grid">
        <span>On</span>
        <TargetSelector value={node.attrs.onTarget ?? ''} onChange={(onTarget) => updateAttributes({ onTarget })} placeholder="On target" />
        <span>Off</span>
        <TargetSelector value={node.attrs.offTarget ?? ''} onChange={(offTarget) => updateAttributes({ offTarget })} placeholder="Off target" />
      </div>
    </BlockShell>
  );
}
