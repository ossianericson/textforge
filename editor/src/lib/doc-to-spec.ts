import type { JSONContent } from '@tiptap/core';
import type {
  ParsedSpec,
  ProgressSteps,
  Question,
  QuestionMap,
  Result,
  ResultMap,
} from '@shared/types';
import {
  DOC_NODE_TYPES,
  RESULT_BULLET_SECTION_KEYS,
  RESULT_PROSE_SECTION_KEYS,
  cloneValue,
} from './doc-model';

function findChildren(node: JSONContent | undefined, type: string): JSONContent[] {
  return (node?.content ?? []).filter((child) => child.type === type);
}

function findChild(node: JSONContent | undefined, type: string): JSONContent | undefined {
  return (node?.content ?? []).find((child) => child.type === type);
}

function extractPlainText(node: JSONContent | undefined): string {
  if (!node) {
    return '';
  }
  if (typeof node.text === 'string') {
    return node.text;
  }
  return (node.content ?? []).map((child) => extractPlainText(child)).join('');
}

function applyTextMarks(
  text: string,
  marks: Array<{ type: string; attrs?: Record<string, unknown> }> = []
): string {
  return marks.reduce((value, mark) => {
    if (mark.type === 'link') {
      const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : '';
      return href ? `[${value}](${href})` : value;
    }
    if (mark.type === 'strong') {
      return `**${value}**`;
    }
    if (mark.type === 'italic') {
      return `*${value}*`;
    }
    if (mark.type === 'code') {
      return `\`${value}\``;
    }
    if (mark.type === 'strike') {
      return `~~${value}~~`;
    }
    return value;
  }, text);
}

function inlineContentToMarkdown(node: JSONContent | undefined): string {
  if (!node) {
    return '';
  }
  if (typeof node.text === 'string') {
    return applyTextMarks(
      node.text,
      (node.marks as Array<{ type: string; attrs?: Record<string, unknown> }>) ?? []
    );
  }
  if (node.type === 'hardBreak') {
    return '\n';
  }
  if (node.type === 'paragraph') {
    return (node.content ?? []).map((child) => inlineContentToMarkdown(child)).join('');
  }
  return (node.content ?? []).map((child) => inlineContentToMarkdown(child)).join('');
}

function blockContentToMarkdown(node: JSONContent | undefined): string {
  if (!node?.content?.length) {
    return '';
  }
  return node.content
    .map((child) => {
      if (child.type === 'paragraph') {
        return inlineContentToMarkdown(child);
      }
      return inlineContentToMarkdown(child);
    })
    .filter(Boolean)
    .join('\n\n');
}

