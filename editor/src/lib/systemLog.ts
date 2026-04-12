export interface SystemLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  action: string;
  detail?: string;
  duration_ms?: number;
  success?: boolean;
}

const logBuffer: SystemLogEntry[] = [];
const MAX_LOG_ENTRIES = 500;

export function systemLog(
  level: SystemLogEntry['level'],
  category: string,
  action: string,
  extra: Partial<Pick<SystemLogEntry, 'detail' | 'duration_ms' | 'success'>> = {}
): void {
  const entry: SystemLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    action,
    ...extra,
  };

  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_ENTRIES) {
    logBuffer.splice(0, logBuffer.length - MAX_LOG_ENTRIES);
  }

  if (import.meta.env.DEV) {
    const detail = extra.detail ? ` ${extra.detail}` : '';
    console.log(`[system:${level}] [${category}] ${action}${detail}`);
  }
}

export function getSystemLog(): SystemLogEntry[] {
  return [...logBuffer];
}

export function queryLog(filter: {
  category?: string;
  level?: SystemLogEntry['level'];
  since?: string;
}): SystemLogEntry[] {
  return logBuffer.filter((entry) => {
    if (filter.category && entry.category !== filter.category) {
      return false;
    }
    if (filter.level && entry.level !== filter.level) {
      return false;
    }
    if (filter.since && entry.timestamp < filter.since) {
      return false;
    }
    return true;
  });
}

export function getSessionMetrics(): {
  totalEntries: number;
  errorCount: number;
  categories: Record<string, number>;
  avgDuration: Record<string, number>;
} {
  const categories: Record<string, number> = {};
  const durations: Record<string, number[]> = {};
  let errorCount = 0;

  for (const entry of logBuffer) {
    categories[entry.category] = (categories[entry.category] ?? 0) + 1;
    if (entry.level === 'error') {
      errorCount += 1;
    }
    if (entry.duration_ms !== undefined) {
      (durations[entry.category] ??= []).push(entry.duration_ms);
    }
  }

  const avgDuration: Record<string, number> = {};
  for (const [category, values] of Object.entries(durations)) {
    avgDuration[category] = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  return {
    totalEntries: logBuffer.length,
    errorCount,
    categories,
    avgDuration,
  };
}

export function clearSystemLog(): void {
  logBuffer.length = 0;
}
