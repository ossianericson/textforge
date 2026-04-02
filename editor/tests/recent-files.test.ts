import { describe, expect, it } from 'vitest';
import type { RecentFile } from '@shared/types';

describe('recent-file shape', () => {
  it('contains the required numeric fields', () => {
    const sample: RecentFile = {
      path: 'C:/spec.md',
      title: 'Example',
      lastOpened: Date.now(),
      lastCompiled: Date.now(),
      questionCount: 3,
      resultCount: 4,
      warningCount: 1,
      usageCount: 0,
    };

    expect(typeof sample.lastOpened).toBe('number');
    expect(typeof sample.lastCompiled).toBe('number');
    expect(typeof sample.questionCount).toBe('number');
    expect(typeof sample.resultCount).toBe('number');
    expect(typeof sample.warningCount).toBe('number');
    expect(typeof sample.usageCount).toBe('number');
  });
});
