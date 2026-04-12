import type {
  DropdownBucketRange,
  DropdownRange,
  MultiSelectRoute,
  QuestionParserHelpers,
  TooltipDefinition,
} from '../types.js';

function shouldEndBlock(trimmed: string, allowedHeaders: string[]): boolean {
  if (trimmed.startsWith('### ') || trimmed.startsWith('---')) {
    return true;
  }

  if (!trimmed.startsWith('**')) {
    return false;
  }

  return !allowedHeaders.some((header) => trimmed.startsWith(header));
}

function parseNavigationRangeLine(
  trimmed: string,
  helpers: QuestionParserHelpers
): DropdownRange | null {
  const rangeMatch = trimmed.match(
    /^\-\s*Range:\s*(-?\d+)(?:\s*[\u2013-]\s*(-?\d+))?(?:\s*\(([^)]+)\))?\s*\u2192\s*(go to|result:)\s*(.+)$/i
  );
  if (!rangeMatch || !rangeMatch[1] || !rangeMatch[4] || !rangeMatch[5]) {
    return null;
  }

  const min = parseInt(rangeMatch[1], 10);
  const max = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : min;
  const next = helpers.parseNavigationTarget(rangeMatch[4], rangeMatch[5]);

  if (!next) {
    return null;
  }

  const customLabel = rangeMatch[3]
    ? helpers.normalizeText(helpers.stripQuotes(rangeMatch[3]))
    : '';

  return {
    min,
    max,
    next,
    label: customLabel || (min === max ? `${min}` : `${min}\u2013${max}`),
  };
}

function parseBucketRangeLine(
  trimmed: string,
  helpers: QuestionParserHelpers
): DropdownBucketRange | null {
  const rangeMatch = trimmed.match(
    /^\-\s*Range:\s*(-?\d+)(?:\s*[\u2013-]\s*(-?\d+))?(?:\s*\(([^)]+)\))?\s*\u2192\s*bucket:\s*([a-z0-9-]+)$/i
  );
  if (!rangeMatch || !rangeMatch[1] || !rangeMatch[4]) {
    return null;
  }

  const min = parseInt(rangeMatch[1], 10);
  const max = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : min;
  const customLabel = rangeMatch[3]
    ? helpers.normalizeText(helpers.stripQuotes(rangeMatch[3]))
    : '';

  return {
    min,
    max,
    bucket: rangeMatch[4].trim().toLowerCase(),
    label: customLabel || (min === max ? `${min}` : `${min}\u2013${max}`),
  };
}

function parseMatrixRouteLine(
  trimmed: string,
  helpers: QuestionParserHelpers
): { left: string; right: string; next: string } | null {
  const lineMatch = trimmed.match(
    /^\-\s*([a-z0-9-]+)\s*\+\s*([a-z0-9-]+)\s*\u2192\s*(go to|result:)\s*(.+)$/i
  );
  if (!lineMatch || !lineMatch[1] || !lineMatch[2] || !lineMatch[3] || !lineMatch[4]) {
    return null;
  }

  const next = helpers.parseNavigationTarget(lineMatch[3], lineMatch[4]);
  if (!next) {
    return null;
  }

  return {
    left: lineMatch[1].toLowerCase(),
    right: lineMatch[2].toLowerCase(),
    next,
  };
}

function parseTierRouteLine(trimmed: string): { left: string; right: string; tier: string } | null {
  const lineMatch = trimmed.match(
    /^\-\s*([a-z0-9-]+)\s*\+\s*([a-z0-9-]+)\s*\u2192\s*tier:\s*([a-z0-9-]+)\s*$/i
  );
  if (!lineMatch || !lineMatch[1] || !lineMatch[2] || !lineMatch[3]) {
    return null;
  }

  return {
    left: lineMatch[1].toLowerCase(),
    right: lineMatch[2].toLowerCase(),
    tier: lineMatch[3].toLowerCase(),
  };
}

function parseMultiSelectRouteLine(
  trimmed: string,
  helpers: QuestionParserHelpers
): MultiSelectRoute | null {
  const lineMatch = trimmed.match(/^\-\s*(.+?)\s*\u2192\s*(go to|result:)\s*(.+)$/i);
  if (!lineMatch || !lineMatch[1] || !lineMatch[2] || !lineMatch[3]) {
    return null;
  }

  const next = helpers.parseNavigationTarget(lineMatch[2], lineMatch[3]);
  if (!next) {
    return null;
  }

  const values = lineMatch[1]
    .split('+')
    .map((part) => helpers.normalizeText(helpers.stripQuotes(part.trim())))
    .filter(Boolean);

  if (!values.length) {
    return null;
  }

  return { values, next };
}

function parseTooltipLine(
  trimmed: string,
  helpers: QuestionParserHelpers
): TooltipDefinition | null {
  const tooltipMatch = trimmed.match(/^\-\s*"(.+?)"\s*:\s*"(.+)"\s*$/);
  if (!tooltipMatch || !tooltipMatch[1] || !tooltipMatch[2]) {
    return null;
  }

  return {
    term: helpers.normalizeText(helpers.stripQuotes(tooltipMatch[1])),
    definition: helpers.normalizeText(helpers.stripQuotes(tooltipMatch[2])),
  };
}

export {
  parseBucketRangeLine,
  parseMatrixRouteLine,
  parseMultiSelectRouteLine,
  parseNavigationRangeLine,
  parseTierRouteLine,
  parseTooltipLine,
  shouldEndBlock,
};
