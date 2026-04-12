export type EditorEventType =
  | 'step.started'
  | 'step.completed'
  | 'step.failed'
  | 'tool.called'
  | 'tool.result'
  | 'compile.started'
  | 'compile.saving'
  | 'compile.validating'
  | 'compile.compiling'
  | 'compile.verifying'
  | 'compile.completed'
  | 'compile.failed'
  | 'validate.started'
  | 'validate.completed'
  | 'validate.failed'
  | 'ai.started'
  | 'ai.completed'
  | 'ai.failed'
  | 'auth.started'
  | 'auth.completed'
  | 'auth.failed'
  | 'file.saved'
  | 'file.changed'
  | 'file.reloaded';

export interface EditorEvent {
  type: EditorEventType;
  timestamp: number;
  source: string;
  payload: Record<string, unknown>;
}

type EventListener = (event: EditorEvent) => void;

const listeners = new Set<EventListener>();
const recentEvents: EditorEvent[] = [];
const MAX_RECENT = 200;

export function emitEvent(
  type: EditorEventType,
  source: string,
  payload: Record<string, unknown> = {}
): void {
  const event: EditorEvent = {
    type,
    timestamp: Date.now(),
    source,
    payload,
  };

  recentEvents.push(event);
  if (recentEvents.length > MAX_RECENT) {
    recentEvents.splice(0, recentEvents.length - MAX_RECENT);
  }

  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Listener failures should not break event delivery.
    }
  }
}

export function onEvent(listener: EventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRecentEvents(count = 50): EditorEvent[] {
  return recentEvents.slice(-count);
}

export function getEventCounts(): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const event of recentEvents) {
    counts[event.type] = (counts[event.type] ?? 0) + 1;
  }

  return counts;
}

export function clearEvents(): void {
  recentEvents.length = 0;
}
