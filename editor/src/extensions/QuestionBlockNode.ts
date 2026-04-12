import { QuestionBlockView } from '@/components/nodes/QuestionBlockView';
import { createReactNode } from './shared';

export const QuestionBlockNode = createReactNode({
  name: 'questionBlock',
  group: 'block',
  content:
    'questionHeader questionTitle questionSubtitle questionInfoBox? (questionBody|scoringMatrixBody|dropdownPairBody)',
  isolating: true,
  draggable: true,
  attrs: {
    questionId: '',
    questionType: 'buttons',
    progressStep: 0,
    rawData: null,
  },
  component: QuestionBlockView,
});
