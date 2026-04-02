import { ToggleBodyView } from '@/components/nodes/ToggleBodyView';
import { createReactNode } from './shared';

export const ToggleBodyNode = createReactNode({
  name: 'toggleBody',
  group: 'block',
  atom: true,
  attrs: {
    label: '',
    onTarget: '',
    offTarget: '',
  },
  component: ToggleBodyView,
});
