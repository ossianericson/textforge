import type {
  CopyBlock,
  DocLink,
  DropdownBucketRange,
  DropdownRange,
  ParsedSpec,
  ProgressSteps,
  Question,
  Result,
  ServiceConfigBlock,
} from '@shared/types';

const ARROW = '→';
const BULLET = '▸';
const EN_DASH = '–';

function quote(value: string): string {
  return `"${(value ?? '').replace(/"/g, '\\"')}"`;
}

function normalizeBadgeClassName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function assertQuestionId(id: string): void {
  if (!/^q[0-9]+[a-z]*$/.test(id)) {
    throw new Error(`Invalid question ID "${id}". Must match q[0-9]+[a-z]*.`);
  }
}

function assertResultId(id: string): void {
  if (!/^result-[a-z0-9-]+$/.test(id)) {
    throw new Error(`Invalid result ID "${id}". Must match result-[a-z0-9-]+.`);
  }
}

function assertRangesContiguous(ranges: DropdownRange[], context: string): void {
  if (ranges.length < 2) {
    return;
  }

  const sorted = [...ranges].sort((left, right) => left.min - right.min);
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]!;
    const current = sorted[index]!;
    if (current.min <= previous.max) {
      throw new Error(
        `${context}: ranges overlap: ${previous.min}${EN_DASH}${previous.max} and ${current.min}${EN_DASH}${current.max}.`
      );
    }
    if (current.min > previous.max + 1) {
      throw new Error(`${context}: gap in ranges between ${previous.max} and ${current.min}.`);
    }
  }
}

function assertBucketRangesContiguous(ranges: DropdownBucketRange[], context: string): void {
  if (ranges.length < 2) {
    return;
  }

  const sorted = [...ranges].sort((left, right) => left.min - right.min);
  const isDiscrete = sorted.every((range) => range.min === range.max);

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]!;
    const current = sorted[index]!;
    if (current.min <= previous.max) {
      throw new Error(
        `${context}: ranges overlap: ${previous.min}${EN_DASH}${previous.max} and ${current.min}${EN_DASH}${current.max}.`
      );
    }
    if (!isDiscrete && current.min > previous.max + 1) {
      throw new Error(`${context}: gap in ranges between ${previous.max} and ${current.min}.`);
    }
  }
}

function formatRange(min: number, max: number): string {
  return min === max ? `${min}` : `${min}${EN_DASH}${max}`;
}

function formatTarget(target: string): string {
  return target.startsWith('result-') ? `result: ${target}` : `go to ${target}`;
}

function sortQuestionIds(ids: string[]): string[] {
  return [...ids].sort((left, right) => {
    const leftMatch = left.match(/^q(\d+)([a-z]*)$/i);
    const rightMatch = right.match(/^q(\d+)([a-z]*)$/i);
    if (!leftMatch || !rightMatch) {
      return left.localeCompare(right);
    }
    const leftNumber = Number(leftMatch[1]);
    const rightNumber = Number(rightMatch[1]);
    if (leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }
    return (leftMatch[2] ?? '').localeCompare(rightMatch[2] ?? '');
  });
}

function pushNonEmpty(lines: string[], ...values: string[]): void {
  values.forEach((value) => {
    if (value) {
      lines.push(value);
    }
  });
}

function serializeTooltips(question: Question): string[] {
  if (!question.tooltips?.length) {
    return [];
  }
  return [
    '**Tooltips**:',
    '',
    ...question.tooltips.map((tooltip) => `- ${quote(tooltip.term)}: ${quote(tooltip.definition)}`),
    '',
  ];
}

function serializeButtonsQuestion(question: Question): string[] {
  return [
    '**Options**:',
    '',
    ...(question.options ?? []).map((option, index) => {
      const markers = [
        option.recommended ? ' *(Recommended)*' : '',
        option.advanced ? ' *(Advanced)*' : '',
      ]
        .filter(Boolean)
        .join('');
      return `${index + 1}. ${quote(option.text)}${markers} ${ARROW} ${formatTarget(option.next)}`;
    }),
    '',
  ];
}

