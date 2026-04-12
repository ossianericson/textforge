import type { QuestionBlockContext, QuestionBlockHandler } from '../types.js';
import { parseMultiSelectRouteLine, shouldEndBlock } from './shared.js';

function createMultiSelectBlockHandler(): QuestionBlockHandler {
  return {
    matches: (line, question) =>
      question.type === 'multi-select' &&
      (line.startsWith('**Options**') || line.startsWith('**Routes**')),
    parse: ({ lines, startIndex, helpers }: QuestionBlockContext) => {
      const marker = (lines[startIndex] || '').trim();

      if (marker.startsWith('**Options**')) {
        const options: string[] = [];
        let i = startIndex + 1;
        for (; i < lines.length; i += 1) {
          const trimmed = (lines[i] || '').trim();
          if (!trimmed) {
            continue;
          }
          if (shouldEndBlock(trimmed, ['**Options**'])) {
            break;
          }
          const optionMatch = trimmed.match(/^\d+\.\s*"(.+)"\s*$/);
          if (optionMatch && optionMatch[1]) {
            options.push(helpers.normalizeText(helpers.stripQuotes(optionMatch[1])));
          }
        }

        return {
          endIndex: i - 1,
          patch: {
            type: 'multi-select',
            multiSelectOptions: options,
            options: [],
          },
        };
      }

      const routes = [];
      let fallback = '';
      let i = startIndex + 1;
      for (; i < lines.length; i += 1) {
        const trimmed = (lines[i] || '').trim();
        if (!trimmed) {
          continue;
        }
        if (shouldEndBlock(trimmed, ['**Routes**'])) {
          break;
        }

        const fallbackMatch = trimmed.match(/^\-\s*fallback\s*\u2192\s*(go to|result:)\s*(.+)$/i);
        if (fallbackMatch && fallbackMatch[1] && fallbackMatch[2]) {
          fallback = helpers.parseNavigationTarget(fallbackMatch[1], fallbackMatch[2]) || '';
          continue;
        }

        const route = parseMultiSelectRouteLine(trimmed, helpers);
        if (route) {
          routes.push(route);
        }
      }

      return {
        endIndex: i - 1,
        patch: {
          type: 'multi-select',
          multiSelectRoutes: routes,
          multiSelectFallback: fallback,
        },
      };
    },
  };
}

export { createMultiSelectBlockHandler };
