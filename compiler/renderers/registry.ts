import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { DecisionTreeCompilerError, ERROR_CODES } from '../errors.js';

export interface RenderOptions {
  showDocsSection?: boolean;
  showDocsButton?: boolean;
  showCopyLinkButton?: boolean;
  showContactSection?: boolean;
}

interface RenderOptionsInput {
  showDocsSection?: boolean | undefined;
  showDocsButton?: boolean | undefined;
  showCopyLinkButton?: boolean | undefined;
  showContactSection?: boolean | undefined;
}

export interface TopicRenderConfig {
  renderer: string;
  options: RenderOptions;
}

const DEFAULT_RENDERER = 'html/default-v1';
const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  showDocsSection: true,
  showDocsButton: true,
  showCopyLinkButton: true,
  showContactSection: true,
};
const RENDERER_DEFAULT_OPTIONS: Record<string, RenderOptions> = {
  'html/default-v1': { ...DEFAULT_RENDER_OPTIONS },
  'html/copy-first-v1': {
    ...DEFAULT_RENDER_OPTIONS,
    showDocsSection: false,
    showDocsButton: false,
    showCopyLinkButton: false,
  },
  'html/reference-v1': { ...DEFAULT_RENDER_OPTIONS },
};

const RenderOptionsSchema = z
  .object({
    showDocsSection: z.boolean().optional(),
    showDocsButton: z.boolean().optional(),
    showCopyLinkButton: z.boolean().optional(),
    showContactSection: z.boolean().optional(),
  })
  .catchall(z.unknown());

const TopicRenderConfigSchema = z.object({
  renderer: z.string().min(1),
  options: RenderOptionsSchema.optional().default({}),
});

function getRendererTemplateMap(rootDir: string): Record<string, string> {
  const sharedV1TemplatePath = path.join(
    rootDir,
    'renderers',
    'html',
    'default-v1',
    'template.html'
  );

  return {
    'html/default-v1': sharedV1TemplatePath,
    'html/copy-first-v1': sharedV1TemplatePath,
    'html/reference-v1': sharedV1TemplatePath,
  };
}

function getRendererDefaultOptions(renderer: string): RenderOptions {
  return normalizeRenderOptions(RENDERER_DEFAULT_OPTIONS[renderer] || DEFAULT_RENDER_OPTIONS);
}

function normalizeRenderOptions(options: RenderOptionsInput): RenderOptions {
  const normalized: RenderOptions = {};

  if (typeof options.showDocsSection === 'boolean') {
    normalized.showDocsSection = options.showDocsSection;
  }
  if (typeof options.showDocsButton === 'boolean') {
    normalized.showDocsButton = options.showDocsButton;
  }
  if (typeof options.showCopyLinkButton === 'boolean') {
    normalized.showCopyLinkButton = options.showCopyLinkButton;
  }
  if (typeof options.showContactSection === 'boolean') {
    normalized.showContactSection = options.showContactSection;
  }

  return normalized;
}

export function loadTopicRenderConfig(
  specPath: string,
  defaultRenderer: string = DEFAULT_RENDERER
): TopicRenderConfig {
  const renderConfigPath = path.join(path.dirname(specPath), 'render.json');
  if (!fs.existsSync(renderConfigPath)) {
    return {
      renderer: defaultRenderer,
      options: getRendererDefaultOptions(defaultRenderer),
    };
  }

  let rawConfig: unknown;
  try {
    rawConfig = JSON.parse(fs.readFileSync(renderConfigPath, 'utf8'));
  } catch (error) {
    throw new DecisionTreeCompilerError(`Failed to read render config: ${renderConfigPath}`, {
      code: ERROR_CODES.RENDER_CONFIG_FAILED,
      suggestion: 'Fix invalid JSON in render.json or remove the file.',
      cause: error,
    });
  }

  const parsed = TopicRenderConfigSchema.safeParse(rawConfig);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'render.json'}: ${issue.message}`)
      .join('; ');
    throw new DecisionTreeCompilerError(`Invalid render config: ${renderConfigPath}`, {
      code: ERROR_CODES.RENDER_CONFIG_FAILED,
      suggestion: details,
    });
  }

  return {
    renderer: parsed.data.renderer,
    options: normalizeRenderOptions({
      ...getRendererDefaultOptions(parsed.data.renderer),
      ...parsed.data.options,
    }),
  };
}

export function resolveRendererTemplatePath(renderer: string, rootDir: string): string {
  const rendererTemplateMap = getRendererTemplateMap(rootDir);
  const templatePath = rendererTemplateMap[renderer];

  if (!templatePath) {
    throw new DecisionTreeCompilerError(`Unknown renderer: ${renderer}`, {
      code: ERROR_CODES.RENDER_CONFIG_FAILED,
      suggestion:
        'Use a registered renderer such as html/default-v1, html/copy-first-v1, or html/reference-v1.',
    });
  }

  return templatePath;
}

export { DEFAULT_RENDERER };
