import { OptionRowView } from '@/components/nodes/OptionRowView';
import { createReactNode } from './shared';

export const OptionRowNode = createReactNode({
  name: 'optionRow',
  group: 'block',
  content: 'inline*',
  attrs: {
    target: '',
    recommended: false,
    advanced: false,
  },
  component: OptionRowView,
});
