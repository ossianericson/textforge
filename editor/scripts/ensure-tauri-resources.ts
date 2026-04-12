import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const editorRoot = path.resolve(scriptDir, '..');
const binariesDir = path.resolve(editorRoot, 'src-tauri', 'binaries');
const placeholderPath = path.join(binariesDir, '.dev-placeholder');

mkdirSync(binariesDir, { recursive: true });

if (!existsSync(placeholderPath)) {
  writeFileSync(placeholderPath, 'Development placeholder for Tauri resources.\n', 'utf8');
}
