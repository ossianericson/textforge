import { NodeViewContent } from '@tiptap/react';
import { BlockShell } from './helpers';

export function QuestionBodyView() {
  return (
    <BlockShell className="question-body">
      <NodeViewContent className="question-body-content" />
    </BlockShell>
  );
}
