import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

type Provider = 'github' | 'azure' | 'both';

interface InitSpecRepoOptions {
  targetDir?: string;
  provider?: Provider;
  force?: boolean;
}

interface PackageJsonShape {
  name?: string;
  private?: boolean;
  type?: string;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const parentDir = path.resolve(__dirname, '..');
const repoRoot = path.basename(parentDir) === 'dist' ? path.resolve(parentDir, '..') : parentDir;
const ciTemplateDir = path.join(repoRoot, 'editor', 'templates', 'ci');

function parseProvider(raw: string | undefined): Provider {
  if (!raw) {
    return 'both';
  }
  if (raw === 'github' || raw === 'azure' || raw === 'both') {
    return raw;
  }
  throw new Error(`Unsupported provider: ${raw}`);
}

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeIfAllowed(filePath: string, content: string, force: boolean): void {
  if (fs.existsSync(filePath) && !force) {
    return;
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function loadPackageVersion(): string {
  const packageJsonPath = path.join(repoRoot, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { version?: string };
  return pkg.version ?? '1.0.0';
}

function buildEnvExample(): string {
  return ['DTB_DECISION_TREES_DIR=decision-trees', 'DTB_OUTPUT_DIR=output', ''].join('\n');
}

function buildStarterSpec(repoName: string): string {
  const templatePath = path.join(repoRoot, 'core', 'template-blank.md');
  let content = fs.readFileSync(templatePath, 'utf8');
  const title = repoName
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  content = content
    .replace(/\[Decision Tree Title\]/g, `${title} Decision Tree`)
    .replace(/\[Decision Tree Name\]/g, title)
    .replace(/\[DATE\]/g, new Date().toISOString().slice(0, 10))
    .replace(/\[NAME\]/g, 'textforge');

  return content;
}

function appendGitignore(targetDir: string): void {
  const gitignorePath = path.join(targetDir, '.gitignore');
  const desired = ['node_modules/', '.DS_Store'];
  const existing = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, 'utf8').split(/\r?\n/)
    : [];
  const merged = [...existing];
  for (const item of desired) {
    if (!merged.includes(item)) {
      merged.push(item);
    }
  }
  fs.writeFileSync(gitignorePath, `${merged.filter(Boolean).join('\n')}\n`, 'utf8');
}

function mergePackageJson(targetDir: string): void {
  const packageJsonPath = path.join(targetDir, 'package.json');
  const existing: PackageJsonShape = fs.existsSync(packageJsonPath)
    ? (JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as PackageJsonShape)
    : {};
  const repoName = path.basename(targetDir);
  const nextPackage: PackageJsonShape = {
    name: existing.name ?? repoName,
    private: existing.private ?? true,
    type: existing.type ?? 'module',
    scripts: {
      ...existing.scripts,
      'spec:validate': 'npx dtb validate',
      'spec:compile': 'npx dtb compile',
      'spec:ci': 'npm run spec:validate && npm run spec:compile',
    },
    devDependencies: {
      ...existing.devDependencies,
      textforge: existing.devDependencies?.textforge ?? `^${loadPackageVersion()}`,
    },
  };
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(nextPackage, null, 2)}\n`, 'utf8');
}

function copyTemplateFile(sourceName: string, targetPath: string, force: boolean): void {
  const sourcePath = path.join(ciTemplateDir, sourceName);
  const content = fs.readFileSync(sourcePath, 'utf8');
  writeIfAllowed(targetPath, content, force);
}

export async function initSpecRepo(options: InitSpecRepoOptions = {}): Promise<void> {
  const targetDir = path.resolve(
    options.targetDir ?? path.join(process.cwd(), 'textforge-spec-repo')
  );
  const provider = parseProvider(options.provider);
  const force = options.force ?? false;
  const repoName = path.basename(targetDir);

  ensureDir(targetDir);
  ensureDir(path.join(targetDir, 'decision-trees', 'public', 'sample'));
  ensureDir(path.join(targetDir, 'output'));
  ensureDir(path.join(targetDir, 'scripts'));

  writeIfAllowed(path.join(targetDir, '.env.example'), buildEnvExample(), force);
  writeIfAllowed(
    path.join(targetDir, 'textforge.config.json'),
    fs.readFileSync(path.join(ciTemplateDir, 'textforge.config.json'), 'utf8'),
    force
  );
  writeIfAllowed(
    path.join(targetDir, 'decision-trees', 'public', 'sample', 'spec.md'),
    buildStarterSpec(repoName),
    force
  );

  if (provider === 'github' || provider === 'both') {
    copyTemplateFile(
      'github-workflow.yml',
      path.join(targetDir, '.github', 'workflows', 'textforge-publish.yml'),
      force
    );
  }
  if (provider === 'azure' || provider === 'both') {
    copyTemplateFile('azure-pipelines.yml', path.join(targetDir, 'azure-pipelines.yml'), force);
  }

  appendGitignore(targetDir);
  mergePackageJson(targetDir);

  console.log(`Initialized textforge spec repo at ${targetDir}`);
  console.log('Next steps:');
  console.log('  1. npm install');
  console.log('  2. Copy .env.example to .env if your workflow needs custom paths');
  console.log('  3. npm run spec:validate');
  console.log('  4. npm run spec:compile');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const targetDir = args.find((arg) => !arg.startsWith('--'));
  const providerIndex = args.indexOf('--provider');
  const force = args.includes('--force');
  const provider = parseProvider(providerIndex >= 0 ? args[providerIndex + 1] : undefined);
  await initSpecRepo({
    provider,
    force,
    ...(targetDir ? { targetDir } : {}),
  });
}

const isDirectRun =
  (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) ||
  process.argv[1]?.endsWith('init-spec-repo.js');

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