function extractQuestion(node: JSONContent): {
  id: string | null;
  question: Question;
  progress: number;
} {
  const rawQuestion = cloneValue((node.attrs?.rawData ?? {}) as Question);
  const headerNode = findChild(node, DOC_NODE_TYPES.questionHeader);
  const id =
    typeof headerNode?.attrs?.questionId === 'string'
      ? headerNode.attrs.questionId
      : typeof node.attrs?.questionId === 'string'
        ? node.attrs.questionId
        : null;
  const questionType =
    typeof headerNode?.attrs?.questionType === 'string'
      ? headerNode.attrs.questionType
      : typeof node.attrs?.questionType === 'string'
        ? node.attrs.questionType
        : (rawQuestion.type ?? 'buttons');
  const progress =
    typeof headerNode?.attrs?.progressStep === 'number'
      ? headerNode.attrs.progressStep
      : typeof node.attrs?.progressStep === 'number'
        ? node.attrs.progressStep
        : 0;
  const titleNode = findChild(node, DOC_NODE_TYPES.questionTitle);
  const subtitleNode = findChild(node, DOC_NODE_TYPES.questionSubtitle);
  const infoBoxNode = findChild(node, DOC_NODE_TYPES.questionInfoBox);
  const bodyNode =
    findChild(node, DOC_NODE_TYPES.questionBody) ??
    findChild(node, DOC_NODE_TYPES.scoringMatrixBody) ??
    findChild(node, DOC_NODE_TYPES.dropdownPairBody);

  const question: Question = {
    ...rawQuestion,
    title: extractPlainText(titleNode),
    subtitle: extractPlainText(subtitleNode),
    infoBox: infoBoxNode ? extractPlainText(infoBoxNode) : null,
    type: questionType as Question['type'],
  };

  if (bodyNode) {
    if (typeof bodyNode.attrs?.dropdownLabel === 'string') {
      question.dropdownLabel = bodyNode.attrs.dropdownLabel;
    }
    if (typeof bodyNode.attrs?.sliderLabel === 'string') {
      question.sliderLabel = bodyNode.attrs.sliderLabel;
    }
    if (typeof bodyNode.attrs?.multiSelectFallback === 'string') {
      question.multiSelectFallback = bodyNode.attrs.multiSelectFallback;
    }
    if (typeof bodyNode.attrs?.dropdownLeftLabel === 'string') {
      question.dropdownLeftLabel = bodyNode.attrs.dropdownLeftLabel;
    }
    if (typeof bodyNode.attrs?.dropdownRightLabel === 'string') {
      question.dropdownRightLabel = bodyNode.attrs.dropdownRightLabel;
    }

    const dropdownMatrix = bodyNode.attrs?.dropdownMatrix as Question['dropdownMatrix'];
    if (dropdownMatrix && Object.keys(dropdownMatrix).length > 0) {
      question.dropdownMatrix = dropdownMatrix;
    }

    const dropdownTierMatrix = bodyNode.attrs?.dropdownTierMatrix as Question['dropdownTierMatrix'];
    if (dropdownTierMatrix && Object.keys(dropdownTierMatrix).length > 0) {
      question.dropdownTierMatrix = dropdownTierMatrix;
    }

    if (typeof bodyNode.attrs?.dropdownPairImage === 'string') {
      question.dropdownPairImage = bodyNode.attrs.dropdownPairImage;
    }
    if (typeof bodyNode.attrs?.dropdownPairImageAlt === 'string') {
      question.dropdownPairImageAlt = bodyNode.attrs.dropdownPairImageAlt;
    }
    if (bodyNode.attrs?.dropdownMatrixTable) {
      question.dropdownMatrixTable = bodyNode.attrs
        .dropdownMatrixTable as Question['dropdownMatrixTable'];
    }

    const categories = Array.isArray(bodyNode.attrs?.scoringMatrixCategories)
      ? (bodyNode.attrs?.scoringMatrixCategories as string[])
      : [];
    const scaleMin =
      typeof bodyNode.attrs?.scoringMatrixScaleMin === 'number'
        ? bodyNode.attrs.scoringMatrixScaleMin
        : undefined;
    const scaleMax =
      typeof bodyNode.attrs?.scoringMatrixScaleMax === 'number'
        ? bodyNode.attrs.scoringMatrixScaleMax
        : undefined;
    if (categories.length) {
      question.scoringMatrixCategories = [...categories];
    }
    if (typeof scaleMin === 'number' && typeof scaleMax === 'number') {
      question.scoringMatrixScale = { min: scaleMin, max: scaleMax };
    }

    const optionRows = findChildren(bodyNode, DOC_NODE_TYPES.optionRow);
    if (optionRows.length) {
      question.options = optionRows.map((row) => ({
        text: extractPlainText(row),
        next: typeof row.attrs?.target === 'string' ? row.attrs.target : '',
        recommended: Boolean(row.attrs?.recommended),
        advanced: Boolean(row.attrs?.advanced),
      }));
    }

    const rangeRows = findChildren(bodyNode, DOC_NODE_TYPES.rangeRow);
    if (questionType === 'dropdown') {
      question.dropdownRanges = rangeRows.map((row) => ({
        min: typeof row.attrs?.min === 'number' ? row.attrs.min : 0,
        max: typeof row.attrs?.max === 'number' ? row.attrs.max : 0,
        next: typeof row.attrs?.target === 'string' ? row.attrs.target : '',
        label: typeof row.attrs?.label === 'string' ? row.attrs.label : '',
      }));
    }
    if (questionType === 'slider') {
      question.sliderRanges = rangeRows.map((row) => ({
        min: typeof row.attrs?.min === 'number' ? row.attrs.min : 0,
        max: typeof row.attrs?.max === 'number' ? row.attrs.max : 0,
        next: typeof row.attrs?.target === 'string' ? row.attrs.target : '',
        label: typeof row.attrs?.label === 'string' ? row.attrs.label : '',
      }));
    }
    if (questionType === 'scoring-matrix') {
      question.scoringMatrixRoutes = rangeRows.map((row) => ({
        min: typeof row.attrs?.min === 'number' ? row.attrs.min : 0,
        max: typeof row.attrs?.max === 'number' ? row.attrs.max : 0,
        next: typeof row.attrs?.target === 'string' ? row.attrs.target : '',
        label: typeof row.attrs?.label === 'string' ? row.attrs.label : '',
      }));
    }
    if (questionType === 'dropdown-pair') {
      question.dropdownLeftRanges = rangeRows
        .filter((row) => row.attrs?.rangeRole === 'dropdown-pair-left')
        .map((row) => ({
          min: typeof row.attrs?.min === 'number' ? row.attrs.min : 0,
          max: typeof row.attrs?.max === 'number' ? row.attrs.max : 0,
          bucket: typeof row.attrs?.target === 'string' ? row.attrs.target : '',
          label: typeof row.attrs?.label === 'string' ? row.attrs.label : '',
        }));
      question.dropdownRightRanges = rangeRows
        .filter((row) => row.attrs?.rangeRole === 'dropdown-pair-right')
        .map((row) => ({
          min: typeof row.attrs?.min === 'number' ? row.attrs.min : 0,
          max: typeof row.attrs?.max === 'number' ? row.attrs.max : 0,
          bucket: typeof row.attrs?.target === 'string' ? row.attrs.target : '',
          label: typeof row.attrs?.label === 'string' ? row.attrs.label : '',
        }));
    }

    const toggleNode = findChild(bodyNode, DOC_NODE_TYPES.toggleBody);
    if (toggleNode) {
      question.toggleLabel =
        typeof toggleNode.attrs?.label === 'string' ? toggleNode.attrs.label : '';
      question.toggleOnNext =
        typeof toggleNode.attrs?.onTarget === 'string' ? toggleNode.attrs.onTarget : '';
      question.toggleOffNext =
        typeof toggleNode.attrs?.offTarget === 'string' ? toggleNode.attrs.offTarget : '';
    }

    const multiSelectOptions = findChildren(bodyNode, DOC_NODE_TYPES.multiSelectOption);
    if (multiSelectOptions.length) {
      question.multiSelectOptions = multiSelectOptions.map((optionNode) =>
        extractPlainText(optionNode)
      );
    }
    const multiSelectRoutes = findChildren(bodyNode, DOC_NODE_TYPES.multiSelectRoute);
    if (multiSelectRoutes.length) {
      question.multiSelectRoutes = multiSelectRoutes.map((routeNode) => ({
        values: Array.isArray(routeNode.attrs?.values)
          ? [...(routeNode.attrs?.values as string[])]
          : [],
        next: typeof routeNode.attrs?.target === 'string' ? routeNode.attrs.target : '',
      }));
    }
  }

  return { id, question, progress };
}

