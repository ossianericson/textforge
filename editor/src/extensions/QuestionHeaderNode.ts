import { QuestionHeaderView } from '@/components/nodes/QuestionHeaderView';
import { createReactNode } from './shared';

export const QuestionHeaderNode = createReactNode({
  name: 'questionHeader',
  group: 'block',
  atom: true,
  attrs: {
    questionId: '',
    questionType: 'buttons',
    progressStep: 0,
  },
  component: QuestionHeaderView,
});
