import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, type Plugin, type PluginBuild } from 'esbuild';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const editorRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(editorRoot, '..');
const tempDir = path.resolve(editorRoot, '.sidecar-build');
const outputDir = path.resolve(editorRoot, 'src-tauri', 'binaries');
const sidecars = ['parse-spec', 'compile-spec', 'validate-spec'] as const;

function ensureDir(dirPath: string): void {
  mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath: string): void {
  rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

function resolvePackageAlias(specifier: string): string | null {
  const compilerRoot = path.resolve(repoRoot, 'compiler');
  const parserRoot = path.resolve(compilerRoot, 'parsers');
  const parserUtilsRoot = path.resolve(parserRoot, 'utils');

  if (specifier.startsWith('#compiler/')) {
    return path.resolve(repoRoot, 'compiler', `${specifier.slice('#compiler/'.length)}.ts`);
  }
  if (specifier.startsWith('#parsers/')) {
    return path.resolve(parserRoot, `${specifier.slice('#parsers/'.length)}.ts`);
  }
  if (specifier.startsWith('#parser-utils/')) {
    return path.resolve(parserUtilsRoot, `${specifier.slice('#parser-utils/'.length)}.ts`);
  }
  if (specifier === '#config') {
    return path.resolve(repoRoot, 'config.ts');
  }
  if (specifier === '#logger') {
    return path.resolve(repoRoot, 'logger.ts');
  }

  return null;
}

const aliasPlugin: Plugin = {
  name: 'textforge-root-aliases',
  setup(buildContext: PluginBuild) {
    buildContext.onResolve({ filter: /^#(?:compiler|parsers|parser-utils)\// }, (args) => {
      const resolved = resolvePackageAlias(args.path);
      return resolved ? { path: resolved } : null;
    });

    buildContext.onResolve({ filter: /^#(?:config|logger)$/ }, (args) => {
      const resolved = resolvePackageAlias(args.path);
      return resolved ? { path: resolved } : null;
    });
  },
};

function outputBinaryPath(name: string): string {
  return path.resolve(outputDir, os.platform() === 'win32' ? `${name}.exe` : name);
}

function runPkg(inputPath: string, outputPath: string): void {
  const pkgCliPath = path.resolve(editorRoot, 'node_modules', '@yao-pkg', 'pkg', 'lib-es5', 'bin.js');
  execFileSync(
    process.execPath,
    [pkgCliPath, inputPath, '--target', 'host', '--output', outputPath],
    {
      cwd: editorRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        PKG_CACHE_PATH: path.resolve(editorRoot, '.pkg-cache'),
      },
    }
  );

  if (os.platform() !== 'win32' && existsSync(outputPath)) {
    chmodSync(outputPath, 0o755);
  }
}

async function bundleSidecars(): Promise<void> {
  cleanDir(tempDir);
  cleanDir(outputDir);

  for (const name of sidecars) {
    const entryPoint = path.resolve(editorRoot, 'sidecar', `${name}.ts`);
    const bundledOutput = path.resolve(tempDir, `${name}.mjs`);

    await build({
      entryPoints: [entryPoint],
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node20',
      outfile: bundledOutput,
      sourcemap: false,
      minify: true,
      absWorkingDir: repoRoot,
      nodePaths: [path.resolve(editorRoot, 'node_modules'), path.resolve(repoRoot, 'node_modules')],
      plugins: [aliasPlugin],
      external: ['node:*'],
      banner: {
        js: '#!/usr/bin/env node',
      },
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });

    runPkg(bundledOutput, outputBinaryPath(name));
    console.log(`Built sidecar: ${name}`);
  }
}

bundleSidecars().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});