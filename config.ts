import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export interface Config {
  rootDir: string;
  decisionTreesDir: string;
  outputDir: string;
  templatePath: string;
  templatePathOverride: string | null;
  defaultRenderer: string;
  badgePath: string;
}

const configDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const rootDir = path.basename(configDir) === 'dist' ? path.resolve(configDir, '..') : configDir;

function readEnv(key: string, fallback: string): string {
  const value = process.env[key];
  if (value && String(value).trim()) {
    return value;
  }
  return fallback;
}

function readOptionalEnv(key: string): string | null {
  const value = process.env[key];
  if (value && String(value).trim()) {
    return String(value).trim();
  }
  return null;
}

let envLoaded = false;
let config: Config | null = null;

function loadEnv(): void {
  if (envLoaded) {
    return;
  }
  envLoaded = true;

  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);
  if (!envExists) {
    return;
  }

  const result = dotenv.config({
    quiet: true,
  } as dotenv.DotenvConfigOptions);
  if (result.error && process.env.NODE_ENV === 'production') {
    throw new Error(`Failed to load .env: ${result.error.message}`);
  }
}

function buildConfig(): Config {
  const templatePathOverride = readOptionalEnv('DTB_TEMPLATE_PATH');
  return {
    rootDir,
    decisionTreesDir: readEnv('DTB_DECISION_TREES_DIR', path.join(rootDir, 'decision-trees')),
    outputDir: readEnv('DTB_OUTPUT_DIR', path.join(rootDir, 'output')),
    templatePath:
      templatePathOverride ||
      path.join(rootDir, 'renderers', 'html', 'default-v1', 'template.html'),
    templatePathOverride,
    defaultRenderer: readEnv('DTB_RENDERER', 'html/default-v1'),
    badgePath: readEnv('DTB_BADGE_PATH', path.join(rootDir, 'core', 'badges.yml')),
  };
}

export function getConfig(): Config {
  if (!config) {
    loadEnv();
    config = buildConfig();
  }
  return config;
}
