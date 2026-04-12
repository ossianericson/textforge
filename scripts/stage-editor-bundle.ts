import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type PlatformKey = 'win' | 'mac';
type VariantKey = 'installer' | 'portable' | 'all';

interface PlatformConfig {
  readonly targetTriple: string;
  readonly outputDirName: string;
  readonly displayName: string;
}

interface TauriConfig {
  readonly productName: string;
  readonly version: string;
}

interface CargoConfig {
  readonly packageName: string;
}

interface ArtifactManifest {
  readonly productName: string;
  readonly version: string;
  readonly platform: string;
  readonly targetTriple: string;
  readonly sourceDir: string;
  readonly generatedAt: string;
  readonly files: readonly string[];
}

type NodeErrorWithCode = Error & { code?: string };

const PLATFORM_CONFIG: Record<PlatformKey, PlatformConfig> = {
  win: {
    targetTriple: 'x86_64-pc-windows-msvc',
    outputDirName: 'windows-x64',
    displayName: 'Windows x64',
  },
  mac: {
    targetTriple: 'x86_64-apple-darwin',
    outputDirName: 'macos-x64',
    displayName: 'macOS x64',
  },
};

const DEFAULT_VARIANT: Record<PlatformKey, VariantKey> = {
  win: 'all',
  mac: 'installer',
};

function getRepoRoot(): string {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(scriptDir, '..');
}

function readTauriConfig(repoRoot: string): TauriConfig {
  const tauriConfigPath = path.join(repoRoot, 'editor', 'src-tauri', 'tauri.conf.json');
  const raw = readFileSync(tauriConfigPath, 'utf8');
  return JSON.parse(raw) as TauriConfig;
}

function readCargoConfig(repoRoot: string): CargoConfig {
  const cargoPath = path.join(repoRoot, 'editor', 'src-tauri', 'Cargo.toml');
  const raw = readFileSync(cargoPath, 'utf8');
  const nameMatch = raw.match(/^name\s*=\s*"([^"]+)"/m);
  if (!nameMatch) {
    throw new Error(`Could not determine the Cargo package name from ${cargoPath}.`);
  }

  const packageName = nameMatch[1];
  if (!packageName) {
    throw new Error(`Cargo package name capture was empty in ${cargoPath}.`);
  }

  return { packageName };
}

