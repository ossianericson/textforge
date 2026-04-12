type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown> | Error | unknown;

interface SerializedError {
  name?: string;
  message?: string;
  code?: string;
  stack?: string;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return (LEVELS as Record<string, number>)[raw] ? (raw as LogLevel) : 'info';
}

function useJsonLogs(): boolean {
  return process.env.LOG_FORMAT === 'json' || process.env.LOG_JSON === 'true';
}

function serializeError(error: unknown): SerializedError | null {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const err = error as { name?: string; message?: string; code?: string; stack?: string };
  const serialized: SerializedError = {};
  if (err.name) {
    serialized.name = err.name;
  }
  if (err.message) {
    serialized.message = err.message;
  }
  if (err.code) {
    serialized.code = err.code;
  }
  if (err.stack) {
    serialized.stack = err.stack;
  }
  return serialized;
}

function normalizeMeta(meta: LogMeta): Record<string, unknown> {
  if (!meta) return {};
  if (meta instanceof Error) {
    return { error: serializeError(meta) };
  }
  if (typeof meta !== 'object') {
    return { detail: meta };
  }

  const next = { ...(meta as Record<string, unknown>) };
  if (next.error instanceof Error) {
    next.error = serializeError(next.error);
  }
  return next;
}

export function createLogger(baseMeta: Record<string, unknown> = {}) {
  const levelName = resolveLevel();
  const minLevel = LEVELS[levelName];

  function log(level: LogLevel, message: string, meta?: LogMeta) {
    if (LEVELS[level] < minLevel) {
      return;
    }

    const payload = {
      time: new Date().toISOString(),
      level,
      message,
      ...normalizeMeta(baseMeta),
      ...normalizeMeta(meta),
    };

    if (useJsonLogs()) {
      process.stdout.write(`${JSON.stringify(payload)}\n`);
      return;
    }

    const { time, level: lvl, message: msg, ...rest } = payload;
    const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
    process.stdout.write(`${time} [${lvl.toUpperCase()}] ${msg}${extra}\n`);
  }

  return {
    debug: (message: string, meta?: LogMeta) => log('debug', message, meta),
    info: (message: string, meta?: LogMeta) => log('info', message, meta),
    warn: (message: string, meta?: LogMeta) => log('warn', message, meta),
    error: (message: string, meta?: LogMeta) => log('error', message, meta),
    child: (meta: Record<string, unknown>) =>
      createLogger({ ...normalizeMeta(baseMeta), ...normalizeMeta(meta) }),
  };
}

export const logger = createLogger();
