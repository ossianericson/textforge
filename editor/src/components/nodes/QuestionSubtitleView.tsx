import { BlockShell, InlineContentShell } from './helpers';

export function QuestionSubtitleView() {
  return (
    <BlockShell className="question-subtitle-wrap">
      <InlineContentShell className="question-subtitle-node" />
    </BlockShell>
  );
}
