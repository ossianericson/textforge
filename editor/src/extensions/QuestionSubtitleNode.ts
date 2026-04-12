import { QuestionSubtitleView } from '@/components/nodes/QuestionSubtitleView';
import { createReactNode } from './shared';

export const QuestionSubtitleNode = createReactNode({
  name: 'questionSubtitle',
  group: 'block',
  content: 'inline*',
  component: QuestionSubtitleView,
});
