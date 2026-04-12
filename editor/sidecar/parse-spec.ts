/**
 * Sidecar: parse-spec
 * Usage: tsx sidecar/parse-spec.ts <absolute-path-to-spec.md>
 * Writes ParsedSpec JSON to stdout. On error writes { "error": "..." }
 * and exits with code 1.
 */
import { readFileSync } from 'node:fs';
import { createParsers } from '../../compiler/parsers/factory.ts';

const specPath = process.argv[2];

if (!specPath) {
  process.stdout.write(JSON.stringify({ error: 'No spec path provided' }));
  process.exit(1);
}

try {
  const content = readFileSync(specPath, 'utf-8');
  const lines = content.split('\n');
  const parsers = createParsers();
  const indices = parsers.findSectionIndices(lines);
  const title = parsers.parseTitle(lines, indices.flowStart);
  const metadata = parsers.parseSpecMetadata(lines, indices.flowStart);
  const progressSteps = parsers.parseProgressSteps(lines, indices.progressStart);
  const questions = parsers.parseQuestions(lines, indices.flowStart, indices.resultStart);
  const results = parsers.parseResults(lines, indices.resultStart, lines.length);
  process.stdout.write(JSON.stringify({ title, metadata, progressSteps, questions, results }));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stdout.write(JSON.stringify({ error: message }));
  process.exit(1);
}