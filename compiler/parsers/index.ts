import fs from 'node:fs';

import { createParsers } from './factory.js';
import { DecisionTreeCompilerError, ERROR_CODES } from '../errors.js';
import type { ParsedSpec } from '../types.js';

const {
  parseTitle,
  parseSpecMetadata,
  parseQuestions,
  parseResults,
  findSectionIndices,
  parseProgressSteps,
} = createParsers();

function parseSpecFile(filePath: string): ParsedSpec {
  if (!fs.existsSync(filePath)) {
    throw new DecisionTreeCompilerError(`Spec file not found: ${filePath}`, {
      code: ERROR_CODES.SPEC_NOT_FOUND,
      suggestion: 'Ensure the spec path exists, for example decision-trees/<topic>/spec.md.',
    });
  }
  const contents = fs.readFileSync(filePath, 'utf8');
  if (!contents.includes('## Decision Tree Flow')) {
    throw new DecisionTreeCompilerError('Missing required section: Decision Tree Flow', {
      code: ERROR_CODES.SPEC_INVALID,
      suggestion: 'Add a "## Decision Tree Flow" section to the spec and try again.',
    });
  }
  return parseSpec(contents);
}

function parseSpec(contents: string): ParsedSpec {
  const lines = contents.split(/\r?\n/);
  const sections = findSectionIndices(lines);
  const title = parseTitle(lines, sections.flowStart ?? sections.resultStart ?? lines.length);
  const metadata = parseSpecMetadata(
    lines,
    sections.flowStart ?? sections.resultStart ?? lines.length
  );
  const questions = parseQuestions(lines, sections.flowStart, sections.resultStart);
  const results = parseResults(lines, sections.resultStart, sections.progressStart);
  const progressSteps = parseProgressSteps(lines, sections.progressStart);

  return {
    title,
    metadata,
    questions,
    results,
    progressSteps,
  };
}

export { createParsers, parseSpec, parseSpecFile };
