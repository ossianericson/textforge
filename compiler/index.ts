import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import { validateParsedSpec } from './schema.js';
import { buildBadgeCss, loadBadgeConfig } from './badges.js';
import { parseSpecFile } from './parsers/index.js';
import { applyBadgeClasses } from './parsers/badge-resolver.js';
import { loadTopicRenderConfig, resolveRendererTemplatePath } from './renderers/registry.js';
import { escapeHtml, sanitizeUrl } from './utils/sanitize.js';
import { DecisionTreeCompilerError, ERROR_CODES } from './errors.js';
import type { ErrorCode } from './errors.js';
import { getConfig } from '#config';
import { createLogger } from '#logger';
import { buildTopicOutputName, parseArgs, resolveTopic } from './cli-utils.js';
import type { DocLink, ParsedSpec, QuestionMap, ResultMap, SupportSection } from './types.js';

const logger = createLogger({ component: 'compiler' });

const SEARCH_TOPICS = new Set(['azure-troubleshooting']);
const SEARCH_LABEL = 'Search: Azure Troubleshooting Decision Tree';
const SEARCH_PLACEHOLDER = 'Search services... (e.g., PostgreSQL, Redis, ETL)';

interface CompileOptions {
  specPath: string;
  templatePath?: string;
  outputPath: string;
  promptPath?: string;
}

