import type { JSONContent } from '@tiptap/core';
import type { ParsedSpec, Question, Result } from '@shared/types';
import {
  DOC_NODE_TYPES,
  RESULT_BULLET_SECTION_KEYS,
  RESULT_PROSE_SECTION_KEYS,
  buildHeaderAttrs,
  cloneValue,
  createInlineTextBlock,
  createTextNode,
  getQuestionType,
} from './doc-model';

function buildHeader(spec: ParsedSpec): JSONContent {
  return {
    type: DOC_NODE_TYPES.specHeader,
    attrs: buildHeaderAttrs(spec),
  };
}

function buildQuestionHeader(id: string, question: Question, spec: ParsedSpec): JSONContent {
  return {
    type: DOC_NODE_TYPES.questionHeader,
    attrs: {
      questionId: id,
      questionType: getQuestionType(question),
      progressStep: spec.progressSteps[id] ?? 0,
    },
  };
}

function buildOptionRows(question: Question): JSONContent[] {
  return (question.options ?? []).map((option) => ({
    type: DOC_NODE_TYPES.optionRow,
    attrs: {
      target: option.next,
      recommended: option.recommended,
      advanced: option.advanced,
    },
    content: option.text ? [createTextNode(option.text)] : [],
  }));
}

function buildRangeRows(
  ranges:
    | Array<{ min: number; max: number; next?: string; bucket?: string; label: string }>
    | undefined,
  rangeRole: string
): JSONContent[] {
  return (ranges ?? []).map((range) => ({
    type: DOC_NODE_TYPES.rangeRow,
    attrs: {
      min: range.min,
      max: range.max,
      target: range.next ?? range.bucket ?? '',
      label: range.label,
      rangeRole,
    },
  }));
}

function buildQuestionBody(question: Question): JSONContent {
  const questionType = getQuestionType(question);
  const commonAttrs = {
    questionType,
    dropdownLabel: question.dropdownLabel,
    sliderLabel: question.sliderLabel,
    multiSelectFallback: question.multiSelectFallback,
    scoringMatrixCategories: cloneValue(question.scoringMatrixCategories ?? []),
    scoringMatrixScaleMin: question.scoringMatrixScale?.min,
    scoringMatrixScaleMax: question.scoringMatrixScale?.max,
    dropdownLeftLabel: question.dropdownLeftLabel,
    dropdownRightLabel: question.dropdownRightLabel,
    dropdownMatrix: cloneValue(question.dropdownMatrix ?? {}),
    dropdownTierMatrix: cloneValue(question.dropdownTierMatrix ?? {}),
    dropdownPairImage: question.dropdownPairImage,
    dropdownPairImageAlt: question.dropdownPairImageAlt,
    dropdownMatrixTable: cloneValue(question.dropdownMatrixTable ?? null),
  };

  switch (questionType) {
    case 'dropdown':
      return {
        type: DOC_NODE_TYPES.questionBody,
        attrs: commonAttrs,
        content: buildRangeRows(question.dropdownRanges, 'dropdown'),
      };
    case 'slider':
      return {
        type: DOC_NODE_TYPES.questionBody,
        attrs: commonAttrs,
        content: buildRangeRows(question.sliderRanges, 'slider'),
      };
    case 'toggle':
      return {
        type: DOC_NODE_TYPES.questionBody,
        attrs: commonAttrs,
        content: [
          {
            type: DOC_NODE_TYPES.toggleBody,
            attrs: {
              label: question.toggleLabel ?? '',
              onTarget: question.toggleOnNext ?? '',
              offTarget: question.toggleOffNext ?? '',
            },
          },
        ],
      };
    case 'multi-select':
      return {
        type: DOC_NODE_TYPES.questionBody,
        attrs: commonAttrs,
        content: [
          ...(question.multiSelectOptions ?? []).map((option) =>
            createInlineTextBlock(DOC_NODE_TYPES.multiSelectOption, option)
          ),
          ...(question.multiSelectRoutes ?? []).map((route) => ({
            type: DOC_NODE_TYPES.multiSelectRoute,
            attrs: {
              values: cloneValue(route.values),
              target: route.next,
            },
          })),
        ],
      };
    case 'scoring-matrix':
      return {
        type: DOC_NODE_TYPES.scoringMatrixBody,
        attrs: commonAttrs,
        content: buildRangeRows(question.scoringMatrixRoutes, 'scoring-matrix'),
      };
    case 'dropdown-pair':
      return {
        type: DOC_NODE_TYPES.dropdownPairBody,
        attrs: commonAttrs,
        content: [
          ...buildRangeRows(question.dropdownLeftRanges, 'dropdown-pair-left'),
          ...buildRangeRows(question.dropdownRightRanges, 'dropdown-pair-right'),
        ],
      };
    case 'buttons':
    default:
      return {
        type: DOC_NODE_TYPES.questionBody,
        attrs: commonAttrs,
        content: buildOptionRows(question),
      };
  }
}