function resolveBundleDir(repoRoot: string, targetTriple: string): string {
  const candidatePaths = [
    path.join(repoRoot, 'editor', 'src-tauri', 'target', targetTriple, 'release', 'bundle'),
    path.join(repoRoot, 'editor', 'src-tauri', 'target', 'release', 'bundle'),
  ];

  for (const candidatePath of candidatePaths) {
    if (existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  throw new Error(
    [
      `No Tauri bundle output found for ${targetTriple}.`,
      'Run the platform build first, then rerun the staging command.',
      `Expected one of: ${candidatePaths.join(', ')}`,
    ].join(' ')
  );
}

function resolveReleaseDir(repoRoot: string, targetTriple: string): string {
  const candidatePaths = [
    path.join(repoRoot, 'editor', 'src-tauri', 'target', targetTriple, 'release'),
    path.join(repoRoot, 'editor', 'src-tauri', 'target', 'release'),
  ];

  for (const candidatePath of candidatePaths) {
    if (existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  throw new Error(
    [
      `No Tauri release output found for ${targetTriple}.`,
      'Run the platform build first, then rerun the staging command.',
      `Expected one of: ${candidatePaths.join(', ')}`,
    ].join(' ')
  );
}

function collectFiles(rootDir: string, currentDir = rootDir): string[] {
  const entries = readdirSync(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(rootDir, entryPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(path.relative(rootDir, entryPath).replace(/\\/g, '/'));
    }
  }

  files.sort((left, right) => left.localeCompare(right));
  return files;
}

function writeManifest(destinationDir: string, manifest: ArtifactManifest): void {
  const manifestPath = path.join(destinationDir, 'manifest.json');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function isRetryableStagingError(error: unknown): error is NodeErrorWithCode {
  if (!(error instanceof Error)) {
    return false;
  }

  return ['EPERM', 'EBUSY', 'EACCES'].includes((error as NodeErrorWithCode).code ?? '');
}

function resolveRefreshDestination(destinationDir: string): string {
  const refreshBase = `${destinationDir}-refresh`;
  if (!existsSync(refreshBase)) {
    return refreshBase;
  }

  let suffix = 2;
  while (existsSync(`${refreshBase}-${suffix}`)) {
    suffix += 1;
  }

  return `${refreshBase}-${suffix}`;
}

function prepareDestinationDir(destinationDir: string): string {
  try {
    rmSync(destinationDir, { recursive: true, force: true });
    return destinationDir;
  } catch (error) {
    if (!isRetryableStagingError(error)) {
      throw error;
    }

    const refreshDestination = resolveRefreshDestination(destinationDir);
    console.warn(
      `Primary staging folder is locked (${destinationDir}). Falling back to ${refreshDestination}.`
    );
    rmSync(refreshDestination, { recursive: true, force: true });
    return refreshDestination;
  }
}

function stageInstaller(
  repoRoot: string,
  tauriConfig: TauriConfig,
  platformConfig: PlatformConfig
): string {
  const sourceDir = resolveBundleDir(repoRoot, platformConfig.targetTriple);
  const destinationDir = path.join(
    repoRoot,
    'artifacts',
    'editor',
    tauriConfig.version,
    platformConfig.outputDirName
  );

  rmSync(destinationDir, { recursive: true, force: true });
  mkdirSync(destinationDir, { recursive: true });
  cpSync(sourceDir, destinationDir, { recursive: true });

  const files = collectFiles(destinationDir);
  writeManifest(destinationDir, {
    productName: tauriConfig.productName,
    version: tauriConfig.version,
    platform: `${platformConfig.displayName} installer bundle`,
    targetTriple: platformConfig.targetTriple,
    sourceDir: path.relative(repoRoot, sourceDir).replace(/\\/g, '/'),
    generatedAt: new Date().toISOString(),
    files,
  });

  if (files.length === 0) {
    throw new Error(`No staged files were found in ${destinationDir}.`);
  }

  return destinationDir;
}

function stageWindowsPortable(
  repoRoot: string,
  tauriConfig: TauriConfig,
  platformConfig: PlatformConfig,
  cargoConfig: CargoConfig
): string {
  const releaseDir = resolveReleaseDir(repoRoot, platformConfig.targetTriple);
  const requestedDestinationDir = path.join(
    repoRoot,
    'artifacts',
    'editor',
    tauriConfig.version,
    `${platformConfig.outputDirName}-portable`
  );
  const destinationDir = prepareDestinationDir(requestedDestinationDir);
  const executableName = `${cargoConfig.packageName}.exe`;
  const executablePath = path.join(releaseDir, executableName);
  const binariesDir = path.join(repoRoot, 'editor', 'src-tauri', 'binaries');
  const badgesConfigPath = path.join(repoRoot, 'core', 'badges.yml');
  const defaultRendererTemplatePath = path.join(
    repoRoot,
    'renderers',
    'html',
    'default-v1',
    'template.html'
  );
  const defaultV2RendererTemplatePath = path.join(
    repoRoot,
    'renderers',
    'html',
    'default-v2',
    'template.html'
  );

  if (!existsSync(executablePath)) {
    throw new Error(
      `Portable executable not found at ${executablePath}. Run npm run editor:build:win first.`
    );
  }
  if (!existsSync(binariesDir)) {
    throw new Error(
      `Packaged sidecars were not found at ${binariesDir}. Run the normal editor build first.`
    );
  }
  if (!existsSync(badgesConfigPath) || !existsSync(defaultRendererTemplatePath)) {
    throw new Error('Required compiler runtime resources are missing. Restore core/badges.yml and renderer templates.');
  }

  mkdirSync(path.join(destinationDir, 'binaries'), { recursive: true });
  mkdirSync(path.join(destinationDir, 'resources', 'binaries'), { recursive: true });
  mkdirSync(path.join(destinationDir, 'resources', 'core'), { recursive: true });
  mkdirSync(path.join(destinationDir, 'resources', 'renderers', 'html', 'default-v1'), {
    recursive: true,
  });
  mkdirSync(path.join(destinationDir, 'resources', 'renderers', 'html', 'default-v2'), {
    recursive: true,
  });
  cpSync(executablePath, path.join(destinationDir, executableName));

  const runtimeFiles = readdirSync(releaseDir, { withFileTypes: true });
  for (const entry of runtimeFiles) {
    if (!entry.isFile()) {
      continue;
    }

    const lowerName = entry.name.toLowerCase();
    if (lowerName === executableName.toLowerCase()) {
      continue;
    }
    if (!lowerName.endsWith('.dll')) {
      continue;
    }

    cpSync(path.join(releaseDir, entry.name), path.join(destinationDir, entry.name));
  }

  cpSync(binariesDir, path.join(destinationDir, 'binaries'), { recursive: true });
  cpSync(binariesDir, path.join(destinationDir, 'resources', 'binaries'), { recursive: true });
  cpSync(badgesConfigPath, path.join(destinationDir, 'resources', 'core', 'badges.yml'));
  cpSync(
    defaultRendererTemplatePath,
    path.join(destinationDir, 'resources', 'renderers', 'html', 'default-v1', 'template.html')
  );
  cpSync(
    defaultV2RendererTemplatePath,
    path.join(destinationDir, 'resources', 'renderers', 'html', 'default-v2', 'template.html')
  );

  const launcherNotes = [
    'textforge Editor Portable',
    '',
    'Run textforge-editor.exe from this folder.',
    'Keep the bundled binaries/ and resources/ directories next to the executable.',
    'Do not move the executable away from the bundled resources/ directory.',
    'Windows still requires WebView2 to be installed on the host machine.',
  ].join('\n');
  writeFileSync(path.join(destinationDir, 'PORTABLE.txt'), `${launcherNotes}\n`, 'utf8');

  const files = collectFiles(destinationDir);
  writeManifest(destinationDir, {
    productName: tauriConfig.productName,
    version: tauriConfig.version,
    platform: `${platformConfig.displayName} portable bundle`,
    targetTriple: platformConfig.targetTriple,
    sourceDir: path.relative(repoRoot, releaseDir).replace(/\\/g, '/'),
    generatedAt: new Date().toISOString(),
    files,
  });

  if (files.length === 0) {
    throw new Error(`No staged files were found in ${destinationDir}.`);
  }

  return destinationDir;
}

function main(): void {
  const platformKey = process.argv[2] as PlatformKey | undefined;
  if (!platformKey || !(platformKey in PLATFORM_CONFIG)) {
    throw new Error('Usage: npx tsx scripts/stage-editor-bundle.ts <win|mac> [installer|portable|all]');
  }

  const variant = (process.argv[3] as VariantKey | undefined) ?? DEFAULT_VARIANT[platformKey];
  if (!['installer', 'portable', 'all'].includes(variant)) {
    throw new Error('Variant must be one of: installer, portable, all');
  }

  const repoRoot = getRepoRoot();
  const tauriConfig = readTauriConfig(repoRoot);
  const cargoConfig = readCargoConfig(repoRoot);
  const platformConfig = PLATFORM_CONFIG[platformKey];
  const stagedDestinations: string[] = [];

  if (variant === 'installer' || variant === 'all') {
    stagedDestinations.push(stageInstaller(repoRoot, tauriConfig, platformConfig));
  }

  if (platformKey === 'win' && (variant === 'portable' || variant === 'all')) {
    stagedDestinations.push(
      stageWindowsPortable(repoRoot, tauriConfig, platformConfig, cargoConfig)
    );
  }

  for (const destinationDir of stagedDestinations) {
    const fileCount = collectFiles(destinationDir).length;
    const relativeDestination = path.relative(repoRoot, destinationDir).replace(/\\/g, '/');
    console.log(
      `Staged ${fileCount} files for ${platformConfig.displayName} at ${relativeDestination}`
    );
  }
}

export const __testUtils = {
  isRetryableStagingError,
  resolveRefreshDestination,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
