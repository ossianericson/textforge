import { TagSectionView } from '@/components/nodes/TagSectionView';
import { createReactNode } from './shared';

export const TagSectionNode = createReactNode({
  name: 'tagSection',
  group: 'block',
  atom: true,
  attrs: {
    sectionName: 'techTags',
    values: [],
  },
  component: TagSectionView,
});
