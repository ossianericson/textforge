import { BlockShell, InlineContentShell } from './helpers';

export function BulletItemView() {
  return (
    <BlockShell className="bullet-item">
      <span className="bullet-glyph">◆</span>
      <InlineContentShell className="bullet-item-content" />
    </BlockShell>
  );
}
