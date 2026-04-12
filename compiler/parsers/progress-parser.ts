import type { FindSectionIndices, ParseProgressSteps, ProgressSteps } from './types.js';

const parseProgressSteps: ParseProgressSteps = (lines, startIndex = 0) => {
  const progressSteps: ProgressSteps = {};
  let inBlock = false;

  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i] || '';
    if (line.trim().startsWith('```javascript')) {
      inBlock = true;
      continue;
    }
    if (inBlock && line.trim().startsWith('```')) {
      inBlock = false;
      continue;
    }
    if (!inBlock) {
      continue;
    }

    const match = line.match(/['"]?([a-z0-9]+)['"]?\s*:\s*(\d+)/i);
    if (match && match[1]) {
      progressSteps[match[1]] = Number(match[2] || 0);
    }
  }

  return progressSteps;
};

const findSectionIndices: FindSectionIndices = (lines) => {
  const flowStart = lines.findIndex(
    (line) => line.trim().toLowerCase() === '## decision tree flow'
  );
  const resultStart = lines.findIndex((line) =>
    line.trim().toLowerCase().startsWith('## result cards')
  );
  const progressStart = lines.findIndex((line) =>
    line.trim().toLowerCase().startsWith('## progress steps')
  );

  return {
    flowStart,
    resultStart,
    progressStart,
  };
};

export { findSectionIndices, parseProgressSteps };
