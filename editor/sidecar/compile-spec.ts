/**
 * Sidecar: compile-spec
 * Usage: tsx sidecar/compile-spec.ts <absolute-path-to-spec.md>
 *        <absolute-path-to-output.html>
 * Calls compileDecisionTree(), writes HTML to the output path,
 * then writes the output path to stdout on success.
 * On error writes { "error": "..." } and exits with code 1.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { compileDecisionTree } from '../../compiler/index.ts';
import {
  loadTopicRenderConfig,
  resolveRendererTemplatePath,
} from '../../compiler/renderers/registry.ts';

const [, , specPath, outputPath] = process.argv;

function resolveBundledCompilerRoot(): string | null {
  const executableDir = path.dirname(process.execPath);
  const candidates = [
    path.resolve(executableDir, '..'),
    path.resolve(executableDir, '..', 'resources'),
    path.resolve(executableDir, '..', '..'),
    executableDir,
  ];

  const seen = new Set<string>();
  for (const candidate of candidates) {
    const normalized = path.resolve(candidate);
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);

    const badgesPath = path.join(normalized, 'core', 'badges.yml');
    const defaultTemplatePath = path.join(
      normalized,
      'renderers',
      'html',
      'default-v1',
      'template.html'
    );

    if (existsSync(badgesPath) && existsSync(defaultTemplatePath)) {
      return normalized;
    }
  }

  return null;
}

if (!specPath || !outputPath) {
  process.stdout.write(JSON.stringify({ error: 'Usage: compile-spec <specPath> <outputPath>' }));
  process.exit(1);
}

try {
  const bundledCompilerRoot = resolveBundledCompilerRoot();
  const compileOptions: {
    specPath: string;
    outputPath: string;
    templatePath?: string;
  } = { specPath, outputPath };

  if (bundledCompilerRoot) {
    process.env.DTB_BADGE_PATH = path.join(bundledCompilerRoot, 'core', 'badges.yml');
    const renderConfig = loadTopicRenderConfig(specPath);
    compileOptions.templatePath = resolveRendererTemplatePath(
      renderConfig.renderer,
      bundledCompilerRoot
    );
  }

  compileDecisionTree(compileOptions);
  process.stdout.write(outputPath);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stdout.write(JSON.stringify({ error: message }));
  process.exit(1);
}