function serializeRangesQuestion(
  header: '**Dropdown**:' | '**Slider**:',
  label: string | undefined,
  ranges: DropdownRange[],
  context: string
): string[] {
  assertRangesContiguous(ranges, context);
  const lines = [header, ''];
  if (label) {
    lines.push(`- Label: ${quote(label)}`);
  }
  ranges.forEach((range) => {
    const customLabel =
      range.label && range.label !== formatRange(range.min, range.max) ? ` (${range.label})` : '';
    lines.push(
      `- Range: ${formatRange(range.min, range.max)}${customLabel} ${ARROW} ${formatTarget(range.next)}`
    );
  });
  lines.push('');
  return lines;
}

function serializeDropdownPairQuestion(question: Question, id: string): string[] {
  const lines = ['**Type**: dropdown-pair'];
  const leftRanges = question.dropdownLeftRanges ?? [];
  const rightRanges = question.dropdownRightRanges ?? [];
  assertBucketRangesContiguous(leftRanges, `Dropdown-pair question "${id}" left bucket ranges`);
  assertBucketRangesContiguous(rightRanges, `Dropdown-pair question "${id}" right bucket ranges`);

  if (question.dropdownPairImage) {
    lines.push(`**Matrix Image**: ${quote(question.dropdownPairImage)}`);
  }
  if (question.dropdownPairImageAlt) {
    lines.push(`**Matrix Image Alt**: ${quote(question.dropdownPairImageAlt)}`);
  }

  const serializeBucketSection = (
    sectionTitle: string,
    sectionLabel: string | undefined,
    ranges: DropdownBucketRange[]
  ) => {
    lines.push(sectionTitle, '');
    if (sectionLabel) {
      lines.push(`- Label: ${quote(sectionLabel)}`);
    }
    ranges.forEach((range) => {
      const customLabel =
        range.label && range.label !== formatRange(range.min, range.max) ? ` (${range.label})` : '';
      lines.push(
        `- Range: ${formatRange(range.min, range.max)}${customLabel} ${ARROW} bucket: ${range.bucket}`
      );
    });
    lines.push('');
  };

  serializeBucketSection('**Dropdown Left**:', question.dropdownLeftLabel, leftRanges);
  serializeBucketSection('**Dropdown Right**:', question.dropdownRightLabel, rightRanges);

  if (question.dropdownMatrix && Object.keys(question.dropdownMatrix).length > 0) {
    lines.push('**Matrix**:', '');
    Object.entries(question.dropdownMatrix).forEach(([leftBucket, row]) => {
      Object.entries(row ?? {}).forEach(([rightBucket, target]) => {
        lines.push(`- ${leftBucket} + ${rightBucket} ${ARROW} ${formatTarget(target)}`);
      });
    });
    lines.push('');
  }

  if (question.dropdownTierMatrix && Object.keys(question.dropdownTierMatrix).length > 0) {
    lines.push('**Tier Matrix**:', '');
    Object.entries(question.dropdownTierMatrix).forEach(([leftBucket, row]) => {
      Object.entries(row ?? {}).forEach(([rightBucket, tier]) => {
        lines.push(`- ${leftBucket} + ${rightBucket} ${ARROW} tier: ${tier}`);
      });
    });
    lines.push('');
  }

  if (question.dropdownMatrixTable) {
    lines.push('**Matrix Table**:', '');
    lines.push(`- Columns: ${question.dropdownMatrixTable.columns.join(' | ')}`);
    question.dropdownMatrixTable.rows.forEach((row) => {
      lines.push(`- Row: ${row.label} | ${row.cells.join(' | ')}`);
    });
    lines.push('');
  }

  return lines;
}

