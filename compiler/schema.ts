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
    type: z
      .enum([
        'buttons',
        'dropdown',
        'dropdown-pair',
        'slider',
        'multi-select',
        'toggle',
        'scoring-matrix',
      ])
      .optional()
      .default('buttons'),
    options: z.array(OptionSchema),
    contextCapture: z
      .object({
        key: z.string(),
        from: z.enum(['optionText']).optional().default('optionText'),
      })
      .optional(),
    tooltips: z
      .array(
        z.object({
          term: z.string(),
          definition: z.string(),
        })
      )
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
    sliderLabel: z.string().optional(),
    sliderRanges: z
      .array(
        z.object({
          min: z.number().int(),
          max: z.number().int(),
          next: z.string(),
          label: z.string(),
        })
      )
      .optional(),
    multiSelectOptions: z.array(z.string()).optional(),
    multiSelectRoutes: z
      .array(
        z.object({
          values: z.array(z.string()),
          next: z.string(),
        })
      )
      .optional(),
    multiSelectFallback: z.string().optional(),
    toggleLabel: z.string().optional(),
    toggleOnNext: z.string().optional(),
    toggleOffNext: z.string().optional(),
    scoringMatrixCategories: z.array(z.string()).optional(),
    scoringMatrixScale: z
      .object({
        min: z.number().int(),
        max: z.number().int(),
      })
      .optional(),
    scoringMatrixRoutes: z
      .array(
        z.object({
          min: z.number().int(),
          max: z.number().int(),
          next: z.string(),
          label: z.string(),
        })
      )
      .optional(),
  })
  .superRefine((question, context) => {
    const validateRangeSet = (
      ranges:
        | Array<{
            min: number;
            max: number;
          }>
        | undefined,
      path: string,
      label: string
    ) => {
      if (!ranges || !ranges.length) {
        return;
      }

      const sorted = [...ranges].sort((left, right) => left.min - right.min);
      const discrete = sorted.every((range) => range.min === range.max);

      sorted.forEach((range, index) => {
        if (range.min > range.max) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [path, index],
            message: `${label} range min cannot exceed max.`,
          });
        }
      });

      for (let index = 1; index < sorted.length; index += 1) {
        const previous = sorted[index - 1];
        const current = sorted[index];
        if (!previous || !current) {
          continue;
        }

        if (current.min <= previous.max) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [path, index],
            message: `${label} ranges must not overlap.`,
          });
          continue;
        }

        if (!discrete && current.min !== previous.max + 1) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [path, index],
            message: `${label} ranges must be contiguous unless all ranges are single values.`,
          });
        }
      }
    };

    const ensureUniqueStrings = (values: string[] | undefined, path: string, message: string) => {
      if (!values || !values.length) {
        return;
      }
      const normalized = values.map((value) => value.trim().toLowerCase());
      if (new Set(normalized).size !== normalized.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message,
        });
      }
    };

    validateRangeSet(question.dropdownRanges, 'dropdownRanges', 'Dropdown');
    validateRangeSet(question.dropdownLeftRanges, 'dropdownLeftRanges', 'Dropdown-pair left');
    validateRangeSet(question.dropdownRightRanges, 'dropdownRightRanges', 'Dropdown-pair right');
    validateRangeSet(question.sliderRanges, 'sliderRanges', 'Slider');
    validateRangeSet(question.scoringMatrixRoutes, 'scoringMatrixRoutes', 'Scoring matrix');

    ensureUniqueStrings(
      question.multiSelectOptions,
      'multiSelectOptions',
      'Multi-select options must be unique.'
    );
    ensureUniqueStrings(
      question.scoringMatrixCategories,
      'scoringMatrixCategories',
      'Scoring matrix categories must be unique.'
    );

    if (question.tooltips) {
      ensureUniqueStrings(
        question.tooltips.map((tooltip) => tooltip.term),
        'tooltips',
        'Tooltip terms must be unique within a question.'
      );
    }

    if (question.type === 'dropdown') {
      if (!(question.dropdownRanges && question.dropdownRanges.length > 0)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dropdown questions must have at least one range.',
        });
      }
      return;
    }

    if (question.type === 'dropdown-pair') {
      if (
        !(
          question.dropdownLeftRanges &&
          question.dropdownLeftRanges.length > 0 &&
          question.dropdownRightRanges &&
          question.dropdownRightRanges.length > 0 &&
          question.dropdownMatrix &&
          Object.keys(question.dropdownMatrix).length > 0
        )
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Dropdown questions must have at least one range and button questions must have options',
        });
      }
      return;
    }

    if (question.type === 'slider') {
      if (!(question.sliderRanges && question.sliderRanges.length > 0)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Slider questions must have at least one range.',
        });
      }
      return;
    }

    if (question.type === 'multi-select') {
      if (!(question.multiSelectOptions && question.multiSelectOptions.length > 0)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Multi-select questions must declare at least one option.',
        });
      }
      if (!(question.multiSelectRoutes && question.multiSelectRoutes.length > 0)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Multi-select questions must declare at least one route.',
        });
      }
      if (!question.multiSelectFallback) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Multi-select questions must declare a fallback route.',
        });
      }

      const allowedOptions = new Set(
        (question.multiSelectOptions || []).map((value) => value.trim().toLowerCase())
      );
      const routeKeys = new Set<string>();
      (question.multiSelectRoutes || []).forEach((route, index) => {
        if (!route.values.length) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['multiSelectRoutes', index],
            message: 'Multi-select routes must match at least one option.',
          });
          return;
        }

        const normalized = route.values.map((value) => value.trim().toLowerCase()).sort();
        const key = normalized.join('||');
        if (routeKeys.has(key)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['multiSelectRoutes', index],
            message: 'Multi-select routes must not duplicate the same exact option set.',
          });
        }
        routeKeys.add(key);

        normalized.forEach((value) => {
          if (!allowedOptions.has(value)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['multiSelectRoutes', index],
              message: `Multi-select route references unknown option: ${value}`,
            });
          }
        });
      });
      return;
    }

    if (question.type === 'toggle') {
      if (!question.toggleLabel || !question.toggleLabel.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Toggle questions must declare a label.',
        });
      }
      if (!question.toggleOnNext || !question.toggleOffNext) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Toggle questions must declare both On and Off routes.',
        });
      }
      return;
    }

    if (question.type === 'scoring-matrix') {
      if (!(question.scoringMatrixCategories && question.scoringMatrixCategories.length > 0)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Scoring-matrix questions must declare at least one category.',
        });
      }
      if (
        !question.scoringMatrixScale ||
        question.scoringMatrixScale.min >= question.scoringMatrixScale.max
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Scoring-matrix questions must declare a valid integer scale.',
        });
      }
      if (!(question.scoringMatrixRoutes && question.scoringMatrixRoutes.length > 0)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Scoring-matrix questions must declare at least one route range.',
        });
      }
      if (
        question.scoringMatrixCategories &&
        question.scoringMatrixScale &&
        question.scoringMatrixRoutes
      ) {
        const theoreticalMin =
          question.scoringMatrixCategories.length * question.scoringMatrixScale.min;
        const theoreticalMax =
          question.scoringMatrixCategories.length * question.scoringMatrixScale.max;
        question.scoringMatrixRoutes.forEach((range, index) => {
          if (range.min < theoreticalMin || range.max > theoreticalMax) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['scoringMatrixRoutes', index],
              message: `Scoring-matrix route range must stay within ${theoreticalMin}-${theoreticalMax}.`,
            });
          }
        });
      }
      return;
    }

    if (question.options.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Dropdown questions must have at least one range and button questions must have options',
      });
    }
  });

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
    expertDetail: z.string().optional(),
  })
  .passthrough();

const ParsedSpecSchema = z.object({
  title: z.object({
    main: z.string(),
    subtitle: z.string(),
  }),
  metadata: z
    .object({
      version: z.string().optional(),
      compiledAt: z.string().optional(),
    })
    .optional(),
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
