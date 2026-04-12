import type { MatrixTable, QuestionBlockContext, QuestionBlockHandler } from '../types.js';
import {
  parseBucketRangeLine,
  parseMatrixRouteLine,
  parseTierRouteLine,
  shouldEndBlock,
} from './shared.js';

function createDropdownPairBlockHandler(): QuestionBlockHandler {
  return {
    matches: (line) =>
      line.startsWith('**Dropdown Left**') ||
      line.startsWith('**Dropdown Right**') ||
      line.startsWith('**Matrix**') ||
      line.startsWith('**Tier Matrix**') ||
      line.startsWith('**Matrix Table**'),
    parse: ({ lines, startIndex, helpers }: QuestionBlockContext) => {
      const marker = (lines[startIndex] || '').trim();

      if (marker.startsWith('**Dropdown Left**') || marker.startsWith('**Dropdown Right**')) {
        let label = '';
        const ranges = [];
        let i = startIndex + 1;

        for (; i < lines.length; i += 1) {
          const trimmed = (lines[i] || '').trim();
          if (!trimmed) {
            continue;
          }
          if (shouldEndBlock(trimmed, [marker])) {
            break;
          }

          const labelMatch = trimmed.match(/^\-\s*Label:\s*"(.+)"$/i);
          if (labelMatch && labelMatch[1]) {
            label = helpers.normalizeText(helpers.stripQuotes(labelMatch[1]));
            continue;
          }

          const range = parseBucketRangeLine(trimmed, helpers);
          if (range) {
            ranges.push(range);
          }
        }

        return {
          endIndex: i - 1,
          patch: marker.startsWith('**Dropdown Left**')
            ? {
                type: 'dropdown-pair',
                dropdownLeftLabel: label,
                dropdownLeftRanges: ranges,
                options: [],
              }
            : {
                type: 'dropdown-pair',
                dropdownRightLabel: label,
                dropdownRightRanges: ranges,
                options: [],
              },
        };
      }

      if (marker.startsWith('**Matrix**')) {
        const matrix: Record<string, Record<string, string>> = {};
        let i = startIndex + 1;
        for (; i < lines.length; i += 1) {
          const trimmed = (lines[i] || '').trim();
          if (!trimmed) {
            continue;
          }
          if (shouldEndBlock(trimmed, ['**Matrix**'])) {
            break;
          }
          const route = parseMatrixRouteLine(trimmed, helpers);
          if (!route) {
            continue;
          }
          if (!matrix[route.left]) {
            matrix[route.left] = {};
          }
          const targetRow = matrix[route.left];
          if (targetRow) {
            targetRow[route.right] = route.next;
          }
        }

        return {
          endIndex: i - 1,
          patch: {
            type: 'dropdown-pair',
            dropdownMatrix: matrix,
          },
        };
      }

      if (marker.startsWith('**Tier Matrix**')) {
        const matrix: Record<string, Record<string, string>> = {};
        let i = startIndex + 1;
        for (; i < lines.length; i += 1) {
          const trimmed = (lines[i] || '').trim();
          if (!trimmed) {
            continue;
          }
          if (shouldEndBlock(trimmed, ['**Tier Matrix**'])) {
            break;
          }
          const route = parseTierRouteLine(trimmed);
          if (!route) {
            continue;
          }
          if (!matrix[route.left]) {
            matrix[route.left] = {};
          }
          const tierRow = matrix[route.left];
          if (tierRow) {
            tierRow[route.right] = route.tier;
          }
        }

        return {
          endIndex: i - 1,
          patch: {
            type: 'dropdown-pair',
            dropdownTierMatrix: matrix,
          },
        };
      }

      const columns: string[] = [];
      const rows: MatrixTable['rows'] = [];
      let i = startIndex + 1;
      for (; i < lines.length; i += 1) {
        const trimmed = (lines[i] || '').trim();
        if (!trimmed) {
          continue;
        }
        if (shouldEndBlock(trimmed, ['**Matrix Table**'])) {
          break;
        }

        const columnMatch = trimmed.match(/^\-\s*Columns:\s*(.+)$/i);
        if (columnMatch && columnMatch[1]) {
          columns.push(
            ...columnMatch[1]
              .split('|')
              .map((part) => helpers.normalizeText(helpers.stripQuotes(part.trim())))
              .filter(Boolean)
          );
          continue;
        }

        const rowMatch = trimmed.match(/^\-\s*Row:\s*(.+)$/i);
        if (rowMatch && rowMatch[1]) {
          const parts = rowMatch[1]
            .split('|')
            .map((part) => helpers.normalizeText(helpers.stripQuotes(part.trim())))
            .filter(Boolean);
          const label = parts[0] || '';
          if (label && parts.length >= 2) {
            rows.push({ label, cells: parts.slice(1) });
          }
        }
      }

      return {
        endIndex: i - 1,
        patch: {
          type: 'dropdown-pair',
          dropdownMatrixTable: { columns, rows },
        },
      };
    },
  };
}

export { createDropdownPairBlockHandler };
