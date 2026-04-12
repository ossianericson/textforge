import { SpecHeaderView } from '@/components/nodes/SpecHeaderView';
import { createReactNode } from './shared';

export const SpecHeaderNode = createReactNode({
  name: 'specHeader',
  group: 'block',
  atom: true,
  attrs: {
    title: '',
    subtitle: '',
    version: '',
  },
  component: SpecHeaderView,
});
