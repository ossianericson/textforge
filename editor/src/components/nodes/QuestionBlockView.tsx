import type { NodeViewProps } from '@tiptap/react';
import { NodeViewContent } from '@tiptap/react';
import { BlockShell } from './helpers';

export function QuestionBlockView({ deleteNode }: NodeViewProps) {
  return (
    <BlockShell className="question-block">
      <div className="node-block-actions">
        <span className="drag-handle" draggable>
          ⋮⋮
        </span>
        <button
          type="button"
          className="node-delete-btn"
          onClick={() => {
            if (window.confirm('Delete this question block?')) {
              deleteNode();
            }
          }}
        >
          ×
        </button>
      </div>
      <div data-tour-id="question-block">
        <NodeViewContent className="question-block-content" />
      </div>
    </BlockShell>
  );
}
