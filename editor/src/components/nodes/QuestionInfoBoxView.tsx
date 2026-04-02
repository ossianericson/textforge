import { BlockShell, InlineContentShell } from './helpers';

export function QuestionInfoBoxView() {
  return (
    <BlockShell className="question-infobox">
      <InlineContentShell className="question-infobox-content" />
    </BlockShell>
  );
}
