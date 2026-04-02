import { BulletItemView } from '@/components/nodes/BulletItemView';
import { createReactNode } from './shared';

export const BulletItemNode = createReactNode({
  name: 'bulletItem',
  group: 'block',
  content: 'inline*',
  component: BulletItemView,
});