function extractResult(node: JSONContent): { id: string | null; result: Result } {
  const rawResult = cloneValue((node.attrs?.rawData ?? {}) as Result);
  const id = typeof node.attrs?.resultId === 'string' ? node.attrs.resultId : null;
  const headerNode = findChild(node, DOC_NODE_TYPES.resultHeader);

  const result: Result = {
    ...rawResult,
    title: extractPlainText(headerNode),
    icon: typeof headerNode?.attrs?.icon === 'string' ? headerNode.attrs.icon : rawResult.icon,
    breadcrumb:
      typeof headerNode?.attrs?.breadcrumb === 'string'
        ? headerNode.attrs.breadcrumb
        : rawResult.breadcrumb,
    badge: {
      text:
        typeof headerNode?.attrs?.badgeText === 'string'
          ? headerNode.attrs.badgeText
          : (rawResult.badge?.text ?? ''),
      className:
        typeof headerNode?.attrs?.badgeClass === 'string'
          ? headerNode.attrs.badgeClass
          : (rawResult.badge?.className ?? ''),
    },
  };

  findChildren(node, DOC_NODE_TYPES.bulletSection).forEach((sectionNode) => {
    const sectionName =
      typeof sectionNode.attrs?.sectionName === 'string' ? sectionNode.attrs.sectionName : '';
    const items = findChildren(sectionNode, DOC_NODE_TYPES.bulletItem).map((itemNode) =>
      extractPlainText(itemNode)
    );
    if (
      RESULT_BULLET_SECTION_KEYS.includes(
        sectionName as (typeof RESULT_BULLET_SECTION_KEYS)[number]
      )
    ) {
      (result as unknown as Record<string, unknown>)[sectionName] = items;
    }
  });

  findChildren(node, DOC_NODE_TYPES.proseSection).forEach((sectionNode) => {
    const sectionName =
      typeof sectionNode.attrs?.sectionName === 'string' ? sectionNode.attrs.sectionName : '';
    const value = blockContentToMarkdown(sectionNode);
    if (
      RESULT_PROSE_SECTION_KEYS.includes(sectionName as (typeof RESULT_PROSE_SECTION_KEYS)[number])
    ) {
      (result as unknown as Record<string, unknown>)[sectionName] = value;
      return;
    }
    if (sectionName === 'warning') {
      result.warning = {
        title: typeof sectionNode.attrs?.title === 'string' ? sectionNode.attrs.title : '',
        text: value,
      };
    }
  });

  const docs = findChildren(node, DOC_NODE_TYPES.docLinkRow)
    .filter((child) => child.attrs?.sectionName === 'docs')
    .map((child) => ({
      label: extractPlainText(child),
      url: typeof child.attrs?.url === 'string' ? child.attrs.url : '',
    }));
  if (docs.length) {
    result.docs = docs;
  }

  const contacts = findChildren(node, DOC_NODE_TYPES.contactRow)
    .filter((child) => child.attrs?.sectionName === 'contact')
    .map((child) => extractPlainText(child));
  if (contacts.length) {
    result.contact = contacts;
  }

  findChildren(node, DOC_NODE_TYPES.tagSection).forEach((sectionNode) => {
    const sectionName =
      typeof sectionNode.attrs?.sectionName === 'string' ? sectionNode.attrs.sectionName : '';
    const values = Array.isArray(sectionNode.attrs?.values)
      ? [...(sectionNode.attrs?.values as string[])]
      : [];
    if (sectionName === 'techTags') {
      result.techTags = values;
    }
    if (sectionName === 'searchTags') {
      result.searchTags = values;
    }
  });

  return { id, result };
}

