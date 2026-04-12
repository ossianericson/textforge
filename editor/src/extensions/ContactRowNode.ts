import { ContactRowView } from '@/components/nodes/ContactRowView';
import { createReactNode } from './shared';

export const ContactRowNode = createReactNode({
  name: 'contactRow',
  group: 'block',
  content: 'inline*',
  attrs: {
    sectionName: 'contact',
  },
  component: ContactRowView,
});
