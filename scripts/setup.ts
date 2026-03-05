import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

interface RunCommandOptions {
  retries?: number;
  retryDelayMs?: number;
}

function parseNodeVersion(version: string | undefined): { major: number; minor: number } {
  const cleaned = (version || '').replace(/^v/, '');
  const [majorRaw = 0, minorRaw = 0] = cleaned.split('.').map((part) => Number(part));
  return {
    major: Number.isFinite(majorRaw) ? majorRaw : 0,
    minor: Number.isFinite(minorRaw) ? minorRaw : 0,
  };
}

function ensureNodeVersion(): void {
  const { major } = parseNodeVersion(process.version);
  if (major < 22 || major >= 25) {
    console.error(`Node.js ${process.version} is unsupported. Use Node.js 22-24.`);
    process.exit(1);
  }
  console.log(`Node.js ${process.version}`);
}

function ensureEnvFile(): void {
  const envPath = path.resolve('.env');
  const templatePath = path.resolve('.env.example');
  if (fs.existsSync(envPath)) {
    return;
  }
  if (!fs.existsSync(templatePath)) {
    console.warn('Missing .env.example. Create .env manually if needed.');
    return;
  }
  console.log('Creating .env from .env.example...');
  fs.copyFileSync(templatePath, envPath);
  console.log('Created .env. Review and customize if needed.');
}

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function runCommand(command: string, label: string, options: RunCommandOptions = {}): void {
  const { retries = 0, retryDelayMs = 0 } = options;
  let attempt = 0;
  while (true) {
    console.log(label);
    try {
      execSync(command, { stdio: 'inherit' });
      return;
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
      attempt += 1;
      console.warn(`Command failed. Retrying (${attempt}/${retries})...`);
      if (retryDelayMs > 0) {
        sleep(retryDelayMs);
      }
    }
  }
}

console.log('Setting up Decision Tree Builder...');
ensureEnvFile();
ensureNodeVersion();
runCommand('npm install', 'Installing dependencies...');
console.log('');
console.log('Setup complete.');
console.log('');
console.log('Next steps:');
console.log('  1. npm test               # Run tests');
console.log('  2. npm run compile        # Build all trees');
console.log('  3. npm run compile:watch  # Auto-rebuild on save');
console.log('  4. See README.md for creating your own tree');
console.log('');