function serializeQuestion(id: string, question: Question): string {
  assertQuestionId(id);
  const lines: string[] = [];
  lines.push(`### ${id.replace(/^q/i, 'Q')}: ${question.title} (id=${quote(id)})`, '');
  lines.push(`**Title**: ${quote(question.title)}`);
  lines.push(`**Subtitle**: ${quote(question.subtitle ?? '')}`);
  if (question.infoBox) {
    lines.push(`**Info Box**: ${quote(question.infoBox)}`);
  }
  if (question.contextCapture) {
    lines.push(
      `**Context Capture**: ${question.contextCapture.key} = {${question.contextCapture.from}}`
    );
  }
  lines.push('');
  lines.push(...serializeTooltips(question));

  const type = question.type ?? 'buttons';
  switch (type) {
    case 'dropdown':
      lines.push('**Type**: dropdown');
      lines.push(
        ...serializeRangesQuestion(
          '**Dropdown**:',
          question.dropdownLabel,
          question.dropdownRanges ?? [],
          `Dropdown question "${id}"`
        )
      );
      break;
    case 'dropdown-pair':
      lines.push(...serializeDropdownPairQuestion(question, id));
      break;
    case 'slider':
      lines.push('**Type**: slider');
      lines.push(
        ...serializeRangesQuestion(
          '**Slider**:',
          question.sliderLabel,
          question.sliderRanges ?? [],
          `Slider question "${id}"`
        )
      );
      break;
    case 'toggle':
      if (!question.toggleOnNext || !question.toggleOffNext) {
        throw new Error(`Toggle question "${id}" must have both toggleOnNext and toggleOffNext.`);
      }
      lines.push('**Type**: toggle');
      lines.push(`**Label**: ${quote(question.toggleLabel ?? 'Toggle')}`);
      lines.push(`**On** ${ARROW} ${formatTarget(question.toggleOnNext)}`);
      lines.push(`**Off** ${ARROW} ${formatTarget(question.toggleOffNext)}`);
      lines.push('');
      break;
    case 'multi-select':
      if (!question.multiSelectFallback) {
        throw new Error(`Multi-select question "${id}" must have a multiSelectFallback.`);
      }
      lines.push('**Type**: multi-select');
      lines.push('**Options**:', '');
      (question.multiSelectOptions ?? []).forEach((option, index) => {
        lines.push(`${index + 1}. ${quote(option)}`);
      });
      lines.push('', '**Routes**:', '');
      (question.multiSelectRoutes ?? []).forEach((route) => {
        lines.push(
          `- ${route.values.map((value) => quote(value)).join(' + ')} ${ARROW} ${formatTarget(route.next)}`
        );
      });
      lines.push(`- fallback ${ARROW} ${formatTarget(question.multiSelectFallback)}`);
      lines.push('');
      break;
    case 'scoring-matrix':
      assertRangesContiguous(question.scoringMatrixRoutes ?? [], `Scoring matrix question "${id}"`);
      lines.push('**Type**: scoring-matrix');
      lines.push(`**Categories**: ${(question.scoringMatrixCategories ?? []).join(', ')}`);
      lines.push(
        `**Scale**: ${question.scoringMatrixScale?.min ?? 1}${EN_DASH}${question.scoringMatrixScale?.max ?? 5}`
      );
      lines.push('**Routes**:', '');
      (question.scoringMatrixRoutes ?? []).forEach((range) => {
        lines.push(
          `- Range: ${formatRange(range.min, range.max)} ${ARROW} ${formatTarget(range.next)}`
        );
      });
      lines.push('');
      break;
    default:
      lines.push(...serializeButtonsQuestion(question));
      break;
  }

  lines.push('---', '');
  return lines.join('\n');
}

function ensureRequiredResult(id: string, result: Result): void {
  assertResultId(id);
  if (!result.title.trim()) {
    throw new Error(`Result "${id}" is missing a title.`);
  }
  if (!result.icon.trim()) {
    throw new Error(`Result "${id}" is missing an icon.`);
  }
  if (!result.badge?.text?.trim()) {
    throw new Error(`Result "${id}" is missing a badge text.`);
  }
  if (
    !result.bestFor.length ||
    !result.keyBenefits.length ||
    !result.considerations.length ||
    !result.whenNotToUse.length
  ) {
    throw new Error(`Result "${id}" is missing one or more required list sections.`);
  }
  if (!result.techTags.length) {
    throw new Error(`Result "${id}" must include at least one tech tag.`);
  }
  if (!result.additionalConsiderations.trim()) {
    throw new Error(`Result "${id}" is missing Additional Considerations.`);
  }
}

