/**
 * editor/src/test/setup.ts
 *
 * Vitest global test setup.
 * Registered via vite.config.ts -> test.setupFiles.
 *
 * - Starts the MSW server before all tests
 * - Resets handlers between tests
 * - Closes the server after all tests
 * - Imports @testing-library/jest-dom matchers
 */

import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
