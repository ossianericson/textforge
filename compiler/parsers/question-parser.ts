import { extractAfterColon, normalizeText, stripQuotes } from '#parser-utils/text-normalizer';
import { renderInlineMarkdown } from '#parser-utils/markdown-renderer';
import { createQuestionBlockHandlers } from '#parsers/question-blocks/index';
import type {
  ParseQuestions,
  Question,
  QuestionMap,
  QuestionOption,
  QuestionParserDependencies,
} from './types.js';

interface ContextCapture {
  key: string;
  from: 'optionText';
}

function createQuestionParser(
  dependencies: Partial<QuestionParserDependencies> = {}
): ParseQuestions {
  const {
    extractAfterColon: extractAfterColonFn = extractAfterColon,
    normalizeText: normalizeTextFn = normalizeText,
    stripQuotes: stripQuotesFn = stripQuotes,
    renderInlineMarkdown: renderInlineMarkdownFn = renderInlineMarkdown,
  } = dependencies;

  function parseNavigationTarget(action: string, target: string): string | null {
    const normalizedAction = (action || '').trim().toLowerCase();
    let next = (target || '').trim();

    if (!next) {
      return null;
    }

    if (normalizedAction.startsWith('result') && !/^result-/i.test(next)) {
      next = `result-${next}`;
    }

    return next;
  }

  const blockHandlers = createQuestionBlockHandlers();

  function parseOption(line: string): QuestionOption | null {
    const parts = line.split('→');
    const left = parts[0] || '';
    const rightRaw = parts[1];
    if (!rightRaw) {
      return null;
    }

    const textRaw = left.replace(/^\d+\.\s*/, '').trim();
    const text = normalizeTextFn(stripQuotesFn(textRaw));
    const right = rightRaw.trim();
    const lower = right.toLowerCase();
    const next = lower.startsWith('go to')
      ? parseNavigationTarget('go to', right.slice(5).trim())
      : lower.startsWith('result:')
        ? parseNavigationTarget('result:', right.slice(7).trim())
        : right.trim();

    if (!next) {
      return null;
    }

    const cleanedNext = next
      .replace(/\(recommended\)/i, '')
      .replace(/\(advanced\)/i, '')
      .trim();

    const recommended = /\(recommended\)/i.test(line);
    const advanced = /\(advanced\)/i.test(line);

    return {
      text,
      next: cleanedNext,
      recommended,
      advanced,
    };
  }

  function parseContextCapture(line: string): ContextCapture | null {
    const raw = normalizeTextFn(stripQuotesFn(extractAfterColonFn(line)));
    if (!raw) {
      return null;
    }
    const match = raw.match(/^([a-z0-9-_.]+)\s*=\s*(.+)$/i);
    if (!match || !match[1] || !match[2]) {
      return null;
    }
    const key = match[1].trim();
    const fromRaw = match[2].replace(/[{}]/g, '').trim().toLowerCase();
    if (
      fromRaw === 'optiontext' ||
      fromRaw === 'option text' ||
      fromRaw === 'selected option text'
    ) {
      return { key, from: 'optionText' };
    }
    return null;
  }

  const parseQuestions: ParseQuestions = (lines, startIndex, endIndex) => {
    const questions: QuestionMap = {};
    if (
      startIndex === -1 ||
      endIndex === -1 ||
      startIndex === undefined ||
      endIndex === undefined
    ) {
      return questions;
    }

    let current: { id: string; question: Question } | null = null;

    for (let i = startIndex + 1; i < endIndex; i += 1) {
      const line = lines[i];
      if (!line) {
        continue;
      }
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      if (trimmed.startsWith('### ') && trimmed.includes('id="')) {
        if (current) {
          questions[current.id] = current.question;
        }
        const idMatch = trimmed.match(/id="([^"]+)"/i);
        if (!idMatch) {
          continue;
        }
        const options: QuestionOption[] = [];
        const id = idMatch[1];
        if (!id) {
          continue;
        }
        current = {
          id,
          question: {
            title: '',
            subtitle: '',
            infoBox: null,
            type: 'buttons',
            options,
          },
        };
        continue;
      }

      if (!current) {
        continue;
      }

      if (trimmed.startsWith('**Title**')) {
        current.question.title = normalizeTextFn(stripQuotesFn(extractAfterColonFn(trimmed)));
        continue;
      }

      if (trimmed.startsWith('**Subtitle**')) {
        current.question.subtitle = normalizeTextFn(stripQuotesFn(extractAfterColonFn(trimmed)));
        continue;
      }

      if (trimmed.startsWith('**Info Box**')) {
        const infoText = normalizeTextFn(stripQuotesFn(extractAfterColonFn(trimmed)));
        current.question.infoBox = renderInlineMarkdownFn(infoText);
        continue;
      }

      if (trimmed.startsWith('**Context Capture**')) {
        const capture = parseContextCapture(trimmed);
        if (capture) {
          current.question.contextCapture = capture;
        }
        continue;
      }

      if (trimmed.startsWith('**Matrix Image**')) {
        current.question.dropdownPairImage = normalizeTextFn(
          stripQuotesFn(extractAfterColonFn(trimmed))
        );
        continue;
      }

      if (trimmed.startsWith('**Matrix Image Alt**')) {
        current.question.dropdownPairImageAlt = normalizeTextFn(
          stripQuotesFn(extractAfterColonFn(trimmed))
        );
        continue;
      }

      if (trimmed.startsWith('**Type**')) {
        const typeValue = extractAfterColonFn(trimmed).toLowerCase();
        if (typeValue === 'dropdown') {
          current.question.type = 'dropdown';
        } else if (typeValue === 'dropdown-pair') {
          current.question.type = 'dropdown-pair';
        } else if (typeValue === 'slider') {
          current.question.type = 'slider';
        } else if (typeValue === 'multi-select') {
          current.question.type = 'multi-select';
        } else if (typeValue === 'toggle') {
          current.question.type = 'toggle';
        } else if (typeValue === 'scoring-matrix') {
          current.question.type = 'scoring-matrix';
        } else {
          current.question.type = 'buttons';
        }
        continue;
      }

      const currentQuestion = current.question;
      const blockHandler = blockHandlers.find((handler) =>
        handler.matches(trimmed, currentQuestion)
      );
      if (blockHandler) {
        const parsed = blockHandler.parse({
          lines,
          startIndex: i,
          questionId: current.id,
          question: currentQuestion,
          helpers: {
            extractAfterColon: extractAfterColonFn,
            normalizeText: normalizeTextFn,
            stripQuotes: stripQuotesFn,
            renderInlineMarkdown: renderInlineMarkdownFn,
            parseNavigationTarget,
          },
        });
        current.question = {
          ...current.question,
          ...parsed.patch,
        };
        i = parsed.endIndex;
        continue;
      }

      if (
        current.question.type === 'buttons' &&
        /^\d+\.\s+/.test(trimmed) &&
        trimmed.includes('→')
      ) {
        const option = parseOption(trimmed);
        if (option) {
          current.question.options.push(option);
        }
      }
    }

    if (current) {
      questions[current.id] = current.question;
    }

    return questions;
  };

  return parseQuestions;
}

const parseQuestions = createQuestionParser();

export { createQuestionParser, parseQuestions };
