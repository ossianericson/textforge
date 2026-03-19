import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLogger } from '#logger';

function captureStdout(run: () => void): string {
  const chunks: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((
    chunk: string | Uint8Array,
    encoding?: BufferEncoding | ((err?: Error) => void),
    callback?: (err?: Error) => void
  ) => {
    chunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
    if (typeof encoding === 'function') {
      encoding();
    } else if (typeof callback === 'function') {
      callback();
    }
    return true;
  }) as typeof process.stdout.write;

  try {
    run();
  } finally {
    process.stdout.write = originalWrite;
  }

  return chunks.join('');
}

test('logger: emits JSON payload with meta', () => {
  const previousLevel = process.env.LOG_LEVEL;
  const previousFormat = process.env.LOG_FORMAT;

  process.env.LOG_LEVEL = 'info';
  process.env.LOG_FORMAT = 'json';

  const output = captureStdout(() => {
    const logger = createLogger({ component: 'tests' });
    logger.info('hello', { requestId: 'abc' });
  });

  const payload = JSON.parse(output.trim());
  assert.equal(payload.level, 'info');
  assert.equal(payload.message, 'hello');
  assert.equal(payload.component, 'tests');
  assert.equal(payload.requestId, 'abc');

  process.env.LOG_LEVEL = previousLevel;
  process.env.LOG_FORMAT = previousFormat;
});

test('logger: respects log level filtering', () => {
  const previousLevel = process.env.LOG_LEVEL;
  const previousFormat = process.env.LOG_FORMAT;

  process.env.LOG_LEVEL = 'error';
  process.env.LOG_FORMAT = 'json';

  const output = captureStdout(() => {
    const logger = createLogger();
    logger.info('skip');
  });

  assert.equal(output.trim(), '');

  process.env.LOG_LEVEL = previousLevel;
  process.env.LOG_FORMAT = previousFormat;
});

test('logger: serializes error objects in meta', () => {
  const previousLevel = process.env.LOG_LEVEL;
  const previousFormat = process.env.LOG_FORMAT;
  const previousJson = process.env.LOG_JSON;

  process.env.LOG_LEVEL = 'error';
  process.env.LOG_FORMAT = 'json';

  const output = captureStdout(() => {
    const logger = createLogger();
    logger.error('oops', new Error('boom'));
  });

  const payload = JSON.parse(output.trim());
  assert.equal(payload.level, 'error');
  assert.equal(payload.message, 'oops');
  assert.ok(payload.error);
  assert.equal(payload.error.message, 'boom');

  process.env.LOG_LEVEL = previousLevel;
  process.env.LOG_FORMAT = previousFormat;
  process.env.LOG_JSON = previousJson;
});

test('logger: falls back to info on invalid log level', () => {
  const previousLevel = process.env.LOG_LEVEL;
  const previousFormat = process.env.LOG_FORMAT;

  process.env.LOG_LEVEL = 'nope';
  process.env.LOG_FORMAT = 'json';

  const output = captureStdout(() => {
    const logger = createLogger();
    logger.info('hello');
  });

  const payload = JSON.parse(output.trim());
  assert.equal(payload.level, 'info');

  process.env.LOG_LEVEL = previousLevel;
  process.env.LOG_FORMAT = previousFormat;
});

test('logger: supports LOG_JSON and non-object meta', () => {
  const previousLevel = process.env.LOG_LEVEL;
  const previousFormat = process.env.LOG_FORMAT;
  const previousJson = process.env.LOG_JSON;

  process.env.LOG_LEVEL = 'info';
  process.env.LOG_FORMAT = '';
  process.env.LOG_JSON = 'true';

  const output = captureStdout(() => {
    const logger = createLogger();
    logger.info('hello', 'detail');
  });

  const payload = JSON.parse(output.trim());
  assert.equal(payload.detail, 'detail');

  process.env.LOG_LEVEL = previousLevel;
  process.env.LOG_FORMAT = previousFormat;
  process.env.LOG_JSON = previousJson;
});
