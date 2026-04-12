import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSystemLog,
  getSessionMetrics,
  getSystemLog,
  queryLog,
  systemLog,
} from '@/lib/systemLog';

describe('systemLog', () => {
  beforeEach(() => {
    clearSystemLog();
  });

  it('logs entries', () => {
    systemLog('info', 'compile', 'Compile started');

    const log = getSystemLog();
    expect(log).toHaveLength(1);
    expect(log[0].category).toBe('compile');
    expect(log[0].action).toBe('Compile started');
  });

  it('queries by category', () => {
    systemLog('info', 'compile', 'Compile started');
    systemLog('error', 'ai', 'AI failed');
    systemLog('info', 'compile', 'Compile completed');

    const compileLog = queryLog({ category: 'compile' });
    expect(compileLog).toHaveLength(2);

    const errorLog = queryLog({ level: 'error' });
    expect(errorLog).toHaveLength(1);
    expect(errorLog[0].category).toBe('ai');
  });

  it('computes session metrics', () => {
    systemLog('info', 'compile', 'Compile started');
    systemLog('info', 'compile', 'Compile completed', { duration_ms: 1200, success: true });
    systemLog('error', 'ai', 'AI failed', { success: false });

    const metrics = getSessionMetrics();
    expect(metrics.totalEntries).toBe(3);
    expect(metrics.errorCount).toBe(1);
    expect(metrics.categories.compile).toBe(2);
    expect(metrics.avgDuration.compile).toBe(1200);
  });
});