import { BlockShell, InlineContentShell } from './helpers';

export function MultiSelectOptionView() {
  return (
    <BlockShell className="multi-select-option-row">
      <span className="option-bullet">□</span>
      <InlineContentShell className="option-text-content" />
    </BlockShell>
  );
}
