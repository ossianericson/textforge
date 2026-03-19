import { z } from 'zod';
import type { ParsedSpec } from './types.js';

const OptionSchema = z.object({
  text: z.string(),
  next: z.string(),
  recommended: z.boolean(),
  advanced: z.boolean(),
});

const QuestionSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    infoBox: z.string().nullable(),
    type: z.enum(['buttons', 'dropdown', 'dropdown-pair']).optional().default('buttons'),
    options: z.array(OptionSchema),
    contextCapture: z
      .object({
        key: z.string(),
        from: z.enum(['optionText']).optional().default('optionText'),
      })
      .optional(),
    dropdownLabel: z.string().optional(),
    dropdownRanges: z
      .array(
        z.object({
          min: z.number().int(),
          max: z.number().int(),
          next: z.string(),
          label: z.string(),
        })
      )
      .optional(),
    dropdownLeftLabel: z.string().optional(),
    dropdownLeftRanges: z
      .array(
        z.object({
          min: z.number().int(),
          max: z.number().int(),
          bucket: z.string(),
          label: z.string(),
        })
      )
      .optional(),
    dropdownRightLabel: z.string().optional(),
    dropdownRightRanges: z
      .array(
        z.object({
          min: z.number().int(),
          max: z.number().int(),
          bucket: z.string(),
          label: z.string(),
        })
      )
      .optional(),
    dropdownMatrix: z.record(z.record(z.string())).optional(),
    dropdownTierMatrix: z.record(z.record(z.string())).optional(),
    dropdownPairImage: z.string().optional(),
    dropdownPairImageAlt: z.string().optional(),
    dropdownMatrixTable: z
      .object({
        columns: z.array(z.string()),
        rows: z.array(
          z.object({
            label: z.string(),
            cells: z.array(z.string()),
          })
        ),
      })
      .optional(),
  })
  .refine(
    (question) => {
      if (question.type === 'dropdown') {
        return !!(question.dropdownRanges && question.dropdownRanges.length > 0);
      }
      if (question.type === 'dropdown-pair') {
        return !!(
          question.dropdownLeftRanges &&
          question.dropdownLeftRanges.length > 0 &&
          question.dropdownRightRanges &&
          question.dropdownRightRanges.length > 0 &&
          question.dropdownMatrix &&
          Object.keys(question.dropdownMatrix).length > 0
        );
      }
      return question.options.length > 0;
    },
    {
      message:
        'Dropdown questions must have at least one range and button questions must have options',
    }
  );

const DocLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
});

const BadgeSchema = z.object({
  text: z.string(),
  className: z.string(),
});

const CopyBlockSchema = z.object({
  title: z.string(),
  content: z.string(),
});

const ResultSchema = z
  .object({
    title: z.string(),
    icon: z.string(),
    badge: BadgeSchema,
    bestFor: z.array(z.string()),
    keyBenefits: z.array(z.string()),
    considerations: z.array(z.string()),
    whenNotToUse: z.array(z.string()),
    techTags: z.array(z.string()),
    searchTags: z.array(z.string()).optional(),
    docs: z.array(DocLinkSchema),
    additionalConsiderations: z.string(),
    copyBlocks: z.array(CopyBlockSchema).optional(),
  })
  .passthrough();

const ParsedSpecSchema = z.object({
  title: z.object({
    main: z.string(),
    subtitle: z.string(),
  }),
  questions: z
    .record(QuestionSchema)
    .refine((value) => Object.keys(value).length > 0, 'At least one question is required'),
  results: z
    .record(ResultSchema)
    .refine((value) => Object.keys(value).length > 0, 'At least one result is required'),
  progressSteps: z.record(z.number()),
});

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length ? issue.path.join('.') : 'spec';
      return `${path}: ${issue.message}`;
    })
    .join('\n');
}

export function validateParsedSpec(
  parsed: ParsedSpec
): { ok: true; error: null } | { ok: false; error: string } {
  const result = ParsedSpecSchema.safeParse(parsed);
  if (result.success) {
    return { ok: true, error: null };
  }

  return {
    ok: false,
    error: formatZodError(result.error),
  };
}
