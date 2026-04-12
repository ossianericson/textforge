import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { getConfig } from '#config';

interface TemplateOption {
  key: string;
  label: string;
  file: string;
  description: string;
}

type TopicScope = 'internal' | 'public';

const TEMPLATES: TemplateOption[] = [
  {
    key: 'standard',
    label: 'Standard (buttons)',
    file: 'template.md',
    description: 'Button-based Q&A flow - like Compute or Troubleshooting',
  },
  {
    key: 'dropdown',
    label: 'Dropdown (numeric ranges)',
    file: 'template-dropdown.md',
    description: 'Numeric input with range-based routing - like a risk scorer',
  },
  {
    key: 'matrix',
    label: 'Dropdown-pair matrix',
    file: 'template-matrix.md',
    description: 'Two dropdowns with matrix routing - like DR Architecture',
  },
  {
    key: 'blank',
    label: 'Blank (minimal)',
    file: 'template-blank.md',
    description: 'Just the required headers and one placeholder question',
  },
];

function usage(): void {
  console.log(
    'Usage: npm run init -- <topic> [--scope internal|public] [--template standard|dropdown|matrix|blank]'
  );
  console.log('Example: npm run init -- my-topic');
  console.log('');
  console.log('Scope defaults to internal when that folder exists, otherwise public.');
  console.log('');
  console.log('Templates:');
  for (const template of TEMPLATES) {
    console.log(`  ${template.key.padEnd(12)} ${template.description}`);
  }
}

function validateTopic(topic: string): string {
  if (!topic) {
    return 'Topic name is required.';
  }
  if (topic.includes('/') || topic.includes('\\')) {
    return 'Topic name must not contain path separators.';
  }
  if (!/^[a-z0-9-]+$/i.test(topic)) {
    return 'Topic name should use letters, numbers, and hyphens only.';
  }
  return '';
}

async function selectTemplate(): Promise<TemplateOption> {
  const flagIndex = process.argv.indexOf('--template');
  if (flagIndex !== -1 && process.argv[flagIndex + 1]) {
    const key = process.argv[flagIndex + 1];
    const found = TEMPLATES.find((template) => template.key === key);
    if (found) {
      return found;
    }
    console.error(`Unknown template: ${key}`);
    usage();
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('\nAvailable templates:\n');
  TEMPLATES.forEach((template, index) => {
    console.log(`  ${index + 1}. ${template.label}`);
    console.log(`     ${template.description}\n`);
  });

  const answer = await rl.question('Select template [1]: ');
  rl.close();

  const index = parseInt(answer || '1', 10) - 1;
  return TEMPLATES[index] ?? TEMPLATES[0]!;
}

function parseScope(args: string[]): TopicScope | undefined {
  const flagIndex = args.indexOf('--scope');
  if (flagIndex === -1) {
    return undefined;
  }

  const rawScope = args[flagIndex + 1]?.trim().toLowerCase();
  if (rawScope === 'internal' || rawScope === 'public') {
    return rawScope;
  }

  console.error(`Unknown scope: ${rawScope || '(missing)'}`);
  usage();
  process.exit(1);
}

function resolveScope(
  config: ReturnType<typeof getConfig>,
  requestedScope: TopicScope | undefined
): TopicScope {
  if (requestedScope) {
    return requestedScope;
  }

  const internalDir = path.join(config.decisionTreesDir, 'internal');
  return fs.existsSync(internalDir) ? 'internal' : 'public';
}

function buildOutputFileName(scope: TopicScope, topic: string): string {
  return scope === 'public' ? `${topic}-tree.html` : `${scope}-${topic}-tree.html`;
}

function getVerifyCommand(scope: TopicScope): string {
  return scope === 'public' ? 'npm run verify:public-examples' : 'npm run verify:internal-examples';
}

export async function initTopic(topicOverride?: string): Promise<void> {
  const args = process.argv.slice(2);
  let topicRaw = topicOverride ?? '';
  if (!topicRaw) {
    for (let i = 0; i < args.length; i += 1) {
      const arg = args[i];
      if (!arg) {
        continue;
      }
      if (arg === '--template') {
        i += 1;
        continue;
      }
      if (arg === '--scope') {
        i += 1;
        continue;
      }
      if (arg.startsWith('--')) {
        continue;
      }
      topicRaw = arg;
      break;
    }
  }

  const topic = topicRaw.trim();
  const error = validateTopic(topic);
  if (error) {
    console.error(error);
    usage();
    process.exit(1);
  }

  const template = await selectTemplate();
  const config = getConfig();
  const scope = resolveScope(config, parseScope(args));
  const templateSpecPath = path.join(config.rootDir, 'core', template.file);
  const targetDir = path.join(config.decisionTreesDir, scope, topic);
  const specPath = path.join(targetDir, 'spec.md');

  if (!fs.existsSync(templateSpecPath)) {
    const fallback = path.join(config.rootDir, 'core', 'template.md');
    if (!fs.existsSync(fallback)) {
      console.error(`Template not found: ${templateSpecPath}`);
      process.exit(1);
    }
    console.warn(`Template '${template.key}' not found, using standard template.`);
  }

  if (fs.existsSync(specPath)) {
    console.error(`Spec already exists: ${specPath}`);
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const sourcePath = fs.existsSync(templateSpecPath)
    ? templateSpecPath
    : path.join(config.rootDir, 'core', 'template.md');
  let content = fs.readFileSync(sourcePath, 'utf8');
  const titleCase = topic
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  content = content
    .replace(/\[Decision Tree Title\]/g, `Azure ${titleCase} Decision Tree`)
    .replace(/\[Decision Tree Name\]/g, `Azure ${titleCase}`)
    .replace(/\[DATE\]/g, new Date().toISOString().slice(0, 10))
    .replace(/\[NAME\]/g, process.env.USER ?? 'Author');

  fs.writeFileSync(specPath, content, 'utf8');

  const topicRef = `${scope}/${topic}`;
  const outputFile = buildOutputFileName(scope, topic);
  const verifyCommand = getVerifyCommand(scope);

  console.log(`\nCreated ${specPath} (template: ${template.label})\n`);
  console.log('Next steps:');
  console.log(`  1. Edit ${specPath}`);
  console.log('  2. npm run validate:spec');
  console.log(`  3. npm run compile:topic -- ${topicRef}`);
  console.log(`  4. Open output/${outputFile}`);
  console.log(`  5. Optional baseline check: ${verifyCommand}`);
  console.log('');
  console.log('New tree checklist:');
  console.log('  - Validate the spec structure and navigation');
  console.log(`  - Compile the tree directly with npm run compile:topic -- ${topicRef}`);
  console.log('  - Review the HTML output in a browser');
  console.log(
    '  - Run npm test and npm run test:coverage to confirm the shared compiler suite still passes'
  );
  console.log(`  - Use ${verifyCommand} to confirm the shipped baseline examples still work`);

  try {
    execSync('npm run validate:spec 2>&1', { encoding: 'utf8', timeout: 10_000 });
    console.log('  OK: Template passes validation\n');
  } catch {
    console.log('  WARN: Run "npm run validate:spec:fix" to auto-fix template placeholders\n');
  }
}

async function main(): Promise<void> {
  const topicRaw = process.argv.slice(2)[0] ?? '';
  await initTopic(topicRaw);
}

const isDirectRun =
  (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) ||
  process.argv[1]?.endsWith('init.js');

if (isDirectRun) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
