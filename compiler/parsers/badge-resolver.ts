import { createLogger } from '#logger';
import type { ResultMap } from './types.js';

const logger = createLogger({ component: 'badge-resolver' });

function parseBadgeCss(promptContents: string): string {
  const badgeLines: string[] = [];
  const lines = promptContents.split(/\r?\n/);
  let inCss = false;

  for (const line of lines) {
    if (line.trim().startsWith('```css')) {
      inCss = true;
      continue;
    }
    if (inCss && line.trim().startsWith('```')) {
      inCss = false;
      continue;
    }
    if (inCss && line.includes('.badge.')) {
      badgeLines.push(line.trim());
    }
  }

  return badgeLines.join('\n    ');
}

function parseBadgeClassNames(badgeCss: string): string[] {
  const classNames: string[] = [];
  const regex = /\.badge\.([a-z0-9-]+)/gi;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(badgeCss))) {
    if (match[1]) {
      classNames.push(match[1]);
    }
  }
  return classNames;
}

function normalizeBadgeToken(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function resolveBadgeClass(
  normalizedBadge: string,
  classNames: string[]
): { className: string; reason: string } {
  const normalizedClassNames = classNames.map((name) => ({
    name,
    normalized: normalizeBadgeToken(name),
  }));

  const exact = normalizedClassNames.find((candidate) => candidate.normalized === normalizedBadge);
  if (exact) {
    return { className: exact.name, reason: 'exact' };
  }

  const startsWithMatches = normalizedClassNames.filter(
    (candidate) =>
      normalizedBadge.startsWith(candidate.normalized) ||
      candidate.normalized.startsWith(normalizedBadge)
  );
  if (startsWithMatches.length) {
    const best = startsWithMatches.reduce((current, next) =>
      next.normalized.length > current.normalized.length ? next : current
    );
    return { className: best.name, reason: 'startsWith' };
  }

  const substringMatches = normalizedClassNames.filter(
    (candidate) =>
      normalizedBadge.includes(candidate.normalized) ||
      candidate.normalized.includes(normalizedBadge)
  );
  if (substringMatches.length) {
    const best = substringMatches.reduce((current, next) =>
      next.normalized.length > current.normalized.length ? next : current
    );
    return { className: best.name, reason: 'substring' };
  }

  return { className: classNames[0] || '', reason: 'default' };
}

function applyBadgeClasses(results: ResultMap, badgeCss: string): ResultMap {
  const classNames = parseBadgeClassNames(badgeCss);
  if (!classNames.length) {
    return results;
  }

  Object.values(results).forEach((result) => {
    const normalizedBadge = normalizeBadgeToken(result.badge.text);
    const { className, reason } = resolveBadgeClass(normalizedBadge, classNames);
    if (reason === 'default' && process.env.NODE_ENV !== 'test') {
      logger.warn('Badge class not found; defaulting to first class.', {
        badgeText: result.badge.text,
        normalizedBadge,
        className,
        availableClasses: classNames,
      });
    } else if (reason !== 'exact' && process.env.NODE_ENV !== 'test') {
      logger.warn('Badge class match used fallback strategy.', {
        badgeText: result.badge.text,
        normalizedBadge,
        className,
        reason,
      });
    }
    result.badge.className = className;
  });

  return results;
}

export { applyBadgeClasses, parseBadgeCss };
