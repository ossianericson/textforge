import type { QuestionBlockContext, QuestionBlockHandler } from '../types.js';
import { parseTooltipLine, shouldEndBlock } from './shared.js';

function createTooltipBlockHandler(): QuestionBlockHandler {
  return {
    matches: (line) => line.startsWith('**Tooltips**'),
    parse: ({ lines, startIndex, helpers }: QuestionBlockContext) => {
      const tooltips = [];
      let i = startIndex + 1;
      for (; i < lines.length; i += 1) {
        const trimmed = (lines[i] || '').trim();
        if (!trimmed) {
          continue;
        }
        if (shouldEndBlock(trimmed, ['**Tooltips**'])) {
          break;
        }
        const tooltip = parseTooltipLine(trimmed, helpers);
        if (tooltip) {
          tooltips.push(tooltip);
        }
      }

      return {
        endIndex: i - 1,
        patch: { tooltips },
      };
    },
  };
}

export { createTooltipBlockHandler };
