import { MultiSelectRouteView } from '@/components/nodes/MultiSelectRouteView';
import { createReactNode } from './shared';

export const MultiSelectRouteNode = createReactNode({
  name: 'multiSelectRoute',
  group: 'block',
  atom: true,
  attrs: {
    values: [],
    target: '',
  },
  component: MultiSelectRouteView,
});
