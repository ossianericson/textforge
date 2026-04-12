import { DocLinkRowView } from '@/components/nodes/DocLinkRowView';
import { createReactNode } from './shared';

export const DocLinkRowNode = createReactNode({
  name: 'docLinkRow',
  group: 'block',
  content: 'inline*',
  attrs: {
    sectionName: 'docs',
    url: '',
  },
  component: DocLinkRowView,
});
