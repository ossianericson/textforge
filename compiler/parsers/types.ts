import type {
  Badge,
  DropdownBucketRange,
  DropdownRange,
  DocLink,
  FindSectionIndices,
  LinkInfo,
  LinkParseResult,
  MatrixTable,
  ParseProgressSteps,
  ParseQuestions,
  ParseResults,
  ParseTitle,
  ParsedSpec,
  ProgressSteps,
  Question,
  QuestionMap,
  QuestionOption,
  ResultCard,
  ResultMap,
  SectionIndices,
  ServiceConfigBlock,
  SupportSection,
  WarningBlock,
} from '../types.js';

export type {
  Badge,
  DropdownBucketRange,
  DropdownRange,
  DocLink,
  FindSectionIndices,
  LinkInfo,
  LinkParseResult,
  MatrixTable,
  ParseProgressSteps,
  ParseQuestions,
  ParseResults,
  ParseTitle,
  ParsedSpec,
  ProgressSteps,
  Question,
  QuestionMap,
  QuestionOption,
  ResultCard,
  ResultMap,
  SectionIndices,
  ServiceConfigBlock,
  SupportSection,
  WarningBlock,
};

export interface QuestionParserDependencies {
  extractAfterColon: (line: string) => string;
  normalizeText: (text: string) => string;
  stripQuotes: (text: string) => string;
  renderInlineMarkdown: (text: string) => string;
}

export interface ResultParserDependencies {
  cleanInlineText: (text: string) => string;
  extractAfterColon: (line: string) => string;
  normalizeText: (text: string) => string;
  stripQuotes: (text: string) => string;
  parseDocsInline: (text: string, title: string) => DocLink[];
  parseInlineList: (text: string) => string[];
  renderInlineMarkdown: (text: string) => string;
  stripLinks: (text: string) => LinkParseResult;
  stripMarkdown: (text: string) => string;
}
