import { QuestionBodyView } from '@/components/nodes/QuestionBodyView';
import { createReactNode } from './shared';

export const QuestionBodyNode = createReactNode({
  name: 'questionBody',
  group: 'block',
  content: '(optionRow|rangeRow|toggleBody|multiSelectOption|multiSelectRoute)*',
  attrs: {
    questionType: 'buttons',
    dropdownLabel: '',
    sliderLabel: '',
    multiSelectFallback: '',
    scoringMatrixCategories: [],
    scoringMatrixScaleMin: 0,
    scoringMatrixScaleMax: 0,
    dropdownLeftLabel: '',
    dropdownRightLabel: '',
    dropdownMatrix: {},
    dropdownTierMatrix: {},
    dropdownPairImage: '',
    dropdownPairImageAlt: '',
    dropdownMatrixTable: null,
  },
  component: QuestionBodyView,
});
