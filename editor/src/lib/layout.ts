import type { Edge, Node } from 'reactflow';
import type { ParsedSpec, Question } from '@shared/types';

const NODE_WIDTH = 260;
const NODE_HEIGHT = 104;
const COL_GAP = 340;
const ROW_GAP = 152;

export function collectTargetsFromQuestion(question: Question): string[] {
  const targets: string[] = [];
  (question.options ?? []).forEach((option) => targets.push(option.next));
  (question.dropdownRanges ?? []).forEach((range) => targets.push(range.next));
  (question.sliderRanges ?? []).forEach((range) => targets.push(range.next));
  (question.multiSelectRoutes ?? []).forEach((route) => targets.push(route.next));
  if (question.multiSelectFallback) {
    targets.push(question.multiSelectFallback);
  }
  if (question.toggleOnNext) {
    targets.push(question.toggleOnNext);
  }
  if (question.toggleOffNext) {
    targets.push(question.toggleOffNext);
  }
  (question.scoringMatrixRoutes ?? []).forEach((range) => targets.push(range.next));
  Object.values(question.dropdownMatrix ?? {}).forEach((row) => {
    Object.values(row ?? {}).forEach((target) => targets.push(target));
  });
  return [...new Set(targets)];
}

function questionIdOrder(a: string, b: string): number {
  const left = a.match(/^q(\d+)([a-z]*)$/i);
  const right = b.match(/^q(\d+)([a-z]*)$/i);
  if (!left || !right) {
    return a.localeCompare(b);
  }
  const leftNumber = Number(left[1]);
  const rightNumber = Number(right[1]);
  if (leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }
  return (left[2] ?? '').localeCompare(right[2] ?? '');
}

export function buildGraphFromSpec(spec: ParsedSpec): { nodes: Node[]; edges: Edge[] } {
  const questionIds = Object.keys(spec.questions).sort(questionIdOrder);
  const resultIds = Object.keys(spec.results);
  const questionIdSet = new Set(questionIds);
  const resultIdSet = new Set(resultIds);

  const columnMap = new Map<string, number>();
  const queue: string[] = [];
  const root = questionIdSet.has('q1') ? 'q1' : questionIds[0] ?? '';

  if (root) {
    columnMap.set(root, 0);
    queue.push(root);
  }

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) {
      continue;
    }
    const question = spec.questions[id];
    if (!question) {
      continue;
    }
    const currentColumn = columnMap.get(id) ?? 0;
    collectTargetsFromQuestion(question).forEach((target) => {
      if (!columnMap.has(target)) {
        columnMap.set(target, currentColumn + 1);
        if (questionIdSet.has(target)) {
          queue.push(target);
        }
      }
    });
  }

  questionIds.forEach((id) => {
    if (!columnMap.has(id)) {
      columnMap.set(id, 0);
    }
  });

  let maxQuestionColumn = 0;
  questionIds.forEach((id) => {
    maxQuestionColumn = Math.max(maxQuestionColumn, columnMap.get(id) ?? 0);
  });
  const resultColumn = maxQuestionColumn + 1;

  const rowMap = new Map<string, number>();
  const perColumnCounts = new Map<number, number>();
  questionIds.forEach((id) => {
    const column = columnMap.get(id) ?? 0;
    const row = perColumnCounts.get(column) ?? 0;
    rowMap.set(id, row);
    perColumnCounts.set(column, row + 1);
  });
  resultIds.forEach((id, index) => {
    rowMap.set(id, index);
  });

  const nodes: Node[] = questionIds.map((id) => {
    const question = spec.questions[id]!;
    return {
      id,
      type: 'questionNode',
      position: {
        x: (columnMap.get(id) ?? 0) * COL_GAP,
        y: (rowMap.get(id) ?? 0) * ROW_GAP,
      },
      data: {
        id,
        label: question.title,
        nodeType: 'question' as const,
        questionType: question.type ?? 'buttons',
        optionCount: (question.options ?? []).length,
        question,
      },
      style: { width: NODE_WIDTH, minHeight: NODE_HEIGHT },
    };
  });

  resultIds.forEach((id) => {
    const result = spec.results[id]!;
    nodes.push({
      id,
      type: 'resultNode',
      position: { x: resultColumn * COL_GAP, y: (rowMap.get(id) ?? 0) * ROW_GAP },
      data: {
        id,
        label: result.title,
        nodeType: 'result' as const,
        icon: result.icon,
        badge: result.badge,
        result,
      },
      style: { width: NODE_WIDTH, minHeight: NODE_HEIGHT },
    });
  });

  const edges: Edge[] = [];
  let edgeCounter = 0;

  Object.entries(spec.questions).forEach(([sourceId, question]) => {
    const addEdge = (target: string, label: string) => {
      if (!questionIdSet.has(target) && !resultIdSet.has(target)) {
        return;
      }
      edges.push({
        id: `e-${++edgeCounter}`,
        source: sourceId,
        target,
        label: label.length > 28 ? `${label.slice(0, 28)}…` : label,
        animated: false,
        style: { stroke: '#49637f', strokeWidth: 1.5 },
        labelStyle: { fontSize: 10, fill: '#9db1c6' },
      });
    };

    (question.options ?? []).forEach((option) => addEdge(option.next, option.text));
    (question.dropdownRanges ?? []).forEach((range) => addEdge(range.next, `${range.min}–${range.max}`));
    (question.sliderRanges ?? []).forEach((range) => addEdge(range.next, `${range.min}–${range.max}`));
    (question.multiSelectRoutes ?? []).forEach((route) => addEdge(route.next, route.values.join(' + ')));
    if (question.multiSelectFallback) {
      addEdge(question.multiSelectFallback, 'fallback');
    }
    if (question.toggleOnNext) {
      addEdge(question.toggleOnNext, 'On');
    }
    if (question.toggleOffNext) {
      addEdge(question.toggleOffNext, 'Off');
    }
    (question.scoringMatrixRoutes ?? []).forEach((range) => addEdge(range.next, `score ${range.min}–${range.max}`));
    Object.entries(question.dropdownMatrix ?? {}).forEach(([left, row]) => {
      Object.entries(row ?? {}).forEach(([right, target]) => {
        addEdge(target, `${left}+${right}`);
      });
    });
  });

  return { nodes, edges };
}