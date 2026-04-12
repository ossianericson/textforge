import { QuestionInfoBoxView } from '@/components/nodes/QuestionInfoBoxView';
import { createReactNode } from './shared';

export const QuestionInfoBoxNode = createReactNode({
  name: 'questionInfoBox',
  group: 'block',
  content: 'inline*',
  component: QuestionInfoBoxView,
});
