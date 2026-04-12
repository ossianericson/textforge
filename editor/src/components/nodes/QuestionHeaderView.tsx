import type { NodeViewProps } from '@tiptap/react';
import { BlockShell } from './helpers';

const QUESTION_TYPES = [
  'buttons',
  'dropdown',
  'dropdown-pair',
  'slider',
  'multi-select',
  'toggle',
  'scoring-matrix',
] as const;

export function QuestionHeaderView({ node, updateAttributes }: NodeViewProps) {
  return (
    <BlockShell className="question-header-bar">
      <input
        value={node.attrs.questionId ?? ''}
        onChange={(event) => updateAttributes({ questionId: event.target.value })}
        className="question-id-input"
      />
      <select
        value={node.attrs.questionType ?? 'buttons'}
        onChange={(event) => updateAttributes({ questionType: event.target.value })}
        className="question-type-select"
      >
        {QUESTION_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <span className="question-progress-pill">{node.attrs.progressStep ?? 0}%</span>
    </BlockShell>
  );
}
