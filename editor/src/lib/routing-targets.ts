import type { ParsedSpec, Question } from '@shared/types';

const TARGET_KEYS = ['targetId', 'id', 'next', 'target', 'route', 'value', 'bucket'] as const;

function extractTargetCandidate(value: unknown, depth: number): string | null {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (!value || typeof value !== 'object' || depth > 2) {
    return null;
  }

  for (const key of TARGET_KEYS) {
    const nested = (value as Record<string, unknown>)[key];
    const candidate = extractTargetCandidate(nested, depth + 1);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

export function normalizeRoutingTarget(value: unknown): string {
  return extractTargetCandidate(value, 0) ?? '';
}

function normalizeQuestionRoutingTargets(question: Question): Question {
  return {
    ...question,
    options: (question.options ?? []).map((option) => ({
      ...option,
      next: normalizeRoutingTarget(option.next),
    })),
    dropdownRanges: question.dropdownRanges?.map((range) => ({
      ...range,
      next: normalizeRoutingTarget(range.next),
    })),
    sliderRanges: question.sliderRanges?.map((range) => ({
      ...range,
      next: normalizeRoutingTarget(range.next),
    })),
    scoringMatrixRoutes: question.scoringMatrixRoutes?.map((range) => ({
      ...range,
      next: normalizeRoutingTarget(range.next),
    })),
    dropdownLeftRanges: question.dropdownLeftRanges?.map((range) => ({
      ...range,
      bucket: normalizeRoutingTarget(range.bucket),
    })),
    dropdownRightRanges: question.dropdownRightRanges?.map((range) => ({
      ...range,
      bucket: normalizeRoutingTarget(range.bucket),
    })),
    dropdownMatrix: question.dropdownMatrix
      ? Object.fromEntries(
          Object.entries(question.dropdownMatrix).map(([leftKey, row]) => [
            leftKey,
            Object.fromEntries(
              Object.entries(row ?? {}).map(([rightKey, target]) => [
                rightKey,
                normalizeRoutingTarget(target),
              ])
            ),
          ])
        )
      : question.dropdownMatrix,
    multiSelectRoutes: question.multiSelectRoutes?.map((route) => ({
      ...route,
      next: normalizeRoutingTarget(route.next),
    })),
    multiSelectFallback: question.multiSelectFallback
      ? normalizeRoutingTarget(question.multiSelectFallback)
      : question.multiSelectFallback,
    toggleOnNext: question.toggleOnNext ? normalizeRoutingTarget(question.toggleOnNext) : question.toggleOnNext,
    toggleOffNext: question.toggleOffNext ? normalizeRoutingTarget(question.toggleOffNext) : question.toggleOffNext,
  };
}

export function normalizeParsedSpecRoutingTargets(spec: ParsedSpec): ParsedSpec {
  return {
    ...spec,
    questions: Object.fromEntries(
      Object.entries(spec.questions).map(([id, question]) => [
        id,
        normalizeQuestionRoutingTargets(question),
      ])
    ),
  };
}