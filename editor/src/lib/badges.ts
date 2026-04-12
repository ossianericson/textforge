import yaml from 'js-yaml';
import type { BadgeDefinition } from '@shared/types';

function titleizeBadge(className: string): string {
  return className
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildBadgeDefinitions(content: string): BadgeDefinition[] {
  const raw = yaml.load(content) as Record<string, string> | undefined;
  if (!raw || typeof raw !== 'object') {
    return [];
  }

  return Object.entries(raw).map(([className, color]) => ({
    label: titleizeBadge(className),
    color,
    className,
  }));
}