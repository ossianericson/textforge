import type { QuestionBlockContext, QuestionBlockHandler } from '../types.js';
import { parseNavigationRangeLine, shouldEndBlock } from './shared.js';

function createScoringMatrixBlockHandler(): QuestionBlockHandler {
  return {
    matches: (line, question) =>
      question.type === 'scoring-matrix' &&
      (line.startsWith('**Categories**') ||
        line.startsWith('**Scale**') ||
        line.startsWith('**Routes**')),
    parse: ({ lines, startIndex, helpers }: QuestionBlockContext) => {
      const marker = (lines[startIndex] || '').trim();

      if (marker.startsWith('**Categories**')) {
        const categories = helpers
          .extractAfterColon(marker)
          .split(',')
          .map((part) => helpers.normalizeText(helpers.stripQuotes(part.trim())))
          .filter(Boolean);
        return {
          endIndex: startIndex,
          patch: {
            type: 'scoring-matrix',
            scoringMatrixCategories: categories,
            options: [],
          },
        };
      }

      if (marker.startsWith('**Scale**')) {
        const scaleMatch = marker.match(/^\*\*Scale\*\*:\s*(-?\d+)\s*[\u2013-]\s*(-?\d+)$/i);
        if (!scaleMatch || !scaleMatch[1] || !scaleMatch[2]) {
          return { endIndex: startIndex, patch: { type: 'scoring-matrix' } };
        }
        return {
          endIndex: startIndex,
          patch: {
            type: 'scoring-matrix',
            scoringMatrixScale: {
              min: parseInt(scaleMatch[1], 10),
              max: parseInt(scaleMatch[2], 10),
            },
            options: [],
          },
        };
      }

      const routes = [];
      let i = startIndex + 1;
      for (; i < lines.length; i += 1) {
        const trimmed = (lines[i] || '').trim();
        if (!trimmed) {
          continue;
        }
        if (shouldEndBlock(trimmed, ['**Routes**'])) {
          break;
        }

        const range = parseNavigationRangeLine(trimmed, helpers);
        if (range) {
          routes.push(range);
        }
      }

      return {
        endIndex: i - 1,
        patch: {
          type: 'scoring-matrix',
          scoringMatrixRoutes: routes,
          options: [],
        },
      };
    },
  };
}

export { createScoringMatrixBlockHandler };
