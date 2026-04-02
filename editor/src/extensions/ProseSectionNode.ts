import { ProseSectionView } from '@/components/nodes/ProseSectionView';
import { createReactNode } from './shared';

export const ProseSectionNode = createReactNode({
  name: 'proseSection',
  group: 'block',
  content: 'block*',
  attrs: {
    sectionName: '',
    title: '',
  },
  component: ProseSectionView,
});
