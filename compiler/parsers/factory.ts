import { createQuestionParser } from '#parsers/question-parser';
import { createResultParser } from '#parsers/result-parser';
import { parseTitle } from '#parsers/title-parser';
import { findSectionIndices, parseProgressSteps } from '#parsers/progress-parser';
import {
  cleanInlineText,
  extractAfterColon,
  normalizeText,
  stripQuotes,
} from '#parser-utils/text-normalizer';
import {
  parseDocsInline,
  parseInlineList,
  renderInlineMarkdown,
  stripLinks,
  stripMarkdown,
} from '#parser-utils/markdown-renderer';
import type {
  FindSectionIndices,
  ParseProgressSteps,
  ParseQuestions,
  ParseResults,
  ParseTitle,
  QuestionParserDependencies,
  ResultParserDependencies,
} from './types.js';

interface ParserBundle {
  parseTitle: ParseTitle;
  findSectionIndices: FindSectionIndices;
  parseProgressSteps: ParseProgressSteps;
  parseQuestions: ParseQuestions;
  parseResults: ParseResults;
}

function createParsers(
  dependencies: Partial<QuestionParserDependencies & ResultParserDependencies> = {}
): ParserBundle {
  const {
    cleanInlineText: cleanInlineTextFn = cleanInlineText,
    extractAfterColon: extractAfterColonFn = extractAfterColon,
    normalizeText: normalizeTextFn = normalizeText,
    stripQuotes: stripQuotesFn = stripQuotes,
    parseDocsInline: parseDocsInlineFn = parseDocsInline,
    parseInlineList: parseInlineListFn = parseInlineList,
    renderInlineMarkdown: renderInlineMarkdownFn = renderInlineMarkdown,
    stripLinks: stripLinksFn = stripLinks,
    stripMarkdown: stripMarkdownFn = stripMarkdown,
  } = dependencies;

  return {
    parseTitle,
    findSectionIndices,
    parseProgressSteps,
    parseQuestions: createQuestionParser({
      extractAfterColon: extractAfterColonFn,
      normalizeText: normalizeTextFn,
      stripQuotes: stripQuotesFn,
      renderInlineMarkdown: renderInlineMarkdownFn,
    }),
    parseResults: createResultParser({
      cleanInlineText: cleanInlineTextFn,
      extractAfterColon: extractAfterColonFn,
      normalizeText: normalizeTextFn,
      stripQuotes: stripQuotesFn,
      parseDocsInline: parseDocsInlineFn,
      parseInlineList: parseInlineListFn,
      renderInlineMarkdown: renderInlineMarkdownFn,
      stripLinks: stripLinksFn,
      stripMarkdown: stripMarkdownFn,
    }),
  };
}

export { createParsers };
