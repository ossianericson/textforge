import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_RENDERER_TEMPLATE_PATH = path.resolve(
  __dirname,
  '..',
  'renderers',
  'html',
  'default-v1',
  'template.html'
);
