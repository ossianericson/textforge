/**
 * Pure utilities for the compile pipeline.
 * No side effects. All functions are exported for testing.
 */

export function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function hashSpecPath(specFilePath: string): string {
  const normalized = normalizePath(specFilePath);
  let hash = 0x811c9dc5;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

function isAbsolutePath(filePath: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(filePath) || filePath.startsWith('/') || filePath.startsWith('\\\\');
}

/**
 * Derive the HTML output path for a given spec file and title.
 * Writes compiled output to a stable per-user cache directory.
 */
export function buildOutputPath(compiledRoot: string, specFilePath: string, title: string): string {
  const slug = slugifyTitle(title) || 'compiled';
  const normalizedSpecPath = normalizePath(specFilePath);
  const normalizedCompiledRoot = normalizePath(compiledRoot);

  if (!isAbsolutePath(specFilePath)) {
    throw new Error(
      `Spec path '${specFilePath}' must be absolute before compiling.`
    );
  }

  if (!normalizedCompiledRoot) {
    throw new Error('Compiled output root is empty.');
  }

  const specHash = hashSpecPath(normalizedSpecPath);
  const candidate = `${normalizedCompiledRoot}/${specHash}/${slug}-tree.html`;

  if (candidate.toLowerCase() === normalizedSpecPath.toLowerCase()) {
    throw new Error(
      `Computed output path equals the spec source path ('${candidate}'). This would overwrite the spec. Please report this as a bug.`
    );
  }

  return candidate;
}

export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/\/+$/, '');
}

export function getParentPath(filePath: string): string {
  const normalized = normalizePath(filePath);
  const lastSeparator = normalized.lastIndexOf('/');

  if (lastSeparator <= 0) {
    return normalized;
  }

  return normalized.slice(0, lastSeparator);
}

export function isPathInside(root: string, candidate: string): boolean {
  const normalizedRoot = normalizePath(root);
  const normalizedCandidate = normalizePath(candidate);
  return (
    normalizedCandidate === normalizedRoot ||
    normalizedCandidate.startsWith(`${normalizedRoot}/`)
  );
}

export function isValidCompiledHtml(html: string): boolean {
  const trimmed = html.trimStart();
  return (
    trimmed.length > 500 &&
    (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) &&
    trimmed.includes('</html>')
  );
}

export function friendlyCompileError(raw: string): string {
  const normalized = raw.toLowerCase();

  if (
    normalized.includes('tsx not found') ||
    normalized.includes('npm install') ||
    normalized.includes('local tsx cli n')
  ) {
    return (
      'The compiler could not start - tsx was not found. Open a terminal in the editor/ directory and run: npm install Then restart the editor.'
    );
  }
  if (
    normalized.includes('failed to start') ||
    normalized.includes('failed to spawn') ||
    normalized.includes('enoent')
  ) {
    return (
      'The compiler process could not start. Ensure Node.js 22 or later is installed and visible in your PATH, then restart the editor.'
    );
  }
  if (normalized.includes('timed out') || normalized.includes('did not complete within')) {
    return raw.replace(/\s+/g, ' ').trim();
  }
  if (normalized.includes('cannot resolve') && normalized.includes('root')) {
    return (
      'The editor could not locate the textforge repository. Open a spec file first - the editor will then find the repo automatically.'
    );
  }
  if (
    normalized.includes('access denied') ||
    normalized.includes('eacces') ||
    normalized.includes('permission denied')
  ) {
    return (
      "The compiler was blocked from writing output files. Check that the spec's folder is not read-only and that antivirus software is not blocking the textforge directory. Adding it to the exclusion list may help."
    );
  }
  if (normalized.includes('no questions found') || (normalized.includes('flow') && normalized.includes('empty'))) {
    return (
      'Your spec has no questions. Add a ## FLOW section with at least one question block (for example: ### q1) and compile again.'
    );
  }
  if (normalized.includes('no results found') || (normalized.includes('result') && normalized.includes('empty'))) {
    return (
      'Your spec has no result cards. Add a ## RESULTS section with at least one result card and compile again.'
    );
  }
  if (
    normalized.includes('navigation') ||
    normalized.includes('unknown target') ||
    normalized.includes('broken link')
  ) {
    return (
      'A question option points to a question or result that does not exist. Open Validation (Tools -> Validate) to find the broken link.'
    );
  }
  if (
    normalized.includes('title') &&
    (normalized.includes('missing') ||
      normalized.includes('undefined') ||
      normalized.includes('empty'))
  ) {
    return (
      'The spec is missing a title. The first line must be a top-level heading - for example: # My Decision Tree'
    );
  }
  if (
    normalized.includes('zod') ||
    normalized.includes('schema') ||
    normalized.includes('parse error')
  ) {
    return (
      'The spec has a structural problem that prevented compilation. Open Validation (Tools -> Validate) to see the details.'
    );
  }
  if (
    normalized.includes('output empty') ||
    normalized.includes('invalid html') ||
    normalized.includes('no doctype')
  ) {
    return (
      'The compiler ran but produced no output. This usually means the spec has a structural issue. Open Validation (Tools -> Validate) to check for warnings.'
    );
  }

  const clean = raw.replace(/\s+/g, ' ').trim();
  return clean.length > 400 ? `${clean.slice(0, 400)}...` : clean;
}