function serializeBulletSection(title: string, items: string[] | undefined): string[] {
  if (!items?.length) {
    return [];
  }
  return [`**${title}:**`, '', ...items.map((item) => `${BULLET} ${item}`), ''];
}

function serializeDashSection(title: string, items: string[] | undefined): string[] {
  if (!items?.length) {
    return [];
  }
  return [`**${title}:**`, '', ...items.map((item) => `- ${item}`), ''];
}

function serializeDocs(docs: DocLink[]): string[] {
  if (!docs.length) {
    return [];
  }
  return ['**Docs:**', '', ...docs.map((doc) => `- ${doc.label}: ${doc.url}`), ''];
}

function serializeServiceConfigs(
  title: string,
  blocks: ServiceConfigBlock[] | undefined
): string[] {
  if (!blocks?.length) {
    return [];
  }
  const lines = [`**${title}:**`, ''];
  blocks.forEach((block) => {
    lines.push(`**[${block.name}]:**`);
    block.items.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  });
  return lines;
}

function serializeCopyBlocks(copyBlocks: CopyBlock[] | undefined): string[] {
  if (!copyBlocks?.length) {
    return [];
  }
  const lines: string[] = [];
  copyBlocks.forEach((block) => {
    lines.push(`**Copy Block: ${block.title}**`);
    block.content.split(/\r?\n/).forEach((line) => lines.push(line));
    lines.push('');
  });
  return lines;
}

function serializeResult(index: number, id: string, result: Result): string {
  ensureRequiredResult(id, result);
  const lines: string[] = [];
  lines.push(`#### ${index}. ${result.title} (${id})`, '');
  lines.push(`- Icon: ${result.icon}`);
  const badgeClassName =
    result.badge.className?.trim() || normalizeBadgeClassName(result.badge.text);
  lines.push(`- Badge: ${result.badge.text} (${badgeClassName})`, '');

  if (result.breadcrumb) {
    lines.push(`**Breadcrumb:** ${result.breadcrumb}`, '');
  }
  if (result.overview) {
    lines.push(`**Overview:** ${result.overview}`, '');
  }

  lines.push(...serializeBulletSection('Best For', result.bestFor));
  lines.push(...serializeBulletSection('Key Benefits', result.keyBenefits));
  lines.push(...serializeBulletSection('Platform Technologies', result.platformTechnologies));
  lines.push(...serializeBulletSection('Recommended With', result.recommendedWith));
  lines.push(...serializeBulletSection('Migration Path', result.migrationPath));
  lines.push(...serializeBulletSection('Considerations', result.considerations));
  lines.push(...serializeBulletSection('When NOT to use', result.whenNotToUse));
  lines.push(...serializeBulletSection('Platform Fit Warnings', result.platformFitWarnings));
  lines.push(...serializeBulletSection('Cost Profile', result.costProfile));
  lines.push(...serializeBulletSection('Tier Comparison', result.tierComparison));
  lines.push(...serializeBulletSection('Networking Essentials', result.networkingEssentials));
  lines.push(
    ...serializeBulletSection('Shared Services Essentials', result.sharedServicesEssentials)
  );
  lines.push(...serializeBulletSection('IaC Requirement', result.iacRequirement));
  lines.push(...serializeBulletSection('DR Testing Cadence', result.drTestingCadence));
  lines.push(...serializeBulletSection('Next Steps', result.nextSteps));

  lines.push(`**Tech Tags:** ${result.techTags.join(', ')}`, '');
  if (result.searchTags?.length) {
    lines.push(`**Search Tags:** ${result.searchTags.join(', ')}`, '');
  }

  lines.push(...serializeDocs(result.docs));

  pushNonEmpty(
    lines,
    `**Additional Considerations:** ${result.additionalConsiderations.split(/\r?\n/)[0] ?? ''}`
  );
  if (result.additionalConsiderations.includes('\n')) {
    result.additionalConsiderations
      .split(/\r?\n/)
      .slice(1)
      .forEach((line) => lines.push(line));
  }
  lines.push('');

  lines.push(
    ...serializeServiceConfigs('Data Service DR Configuration', result.dataServiceConfigs)
  );
  lines.push(
    ...serializeServiceConfigs('Compute Platform DR Configuration', result.computePlatformConfigs)
  );

  if (result.responsibility?.length) {
    lines.push('**Responsibility Model & Contact:**', '');
    result.responsibility.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }
  if (result.supportSection) {
    lines.push(`**Support Section - ${result.supportSection.title}:**`, '');
    result.supportSection.lines.forEach((line) => lines.push(`- ${line}`));
    lines.push('');
  }
  lines.push(...serializeDashSection('Contact', result.contact));

  if (result.warning) {
    lines.push(`**WARNING:** ${result.warning.title}`);
    lines.push(result.warning.text, '');
  }
  if (result.infoNote) {
    lines.push(`**Note:** ${result.infoNote}`, '');
  }
  if (result.expertDetail) {
    lines.push(`**Expert Detail:** ${result.expertDetail}`, '');
  }
  if (result.footnote) {
    lines.push(`**Footnote:** ${result.footnote}`, '');
  }

  lines.push(...serializeCopyBlocks(result.copyBlocks));
  lines.push('---', '');
  return lines.join('\n');
}

