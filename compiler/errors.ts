export const ERROR_CODES = {
  SPEC_NOT_FOUND: 'DTB-001',
  TEMPLATE_NOT_FOUND: 'DTB-002',
  SPEC_INVALID: 'DTB-003',
  TEMPLATE_READ_FAILED: 'DTB-004',
  OUTPUT_WRITE_FAILED: 'DTB-005',
  NAV_VALIDATION_FAILED: 'DTB-006',
  BADGE_CONFIG_FAILED: 'DTB-007',
  RENDER_CONFIG_FAILED: 'DTB-008',
  UNKNOWN: 'DTB-999',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

interface CompilerErrorOptions {
  code?: ErrorCode;
  suggestion?: string;
  cause?: unknown;
}

export class DecisionTreeCompilerError extends Error {
  code: ErrorCode;
  suggestion: string;
  cause?: unknown;

  constructor(message: string, options: CompilerErrorOptions = {}) {
    super(message);
    this.name = 'DecisionTreeCompilerError';
    this.code = options.code || ERROR_CODES.UNKNOWN;
    this.suggestion = options.suggestion || '';
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}
