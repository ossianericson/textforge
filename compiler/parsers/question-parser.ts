import { extractAfterColon, normalizeText, stripQuotes } from '#parser-utils/text-normalizer';
import { renderInlineMarkdown } from '#parser-utils/markdown-renderer';
import type {
  DropdownBucketRange,
  DropdownRange,
  MatrixTable,
  ParseQuestions,
  Question,
  QuestionMap,
  QuestionOption,
  QuestionParserDependencies,
} from './types.js';

interface DropdownBlock {
  label: string;
  ranges: DropdownRange[];
  endIndex: number;
}

interface DropdownBucketBlock {
  label: string;
  ranges: DropdownBucketRange[];
  endIndex: number;
}

interface MatrixBlock {
  matrix: Record<string, Record<string, string>>;
  endIndex: number;
}

interface MatrixTableBlock {
  table: MatrixTable;
  endIndex: number;
}

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
    let next = right;
    let isResultTarget = false;

    if (lower.startsWith('go to')) {
      next = right.slice(5).trim();
    } else if (lower.startsWith('result:')) {
      next = right.slice(7).trim();
      isResultTarget = true;
    }

    next = next
      .replace(/\(recommended\)/i, '')
      .replace(/\(advanced\)/i, '')
      .trim();

    if (isResultTarget && !/^result-/i.test(next)) {
      next = `result-${next}`;
    }

    const recommended = /\(recommended\)/i.test(line);
    const advanced = /\(advanced\)/i.test(line);

    return {
      text,
      next,
      recommended,
      advanced,
    };
  }

  function parseDropdownBlock(lines: string[], startIndex: number): DropdownBlock {
    let label = '';
    const ranges: DropdownRange[] = [];
    let i = startIndex + 1;

    for (; i < lines.length; i += 1) {
      const raw = lines[i];
      if (!raw) {
        continue;
      }
      const trimmed = raw.trim();
      if (!trimmed) {
        continue;
      }

      if (
        trimmed.startsWith('### ') ||
        trimmed.startsWith('---') ||
        (trimmed.startsWith('**') && !trimmed.startsWith('**Dropdown**'))
      ) {
        break;
      }

      const labelMatch = trimmed.match(/^\-\s*Label:\s*"(.+)"/i);
      if (labelMatch && labelMatch[1]) {
        label = normalizeTextFn(stripQuotesFn(labelMatch[1]));
        continue;
      }

      const rangeMatch = trimmed.match(
        /^\-\s*Range:\s*(\d+)(?:\s*[\u2013-]\s*(\d+))?(?:\s*\(([^)]+)\))?\s*\u2192\s*(go to|result:)\s*(.+)$/i
      );
      if (rangeMatch && rangeMatch[1] && rangeMatch[4] && rangeMatch[5]) {
        const min = parseInt(rangeMatch[1], 10);
        const max = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : min;
        const customLabel = rangeMatch[3] ? normalizeTextFn(stripQuotesFn(rangeMatch[3])) : '';
        const targetRaw = rangeMatch[5].trim();
        const isResultTarget = rangeMatch[4].toLowerCase().startsWith('result');
        let next = targetRaw;

        if (isResultTarget && !/^result-/i.test(next)) {
          next = `result-${next}`;
        }

        ranges.push({
          min,
          max,
          next,
          label: customLabel || (min === max ? `${min}` : `${min}\u2013${max}`),
        });
      }
    }

    return { label, ranges, endIndex: i - 1 };
  }

  function parseDropdownBucketBlock(lines: string[], startIndex: number): DropdownBucketBlock {
    let label = '';
    const ranges: DropdownBucketRange[] = [];
    let i = startIndex + 1;

    for (; i < lines.length; i += 1) {
      const raw = lines[i];
      if (!raw) {
        continue;
      }
      const trimmed = raw.trim();
      if (!trimmed) {
        continue;
      }

      if (
        trimmed.startsWith('### ') ||
        trimmed.startsWith('---') ||
        trimmed.startsWith('**Matrix**') ||
        trimmed.startsWith('**Dropdown Left**') ||
        trimmed.startsWith('**Dropdown Right**') ||
        (trimmed.startsWith('**') && !trimmed.startsWith('**Dropdown'))
      ) {
        break;
      }

      const labelMatch = trimmed.match(/^[-\s]*Label:\s*"(.+)"/i);
      if (labelMatch && labelMatch[1]) {
        label = normalizeTextFn(stripQuotesFn(labelMatch[1]));
        continue;
      }

      const rangeMatch = trimmed.match(
        /^\-\s*Range:\s*(\d+)(?:\s*[\u2013-]\s*(\d+))?(?:\s*\(([^)]+)\))?\s*\u2192\s*bucket:\s*([a-z0-9-]+)$/i
      );
      if (rangeMatch && rangeMatch[1] && rangeMatch[4]) {
        const min = parseInt(rangeMatch[1], 10);
        const max = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : min;
        const customLabel = rangeMatch[3] ? normalizeTextFn(stripQuotesFn(rangeMatch[3])) : '';
        const bucket = rangeMatch[4].trim().toLowerCase();

        ranges.push({
          min,
          max,
          bucket,
          label: customLabel || (min === max ? `${min}` : `${min}\u2013${max}`),
        });
      }
    }

    return { label, ranges, endIndex: i - 1 };
  }

  function parseTierMatrixBlock(lines: string[], startIndex: number): MatrixBlock {
    const matrix: Record<string, Record<string, string>> = {};
    let i = startIndex + 1;

    for (; i < lines.length; i += 1) {
      const raw = lines[i];
      if (!raw) {
        continue;
      }
      const trimmed = raw.trim();
      if (!trimmed) {
        continue;
      }

      if (trimmed.startsWith('### ') || trimmed.startsWith('---') || trimmed.startsWith('**')) {
        break;
      }

      const lineMatch = trimmed.match(
        /^\-\s*([a-z0-9-]+)\s*\+\s*([a-z0-9-]+)\s*\u2192\s*tier:\s*([a-z0-9-]+)\s*$/i
      );
      if (lineMatch && lineMatch[1] && lineMatch[2] && lineMatch[3]) {
        const left = lineMatch[1].toLowerCase();
        const right = lineMatch[2].toLowerCase();
        const tier = lineMatch[3].toLowerCase();

        if (!matrix[left]) {
          matrix[left] = {};
        }
        matrix[left][right] = tier;
      }
    }

    return { matrix, endIndex: i - 1 };
  }

  function parseMatrixTableBlock(lines: string[], startIndex: number): MatrixTableBlock {
    const columns: string[] = [];
    const rows: { label: string; cells: string[] }[] = [];
    let i = startIndex + 1;

    for (; i < lines.length; i += 1) {
      const raw = lines[i];
      if (!raw) {
        continue;
      }
      const trimmed = raw.trim();
      if (!trimmed) {
        continue;
      }

      if (trimmed.startsWith('### ') || trimmed.startsWith('---') || trimmed.startsWith('**')) {
        break;
      }

      const columnMatch = trimmed.match(/^[-\s]*Columns:\s*(.+)$/i);
      if (columnMatch && columnMatch[1]) {
        columns.push(
          ...columnMatch[1]
            .split('|')
            .map((part) => normalizeTextFn(stripQuotesFn(part.trim())))
            .filter(Boolean)
        );
        continue;
      }

      const rowMatch = trimmed.match(/^\-\s*Row:\s*(.+)$/i);
      if (rowMatch && rowMatch[1]) {
        const parts = rowMatch[1]
          .split('|')
          .map((part) => normalizeTextFn(stripQuotesFn(part.trim())))
          .filter(Boolean);
        if (parts.length >= 2) {
          const label = parts[0] || '';
          if (!label) {
            continue;
          }
          rows.push({ label, cells: parts.slice(1) });
        }
      }
    }

    return { table: { columns, rows }, endIndex: i - 1 };
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

  function parseMatrixBlock(lines: string[], startIndex: number): MatrixBlock {
    const matrix: Record<string, Record<string, string>> = {};
    let i = startIndex + 1;

    for (; i < lines.length; i += 1) {
      const raw = lines[i];
      if (!raw) {
        continue;
      }
      const trimmed = raw.trim();
      if (!trimmed) {
        continue;
      }

      if (trimmed.startsWith('### ') || trimmed.startsWith('---') || trimmed.startsWith('**')) {
        break;
      }

      const lineMatch = trimmed.match(
        /^\-\s*([a-z0-9-]+)\s*\+\s*([a-z0-9-]+)\s*\u2192\s*(go to|result:)\s*(.+)$/i
      );
      if (lineMatch && lineMatch[1] && lineMatch[2] && lineMatch[3] && lineMatch[4]) {
        const left = lineMatch[1].toLowerCase();
        const right = lineMatch[2].toLowerCase();
        const targetRaw = lineMatch[4].trim();
        const isResultTarget = lineMatch[3].toLowerCase().startsWith('result');
        let next = targetRaw;

        if (isResultTarget && !/^result-/i.test(next)) {
          next = `result-${next}`;
        }

        if (!matrix[left]) {
          matrix[left] = {};
        }
        matrix[left][right] = next;
      }
    }

    return { matrix, endIndex: i - 1 };
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
        } else {
          current.question.type = 'buttons';
        }
        continue;
      }

      if (trimmed.startsWith('**Dropdown**')) {
        const parsed = parseDropdownBlock(lines, i);
        current.question.type = 'dropdown';
        current.question.dropdownLabel = parsed.label;
        current.question.dropdownRanges = parsed.ranges;
        current.question.options = [];
        i = parsed.endIndex;
        continue;
      }

      if (trimmed.startsWith('**Dropdown Left**')) {
        const parsed = parseDropdownBucketBlock(lines, i);
        current.question.type = 'dropdown-pair';
        current.question.dropdownLeftLabel = parsed.label;
        current.question.dropdownLeftRanges = parsed.ranges;
        current.question.options = [];
        i = parsed.endIndex;
        continue;
      }

      if (trimmed.startsWith('**Dropdown Right**')) {
        const parsed = parseDropdownBucketBlock(lines, i);
        current.question.type = 'dropdown-pair';
        current.question.dropdownRightLabel = parsed.label;
        current.question.dropdownRightRanges = parsed.ranges;
        current.question.options = [];
        i = parsed.endIndex;
        continue;
      }

      if (trimmed.startsWith('**Matrix**')) {
        const parsed = parseMatrixBlock(lines, i);
        current.question.type = 'dropdown-pair';
        current.question.dropdownMatrix = parsed.matrix;
        i = parsed.endIndex;
        continue;
      }

      if (trimmed.startsWith('**Tier Matrix**')) {
        const parsed = parseTierMatrixBlock(lines, i);
        current.question.type = 'dropdown-pair';
        current.question.dropdownTierMatrix = parsed.matrix;
        i = parsed.endIndex;
        continue;
      }

      if (trimmed.startsWith('**Matrix Table**')) {
        const parsed = parseMatrixTableBlock(lines, i);
        current.question.type = 'dropdown-pair';
        current.question.dropdownMatrixTable = parsed.table;
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
