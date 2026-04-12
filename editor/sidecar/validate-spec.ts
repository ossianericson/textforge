/**
 * Sidecar: validate-spec
 * Usage: tsx sidecar/validate-spec.ts <absolute-path-to-spec.md>
 * Writes JSON array of ValidationWarning objects to stdout.
 * On error writes { "error": "..." } and exits with code 1.
 */
import { readFileSync } from 'node:fs';
import { createParsers } from '../../compiler/parsers/factory.ts';

const specPath = process.argv[2];

if (!specPath) {
  process.stdout.write(JSON.stringify({ error: 'No spec path provided' }));
  process.exit(1);
}

try {
  const content = readFileSync(specPath, 'utf-8');
  const lines = content.split('\n');
  const warnings: { line: number; code: string; message: string; nodeId?: string }[] = [];

  lines.forEach((line, index) => {
    if ((line.includes('->') || line.includes('=>')) && /Options|Dropdown|go to|result:/i.test(line)) {
      warnings.push({
        line: index + 1,
        code: 'W001',
        message: 'Navigation arrow should be → (U+2192), not -> or =>',
      });
    }
  });

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = (lines[index] || '').trim();
    const previous = (lines[index - 1] || '').trim();
    if (/^[-*]\s+/.test(trimmed) && /^\*\*(Best For|Key Benefits|Considerations|When NOT to use):\*\*/.test(previous)) {
      warnings.push({
        line: index + 1,
        code: 'W002',
        message: 'Result list items should use ▸ (U+25B8), not - or *',
      });
    }
  }

  const parsers = createParsers();
  const indices = parsers.findSectionIndices(lines);
  const questions = parsers.parseQuestions(lines, indices.flowStart, indices.resultStart);
  const results = parsers.parseResults(lines, indices.resultStart, lines.length);
  const progressSteps = parsers.parseProgressSteps(lines, indices.progressStart);

  const questionIds = new Set(Object.keys(questions));
  const resultIds = new Set(Object.keys(results));

  Object.entries(questions).forEach(([questionId, question]) => {
    const targets: string[] = [];
    (question.options ?? []).forEach((option) => targets.push(option.next));
    (question.dropdownRanges ?? []).forEach((range) => targets.push(range.next));
    (question.sliderRanges ?? []).forEach((range) => targets.push(range.next));
    (question.multiSelectRoutes ?? []).forEach((route) => targets.push(route.next));
    (question.scoringMatrixRoutes ?? []).forEach((range) => targets.push(range.next));
    if (question.multiSelectFallback) {
      targets.push(question.multiSelectFallback);
    }
    if (question.toggleOnNext) {
      targets.push(question.toggleOnNext);
    }
    if (question.toggleOffNext) {
      targets.push(question.toggleOffNext);
    }
    Object.values(question.dropdownMatrix ?? {}).forEach((row) => {
      Object.values(row ?? {}).forEach((target) => targets.push(target));
    });

    targets.forEach((target) => {
      if (!questionIds.has(target) && !resultIds.has(target)) {
        warnings.push({
          line: 0,
          code: 'E001',
          message: `Question "${questionId}" targets missing id "${target}"`,
          nodeId: questionId,
        });
      }
    });
  });

  if (progressSteps.result !== 100) {
    warnings.push({ line: 0, code: 'W003', message: 'Progress step for "result" must be 100' });
  }
  if (Object.keys(questions).includes('q1') && progressSteps.q1 !== 0) {
    warnings.push({ line: 0, code: 'W004', message: 'Progress step for "q1" must be 0', nodeId: 'q1' });
  }

  process.stdout.write(JSON.stringify(warnings));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stdout.write(JSON.stringify({ error: message }));
  process.exit(1);
}