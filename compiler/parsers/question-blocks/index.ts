import type { QuestionBlockHandler } from '../types.js';
import { createDropdownBlockHandler } from './dropdown-handler.js';
import { createDropdownPairBlockHandler } from './dropdown-pair-handler.js';
import { createMultiSelectBlockHandler } from './multi-select-handler.js';
import { createScoringMatrixBlockHandler } from './scoring-matrix-handler.js';
import { createSliderBlockHandler } from './slider-handler.js';
import { createToggleBlockHandler } from './toggle-handler.js';
import { createTooltipBlockHandler } from './tooltip-handler.js';

function createQuestionBlockHandlers(): QuestionBlockHandler[] {
  return [
    createTooltipBlockHandler(),
    createDropdownBlockHandler(),
    createDropdownPairBlockHandler(),
    createSliderBlockHandler(),
    createMultiSelectBlockHandler(),
    createToggleBlockHandler(),
    createScoringMatrixBlockHandler(),
  ];
}

export { createQuestionBlockHandlers };
