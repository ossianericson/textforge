import type { JSONContent } from '@tiptap/core';
import type { ParsedSpec, Question, QuestionType, Result } from '@shared/types';

export const DOC_NODE_TYPES = {
  specDocument: 'specDocument',
  specHeader: 'specHeader',
  questionBlock: 'questionBlock',
  questionHeader: 'questionHeader',
  questionTitle: 'questionTitle',
  questionSubtitle: 'questionSubtitle',
  questionInfoBox: 'questionInfoBox',
  questionBody: 'questionBody',
  optionRow: 'optionRow',
  rangeRow: 'rangeRow',
  toggleBody: 'toggleBody',
  multiSelectOption: 'multiSelectOption',
  multiSelectRoute: 'multiSelectRoute',
  scoringMatrixBody: 'scoringMatrixBody',
  dropdownPairBody: 'dropdownPairBody',
  resultBlock: 'resultBlock',
  resultHeader: 'resultHeader',
  bulletSection: 'bulletSection',
  bulletItem: 'bulletItem',
  proseSection: 'proseSection',
  docLinkRow: 'docLinkRow',
  contactRow: 'contactRow',
  tagSection: 'tagSection',
} as const;

export const RESULT_BULLET_SECTION_KEYS = [
  'bestFor',
  'keyBenefits',
  'considerations',
  'whenNotToUse',
  'platformTechnologies',
  'recommendedWith',
  'migrationPath',
  'platformFitWarnings',
  'costProfile',
  'tierComparison',
  'networkingEssentials',
  'sharedServicesEssentials',
  'iacRequirement',
  'drTestingCadence',
  'nextSteps',
  'responsibility',
] as const;

export const RESULT_PROSE_SECTION_KEYS = [
  'additionalConsiderations',
  'overview',
  'footnote',
  'infoNote',
  'expertDetail',
] as const;

export type ResultBulletSectionKey = (typeof RESULT_BULLET_SECTION_KEYS)[number];
export type ResultProseSectionKey = (typeof RESULT_PROSE_SECTION_KEYS)[number];

export function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createTextNode(text: string): JSONContent {
  return { type: 'text', text };
}

export function createInlineTextBlock(type: string, text: string): JSONContent {
  return {
    type,
    content: text ? [createTextNode(text)] : [],
  };
}

export function createQuestionSkeleton(): Question {
  return {
    title: 'New Question',
    subtitle: '',
    infoBox: null,
    type: 'buttons',
    options: [
      {
        text: 'Add option',
        next: 'result-new-1',
        recommended: false,
        advanced: false,
      },
    ],
  };
}

export function createBlankSpec(): ParsedSpec {
  return {
    title: {
      main: 'Untitled Decision Tree',
      subtitle: 'Add the title, subtitle, and first question to start mapping the flow.',
    },
    metadata: {
      version: '0.2.0',
    },
    questions: {},
    results: {},
    progressSteps: {
      result: 100,
    },
  };
}

export function createResultSkeleton(): Result {
  return {
    title: 'New Result',
    icon: '📋',
    badge: { text: 'Support', className: 'support' },
    bestFor: ['Describe the best-fit scenario'],
    keyBenefits: ['Describe the primary benefit'],
    considerations: ['Describe an important trade-off'],
    whenNotToUse: ['Describe when to avoid this result'],
    techTags: ['General'],
    docs: [{ label: 'Documentation', url: 'https://example.com' }],
    additionalConsiderations: 'Add more context for this result.',
  };
}

export function buildNewQuestionNode(questionId = 'q-new', progressStep = 50): JSONContent {
  const rawData = createQuestionSkeleton();
  return {
    type: DOC_NODE_TYPES.questionBlock,
    attrs: {
      questionId,
      questionType: rawData.type,
      progressStep,
      rawData,
    },
    content: [
      {
        type: DOC_NODE_TYPES.questionHeader,
        attrs: {
          questionId,
          questionType: rawData.type,
          progressStep,
        },
      },
      createInlineTextBlock(DOC_NODE_TYPES.questionTitle, rawData.title),
      createInlineTextBlock(DOC_NODE_TYPES.questionSubtitle, rawData.subtitle),
      {
        type: DOC_NODE_TYPES.questionBody,
        attrs: {
          questionType: rawData.type,
        },
        content: (rawData.options ?? []).map((option) => ({
          type: DOC_NODE_TYPES.optionRow,
          attrs: {
            target: option.next,
            recommended: option.recommended,
            advanced: option.advanced,
          },
          content: option.text ? [createTextNode(option.text)] : [],
        })),
      },
    ],
  };
}

export function buildNewResultNode(resultId = 'result-new-1'): JSONContent {
  const rawData = createResultSkeleton();
  return {
    type: DOC_NODE_TYPES.resultBlock,
    attrs: {
      resultId,
      rawData,
    },
    content: [
      {
        type: DOC_NODE_TYPES.resultHeader,
        attrs: {
          icon: rawData.icon,
          badgeText: rawData.badge.text,
          badgeClass: rawData.badge.className,
        },
        content: rawData.title ? [createTextNode(rawData.title)] : [],
      },
      {
        type: DOC_NODE_TYPES.bulletSection,
        attrs: { sectionName: 'bestFor' },
        content: rawData.bestFor.map((item) =>
          createInlineTextBlock(DOC_NODE_TYPES.bulletItem, item)
        ),
      },
      {
        type: DOC_NODE_TYPES.bulletSection,
        attrs: { sectionName: 'keyBenefits' },
        content: rawData.keyBenefits.map((item) =>
          createInlineTextBlock(DOC_NODE_TYPES.bulletItem, item)
        ),
      },
      {
        type: DOC_NODE_TYPES.bulletSection,
        attrs: { sectionName: 'considerations' },
        content: rawData.considerations.map((item) =>
          createInlineTextBlock(DOC_NODE_TYPES.bulletItem, item)
        ),
      },
      {
        type: DOC_NODE_TYPES.bulletSection,
        attrs: { sectionName: 'whenNotToUse' },
        content: rawData.whenNotToUse.map((item) =>
          createInlineTextBlock(DOC_NODE_TYPES.bulletItem, item)
        ),
      },
      {
        type: DOC_NODE_TYPES.proseSection,
        attrs: { sectionName: 'additionalConsiderations' },
        content: rawData.additionalConsiderations
          ? [{ type: 'paragraph', content: [createTextNode(rawData.additionalConsiderations)] }]
          : [],
      },
      {
        type: DOC_NODE_TYPES.docLinkRow,
        attrs: { sectionName: 'docs', url: rawData.docs[0]?.url ?? '' },
        content: rawData.docs[0]?.label ? [createTextNode(rawData.docs[0].label)] : [],
      },
      {
        type: DOC_NODE_TYPES.tagSection,
        attrs: { sectionName: 'techTags', values: rawData.techTags },
      },
    ],
  };
}

export function getQuestionType(question: Question): QuestionType {
  return (question.type ?? 'buttons') as QuestionType;
}

export function buildHeaderAttrs(spec: ParsedSpec): Record<string, unknown> {
  return {
    title: spec.title.main,
    subtitle: spec.title.subtitle,
    version: spec.metadata?.version ?? '',
  };
}
