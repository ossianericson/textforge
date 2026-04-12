import fs from 'node:fs';
import path from 'node:path';

interface PackageJson {
  version?: string;
}

const rootDir = process.cwd();
const packagePath = path.join(rootDir, 'package.json');
const readmePath = path.join(rootDir, 'README.md');

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageJson;
const version = pkg.version;

if (!version) {
  console.error('Missing version in package.json.');
  process.exit(1);
}

const readme = fs.readFileSync(readmePath, 'utf8');
const pattern = /\*\*Version:\*\*\s+([0-9.]+)\s+\|\s+\*\*Date:\*\*\s+([0-9-]+)/;
const match = readme.match(pattern);

if (!match) {
  console.warn('README version badge not found — skipping README version update.');
  process.exit(0);
}

const currentDate = match[2];
const updated = readme.replace(pattern, `**Version:** ${version} | **Date:** ${currentDate}`);

if (updated !== readme) {
  fs.writeFileSync(readmePath, updated, 'utf8');
  console.log(`Updated README version to ${version}.`);
} else {
  console.log('README version already matches package.json.');
}
