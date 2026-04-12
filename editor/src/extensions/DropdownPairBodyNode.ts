import { DropdownPairBodyView } from '@/components/nodes/DropdownPairBodyView';
import { createReactNode } from './shared';

export const DropdownPairBodyNode = createReactNode({
  name: 'dropdownPairBody',
  group: 'block',
  content: 'rangeRow*',
  attrs: {
    questionType: 'dropdown-pair',
    dropdownLeftLabel: '',
    dropdownRightLabel: '',
    dropdownMatrix: {},
    dropdownTierMatrix: {},
    dropdownPairImage: '',
    dropdownPairImageAlt: '',
    dropdownMatrixTable: null,
  },
  component: DropdownPairBodyView,
});
