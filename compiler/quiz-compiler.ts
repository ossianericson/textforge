import fs from 'node:fs';
import path from 'node:path';
import Handlebars from 'handlebars';
import { parseQuizSpecFile } from './parsers/quiz-parser.js';
import { validateQuizSpec } from './quiz-schema.js';
import { DecisionTreeCompilerError, ERROR_CODES } from './errors.js';
import type { ErrorCode } from './errors.js';

interface CompileOptions {
  specPath: string;
  templatePath: string;
  outputPath: string;
}

function readFileSafely(filePath: string, code: ErrorCode, suggestion: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new DecisionTreeCompilerError(`Failed to read file: ${filePath}`, {
      code,
      suggestion,
      cause: error,
    });
  }
}

export function compileQuiz({ specPath, templatePath, outputPath }: CompileOptions): void {
  if (!specPath || !fs.existsSync(specPath)) {
    throw new DecisionTreeCompilerError(`Spec file not found: ${specPath}`, {
      code: ERROR_CODES.SPEC_NOT_FOUND,
      suggestion: 'Ensure the quiz spec path exists.',
    });
  }

  if (!templatePath || !fs.existsSync(templatePath)) {
    throw new DecisionTreeCompilerError(`Template file not found: ${templatePath}`, {
      code: ERROR_CODES.TEMPLATE_NOT_FOUND,
      suggestion: 'Check the quiz template path or pass --template with a valid file.',
    });
  }

  let parsed = parseQuizSpecFile(specPath);
  const validation = validateQuizSpec(parsed);
  if (!validation.ok) {
    throw new DecisionTreeCompilerError('Quiz spec failed validation.', {
      code: ERROR_CODES.SPEC_INVALID,
      suggestion: validation.error ?? '',
    });
  }

  const templateContents = readFileSafely(
    templatePath,
    ERROR_CODES.TEMPLATE_READ_FAILED,
    'Verify the quiz template file exists and is readable.'
  );
  const template = Handlebars.compile(templateContents);

  const quizJson = JSON.stringify(parsed, null, 2).replace(/<\//g, '<\\/');
  const html = template({
    title: parsed.title || 'Quiz',
    grade: parsed.grade,
    subject: parsed.subject,
    topic: parsed.topic,
    quizJson,
  });

  const outputDir = path.dirname(outputPath);
  if (outputDir && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    fs.writeFileSync(outputPath, html, 'utf8');
  } catch (error) {
    throw new DecisionTreeCompilerError(`Failed to write output: ${outputPath}`, {
      code: ERROR_CODES.OUTPUT_WRITE_FAILED,
      suggestion: 'Check output path permissions and disk space.',
      cause: error,
    });
  }
}
