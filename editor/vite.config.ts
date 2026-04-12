import path from 'node:path';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@shared', replacement: path.resolve(__dirname, 'shared') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      {
        find: /^#compiler\/(.*)$/,
        replacement: path.resolve(__dirname, '../compiler/$1.ts'),
      },
      {
        find: /^#parsers\/(.*)$/,
        replacement: path.resolve(__dirname, '../compiler/parsers/$1.ts'),
      },
      {
        find: /^#parser-utils\/(.*)$/,
        replacement: path.resolve(__dirname, '../compiler/parsers/utils/$1.ts'),
      },
      { find: '#config', replacement: path.resolve(__dirname, '../config.ts') },
      { find: '#logger', replacement: path.resolve(__dirname, '../logger.ts') },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome105', 'safari15'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: Boolean(process.env.TAURI_DEBUG),
  },
});
