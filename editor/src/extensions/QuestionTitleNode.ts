import { QuestionTitleView } from '@/components/nodes/QuestionTitleView';
import { createReactNode } from './shared';

export const QuestionTitleNode = createReactNode({
  name: 'questionTitle',
  group: 'block',
  content: 'inline*',
  component: QuestionTitleView,
});
