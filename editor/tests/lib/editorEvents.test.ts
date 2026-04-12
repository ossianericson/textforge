import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearEvents,
  emitEvent,
  getEventCounts,
  getRecentEvents,
  onEvent,
} from '@/lib/editorEvents';

describe('editorEvents', () => {
  beforeEach(() => {
    clearEvents();
  });

  it('emits events to listeners', () => {
    const received: string[] = [];
    const unsubscribe = onEvent((event) => received.push(event.type));

    emitEvent('compile.started', 'compile', { path: '/test' });
    emitEvent('compile.completed', 'compile', {});

    expect(received).toEqual(['compile.started', 'compile.completed']);
    unsubscribe();
  });

  it('stores recent events', () => {
    emitEvent('file.saved', 'file', { path: '/test' });

    const recent = getRecentEvents();
    expect(recent).toHaveLength(1);
    expect(recent[0].type).toBe('file.saved');
    expect(recent[0].source).toBe('file');
  });

  it('counts events by type', () => {
    emitEvent('compile.started', 'compile');
    emitEvent('compile.completed', 'compile');
    emitEvent('compile.started', 'compile');

    const counts = getEventCounts();
    expect(counts['compile.started']).toBe(2);
    expect(counts['compile.completed']).toBe(1);
  });

  it('unsubscribe stops delivery', () => {
    const received: string[] = [];
    const unsubscribe = onEvent((event) => received.push(event.type));

    unsubscribe();
    emitEvent('file.saved', 'file');

    expect(received).toEqual([]);
  });

  it('listener errors do not break other listeners', () => {
    const received: string[] = [];
    onEvent(() => {
      throw new Error('boom');
    });
    onEvent((event) => received.push(event.type));

    emitEvent('file.saved', 'file');

    expect(received).toEqual(['file.saved']);
  });
});
