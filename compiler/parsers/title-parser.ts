import { stripQuotes } from '#parser-utils/text-normalizer';
import type { ParseSpecMetadata, ParseTitle } from './types.js';

const parseTitle: ParseTitle = (lines, limitIndex = lines.length) => {
  let main = '';
  let subtitle = '';

  for (let i = 0; i < Math.min(lines.length, limitIndex); i += 1) {
    const line = lines[i];
    if (!line) {
      continue;
    }
    if (line.trim().startsWith('**Main:**')) {
      const parts = line.split('**Main:**');
      if (parts[1]) {
        main = stripQuotes(parts[1].trim());
      }
    }
    if (line.trim().startsWith('**Subtitle:**')) {
      const parts = line.split('**Subtitle:**');
      if (parts[1]) {
        subtitle = stripQuotes(parts[1].trim());
      }
    }
    if (main && subtitle) {
      break;
    }
  }

  return { main, subtitle };
};

const parseSpecMetadata: ParseSpecMetadata = (lines, limitIndex = lines.length) => {
  let version = '';

  for (let i = 0; i < Math.min(lines.length, limitIndex); i += 1) {
    const line = lines[i];
    if (!line) {
      continue;
    }
    if (line.trim().startsWith('**Version:**')) {
      const parts = line.split('**Version:**');
      if (parts[1]) {
        version = stripQuotes(parts[1].trim());
      }
      break;
    }
  }

  return version ? { version } : {};
};

export { parseSpecMetadata, parseTitle };
