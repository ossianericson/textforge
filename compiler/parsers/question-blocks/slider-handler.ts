import type { QuestionBlockContext, QuestionBlockHandler } from '../types.js';
import { parseNavigationRangeLine, shouldEndBlock } from './shared.js';

function createSliderBlockHandler(): QuestionBlockHandler {
  return {
    matches: (line) => line.startsWith('**Slider**'),
    parse: ({ lines, startIndex, helpers }: QuestionBlockContext) => {
      let label = '';
      const ranges = [];
      let i = startIndex + 1;

      for (; i < lines.length; i += 1) {
        const trimmed = (lines[i] || '').trim();
        if (!trimmed) {
          continue;
        }
        if (shouldEndBlock(trimmed, ['**Slider**'])) {
          break;
        }

        const labelMatch = trimmed.match(/^\-\s*Label:\s*"(.+)"$/i);
        if (labelMatch && labelMatch[1]) {
          label = helpers.normalizeText(helpers.stripQuotes(labelMatch[1]));
          continue;
        }

        const range = parseNavigationRangeLine(trimmed, helpers);
        if (range) {
          ranges.push(range);
        }
      }

      return {
        endIndex: i - 1,
        patch: {
          type: 'slider',
          sliderLabel: label,
          sliderRanges: ranges,
          options: [],
        },
      };
    },
  };
}

export { createSliderBlockHandler };
