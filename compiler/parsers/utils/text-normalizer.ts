const CP1252_CHAR_TO_BYTE: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

function decodeCp1252ToUtf8(text: string): string | null {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined) {
      continue;
    }
    if (code <= 0xff) {
      bytes.push(code);
      continue;
    }
    const mapped = CP1252_CHAR_TO_BYTE[code];
    if (mapped === undefined) {
      return null;
    }
    bytes.push(mapped);
  }

  return Buffer.from(bytes).toString('utf8');
}

function isOddBoldCount(text: string): boolean {
  const matches = text.match(/\*\*/g);
  if (!matches) return false;
  return matches.length % 2 === 1;
}

function trimWrappingQuotes(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length < 2) return trimmed;
  const starts = trimmed.startsWith('"') && trimmed.endsWith('"');
  const startsCurly = trimmed.startsWith('“') && trimmed.endsWith('”');
  if (starts || startsCurly) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function stripQuotes(value: string): string {
  if (!value) return '';
  return value
    .replace(/^"+|"+$/g, '')
    .replace(/^“+|”+$/g, '')
    .trim();
}

function normalizeText(text: string): string {
  if (!text) return '';
  if (!/[ÃÂâ€™â€œâ€�â€“â€”â€¦ðŸ]/.test(text)) {
    return text;
  }
  const converted = decodeCp1252ToUtf8(text);
  if (!converted || /�/.test(converted)) {
    return text;
  }
  return converted;
}

function stripEdgeNoise(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^[\s\uFEFF\u00A0]+/, '');
  cleaned = trimWrappingQuotes(cleaned);
  cleaned = cleaned
    .replace(/^["“”]+/, '')
    .replace(/["“”]+$/, '')
    .trim();
  return cleaned;
}

function cleanInlineText(text: string): string {
  if (!text) return '';
  let cleaned = normalizeText(text);
  cleaned = cleaned.replace(/\*\*\s*["“”]?\s*\*\*/g, '');
  cleaned = cleaned.replace(/\*\*"/g, '**').replace(/"\*\*/g, '**');
  cleaned = cleaned.replace(/\*\*“/g, '**').replace(/”\*\*/g, '**');
  cleaned = stripEdgeNoise(cleaned);
  if (isOddBoldCount(cleaned)) {
    cleaned = cleaned.replace(/\*\*/g, '').trim();
  }
  return cleaned;
}

function extractAfterColon(line: string): string {
  const index = line.indexOf(':');
  if (index === -1) return '';
  return line.slice(index + 1).trim();
}

export { cleanInlineText, extractAfterColon, normalizeText, stripQuotes };
