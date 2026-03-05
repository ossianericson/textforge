import fs from 'fs';
import yaml from 'js-yaml';

type BadgeMap = Record<string, string>;

export function loadBadgeConfig(filePath: string): BadgeMap {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = yaml.load(raw) as BadgeMap | undefined;

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Badge config must be a mapping of badge names to colors.');
  }

  return data;
}

export function buildBadgeCss(badges: BadgeMap, includeNames?: Iterable<string>): string {
  const filter = includeNames ? new Set(includeNames) : null;
  return Object.entries(badges)
    .filter(([name]) => !filter || filter.has(name))
    .map(([name, color]) => `.badge.${name} { background: ${color}; }`)
    .join('\n    ');
}

export function loadBadgeCss(filePath: string): string {
  return buildBadgeCss(loadBadgeConfig(filePath));
}
