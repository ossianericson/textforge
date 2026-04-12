import { BlockShell, InlineContentShell } from './helpers';

export function QuestionTitleView() {
  return (
    <BlockShell className="question-title-wrap">
      <InlineContentShell className="question-title-node" />
    </BlockShell>
  );
}
