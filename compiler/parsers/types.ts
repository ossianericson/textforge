import type {
  Badge,
  DropdownBucketRange,
  DropdownRange,
  DocLink,
  FindSectionIndices,
  LinkInfo,
  LinkParseResult,
  MatrixScale,
  MatrixTable,
  MultiSelectRoute,
  ParseProgressSteps,
  ParseQuestions,
  ParseResults,
  ParseSpecMetadata,
  ParseTitle,
  ParsedMetadata,
  ParsedSpec,
  ProgressSteps,
  Question,
  TooltipDefinition,
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
  MatrixScale,
  MatrixTable,
  MultiSelectRoute,
  ParseProgressSteps,
  ParseQuestions,
  ParseResults,
  ParseSpecMetadata,
  ParseTitle,
  ParsedMetadata,
  ParsedSpec,
  ProgressSteps,
  Question,
  TooltipDefinition,
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

export interface QuestionParserHelpers extends QuestionParserDependencies {
  parseNavigationTarget: (action: string, target: string) => string | null;
}

export interface QuestionBlockParseResult {
  endIndex: number;
  patch: Partial<Question>;
}

export interface QuestionBlockContext {
  lines: string[];
  startIndex: number;
  questionId: string;
  question: Question;
  helpers: QuestionParserHelpers;
}

export interface QuestionBlockHandler {
  matches: (line: string, question: Question) => boolean;
  parse: (context: QuestionBlockContext) => QuestionBlockParseResult;
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
