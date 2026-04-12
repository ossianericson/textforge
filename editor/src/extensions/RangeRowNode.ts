import { RangeRowView } from '@/components/nodes/RangeRowView';
import { createReactNode } from './shared';

export const RangeRowNode = createReactNode({
  name: 'rangeRow',
  group: 'block',
  atom: true,
  attrs: {
    min: 0,
    max: 0,
    target: '',
    label: '',
    rangeRole: '',
  },
  component: RangeRowView,
});
