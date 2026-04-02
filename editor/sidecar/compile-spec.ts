/**
 * Sidecar: compile-spec
 * Usage: tsx sidecar/compile-spec.ts <absolute-path-to-spec.md>
 *        <absolute-path-to-output.html>
 * Calls compileDecisionTree(), writes HTML to the output path,
 * then writes the output path to stdout on success.
 * On error writes { "error": "..." } and exits with code 1.
 */
import { compileDecisionTree } from '../../compiler/index.ts';

const [, , specPath, outputPath] = process.argv;

if (!specPath || !outputPath) {
  process.stdout.write(JSON.stringify({ error: 'Usage: compile-spec <specPath> <outputPath>' }));
  process.exit(1);
}

try {
  compileDecisionTree({ specPath, outputPath });
  process.stdout.write(outputPath);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stdout.write(JSON.stringify({ error: message }));
  process.exit(1);
}