function resolveCompileDate(): string {
  const explicitDate = process.env.DTB_COMPILE_DATE?.trim();
  if (explicitDate) {
    return explicitDate;
  }

  const sourceDateEpoch = process.env.SOURCE_DATE_EPOCH?.trim();
  if (sourceDateEpoch && /^\d+$/.test(sourceDateEpoch)) {
    return new Date(Number(sourceDateEpoch) * 1000).toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizeId(id: unknown): string {
  return (id ?? '').toString().toLowerCase().trim();
}

function validateSpec(parsed: ParsedSpec): string[] {
  const warnings: string[] = [];
  const questions = parsed.questions || {};
  const results = parsed.results || {};
  const questionIds = new Set(Object.keys(questions).map(normalizeId));
  const resultIds = new Set(Object.keys(results).map(normalizeId));
  const tierValues = ['critical', 'high', 'medium', 'low'];

  const resolveDynamicTargets = (target: string): string[] => {
    if (!target.includes('{tier}')) {
      return [target];
    }
    return tierValues.map((tier) => target.replace('{tier}', tier));
  };

  const collectQuestionTargets = (question: ParsedSpec['questions'][string]): string[] => {
    const targets = (question.options || []).map((option) => option.next);
    (question.dropdownRanges || []).forEach((range) => targets.push(range.next));
    (question.sliderRanges || []).forEach((range) => targets.push(range.next));
    (question.scoringMatrixRoutes || []).forEach((range) => targets.push(range.next));
    (question.multiSelectRoutes || []).forEach((route) => targets.push(route.next));
    if (question.multiSelectFallback) {
      targets.push(question.multiSelectFallback);
    }
    if (question.toggleOnNext) {
      targets.push(question.toggleOnNext);
    }
    if (question.toggleOffNext) {
      targets.push(question.toggleOffNext);
    }

    Object.values(question.dropdownMatrix || {}).forEach((row) => {
      Object.values(row || {}).forEach((target) => {
        targets.push(target);
      });
    });

    return targets;
  };

  Object.entries(questions).forEach(([questionId, question]) => {
    collectQuestionTargets(question).forEach((rawTarget) => {
      const target = normalizeId(rawTarget);
      const candidates = resolveDynamicTargets(target).map(normalizeId);
      const exists = candidates.some(
        (candidate) => questionIds.has(candidate) || resultIds.has(candidate)
      );
      if (!exists) {
        warnings.push(`Missing target id "${rawTarget}" referenced from question "${questionId}".`);
      }
    });
  });

  const progress = parsed.progressSteps || {};
  if (progress.result !== 100) {
    warnings.push('Progress steps should end at 100% for "result".');
  }
  if (Object.values(progress).length && progress.q1 !== 0) {
    warnings.push('Progress steps should start at 0% for "q1".');
  }

  return warnings;
}

function failOnWarnings(warnings: string[]): void {
  if (!warnings.length) {
    return;
  }

  const details = warnings.map((warning) => `- ${warning}`).join('\n');
  throw new DecisionTreeCompilerError(`Spec validation warnings:\n${details}`, {
    code: ERROR_CODES.NAV_VALIDATION_FAILED,
    suggestion: 'Fix navigation targets and progress steps, then re-run the compiler.',
  });
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

function buildSections(result: ResultMap[string]) {
  const sections: Array<Record<string, unknown>> = [];
  const addList = (title: string, items: string[] | undefined, type = 'list') => {
    if (Array.isArray(items) && items.length) {
      sections.push({ type, title, items });
    }
  };
  const addOrdered = (title: string, items: string[] | undefined) => {
    if (Array.isArray(items) && items.length) {
      sections.push({ type: 'ordered', title, items });
    }
  };
  const addWarning = (title: string, items: string[] | undefined) => {
    if (Array.isArray(items) && items.length) {
      sections.push({ type: 'warning', title, items });
    }
  };
  const addServiceConfig = (
    title: string,
    configs:
      | ResultMap[string]['dataServiceConfigs']
      | ResultMap[string]['computePlatformConfigs']
      | undefined,
    contextKey: string
  ) => {
    if (Array.isArray(configs) && configs.length) {
      sections.push({ type: 'service-config', title, configs, contextKey });
    }
  };

  addList('Best For', result.bestFor);
  addList('Key Benefits', result.keyBenefits);
  addList('Platform Technologies', result.platformTechnologies);
  addList('Recommended With', result.recommendedWith);
  addList('Migration Path', result.migrationPath);
  addServiceConfig('Data Service DR Configuration', result.dataServiceConfigs, 'dataService');
  addServiceConfig(
    'Compute Platform DR Configuration',
    result.computePlatformConfigs,
    'computeService'
  );

  const hasPlatformWarnings =
    (Array.isArray(result.platformFitWarnings) && result.platformFitWarnings.length) ||
    (Array.isArray(result.dataServiceConfigs) && result.dataServiceConfigs.length) ||
    (Array.isArray(result.computePlatformConfigs) && result.computePlatformConfigs.length);
  if (hasPlatformWarnings) {
    sections.push({
      type: 'platform-warnings',
      title: 'Platform Fit Warnings',
      items: Array.isArray(result.platformFitWarnings) ? result.platformFitWarnings : [],
    });
  }

  addList('Cost Profile', result.costProfile, 'html-list');
  addList('Tier Comparison', result.tierComparison, 'html-list');
  addList('Networking Essentials', result.networkingEssentials, 'html-list');
  addList('Shared Services Essentials', result.sharedServicesEssentials, 'html-list');
  addList('IaC Requirement', result.iacRequirement);
  addList('DR Testing Cadence', result.drTestingCadence);
  addList('Considerations', result.considerations);
  addWarning('When NOT to use', result.whenNotToUse);
  addOrdered('Next Steps', result.nextSteps);

  return sections;
}

const LEGACY_RESULT_FIELDS = new Set([
  'bestFor',
  'keyBenefits',
  'platformTechnologies',
  'recommendedWith',
  'migrationPath',
  'dataServiceConfigs',
  'computePlatformConfigs',
  'platformFitWarnings',
  'costProfile',
  'tierComparison',
  'networkingEssentials',
  'sharedServicesEssentials',
  'iacRequirement',
  'drTestingCadence',
  'considerations',
  'whenNotToUse',
  'nextSteps',
]);

type ResultRecord = Record<string, ResultMap[string]>;

function stripLegacyResultFields(result: ResultMap[string]) {
  const trimmed = { ...result } as ResultRecord[string] & Record<string, unknown>;
  LEGACY_RESULT_FIELDS.forEach((field) => {
    if (field in trimmed) {
      delete trimmed[field];
    }
  });
  return trimmed;
}

function sanitizeLinks(links: DocLink[] | undefined): DocLink[] {
  if (!Array.isArray(links)) {
    return [];
  }
  return links.map((link) => ({ ...link, url: sanitizeUrl(link.url) }));
}

function sanitizeSupportSection(section: SupportSection | undefined): SupportSection | undefined {
  if (!section) {
    return section;
  }
  return { ...section, links: sanitizeLinks(section.links) };
}

function sanitizeQuestions(questions: QuestionMap): QuestionMap {
  return Object.fromEntries(
    Object.entries(questions || {}).map(([id, question]) => [
      id,
      {
        ...question,
        ...(question.dropdownPairImage
          ? { dropdownPairImage: sanitizeUrl(question.dropdownPairImage) }
          : {}),
      },
    ])
  );
}

function sanitizeResults(results: ResultMap): ResultMap {
  return Object.fromEntries(
    Object.entries(results || {}).map(([id, result]) => [
      id,
      {
        ...result,
        docs: sanitizeLinks(result.docs),
        responsibilityLinks: sanitizeLinks(result.responsibilityLinks),
        supportSection: sanitizeSupportSection(result.supportSection),
      },
    ])
  ) as ResultMap;
}

function sanitizeParsedSpec(parsed: ParsedSpec): ParsedSpec {
  return {
    ...parsed,
    questions: sanitizeQuestions(parsed.questions || {}),
    results: sanitizeResults(parsed.results || {}),
  };
}

function addSectionsToResults(results: ResultMap): ResultMap {
  return Object.fromEntries(
    Object.entries(results || {}).map(([id, result]) => [
      id,
      { ...stripLegacyResultFields(result), sections: buildSections(result) },
    ])
  ) as ResultMap;
}

function compileDecisionTree({ specPath, templatePath, outputPath }: CompileOptions): void {
  const config = getConfig();
  const topic = path.basename(path.dirname(specPath || ''));
  const searchEnabled = SEARCH_TOPICS.has(topic);
  const renderConfig = loadTopicRenderConfig(specPath, config.defaultRenderer);
  const resolvedTemplatePath = templatePath
    ? path.resolve(templatePath)
    : resolveRendererTemplatePath(renderConfig.renderer, config.rootDir);
  if (!specPath || !fs.existsSync(specPath)) {
    throw new DecisionTreeCompilerError(`Spec file not found: ${specPath}`, {
      code: ERROR_CODES.SPEC_NOT_FOUND,
      suggestion: 'Ensure the spec path exists, for example decision-trees/<topic>/spec.md.',
    });
  }

  if (!resolvedTemplatePath || !fs.existsSync(resolvedTemplatePath)) {
    throw new DecisionTreeCompilerError(`Template file not found: ${resolvedTemplatePath}`, {
      code: ERROR_CODES.TEMPLATE_NOT_FOUND,
      suggestion: 'Check the template path or pass --template with a valid file.',
    });
  }

  let parsed: ParsedSpec | null = null;
  try {
    parsed = parseSpecFile(specPath);
  } catch (error) {
    throw new DecisionTreeCompilerError(`Failed to parse spec: ${specPath}`, {
      code: ERROR_CODES.SPEC_INVALID,
      suggestion: 'Check Decision Tree Flow and Result Cards sections for required structure.',
      cause: error,
    });
  }

  parsed = sanitizeParsedSpec(parsed);
  parsed.metadata = {
    ...(parsed.metadata || {}),
    compiledAt: resolveCompileDate(),
  };

  const validation = validateParsedSpec(parsed);
  if (!validation.ok) {
    throw new DecisionTreeCompilerError('Parsed spec failed validation.', {
      code: ERROR_CODES.SPEC_INVALID,
      suggestion: validation.error ?? '',
    });
  }

  const badgePath = config.badgePath;
  if (!fs.existsSync(badgePath)) {
    throw new DecisionTreeCompilerError(`Badge config not found: ${badgePath}`, {
      code: ERROR_CODES.BADGE_CONFIG_FAILED,
      suggestion: 'Restore core/badges.yml or update the path.',
    });
  }

  let badgeCss = '';
  let badgeConfig: Record<string, string> | null = null;
  try {
    badgeConfig = loadBadgeConfig(badgePath);
    badgeCss = buildBadgeCss(badgeConfig);
  } catch (error) {
    throw new DecisionTreeCompilerError('Failed to load badge config.', {
      code: ERROR_CODES.BADGE_CONFIG_FAILED,
      suggestion: 'Validate core/badges.yml is a map of badge names to colors.',
      cause: error,
    });
  }

  applyBadgeClasses(parsed.results, badgeCss);
  const usedBadgeClasses = new Set(
    Object.values(parsed.results || {})
      .map((result) => (result.badge ? result.badge.className : ''))
      .filter(Boolean)
  );
  badgeCss = buildBadgeCss(badgeConfig, usedBadgeClasses);

  const resultsWithSections = addSectionsToResults(parsed.results);

  const warnings = validateSpec(parsed);
  failOnWarnings(warnings);

  const templateContents = readFileSafely(
    resolvedTemplatePath,
    ERROR_CODES.TEMPLATE_READ_FAILED,
    'Verify the template file exists and is readable.'
  );
  Handlebars.registerHelper(
    'safeUrl',
    (url: string) => new Handlebars.SafeString(sanitizeUrl(url))
  );
  Handlebars.registerHelper(
    'safeText',
    (text: string) => new Handlebars.SafeString(escapeHtml(text))
  );
  const template = Handlebars.compile(templateContents);

  const questionsJson = JSON.stringify(parsed.questions, null, 2).replace(/<\//g, '<\\/');
  const resultsJson = JSON.stringify(resultsWithSections, null, 2).replace(/<\//g, '<\\/');
  const progressStepsJson = JSON.stringify(parsed.progressSteps, null, 2).replace(/<\//g, '<\\/');
  const metadataJson = JSON.stringify(parsed.metadata || {}, null, 2).replace(/<\//g, '<\\/');
  const renderOptionsJson = JSON.stringify(renderConfig.options || {}, null, 2).replace(
    /<\//g,
    '<\\/'
  );

  const html = template({
    title: parsed.title.main || 'Decision Tree',
    subtitle: parsed.title.subtitle || '',
    badgeCss,
    questionsJson,
    resultsJson,
    progressStepsJson,
    metadataJson,
    renderOptionsJson,
    searchEnabled,
    searchCollapsed: true,
    searchLabel: SEARCH_LABEL,
    searchPlaceholder: SEARCH_PLACEHOLDER,
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

function main(): void {
  const { values } = parseArgs(process.argv.slice(2));
  const config = getConfig();
  if (values.help) {
    logger.info(
      'Usage: node dist/compiler/index.js --topic <topic> [--template <template.html>] [--output <output.html>]'
    );
    logger.info(
      'Or: node dist/compiler/index.js --spec <spec.md> --template <template.html> --output <output.html>'
    );
    process.exit(0);
  }

  const topic = typeof values.topic === 'string' ? values.topic.trim() : '';
  const specValue = typeof values.spec === 'string' ? values.spec : '';
  const templateValue = typeof values.template === 'string' ? values.template : '';
  const templateOverride = templateValue || config.templatePathOverride || '';
  const outputValue = typeof values.output === 'string' ? values.output : '';
  const resolvedTopic = topic ? resolveTopic(config.decisionTreesDir, topic) : null;
  const specPath =
    specValue ||
    (resolvedTopic
      ? path.join(config.decisionTreesDir, ...resolvedTopic.split('/'), 'spec.md')
      : '');
  const outputName = !resolvedTopic
    ? `${topic}-tree.html`
    : topic.includes('/') || topic.includes('\\')
      ? buildTopicOutputName(resolvedTopic)
      : `${path.basename(resolvedTopic)}-tree.html`;
  const outputPath = outputValue || (topic ? path.join(config.outputDir, outputName) : '');

  if (!specPath || !outputPath) {
    logger.error(
      'Usage: node dist/compiler/index.js --topic <topic> [--template <template.html>] [--output <output.html>]'
    );
    logger.error(
      'Or: node dist/compiler/index.js --spec <spec.md> [--template <template.html>] --output <output.html>'
    );
    process.exit(1);
  }

  try {
    compileDecisionTree({
      specPath: path.resolve(specPath),
      outputPath: path.resolve(outputPath),
      ...(templateOverride ? { templatePath: templateOverride } : {}),
    });
  } catch (error) {
    const err = error as { code?: string; message?: string; suggestion?: string };
    const code = err.code || ERROR_CODES.UNKNOWN;
    logger.error('Compilation failed.', {
      code,
      message: err.message,
      suggestion: err.suggestion || undefined,
    });
    process.exit(1);
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}

export { compileDecisionTree };
