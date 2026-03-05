import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getConfig, type Config } from '#config';
import { createLogger } from '#logger';

interface IssueContext {
  columnStart?: number | null;
  columnEnd?: number | null;
  expected?: string;
  got?: string;
}

interface ValidationIssue extends IssueContext {
  file: string;
  line: number;
  message: string;
}

type ValidationWarning = ValidationIssue;

interface ValidationContext {
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
}

interface GraphTarget {
  question: string | null;
  result: string | null;
}

interface RangeInfo {
  min: number;
  max: number;
  line: number;
}

interface ResultBlock {
  id: string;
  start: number;
  end: number;
}

interface FixResult {
  content: string;
  changed: boolean;
}

interface ReplaceResult {
  lines: string[];
  changed: boolean;
}

const logger = createLogger({ component: 'validate-spec' });

const ARROW_CHAR = String.fromCharCode(0x2192);
const NAV_PATTERN: RegExp = new RegExp(
  `${escapeRegex(ARROW_CHAR)}\\s+(go to\\s+q[0-9]+[a-z]?|result:\\s*result-[a-z0-9-{}]+)`,
  'i'
);
const NAV_TARGET_PATTERN: RegExp = new RegExp(
  `${escapeRegex(ARROW_CHAR)}\\s+(?:go to\\s+(q[0-9]+[a-z]?)|result:\\s*(result-[a-z0-9-{}]+))`,
  'i'
);
const DROPDOWN_HEADER_PATTERN: RegExp = /^\s*\*\*Dropdown\*\*:?.*$/i;
const DROPDOWN_LEFT_HEADER_PATTERN: RegExp = /^\s*\*\*Dropdown Left\*\*:?.*$/i;
const DROPDOWN_RIGHT_HEADER_PATTERN: RegExp = /^\s*\*\*Dropdown Right\*\*:?.*$/i;
const MATRIX_HEADER_PATTERN: RegExp = /^\s*\*\*Matrix\*\*:?.*$/i;
const TIER_MATRIX_HEADER_PATTERN: RegExp = /^\s*\*\*Tier Matrix\*\*:?.*$/i;
const TYPE_DROPDOWN_PATTERN: RegExp = /^\s*\*\*Type\*\*:\s*dropdown\s*$/i;
const TYPE_DROPDOWN_PAIR_PATTERN: RegExp = /^\s*\*\*Type\*\*:\s*dropdown-pair\s*$/i;
const RANGE_PATTERN: RegExp = new RegExp(
  `^\\s*-\\s*Range:\\s*(\\d+)(?:\\s*[\\u2013-]\\s*(\\d+))?(?:\\s*\\(([^)]+)\\))?\\s*${escapeRegex(ARROW_CHAR)}\\s+(go to\\s+q[0-9]+[a-z]?|result:\\s*result-[a-z0-9-{}]+)`,
  'i'
);
const RANGE_TARGET_PATTERN: RegExp = new RegExp(
  `^\\s*-\\s*Range:\\s*(\\d+)(?:\\s*[\\u2013-]\\s*(\\d+))?(?:\\s*\\(([^)]+)\\))?\\s*${escapeRegex(ARROW_CHAR)}\\s+(?:go to\\s+(q[0-9]+[a-z]?)|result:\\s*(result-[a-z0-9-{}]+))`,
  'i'
);
const RANGE_BUCKET_PATTERN: RegExp = new RegExp(
  `^\\s*-\\s*Range:\\s*(\\d+)(?:\\s*[\\u2013-]\\s*(\\d+))?(?:\\s*\\(([^)]+)\\))?\\s*${escapeRegex(ARROW_CHAR)}\\s*bucket:\\s*([a-z0-9-]+)`,
  'i'
);
const MATRIX_PATTERN: RegExp = new RegExp(
  `^\\s*-\\s*([a-z0-9-]+)\\s*\\+\\s*([a-z0-9-]+)\\s*${escapeRegex(ARROW_CHAR)}\\s+(go to\\s+q[0-9]+[a-z]?|result:\\s*result-[a-z0-9-{}]+)`,
  'i'
);
const MATRIX_TARGET_PATTERN: RegExp = new RegExp(
  `^\\s*-\\s*([a-z0-9-]+)\\s*\\+\\s*([a-z0-9-]+)\\s*${escapeRegex(ARROW_CHAR)}\\s+(?:go to\\s+(q[0-9]+[a-z]?)|result:\\s*(result-[a-z0-9-{}]+))`,
  'i'
);
const TIER_MATRIX_PATTERN: RegExp = new RegExp(
  `^\\s*-\\s*([a-z0-9-]+)\\s*\\+\\s*([a-z0-9-]+)\\s*${escapeRegex(ARROW_CHAR)}\\s*tier:\\s*([a-z0-9-]+)`,
  'i'
);
const MAX_PATH_STEPS = 8;
const MAX_OPTIONS_PER_QUESTION = 6;