function normalizeProgressSteps(steps: ProgressSteps, questionIds: string[]): ProgressSteps {
  const normalized: ProgressSteps = { ...steps, result: 100 };
  if (questionIds.includes('q1')) {
    normalized.q1 = 0;
  }
  return normalized;
}

function serializeProgressSteps(steps: ProgressSteps, questionIds: string[]): string {
  const normalized = normalizeProgressSteps(steps, questionIds);
  const orderedIds = [
    ...sortQuestionIds(questionIds),
    ...Object.keys(normalized)
      .filter((id) => id !== 'result' && !questionIds.includes(id))
      .sort(),
    'result',
  ].filter((id, index, array) => array.indexOf(id) === index && id in normalized);

  return [
    '```javascript',
    'const progressSteps = {',
    ...orderedIds.map((id) => `  ${id}: ${normalized[id]},`),
    '};',
    '```',
  ].join('\n');
}

export function serialize(spec: ParsedSpec): string {
  const questionIds = sortQuestionIds(Object.keys(spec.questions));
  const resultIds = Object.keys(spec.results);
  const lines: string[] = [];

  lines.push(`# ${spec.title.main || 'Untitled Decision Tree'}`, '');
  if (spec.metadata?.version) {
    lines.push(`**Version:** ${spec.metadata.version}`);
  }
  if (spec.metadata?.compiledAt) {
    lines.push(`**Date:** ${spec.metadata.compiledAt}`);
  }
  lines.push('---', '', '## Requirements and Standards', '', '### Title', '');
  lines.push(`**Main:** ${quote(spec.title.main)}`);
  lines.push(
    `**Subtitle:** ${quote(spec.title.subtitle ?? '')}`,
    '',
    '---',
    '',
    '## Decision Tree Flow',
    ''
  );

  questionIds.forEach((id) => {
    lines.push(serializeQuestion(id, spec.questions[id]!));
  });

  lines.push(`## Result Cards (${resultIds.length} Services)`, '');
  resultIds.forEach((id, index) => {
    lines.push(serializeResult(index + 1, id, spec.results[id]!));
  });

  lines.push('## Progress Steps', '');
  lines.push(serializeProgressSteps(spec.progressSteps, questionIds), '');

  return lines.join('\n');
}
