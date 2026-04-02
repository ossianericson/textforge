import { Node } from '@tiptap/core';

export const SpecDocumentNode = Node.create({
  name: 'specDocument',
  topNode: true,
  content: 'specHeader questionBlock* resultBlock*',
});
