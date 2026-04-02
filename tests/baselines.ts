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
    goldenSha256: 'e2e62295d5645bd649749eaf3ede155a7965ad9bf47c8cbee1dd4222b0f8bbd4',
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
    goldenSha256: '432b51b529e7df23d282f1b3f9553250788877e012fba7b2c5f200a698429a9c',
  },
  {
    id: 'internal-compute-tree',
    scope: 'internal',
    kind: 'decision-tree',
    label: 'internal reference tree',
    specPath: path.join(ROOT_DIR, 'decision-trees', 'internal', 'azure-compute', 'spec.md'),
    expectedOutputName: 'internal-azure-compute-tree.html',
    goldenSha256: '511a9cc5c5924732e56715a64a3f169eec700a0c0675821cb16d4dc869117d8d',
  },
];

export function getBaselineExamples(scope: BaselineScope): BaselineExample[] {
  return BASELINE_EXAMPLES.filter((example) => example.scope === scope);
}
