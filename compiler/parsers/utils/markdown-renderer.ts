import { normalizeText, stripQuotes } from '#parser-utils/text-normalizer';
import type { DocLink, LinkInfo, LinkParseResult } from '../types.js';

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeHref(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes('javascript:')) {
    return '';
  }
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return trimmed.replace(/&quot;|"/g, '%22');
  }

  if (/[\\\s]/.test(trimmed)) {
    return '';
  }

  if (/:/.test(trimmed)) {
    return '';
  }

  if (/^(?:\/|\.{0,2}\/)?[a-z0-9][\w\-./]*?(?:#[\w\-]+)?$/i.test(trimmed)) {
    return trimmed.replace(/&quot;|"/g, '%22');
  }

  return '';
}

function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]/g, '$1');
}

function renderInlineMarkdown(text: string): string {
  if (!text) return '';
  let output = escapeHtml(text);
  output = output.replace(/\[(.+?)\]\((.+?)\)/g, (_match, label, url) => {
    const safeUrl = sanitizeHref(url);
    if (!safeUrl) {
      return label;
    }
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  output = output.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\*(.+?)\*/g, '<em>$1</em>');
  output = output.replace(/`(.+?)`/g, '<code>$1</code>');
  return output;
}

function parseMarkdownLinks(text: string): LinkParseResult {
  const links: LinkInfo[] = [];
  const output = text.replace(/\[(.+?)\]\((.+?)\)/g, (_match, label, url) => {
    links.push({ label, url });
    return label;
  });

  return {
    text: stripMarkdown(output).trim(),
    links,
  };
}

function stripLinks(text: string): LinkParseResult {
  return parseMarkdownLinks(text);
}

function parseInlineList(text: string): string[] {
  const cleaned = normalizeText(stripMarkdown(stripQuotes(text)));
  if (!cleaned) return [];
  const cleanedNoAsterisks = cleaned.replace(/\*/g, '').trim();
  if (!cleanedNoAsterisks) return [];
  const parts = cleaned
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return [cleanedNoAsterisks];
  }
  return parts.map((part) => part.replace(/\*/g, '').trim()).filter(Boolean);
}

function cleanLabel(label: string): string {
  if (!label) return '';
  return normalizeText(stripMarkdown(label)).replace(/\*\*/g, '').trim();
}

function stripResultTitle(title: string): string {
  if (!title) return 'Documentation';
  return normalizeText(title.replace(/\s*\(.*\)\s*$/, '').trim());
}

function parseDocsInline(text: string, title: string): DocLink[] {
  if (!text) return [];

  const docs: DocLink[] = [];
  const trimmed = normalizeText(text.trim());

  const urlWithLabelAfter = trimmed.match(/^(https?:\/\/\S+)\s*\(([^)]+)\)\s*$/i);
  if (urlWithLabelAfter) {
    const url = urlWithLabelAfter[1] || '';
    const label = urlWithLabelAfter[2] || '';
    docs.push({
      label: cleanLabel(label),
      url: url.trim(),
    });
    return docs;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    docs.push({
      label: cleanLabel(`${stripResultTitle(title)} Documentation`),
      url: trimmed,
    });
    return docs;
  }

  const match = trimmed.match(/^([^:]+):\s*(https?:\/\/.+)$/i);
  if (match) {
    const label = match[1] || '';
    const url = match[2] || '';
    docs.push({
      label: cleanLabel(label),
      url: url.trim(),
    });
    return docs;
  }

  const labelWithUrlInParens = trimmed.match(/^(.+?)\s*\((https?:\/\/.+)\)\s*$/i);
  if (labelWithUrlInParens) {
    const label = labelWithUrlInParens[1] || '';
    const url = labelWithUrlInParens[2] || '';
    docs.push({
      label: cleanLabel(label),
      url: url.trim(),
    });
    return docs;
  }

  const urlMatch = trimmed.match(/https?:\/\/\S+/i);
  if (urlMatch) {
    const url = urlMatch[0].replace(/[),.]+$/, '');
    const label = trimmed
      .replace(urlMatch[0], '')
      .replace(/[()]/g, '')
      .replace(/[:\-]/g, '')
      .trim();
    docs.push({
      label:
        cleanLabel(label || `${stripResultTitle(title)} Documentation`) ||
        `${stripResultTitle(title)} Documentation`,
      url,
    });
  }

  return docs;
}

export { parseDocsInline, parseInlineList, renderInlineMarkdown, stripLinks, stripMarkdown };
