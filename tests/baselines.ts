import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type BaselineScope = 'public' | 'internal';
export type BaselineKind = 'decision-tree' | 'quiz';

export interface BaselineExample {
  id: string;
  scope: BaselineScope;
  kind: BaselineKind;
  label: string;
  specPath: string;
  templatePath?: string;
  expectedOutputName: string;
  goldenSha256?: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

export const BASELINE_EXAMPLES: BaselineExample[] = [
  {
    id: 'public-compute-tree',
    scope: 'public',
    kind: 'decision-tree',
    label: 'public compute example',
    specPath: path.join(
      ROOT_DIR,
      'decision-trees',
      'public',
      'example-multicloud-compute',
      'spec.md'
    ),
    expectedOutputName: 'example-multicloud-compute-tree.html',
    goldenSha256: 'b047c01ae4b48d017b56ef118b7fd6b9b47bea67c15dec9636a3a717129d3130',
  },
  {
    id: 'public-quiz',
    scope: 'public',
    kind: 'quiz',
    label: 'public quiz example',
    specPath: path.join(ROOT_DIR, 'quiz', 'public', 'example', 'spec.md'),
    templatePath: path.join(ROOT_DIR, 'core', 'quiz-template.html'),
    expectedOutputName: 'example-quiz.html',
    goldenSha256: 'a0d51a454f24ad02d0f9570bdd90be5a5bc1d1c4c028d68bb9248e2294b72800',
  },
  {
    id: 'public-advanced-tree',
    scope: 'public',
    kind: 'decision-tree',
    label: 'public advanced inputs example',
    specPath: path.join(ROOT_DIR, 'decision-trees', 'public', 'example-advanced-inputs', 'spec.md'),
    expectedOutputName: 'example-advanced-inputs-tree.html',
  },
  {
    id: 'internal-compute-tree',
    scope: 'internal',
    kind: 'decision-tree',
    label: 'internal reference tree',
    specPath: path.join(ROOT_DIR, 'decision-trees', 'internal', 'azure-compute', 'spec.md'),
    expectedOutputName: 'internal-azure-compute-tree.html',
  },
];

export function getBaselineExamples(scope: BaselineScope): BaselineExample[] {
  return BASELINE_EXAMPLES.filter((example) => example.scope === scope);
}
