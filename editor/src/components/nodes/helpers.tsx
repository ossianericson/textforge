import type { PropsWithChildren, ReactNode } from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';

export function BlockShell({ className, children }: PropsWithChildren<{ className: string }>) {
  return (
    <NodeViewWrapper className={className}>
      {children}
    </NodeViewWrapper>
  );
}

export function InlineContentShell({ className }: { className: string }) {
  return <NodeViewContent className={className} />;
}

export function SectionLabel({ children }: PropsWithChildren) {
  return <div className="bullet-section-label">{children}</div>;
}

export function IconButton({
  title,
  active = false,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`node-icon-btn ${active ? 'node-icon-btn-active' : ''}`}
    >
      {children}
    </button>
  );
}