export function runValidation(options: { fix: boolean }): void {
  const hasFix = options.fix;
  const config: Config = getConfig();
  const specFiles = findSpecFiles(config.decisionTreesDir);

  if (!specFiles.length) {
    logger.error('No spec.md files found under decision-trees/.', {
      decisionTreesDir: config.decisionTreesDir,
    });
    process.exit(1);
  }

  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];
  const context: ValidationContext = { issues, warnings };

  specFiles.forEach((specFile) => {
    const rawBytes = fs.readFileSync(specFile);
    let content = rawBytes.toString('utf8');
    logger.info('Validating spec.', { file: specFile });

    if (hasFix) {
      const fixResult = applyFixes(content);
      if (fixResult.changed) {
        fs.writeFileSync(specFile, fixResult.content, 'utf8');
        content = fixResult.content;
        logger.info('Applied auto-fixes (--fix).', { file: specFile });
      }
    }

    const encodingStatus = testUtf8Encoding(rawBytes);
    if (encodingStatus !== 'UTF-8 without BOM') {
      addIssue(context, specFile, `Encoding check failed: ${encodingStatus}.`, 0);
    }

    if (!/\*\*Version:\*\*\s+v\d+\.\d+/.test(content)) {
      addIssue(context, specFile, 'Missing or invalid version number. Expected format: v1.0', 0);
    }

    const lines = content.split(/\r?\n/);
    let inMermaid = false;
    let inOptions = false;
    let inDropdown = false;
    let inDropdownLeft = false;
    let inDropdownRight = false;
    let inMatrix = false;
    let inTierMatrix = false;
    let currentQuestionId: string | null = null;
    let inResultCard = false;
    const questionOrder: string[] = [];
    const questionLineMap = new Map<string, number>();
    const questionHasUnsure = new Map<string, boolean>();
    const questionInfoAfterOptions = new Map<string, boolean>();
    const optionCounts = new Map<string, number>();
    const optionTextsPerQuestion = new Map<string, Map<string, number[]>>();
    const graph = new Map<string, GraphTarget[]>();
    const resultBlocks: ResultBlock[] = [];
    let currentResultBlock: ResultBlock | null = null;
    const dropdownRanges = new Map<string, RangeInfo[]>();
    const dropdownQuestions = new Set<string>();
    const dropdownPairQuestions = new Set<string>();
    const dropdownPairLeftRanges = new Map<string, RangeInfo[]>();
    const dropdownPairRightRanges = new Map<string, RangeInfo[]>();
    const dropdownPairMatrixCounts = new Map<string, number>();

    lines.forEach((line, index) => {
      if (/^```mermaid\s*$/.test(line)) {
        inMermaid = true;
        return;
      }
      if (/^```\s*$/.test(line)) {
        inMermaid = false;
        return;
      }

      const questionMatch = line.match(/id="(q[0-9]+[a-z]?)"/);
      if (questionMatch) {
        const questionId = questionMatch[1] ?? null;
        if (questionId) {
          currentQuestionId = questionId;
          inOptions = false;
          inDropdown = false;
          inDropdownLeft = false;
          inDropdownRight = false;
          inMatrix = false;
          inTierMatrix = false;
          if (!questionOrder.includes(currentQuestionId)) {
            questionOrder.push(currentQuestionId);
          }
          if (!questionLineMap.has(currentQuestionId)) {
            questionLineMap.set(currentQuestionId, index + 1);
          }
          if (!questionHasUnsure.has(currentQuestionId)) {
            questionHasUnsure.set(currentQuestionId, false);
          }
          if (!questionInfoAfterOptions.has(currentQuestionId)) {
            questionInfoAfterOptions.set(currentQuestionId, false);
          }
        }
      }

      if (TYPE_DROPDOWN_PATTERN.test(line)) {
        if (currentQuestionId) {
          dropdownQuestions.add(currentQuestionId);
        }
      }

      if (TYPE_DROPDOWN_PAIR_PATTERN.test(line)) {
        if (currentQuestionId) {
          dropdownPairQuestions.add(currentQuestionId);
        }
      }

      const resultMatch = line.match(/^####\s+.*\((result-[^)]+)\)/);
      if (resultMatch) {
        const resultId = resultMatch[1] ?? null;
        if (resultId) {
          if (currentResultBlock) {
            currentResultBlock.end = index - 1;
          }
          currentResultBlock = { id: resultId, start: index, end: lines.length - 1 };
          resultBlocks.push(currentResultBlock);
          inResultCard = true;
        }
      }

      if (/^##\s+/.test(line) && !/^##\s+Result Cards/i.test(line)) {
        inResultCard = false;
      }

      if (/^\s*\*\*Options\*\*:?.*$/i.test(line)) {
        inOptions = true;
        inDropdown = false;
        inDropdownLeft = false;
        inDropdownRight = false;
        inMatrix = false;
        return;
      }
      if (/^\s*\*\*Info Box\*\*/i.test(line) && inOptions && currentQuestionId) {
        questionInfoAfterOptions.set(currentQuestionId, true);
      }
      if (DROPDOWN_HEADER_PATTERN.test(line)) {
        inDropdown = true;
        inOptions = false;
        inDropdownLeft = false;
        inDropdownRight = false;
        inMatrix = false;
        inTierMatrix = false;
        if (currentQuestionId) {
          dropdownQuestions.add(currentQuestionId);
          if (!dropdownRanges.has(currentQuestionId)) {
            dropdownRanges.set(currentQuestionId, []);
          }
        }
        return;
      }
      if (DROPDOWN_LEFT_HEADER_PATTERN.test(line)) {
        inDropdownLeft = true;
        inDropdownRight = false;
        inMatrix = false;
        inOptions = false;
        inDropdown = false;
        inTierMatrix = false;
        if (currentQuestionId) {
          dropdownPairQuestions.add(currentQuestionId);
          if (!dropdownPairLeftRanges.has(currentQuestionId)) {
            dropdownPairLeftRanges.set(currentQuestionId, []);
          }
        }
        return;
      }
      if (DROPDOWN_RIGHT_HEADER_PATTERN.test(line)) {
        inDropdownRight = true;
        inDropdownLeft = false;
        inMatrix = false;
        inOptions = false;
        inDropdown = false;
        inTierMatrix = false;
        if (currentQuestionId) {
          dropdownPairQuestions.add(currentQuestionId);
          if (!dropdownPairRightRanges.has(currentQuestionId)) {
            dropdownPairRightRanges.set(currentQuestionId, []);
          }
        }
        return;
      }
      if (MATRIX_HEADER_PATTERN.test(line)) {
        inMatrix = true;
        inDropdownLeft = false;
        inDropdownRight = false;
        inOptions = false;
        inDropdown = false;
        inTierMatrix = false;
        if (currentQuestionId) {
          dropdownPairQuestions.add(currentQuestionId);
          if (!dropdownPairMatrixCounts.has(currentQuestionId)) {
            dropdownPairMatrixCounts.set(currentQuestionId, 0);
          }
        }
        return;
      }
      if (TIER_MATRIX_HEADER_PATTERN.test(line)) {
        inTierMatrix = true;
        inMatrix = false;
        inDropdownLeft = false;
        inDropdownRight = false;
        inOptions = false;
        inDropdown = false;
        if (currentQuestionId) {
          dropdownPairQuestions.add(currentQuestionId);
        }
        return;
      }
      if (/^\s*#+\s+/.test(line) || /^---\s*$/.test(line)) {
        inOptions = false;
        inDropdown = false;
        inDropdownLeft = false;
        inDropdownRight = false;
        inMatrix = false;
        inTierMatrix = false;
      }

      if (!inMermaid && /(->|=>)/.test(line)) {
        const match = line.match(/(->|=>)/);
        const token = match?.[1] ?? '->';
        const columnStart = match ? line.indexOf(token) : -1;
        addIssue(
          context,
          specFile,
          `Use the Unicode arrow (U+2192) instead of '${token}'.`,
          index + 1,
          {
            columnStart,
            columnEnd: columnStart >= 0 ? columnStart + token.length : null,
            expected: `${ARROW_CHAR} go to q3`,
            got: token,
          }
        );
      }

      if (
        !inMermaid &&
        inResultCard &&
        /^(?:\s*[-*▸]\s+)/.test(line) &&
        (/<\s*\/?\s*[a-z][^>]*>/i.test(line) ||
          /&lt;\s*\/?\s*[a-z][^&]*&gt;/i.test(line))
      ) {
        addIssue(
          context,
          specFile,
          'Result list items must use Markdown, not HTML tags. HTML tags are escaped and show as literal text in output.',
          index + 1
        );
      }

      if (!inMermaid && inResultCard) {
        const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(line);
        const hasUrl = /https?:\/\//i.test(line);

        if (/Collaboration Channel/i.test(line) && !hasUrl) {
          addIssue(
            context,
            specFile,
            'Collaboration channel lines must include a URL.',
            index + 1
          );
        }

        if (
          /Contact:\s*[^*]/i.test(line) &&
          !/^\s*\*\*Contact:\*\*\s*$/i.test(line) &&
          !hasEmail
        ) {
          addIssue(
            context,
            specFile,
            'Contact lines must include an email address.',
            index + 1
          );
        }
      }

      if (!inMermaid && inOptions && line.includes(ARROW_CHAR)) {
        if (!NAV_PATTERN.test(line)) {
          const arrowIndex = line.indexOf(ARROW_CHAR);
          addIssue(
            context,
            specFile,
            'Invalid navigation syntax. Use "U+2192 go to qX" or "U+2192 result: result-name".',
            index + 1,
            {
              columnStart: arrowIndex >= 0 ? arrowIndex : null,
              columnEnd: arrowIndex >= 0 ? line.length : null,
              expected: `${ARROW_CHAR} go to q3 OR ${ARROW_CHAR} result: result-name`,
              got: line.trim(),
            }
          );
        }

        if (currentQuestionId) {
          const targetMatch = line.match(NAV_TARGET_PATTERN);
          if (targetMatch) {
            const nextQuestion = targetMatch[1] || null;
            const nextResult = targetMatch[2] || null;
            const targets = graph.get(currentQuestionId);
            if (targets) {
              targets.push({ question: nextQuestion, result: nextResult });
            } else {
              graph.set(currentQuestionId, [{ question: nextQuestion, result: nextResult }]);
            }
            const targetValue = nextQuestion || nextResult || '';
            if (targetValue.includes('_')) {
              addWarning(
                context,
                specFile,
                `Navigation target '${targetValue}' contains underscores. Use hyphens only.`,
                index + 1
              );
            }
          }
        }
      }

      if (!inMermaid && inDropdown && line.includes(ARROW_CHAR)) {
        if (!RANGE_PATTERN.test(line)) {
          const arrowIndex = line.indexOf(ARROW_CHAR);
          addIssue(
            context,
            specFile,
            'Invalid dropdown range syntax. Use "- Range: 0-3 \u2192 go to qX" or "- Range: 4 \u2192 result: result-name".',
            index + 1,
            {
              columnStart: arrowIndex >= 0 ? arrowIndex : null,
              columnEnd: arrowIndex >= 0 ? line.length : null,
              expected: `- Range: 0-3 ${ARROW_CHAR} go to q3 OR - Range: 4 ${ARROW_CHAR} result: result-name`,
              got: line.trim(),
            }
          );
        }

        if (currentQuestionId) {
          const targetMatch = line.match(RANGE_TARGET_PATTERN);
          if (targetMatch) {
            const nextQuestion = targetMatch[4] || null;
            const nextResult = targetMatch[5] || null;
            const targets = graph.get(currentQuestionId);
            if (targets) {
              targets.push({ question: nextQuestion, result: nextResult });
            } else {
              graph.set(currentQuestionId, [{ question: nextQuestion, result: nextResult }]);
            }
          }
        }
      }

      if (!inMermaid && (inDropdownLeft || inDropdownRight) && line.includes(ARROW_CHAR)) {
        if (!RANGE_BUCKET_PATTERN.test(line)) {
          const arrowIndex = line.indexOf(ARROW_CHAR);
          addIssue(
            context,
            specFile,
            'Invalid dropdown bucket range syntax. Use "- Range: 10 \u2192 bucket: rto-a".',
            index + 1,
            {
              columnStart: arrowIndex >= 0 ? arrowIndex : null,
              columnEnd: arrowIndex >= 0 ? line.length : null,
              expected: `- Range: 10 ${ARROW_CHAR} bucket: rto-a`,
              got: line.trim(),
            }
          );
        }
      }

      if (!inMermaid && inMatrix && line.includes(ARROW_CHAR)) {
        if (!MATRIX_PATTERN.test(line)) {
          const arrowIndex = line.indexOf(ARROW_CHAR);
          addIssue(
            context,
            specFile,
            'Invalid dropdown matrix syntax. Use "- left + right \u2192 go to qX" or "- left + right \u2192 result: result-name".',
            index + 1,
            {
              columnStart: arrowIndex >= 0 ? arrowIndex : null,
              columnEnd: arrowIndex >= 0 ? line.length : null,
              expected: `- rto-a + rpo-1 ${ARROW_CHAR} go to q2a`,
              got: line.trim(),
            }
          );
        }

        if (currentQuestionId) {
          const targetMatch = line.match(MATRIX_TARGET_PATTERN);
          if (targetMatch) {
            const nextQuestion = targetMatch[3] || null;
            const nextResult = targetMatch[4] || null;
            const targets = graph.get(currentQuestionId);
            if (targets) {
              targets.push({ question: nextQuestion, result: nextResult });
            } else {
              graph.set(currentQuestionId, [{ question: nextQuestion, result: nextResult }]);
            }
            dropdownPairMatrixCounts.set(
              currentQuestionId,
              (dropdownPairMatrixCounts.get(currentQuestionId) || 0) + 1
            );
          }
        }
      }

      if (!inMermaid && inTierMatrix && line.includes(ARROW_CHAR)) {
        if (!TIER_MATRIX_PATTERN.test(line)) {
          const arrowIndex = line.indexOf(ARROW_CHAR);
          addIssue(
            context,
            specFile,
            'Invalid tier matrix syntax. Use "- left + right \u2192 tier: critical".',
            index + 1,
            {
              columnStart: arrowIndex >= 0 ? arrowIndex : null,
              columnEnd: arrowIndex >= 0 ? line.length : null,
              expected: `- rto-10m + rpo-1m ${ARROW_CHAR} tier: critical`,
              got: line.trim(),
            }
          );
        }
      }

      if (!inMermaid && inDropdown && /^\s*-\s*Range:/i.test(line) && currentQuestionId) {
        const rangeMatch = line.match(RANGE_TARGET_PATTERN);
        if (rangeMatch) {
          const min = parseInt(rangeMatch[1]!, 10);
          const max = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : min;
          const ranges = dropdownRanges.get(currentQuestionId);
          if (ranges) {
            ranges.push({ min, max, line: index + 1 });
          } else {
            dropdownRanges.set(currentQuestionId, [{ min, max, line: index + 1 }]);
          }
        }
      }

      if (
        !inMermaid &&
        (inDropdownLeft || inDropdownRight) &&
        /^\s*-\s*Range:/i.test(line) &&
        currentQuestionId
      ) {
        const rangeMatch = line.match(RANGE_BUCKET_PATTERN);
        if (rangeMatch) {
          const min = parseInt(rangeMatch[1]!, 10);
          const max = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : min;
          if (inDropdownLeft) {
            const ranges = dropdownPairLeftRanges.get(currentQuestionId);
            if (ranges) {
              ranges.push({ min, max, line: index + 1 });
            } else {
              dropdownPairLeftRanges.set(currentQuestionId, [{ min, max, line: index + 1 }]);
            }
          } else if (inDropdownRight) {
            const ranges = dropdownPairRightRanges.get(currentQuestionId);
            if (ranges) {
              ranges.push({ min, max, line: index + 1 });
            } else {
              dropdownPairRightRanges.set(currentQuestionId, [{ min, max, line: index + 1 }]);
            }
          }
        }
      }

      if (!inMermaid && inOptions && /^\s*\d+\./.test(line) && currentQuestionId) {
        const currentCount = optionCounts.get(currentQuestionId) ?? 0;
        optionCounts.set(currentQuestionId, currentCount + 1);

        const left = line.split(ARROW_CHAR)[0] || line;
        const text = left
          .replace(/^\s*\d+\.\s*/, '')
          .replace(/^"|"$/g, '')
          .trim()
          .toLowerCase();
        if (
          text.includes('unsure') ||
          text.includes('not sure') ||
          text.includes("don't know") ||
          text.includes('do not know') ||
          text.includes('general')
        ) {
          questionHasUnsure.set(currentQuestionId, true);
        }

        if (!optionTextsPerQuestion.has(currentQuestionId)) {
          optionTextsPerQuestion.set(currentQuestionId, new Map());
        }
        const texts = optionTextsPerQuestion.get(currentQuestionId) ?? new Map();
        const linesForText = texts.get(text) ?? [];
        linesForText.push(index + 1);
        texts.set(text, linesForText);
        optionTextsPerQuestion.set(currentQuestionId, texts);
      }

      if (!inMermaid) {
        const linkMatches = line.matchAll(/\(([^)]+)\)/g);
        for (const match of linkMatches) {
          const url = (match[1] ?? '').trim();
          if (!url) continue;
          if (/^https:\/\//i.test(url)) continue;
          if (/^[a-z]+:/i.test(url) || /\./.test(url)) {
            addWarning(
              context,
              specFile,
              'Links should be absolute (https://...).',
              index + 1
            );
            break;
          }
        }
      }

      if (!inMermaid) {
        const urlPattern = /https?:\/\/[^\s)>\"]+/gi;
        const urlMatches = line.matchAll(urlPattern);
        for (const urlMatch of urlMatches) {
          const url = urlMatch[0];
          if (url.startsWith('http://') && !url.startsWith('http://localhost')) {
            const columnStart = line.indexOf(url);
            addWarning(
              context,
              specFile,
              `Insecure URL found: "${url}". Use HTTPS.`,
              index + 1,
              {
                columnStart,
                columnEnd: columnStart + url.length,
              }
            );
          }
        }
      }
    });

    const lastResultBlock = resultBlocks[resultBlocks.length - 1];
    if (lastResultBlock) {
      lastResultBlock.end = lines.length - 1;
    }

    const questionIdMatches = matchAll(content, /(id="([^"]+)")/g);
    questionIdMatches.forEach((match) => {
      const id = match[2] ?? '';
      if (!id) return;
      if (id.startsWith('result-')) return;
      if (!/^q[0-9]+[a-z]?$/.test(id)) {
        addIssue(
          context,
          specFile,
          `Invalid question id '${id}'. Expected q1, q2a, q3b, etc.`,
          getLineNumber(content, match.index)
        );
      }
    });

    const resultIdMatches = matchAll(content, /(id="(result-[^"]+)")/g);
    resultIdMatches.forEach((match) => {
      const id = match[2] ?? '';
      if (!id) return;
      if (!/^result-[a-z0-9-]+$/.test(id)) {
        addIssue(
          context,
          specFile,
          `Invalid result id '${id}'. Expected result-servicename (lowercase, hyphens).`,
          getLineNumber(content, match.index)
        );
      }
    });

    REQUIRED_SECTIONS.forEach((section) => {
      if (!content.includes(section)) {
        addIssue(context, specFile, `Missing required section '${section}'.`, 0);
      }
    });

    optionCounts.forEach((count, questionId) => {
      if (count > MAX_OPTIONS_PER_QUESTION) {
        addWarning(
          context,
          specFile,
          `Question '${questionId}' has ${count} options. Consider reducing to ${MAX_OPTIONS_PER_QUESTION} or fewer for mobile readability.`,
          questionLineMap.get(questionId) || 0
        );
      }
    });

    questionOrder.forEach((questionId) => {
      const isDropdown = dropdownQuestions.has(questionId) || dropdownPairQuestions.has(questionId);
      if (!isDropdown && !questionHasUnsure.get(questionId)) {
        addWarning(
          context,
          specFile,
          `Question '${questionId}' is missing an "I don't know"/"Unsure" option that routes to guidance.`,
          questionLineMap.get(questionId) || 0
        );
      }
      if (questionInfoAfterOptions.get(questionId)) {
        addWarning(
          context,
          specFile,
          `Question '${questionId}' has an Info Box after options. Place Info Box above Options.`,
          questionLineMap.get(questionId) || 0
        );
      }
    });

    dropdownQuestions.forEach((questionId) => {
      const ranges = dropdownRanges.get(questionId) || [];
      if (!ranges.length) {
        addIssue(
          context,
          specFile,
          `Dropdown question '${questionId}' must define at least one range.`,
          questionLineMap.get(questionId) || 0
        );
        return;
      }

      const sorted = [...ranges].sort((a, b) => a.min - b.min);
      const isDiscrete = sorted.every((range) => range.min === range.max);
      for (let i = 0; i < sorted.length; i += 1) {
        const range = sorted[i];
        if (!range) {
          continue;
        }
        if (range.min > range.max) {
          addIssue(
            context,
            specFile,
            `Dropdown range ${range.min}-${range.max} has min > max in '${questionId}'.`,
            range.line
          );
        }

        if (i > 0) {
          const prev = sorted[i - 1];
          if (!prev) {
            continue;
          }
          if (range.min <= prev.max) {
            addIssue(
              context,
              specFile,
              `Dropdown ranges overlap in '${questionId}': ${prev.min}-${prev.max} and ${range.min}-${range.max}.`,
              range.line
            );
          } else if (!isDiscrete && range.min !== prev.max + 1) {
            addIssue(
              context,
              specFile,
              `Dropdown ranges must be contiguous in '${questionId}': gap between ${prev.max} and ${range.min}.`,
              range.line
            );
          }
        }
      }
    });

    dropdownPairQuestions.forEach((questionId) => {
      const leftRanges = dropdownPairLeftRanges.get(questionId) || [];
      const rightRanges = dropdownPairRightRanges.get(questionId) || [];
      const matrixCount = dropdownPairMatrixCounts.get(questionId) || 0;

      if (!leftRanges.length) {
        addIssue(
          context,
          specFile,
          `Dropdown-pair question '${questionId}' must define at least one left range.`,
          questionLineMap.get(questionId) || 0
        );
      }

      if (!rightRanges.length) {
        addIssue(
          context,
          specFile,
          `Dropdown-pair question '${questionId}' must define at least one right range.`,
          questionLineMap.get(questionId) || 0
        );
      }

      if (!matrixCount) {
        addIssue(
          context,
          specFile,
          `Dropdown-pair question '${questionId}' must define at least one matrix mapping.`,
          questionLineMap.get(questionId) || 0
        );
      }

      [leftRanges, rightRanges].forEach((ranges) => {
        const sorted = [...ranges].sort((a, b) => a.min - b.min);
        const isDiscrete = sorted.every((range) => range.min === range.max);
        for (let i = 0; i < sorted.length; i += 1) {
          const range = sorted[i];
          if (!range) {
            continue;
          }
          if (range.min > range.max) {
            addIssue(
              context,
              specFile,
              `Dropdown-pair range ${range.min}-${range.max} has min > max in '${questionId}'.`,
              range.line
            );
          }

          if (i > 0) {
            const prev = sorted[i - 1];
            if (!prev) {
              continue;
            }
            if (range.min <= prev.max) {
              addIssue(
                context,
                specFile,
                `Dropdown-pair ranges overlap in '${questionId}': ${prev.min}-${prev.max} and ${range.min}-${range.max}.`,
                range.line
              );
            } else if (!isDiscrete && range.min !== prev.max + 1) {
              addIssue(
                context,
                specFile,
                `Dropdown-pair ranges must be contiguous in '${questionId}': gap between ${prev.max} and ${range.min}.`,
                range.line
              );
            }
          }
        }
      });
    });

    for (const [questionId, texts] of optionTextsPerQuestion) {
      for (const [text, lineNums] of texts) {
        if (lineNums.length > 1) {
          addWarning(
            context,
            specFile,
            `Question '${questionId}' has duplicate option text "${text}" on lines ${lineNums.join(', ')}.`,
            lineNums[0] ?? 0
          );
        }
      }
    }

    const cycles = detectCycles(graph, questionOrder);
    for (const { cycle, entryPoint } of cycles) {
      addIssue(
        context,
        specFile,
        `Circular reference detected: ${cycle.join(` ${ARROW_CHAR} `)}. Users entering at '${entryPoint}' will loop forever.`,
        questionLineMap.get(cycle[0] ?? '') ?? 0
      );
    }

    const unreachable = findUnreachableQuestions(graph, questionOrder);
    for (const questionId of unreachable) {
      addWarning(
        context,
        specFile,
        `Question '${questionId}' is unreachable — no other question navigates to it. It may be orphaned or the navigation target may be misspelled.`,
        questionLineMap.get(questionId) ?? 0
      );
    }

    const referencedResults = new Set<string>();
    const tierValues = ['critical', 'high', 'medium', 'low'];
    for (const targets of graph.values()) {
      for (const target of targets) {
        if (target.result) {
          const normalized = target.result.toLowerCase();
          if (normalized.includes('{tier}')) {
            tierValues.forEach((tier) => {
              referencedResults.add(normalized.replace('{tier}', tier));
            });
          } else {
            referencedResults.add(normalized);
          }
        }
      }
    }

    for (const block of resultBlocks) {
      if (!referencedResults.has(block.id)) {
        addWarning(
          context,
          specFile,
          `Result '${block.id}' is defined but never referenced by any question. It may be orphaned or the navigation target may use a different ID.`,
          block.start + 1
        );
      }
    }

    const definedQuestions = new Set(questionOrder);
    const definedResults = new Set(resultBlocks.map((block) => block.id));

    for (const [sourceId, targets] of graph.entries()) {
      for (const target of targets) {
        if (target.question && !definedQuestions.has(target.question)) {
          addIssue(
            context,
            specFile,
            `Question '${sourceId}' navigates to '${target.question}' which is not defined in this spec.`,
            questionLineMap.get(sourceId) ?? 0
          );
        }
        if (target.result) {
          const normalized = target.result.toLowerCase();
          const hasDynamicTier = normalized.includes('{tier}');
          const matchesTier = hasDynamicTier
            ? tierValues.every((tier) => definedResults.has(normalized.replace('{tier}', tier)))
            : false;
          if (!definedResults.has(normalized) && !matchesTier) {
            addIssue(
              context,
              specFile,
              `Question '${sourceId}' navigates to '${target.result}' which is not defined in this spec.`,
              questionLineMap.get(sourceId) ?? 0
            );
          }
        }
      }
    }
    const startQuestion = questionOrder.includes('q1') ? 'q1' : questionOrder[0];
    if (startQuestion) {
      const maxDepth = getMaxQuestionDepth(startQuestion, graph, new Set());
      if (maxDepth > MAX_PATH_STEPS) {
        addWarning(
          context,
          specFile,
          `Longest path is ${maxDepth} steps. Consider adding an early-out before step ${MAX_PATH_STEPS}.`,
          questionLineMap.get(startQuestion) || 0
        );
      }
    }

    resultBlocks.forEach((block) => {
      const blockText = lines.slice(block.start, block.end + 1).join('\n');
      const hasResponsibility = /Responsibility Model/i.test(blockText);
      const hasSupport = /Support Section|Contact/i.test(blockText);
      if (!hasResponsibility || !hasSupport) {
        const missing = [
          hasResponsibility ? null : 'Responsibility Model',
          hasSupport ? null : 'Support/Contact section',
        ]
          .filter(Boolean)
          .join(' and ');
        addWarning(
          context,
          specFile,
          `Result '${block.id}' is missing ${missing}.`,
          block.start + 1
        );
      }
    });

    const progressMatch = /const\s+progressSteps\s*=\s*\{([\s\S]*?)\};/m.exec(content);
    if (progressMatch) {
      const block = progressMatch[1] ?? '';
      if (!/(?:^|[,{])\s*(?:['"])?result(?:['"])?\s*:\s*100/.test(block)) {
        addIssue(
          context,
          specFile,
          'Progress steps must end with "result": 100.',
          getLineNumber(content, progressMatch.index)
        );
      }
      if (!/(?:^|[,{])\s*(?:['"])?q[0-9]+[a-z]?(?:['"])?\s*:\s*0/.test(block)) {
        addIssue(
          context,
          specFile,
          'Progress steps must start at 0% for the first question.',
          getLineNumber(content, progressMatch.index)
        );
      }

      const progressEntries = [...block.matchAll(/([a-z0-9-]+)\s*:\s*(\d+)/gi)].map((match) => ({
        key: match[1] ?? '',
        value: parseInt(match[2] ?? '0', 10),
      }));
      const questionProgress = progressEntries
        .filter((entry) => entry.key.toLowerCase() !== 'result')
        .map((entry) => entry.value)
        .filter((value) => Number.isFinite(value));
      if (questionProgress.length) {
        const maxValue = Math.max(...questionProgress);
        if (maxValue !== 80) {
          addWarning(
            context,
            specFile,
            `Progress steps should top out at 80% for the deepest question (found ${maxValue}%).`,
            getLineNumber(content, progressMatch.index)
          );
        }
        const uniqueValues = [...new Set(questionProgress)].sort((a, b) => a - b);
        if (uniqueValues.length > 1) {
          const step = 80 / (uniqueValues.length - 1);
          const uneven = uniqueValues.some((value, index) => Math.abs(value - step * index) > 0.5);
          if (uneven) {
            addWarning(
              context,
              specFile,
              'Progress steps should be evenly spaced between 0% and 80%.',
              getLineNumber(content, progressMatch.index)
            );
          }
        }
      }
    } else {
      addIssue(context, specFile, 'Missing progressSteps block.', 0);
    }
  });

  if (issues.length) {
    logger.error('Validation failed.', { issueCount: issues.length });
    issues.forEach((issue) => {
      if (issue.line > 0) {
        const contextText = getErrorContext(issue.file, issue.line, issue);
        logger.error('Spec validation issue.', {
          file: issue.file,
          line: issue.line,
          message: issue.message,
          expected: issue.expected,
          got: issue.got,
          context: contextText || undefined,
        });
      } else {
        logger.error('Spec validation issue.', {
          file: issue.file,
          message: issue.message,
        });
      }
    });
    process.exit(1);
  }

  if (warnings.length) {
    logger.warn('Validation warnings.', { warningCount: warnings.length });
    warnings.forEach((warning) => {
      if (warning.line > 0) {
        const contextText = getErrorContext(warning.file, warning.line, warning);
        logger.warn('Spec validation warning.', {
          file: warning.file,
          line: warning.line,
          message: warning.message,
          expected: warning.expected,
          got: warning.got,
          context: contextText || undefined,
        });
      } else {
        logger.warn('Spec validation warning.', {
          file: warning.file,
          message: warning.message,
        });
      }
    });
  }

  logger.info('All spec checks passed.');
}

function findSpecFiles(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files: string[] = [];
  entries.forEach((entry) => {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findSpecFiles(fullPath));
      return;
    }
    if (entry.isFile() && entry.name.toLowerCase() === 'spec.md') {
      files.push(fullPath);
    }
  });
  return files;
}

function testUtf8Encoding(bytes: Uint8Array): string {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'UTF-8 with BOM (should be without BOM)';
  }

  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(bytes);
    return 'UTF-8 without BOM';
  } catch {
    return 'Invalid UTF-8 encoding';
  }
}

function matchAll(content: string, regex: RegExp): RegExpExecArray[] {
  const matches: RegExpExecArray[] = [];
  let match = regex.exec(content);
  while (match) {
    matches.push(match);
    match = regex.exec(content);
  }
  return matches;
}

function addIssue(
  context: ValidationContext,
  file: string,
  message: string,
  lineNumber: number,
  issueContext: IssueContext = {}
): void {
  context.issues.push({ file, line: lineNumber, message, ...issueContext });
}

function addWarning(
  context: ValidationContext,
  file: string,
  message: string,
  lineNumber: number,
  issueContext: IssueContext = {}
): void {
  context.warnings.push({ file, line: lineNumber, message, ...issueContext });
}

function getLineNumber(content: string, index: number): number {
  if (index < 0) return 0;
  return content.slice(0, index).split(/\r?\n/).length;
}

function getErrorContext(file: string, lineNumber: number, issue: ValidationIssue): string {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const start = Math.max(1, lineNumber - 3);
  const end = Math.min(lines.length, lineNumber + 3);
  if (start > end) {
    return '';
  }

  const gutterWidth = String(end).length;
  const block = ['\n  Context:'];

  for (let i = start; i <= end; i += 1) {
    const lineText = lines[i - 1];
    const isTarget = i === lineNumber;
    const prefix = isTarget ? '>' : ' ';
    const linePrefix = `  ${prefix} ${String(i).padStart(gutterWidth)} | `;
    block.push(`${linePrefix}${lineText}`);

    if (isTarget && Number.isInteger(issue.columnStart)) {
      const startCol = Math.max(0, issue.columnStart ?? 0);
      const endCol = Number.isInteger(issue.columnEnd)
        ? Math.max(startCol + 1, issue.columnEnd ?? startCol + 1)
        : startCol + 1;
      const markerPrefix = `  ${' '.repeat(1)} ${' '.repeat(gutterWidth)} | `;
      block.push(
        `${markerPrefix}${' '.repeat(startCol)}${'~'.repeat(Math.max(1, endCol - startCol))}`
      );
    }
  }

  if (issue.expected || issue.got) {
    if (issue.expected) {
      block.push(`\n  Expected: ${issue.expected}`);
    }
    if (issue.got) {
      block.push(`  Got:      ${issue.got}`);
    }
  }

  return block.join('\n');
}

function getMaxQuestionDepth(
  startId: string,
  graph: Map<string, GraphTarget[]>,
  visiting: Set<string>
): number {
  if (visiting.has(startId)) {
    return 0;
  }
  visiting.add(startId);
  const targets = graph.get(startId) || [];
  let maxDepth = 1;
  targets.forEach((target) => {
    if (target.question) {
      const childDepth = getMaxQuestionDepth(target.question, graph, visiting);
      maxDepth = Math.max(maxDepth, 1 + childDepth);
    }
  });
  visiting.delete(startId);
  return maxDepth;
}

function detectCycles(
  graph: Map<string, GraphTarget[]>,
  questionOrder: string[]
): Array<{ cycle: string[]; entryPoint: string }> {
  const cycles: Array<{ cycle: string[]; entryPoint: string }> = [];
  const globalVisited = new Set<string>();

  function dfs(nodeId: string, path: string[], pathSet: Set<string>): void {
    if (pathSet.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      const cycle = path.slice(cycleStart);
      cycle.push(nodeId);
      cycles.push({ cycle, entryPoint: path[0] ?? nodeId });
      return;
    }
    if (globalVisited.has(nodeId)) {
      return;
    }

    pathSet.add(nodeId);
    path.push(nodeId);

    const targets = graph.get(nodeId) ?? [];
    for (const target of targets) {
      if (target.question) {
        dfs(target.question, path, pathSet);
      }
    }

    path.pop();
    pathSet.delete(nodeId);
    globalVisited.add(nodeId);
  }

  for (const questionId of questionOrder) {
    if (!globalVisited.has(questionId)) {
      dfs(questionId, [], new Set());
    }
  }

  return cycles;
}

function findUnreachableQuestions(
  graph: Map<string, GraphTarget[]>,
  questionOrder: string[]
): string[] {
  const reachable = new Set<string>();
  const startId = questionOrder.includes('q1') ? 'q1' : questionOrder[0];
  if (startId) {
    reachable.add(startId);
  }

  const queue: string[] = startId ? [startId] : [];
  while (queue.length > 0) {
    const current = queue.shift() ?? '';
    const targets = graph.get(current) ?? [];
    for (const target of targets) {
      if (target.question && !reachable.has(target.question)) {
        reachable.add(target.question);
        queue.push(target.question);
      }
    }
  }

  return questionOrder.filter((questionId) => !reachable.has(questionId));
}

function applyFixes(content: string): FixResult {
  const lines = content.split(/\r?\n/);
  const arrowFixed = replaceAsciiArrows(lines);
  let updated = arrowFixed.lines.join('\n');

  const missingSections = REQUIRED_SECTIONS.filter((section) => !updated.includes(section));
  if (missingSections.length) {
    updated = appendMissingSections(updated, missingSections);
  }

  return {
    content: updated,
    changed: arrowFixed.changed || missingSections.length > 0,
  };
}

function replaceAsciiArrows(lines: string[]): ReplaceResult {
  let inMermaid = false;
  let changed = false;

  const nextLines = lines.map((line) => {
    if (/^```mermaid\s*$/.test(line)) {
      inMermaid = true;
      return line;
    }
    if (inMermaid && /^```\s*$/.test(line)) {
      inMermaid = false;
      return line;
    }
    if (!inMermaid && /(->|=>)/.test(line)) {
      const replaced = line.replace(/->|=>/g, ARROW_CHAR);
      if (replaced !== line) {
        changed = true;
      }
      return replaced;
    }
    return line;
  });

  return { lines: nextLines, changed };
}

function appendMissingSections(content: string, missingSections: string[]): string {
  const placeholders: Record<string, string> = {
    'Best For:': '- TODO',
    'Key Benefits:': '- TODO',
    'Considerations:': '- TODO',
    'When NOT to use:': '- TODO',
    'Tech Tags:': 'TODO',
    'Additional Considerations:': 'TODO',
  };

  const sectionBlock = missingSections
    .map((section) => {
      const placeholder = placeholders[section] || 'TODO';
      if (section === 'Tech Tags:') {
        return `**${section}** ${placeholder}`;
      }
      if (section === 'Additional Considerations:') {
        return `**${section}**\n${placeholder}`;
      }
      return `**${section}**\n${placeholder}`;
    })
    .join('\n\n');

  return `${content}\n\n---\n\n## Auto-added Required Sections (Review)\n\n${sectionBlock}\n`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const REQUIRED_SECTIONS = [
  'Best For:',
  'Key Benefits:',
  'Considerations:',
  'When NOT to use:',
  'Tech Tags:',
  'Additional Considerations:',
];

const isDirectRun =
  (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) ||
  process.argv[1]?.endsWith('validate-spec.js');

if (isDirectRun) {
  runValidation({ fix: process.argv.includes('--fix') });
}