function buildQuestion(id: string, question: Question, spec: ParsedSpec): JSONContent {
  const questionType = getQuestionType(question);
  const content: JSONContent[] = [
    buildQuestionHeader(id, question, spec),
    createInlineTextBlock(DOC_NODE_TYPES.questionTitle, question.title),
    createInlineTextBlock(DOC_NODE_TYPES.questionSubtitle, question.subtitle ?? ''),
  ];

  if (question.infoBox) {
    content.push(createInlineTextBlock(DOC_NODE_TYPES.questionInfoBox, question.infoBox));
  }

  content.push(buildQuestionBody(question));

  return {
    type: DOC_NODE_TYPES.questionBlock,
    attrs: {
      questionId: id,
      questionType,
      progressStep: spec.progressSteps[id] ?? 0,
      rawData: cloneValue(question),
    },
    content,
  };
}

function buildBulletSection(sectionName: string, items: string[] | undefined): JSONContent | null {
  if (!items?.length) {
    return null;
  }

  return {
    type: DOC_NODE_TYPES.bulletSection,
    attrs: { sectionName },
    content: items.map((item) => createInlineTextBlock(DOC_NODE_TYPES.bulletItem, item)),
  };
}

function buildProseSection(sectionName: string, value: string | undefined): JSONContent | null {
  if (!value) {
    return null;
  }

  return {
    type: DOC_NODE_TYPES.proseSection,
    attrs: { sectionName },
    content: [{ type: 'paragraph', content: [createTextNode(value)] }],
  };
}

function buildDocs(result: Result): JSONContent[] {
  return (result.docs ?? []).map((doc) => ({
    type: DOC_NODE_TYPES.docLinkRow,
    attrs: {
      sectionName: 'docs',
      url: doc.url,
    },
    content: doc.label ? [createTextNode(doc.label)] : [],
  }));
}

function buildContacts(result: Result): JSONContent[] {
  return (result.contact ?? []).map((value) => ({
    type: DOC_NODE_TYPES.contactRow,
    attrs: {
      sectionName: 'contact',
    },
    content: value ? [createTextNode(value)] : [],
  }));
}

function buildTagSections(result: Result): JSONContent[] {
  const tagSections: JSONContent[] = [];
  if (result.techTags?.length) {
    tagSections.push({
      type: DOC_NODE_TYPES.tagSection,
      attrs: { sectionName: 'techTags', values: cloneValue(result.techTags) },
    });
  }
  if (result.searchTags?.length) {
    tagSections.push({
      type: DOC_NODE_TYPES.tagSection,
      attrs: { sectionName: 'searchTags', values: cloneValue(result.searchTags) },
    });
  }
  return tagSections;
}

function buildResult(id: string, result: Result): JSONContent {
  const content: JSONContent[] = [
    {
      type: DOC_NODE_TYPES.resultHeader,
      attrs: {
        icon: result.icon,
        badgeText: result.badge.text,
        badgeClass: result.badge.className,
        breadcrumb: result.breadcrumb,
      },
      content: result.title ? [createTextNode(result.title)] : [],
    },
  ];

  RESULT_BULLET_SECTION_KEYS.forEach((sectionName) => {
    const node = buildBulletSection(sectionName, result[sectionName]);
    if (node) {
      content.push(node);
    }
  });

  RESULT_PROSE_SECTION_KEYS.forEach((sectionName) => {
    const node = buildProseSection(sectionName, result[sectionName]);
    if (node) {
      content.push(node);
    }
  });

  if (result.warning) {
    content.push({
      type: DOC_NODE_TYPES.proseSection,
      attrs: { sectionName: 'warning', title: result.warning.title },
      content: result.warning.text
        ? [{ type: 'paragraph', content: [createTextNode(result.warning.text)] }]
        : [],
    });
  }

  content.push(...buildDocs(result));
  content.push(...buildContacts(result));
  content.push(...buildTagSections(result));

  return {
    type: DOC_NODE_TYPES.resultBlock,
    attrs: {
      resultId: id,
      rawData: cloneValue(result),
    },
    content,
  };
}

export function specToDoc(spec: ParsedSpec): JSONContent {
  return {
    type: DOC_NODE_TYPES.specDocument,
    content: [
      buildHeader(spec),
      ...Object.entries(spec.questions).map(([id, question]) => buildQuestion(id, question, spec)),
      ...Object.entries(spec.results).map(([id, result]) => buildResult(id, result)),
    ],
  };
}
