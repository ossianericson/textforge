import { MultiSelectOptionView } from '@/components/nodes/MultiSelectOptionView';
import { createReactNode } from './shared';

export const MultiSelectOptionNode = createReactNode({
  name: 'multiSelectOption',
  group: 'block',
  content: 'inline*',
  component: MultiSelectOptionView,
});
