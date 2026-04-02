/**
 * editor/src/test/server.ts
 *
 * Shared MSW server for component tests.
 *
 * Usage in a test file:
 *
 *   import { server } from '../test/server';
 *   import { http, HttpResponse } from 'msw';
 *
 *   server.use(
 *     http.post('https://api.openai.com/v1/chat/completions', () =>
 *       HttpResponse.json({ choices: [{ message: { content: 'ok' } }] })
 *     )
 *   );
 *
 * The server is started/reset/stopped automatically via setup.ts.
 * You only need to call server.use() for per-test or per-file overrides.
 */

import { setupServer } from 'msw/node';

export const server = setupServer();
