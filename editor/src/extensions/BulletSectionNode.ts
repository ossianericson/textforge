import { BulletSectionView } from '@/components/nodes/BulletSectionView';
import { createReactNode } from './shared';

export const BulletSectionNode = createReactNode({
  name: 'bulletSection',
  group: 'block',
  content: 'bulletItem*',
  attrs: {
    sectionName: '',
  },
  component: BulletSectionView,
});