function extractTitle(headerNode: JSONContent | undefined): ParsedSpec['title'] {
  return {
    main: typeof headerNode?.attrs?.title === 'string' ? headerNode.attrs.title : '',
    subtitle: typeof headerNode?.attrs?.subtitle === 'string' ? headerNode.attrs.subtitle : '',
  };
}

function extractMetadata(
  headerNode: JSONContent | undefined,
  existingSpec: ParsedSpec
): ParsedSpec['metadata'] {
  const version =
    typeof headerNode?.attrs?.version === 'string'
      ? headerNode.attrs.version
      : existingSpec.metadata?.version;

  const compiledAt = existingSpec.metadata?.compiledAt;
  if (!version && !compiledAt) {
    return undefined;
  }

  return {
    ...(compiledAt ? { compiledAt } : {}),
    ...(version ? { version } : {}),
  };
}

export function docToSpec(doc: JSONContent, existingSpec: ParsedSpec): ParsedSpec {
  const questions: QuestionMap = {};
  const results: ResultMap = {};
  const progressSteps: ProgressSteps = {};

  const nodes = doc.content ?? [];
  const headerNode = nodes.find((node) => node.type === DOC_NODE_TYPES.specHeader);
  const title = extractTitle(headerNode);
  const metadata = extractMetadata(headerNode, existingSpec);

  nodes.forEach((node) => {
    if (node.type === DOC_NODE_TYPES.questionBlock) {
      const { id, question, progress } = extractQuestion(node);
      if (id) {
        questions[id] = question;
        progressSteps[id] = progress;
      }
    }
    if (node.type === DOC_NODE_TYPES.resultBlock) {
      const { id, result } = extractResult(node);
      if (id) {
        results[id] = result;
      }
    }
  });

  progressSteps.result = 100;

  return {
    title: {
      main: title.main || existingSpec.title.main,
      subtitle: title.subtitle || existingSpec.title.subtitle,
    },
    metadata,
    questions,
    results,
    progressSteps,
  };
}
