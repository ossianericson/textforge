import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { BulletItemNode } from './BulletItemNode';
import { BulletSectionNode } from './BulletSectionNode';
import { ContactRowNode } from './ContactRowNode';
import { DocLinkRowNode } from './DocLinkRowNode';
import { DropdownPairBodyNode } from './DropdownPairBodyNode';
import { MultiSelectOptionNode } from './MultiSelectOptionNode';
import { MultiSelectRouteNode } from './MultiSelectRouteNode';
import { OptionRowNode } from './OptionRowNode';
import { ProseSectionNode } from './ProseSectionNode';
import { QuestionBlockNode } from './QuestionBlockNode';
import { QuestionBodyNode } from './QuestionBodyNode';
import { QuestionHeaderNode } from './QuestionHeaderNode';
import { QuestionInfoBoxNode } from './QuestionInfoBoxNode';
import { QuestionSubtitleNode } from './QuestionSubtitleNode';
import { QuestionTitleNode } from './QuestionTitleNode';
import { RangeRowNode } from './RangeRowNode';
import { ResultBlockNode } from './ResultBlockNode';
import { ResultHeaderNode } from './ResultHeaderNode';
import { ScoringMatrixBodyNode } from './ScoringMatrixBodyNode';
import { SpecDocumentNode } from './SpecDocumentNode';
import { SpecHeaderNode } from './SpecHeaderNode';
import { TagSectionNode } from './TagSectionNode';
import { ToggleBodyNode } from './ToggleBodyNode';

export function getAllExtensions() {
  return [
    Placeholder.configure({
      includeChildren: true,
      showOnlyCurrent: false,
      placeholder: 'Start typing…',
    }),
    Typography,
    SpecDocumentNode,
    SpecHeaderNode,
    QuestionBlockNode,
    QuestionHeaderNode,
    QuestionTitleNode,
    QuestionSubtitleNode,
    QuestionInfoBoxNode,
    QuestionBodyNode,
    OptionRowNode,
    RangeRowNode,
    ToggleBodyNode,
    MultiSelectOptionNode,
    MultiSelectRouteNode,
    ScoringMatrixBodyNode,
    DropdownPairBodyNode,
    ResultBlockNode,
    ResultHeaderNode,
    BulletSectionNode,
    BulletItemNode,
    ProseSectionNode,
    DocLinkRowNode,
    ContactRowNode,
    TagSectionNode,
  ];
}

export {
  BulletItemNode,
  BulletSectionNode,
  ContactRowNode,
  DocLinkRowNode,
  DropdownPairBodyNode,
  MultiSelectOptionNode,
  MultiSelectRouteNode,
  OptionRowNode,
  ProseSectionNode,
  QuestionBlockNode,
  QuestionBodyNode,
  QuestionHeaderNode,
  QuestionInfoBoxNode,
  QuestionSubtitleNode,
  QuestionTitleNode,
  RangeRowNode,
  ResultBlockNode,
  ResultHeaderNode,
  ScoringMatrixBodyNode,
  SpecDocumentNode,
  SpecHeaderNode,
  TagSectionNode,
  ToggleBodyNode,
};
