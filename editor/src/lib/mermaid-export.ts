import { collectTargetsFromQuestion } from '@/lib/layout';
import type { ParsedSpec } from '@shared/types';

function escapeLabel(value: string): string {
  return value.replace(/"/g, '\\"');
}

function nodeRef(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

export function generateMermaid(spec: ParsedSpec): string {
  const lines: string[] = ['flowchart LR'];

  Object.entries(spec.questions).forEach(([id, question]) => {
    lines.push(`  ${nodeRef(id)}([\"${escapeLabel(question.title || id)}\"])`);
  });

  Object.entries(spec.results).forEach(([id, result]) => {
    lines.push(`  ${nodeRef(id)}{{\"${escapeLabel(result.title || id)}\"}}`);
  });

  Object.entries(spec.questions).forEach(([id, question]) => {
    const targets = collectTargetsFromQuestion(question);
    targets.forEach((target) => {
      if (spec.questions[target] || spec.results[target]) {
        lines.push(`  ${nodeRef(id)} --> ${nodeRef(target)}`);
      }
    });
  });

  return `${lines.join('\n')}\n`;
}
