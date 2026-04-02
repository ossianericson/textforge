import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

export function createReactNode(options: {
  name: string;
  group?: string;
  content?: string;
  inline?: boolean;
  atom?: boolean;
  draggable?: boolean;
  isolating?: boolean;
  defining?: boolean;
  attrs?: Record<string, unknown>;
  component?: Parameters<typeof ReactNodeViewRenderer>[0];
}) {
  return Node.create({
    name: options.name,
    group: options.group,
    content: options.content,
    inline: options.inline,
    atom: options.atom,
    draggable: options.draggable,
    isolating: options.isolating,
    defining: options.defining,
    selectable: true,
    addAttributes() {
      return Object.fromEntries(
        Object.entries(options.attrs ?? {}).map(([key, defaultValue]) => [
          key,
          {
            default: defaultValue,
          },
        ])
      );
    },
    parseHTML() {
      return [{ tag: `div[data-type=\"${options.name}\"]` }];
    },
    renderHTML({ HTMLAttributes }) {
      return ['div', { ...HTMLAttributes, 'data-type': options.name }, 0];
    },
    addNodeView: options.component ? () => ReactNodeViewRenderer(options.component!) : undefined,
  });
}
