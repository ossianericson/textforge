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
    goldenSha256: '6571fb724c102696f0f1d97affc7ef2d4e47a40e67ca28fca05d5776236d1c49',
  },
  {
    id: 'public-quiz',
    scope: 'public',
    kind: 'quiz',
    label: 'public azure fundamentals quiz example',
    specPath: path.join(ROOT_DIR, 'quiz', 'public', 'example', 'azure-fundamentals', 'spec.md'),
    templatePath: path.join(ROOT_DIR, 'core', 'quiz-template.html'),
    expectedOutputName: 'example-azure-fundamentals-quiz.html',
    goldenSha256: '7884fdf76b5eecd3f537646fc5d6d4adce818bff906e8d4aad008b482be0b452',
  },
  {
    id: 'public-advanced-tree',
    scope: 'public',
    kind: 'decision-tree',
    label: 'public advanced inputs example',
    specPath: path.join(ROOT_DIR, 'decision-trees', 'public', 'example-advanced-inputs', 'spec.md'),
    expectedOutputName: 'example-advanced-inputs-tree.html',
    goldenSha256: '11cdff114cdf470c3a2f38fc7cdd3cb84ee1f85991ae8c6f165868d97d52bd29',
  },
  {
    id: 'internal-compute-tree',
    scope: 'internal',
    kind: 'decision-tree',
    label: 'internal reference tree',
    specPath: path.join(ROOT_DIR, 'decision-trees', 'internal', 'azure-compute', 'spec.md'),
    expectedOutputName: 'internal-azure-compute-tree.html',
    goldenSha256: 'b334d32e5609794d24a6f21142d9d3bbc5eaf3ddf1d8d32bc712775179795805',
  },
];

export function getBaselineExamples(scope: BaselineScope): BaselineExample[] {
  return BASELINE_EXAMPLES.filter((example) => example.scope === scope);
}
