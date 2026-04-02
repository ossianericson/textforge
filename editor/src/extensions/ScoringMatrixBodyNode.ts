import { ScoringMatrixBodyView } from '@/components/nodes/ScoringMatrixBodyView';
import { createReactNode } from './shared';

export const ScoringMatrixBodyNode = createReactNode({
  name: 'scoringMatrixBody',
  group: 'block',
  content: 'rangeRow*',
  attrs: {
    questionType: 'scoring-matrix',
    scoringMatrixCategories: [],
    scoringMatrixScaleMin: 0,
    scoringMatrixScaleMax: 0,
  },
  component: ScoringMatrixBodyView,
});
