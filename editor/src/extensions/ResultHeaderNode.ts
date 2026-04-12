import { ResultHeaderView } from '@/components/nodes/ResultHeaderView';
import { createReactNode } from './shared';

export const ResultHeaderNode = createReactNode({
  name: 'resultHeader',
  group: 'block',
  content: 'inline*',
  attrs: {
    icon: '',
    badgeText: '',
    badgeClass: '',
    breadcrumb: '',
  },
  component: ResultHeaderView,
});
