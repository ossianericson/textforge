const ALLOWED_PROTOCOLS = new Set(['https:', 'http:']);

export function sanitizeUrl(raw: string): string {
  const trimmed = String(raw || '').trim();

  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return '#blocked-url';
  }

  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return '#blocked-url';
    }
    return parsed.href;
  } catch {
    if (trimmed.startsWith('#') || trimmed.startsWith('/')) {
      return trimmed;
    }
    return '#blocked-url';
  }
}

export function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
