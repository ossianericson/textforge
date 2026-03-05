import { z } from 'zod';
import type { QuizSpec } from './types.js';

const StudyCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  front: z.string(),
  back: z.string(),
  hint: z.string().optional(),
});

const QuizOptionSchema = z.object({
  key: z.string(),
  text: z.string(),
});

const QuizQuestionSchema = z
  .object({
    id: z.string(),
    question: z.string(),
    type: z.literal('mcq'),
    options: z.array(QuizOptionSchema),
    answer: z.enum(['A', 'B', 'C', 'D']),
    explanation: z.string(),
    topicTag: z.string().optional(),
  })
  .refine(
    (question) => question.options.length === 4,
    'Each MCQ must include exactly four options.'
  )
  .refine(
    (question) => question.options.map((option) => option.key.toUpperCase()).join('') === 'ABCD',
    'MCQ options must be A, B, C, and D.'
  );

const QuizSpecSchema = z
  .object({
    title: z.string(),
    grade: z.string(),
    subject: z.string(),
    topic: z.string(),
    studyCards: z
      .array(StudyCardSchema)
      .refine((cards) => cards.length > 0, 'At least one study card is required.'),
    quizQuestions: z
      .array(QuizQuestionSchema)
      .refine((questions) => questions.length > 0, 'At least one quiz question is required.'),
    summary: z.array(z.string()),
  })
  .refine((spec) => {
    const ids = spec.quizQuestions.map((question) => question.id.toLowerCase().trim());
    return new Set(ids).size === ids.length;
  }, 'Quiz questions must have unique IDs.');

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length ? issue.path.join('.') : 'quizSpec';
      return `${path}: ${issue.message}`;
    })
    .join('\n');
}

export function validateQuizSpec(
  parsed: QuizSpec
): { ok: true; error: null } | { ok: false; error: string } {
  const result = QuizSpecSchema.safeParse(parsed);
  if (result.success) {
    return { ok: true, error: null };
  }

  return {
    ok: false,
    error: formatZodError(result.error),
  };
}
