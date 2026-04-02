import { ResultBlockView } from '@/components/nodes/ResultBlockView';
import { createReactNode } from './shared';

export const ResultBlockNode = createReactNode({
  name: 'resultBlock',
  group: 'block',
  content: 'resultHeader (bulletSection|proseSection|docLinkRow|contactRow|tagSection)*',
  isolating: true,
  draggable: true,
  attrs: {
    resultId: '',
    rawData: null,
  },
  component: ResultBlockView,
});
