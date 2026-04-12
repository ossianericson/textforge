/**
 * Sidecar: compile-parsed-spec
 * Usage: tsx sidecar/compile-parsed-spec.ts <absolute-path-to-payload.json>
 *        <absolute-path-to-output.html>
 * Payload shape: { specPath: string, parsedSpec: ParsedSpec }
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { compileParsedDecisionTree } from '../../compiler/index.ts';
import {
  loadTopicRenderConfig,
  resolveRendererTemplatePath,
} from '../../compiler/renderers/registry.ts';
import type { ParsedSpec } from '../../compiler/types.ts';
import { normalizeParsedSpecRoutingTargets } from '../src/lib/routing-targets.ts';

const [, , payloadPath, outputPath] = process.argv;

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

if (!payloadPath || !outputPath) {
  process.stdout.write(
    JSON.stringify({ error: 'Usage: compile-parsed-spec <payloadPath> <outputPath>' })
  );
  process.exit(1);
}

try {
  const payload = JSON.parse(readFileSync(payloadPath, 'utf8')) as {
    specPath?: string;
    parsedSpec?: ParsedSpec;
  };

  if (!payload.specPath || !payload.parsedSpec) {
    throw new Error('compile-parsed-spec payload must include specPath and parsedSpec.');
  }

  const compileOptions: {
    specPath: string;
    parsedSpec: ParsedSpec;
    outputPath: string;
    templatePath?: string;
  } = {
    specPath: payload.specPath,
    parsedSpec: normalizeParsedSpecRoutingTargets(payload.parsedSpec),
    outputPath,
  };

  const bundledCompilerRoot = resolveBundledCompilerRoot();
  if (bundledCompilerRoot) {
    process.env.DTB_BADGE_PATH = path.join(bundledCompilerRoot, 'core', 'badges.yml');
    const renderConfig = loadTopicRenderConfig(payload.specPath);
    compileOptions.templatePath = resolveRendererTemplatePath(
      renderConfig.renderer,
      bundledCompilerRoot
    );
  }

  compileParsedDecisionTree(compileOptions);
  process.stdout.write(outputPath);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stdout.write(JSON.stringify({ error: message }));
  process.exit(1);
}