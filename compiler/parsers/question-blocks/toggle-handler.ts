import type { QuestionBlockContext, QuestionBlockHandler } from '../types.js';

function createToggleBlockHandler(): QuestionBlockHandler {
  return {
    matches: (line, question) =>
      question.type === 'toggle' &&
      (line.startsWith('**Label**') || line.startsWith('**On**') || line.startsWith('**Off**')),
    parse: ({ lines, startIndex, helpers }: QuestionBlockContext) => {
      const marker = (lines[startIndex] || '').trim();

      if (marker.startsWith('**Label**')) {
        return {
          endIndex: startIndex,
          patch: {
            type: 'toggle',
            toggleLabel: helpers.normalizeText(
              helpers.stripQuotes(helpers.extractAfterColon(marker))
            ),
            options: [],
          },
        };
      }

      const toggleMatch = marker.match(/^\*\*(On|Off)\*\*\s*\u2192\s*(go to|result:)\s*(.+)$/i);
      const next =
        toggleMatch?.[2] && toggleMatch?.[3]
          ? helpers.parseNavigationTarget(toggleMatch[2], toggleMatch[3])
          : null;

      if (!toggleMatch || !next) {
        return { endIndex: startIndex, patch: { type: 'toggle' } };
      }

      return {
        endIndex: startIndex,
        patch:
          toggleMatch[1]?.toLowerCase() === 'on'
            ? { type: 'toggle', toggleOnNext: next, options: [] }
            : { type: 'toggle', toggleOffNext: next, options: [] },
      };
    },
  };
}

export { createToggleBlockHandler };
