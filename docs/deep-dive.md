# textforge Deep Dive

This document collects the detailed workflow, architecture, and troubleshooting guidance for textforge.

Related references:

- [decision-tree.rules.md](../decision-tree.rules.md)
- [core/style-guide.md](../core/style-guide.md)

## Origin and Philosophy

textforge started as a small experiment: use AI to design a better interactive learning tool, then keep the useful result and remove AI from runtime entirely.

The project principle is simple:

> _If you can't reproduce it, you don't own it._

AI can help during design and development, but the delivered artifact should stay deterministic, inspectable, and reproducible.

For the architectural philosophy behind that approach, see [The Spec Is the Product. The Model Is Scaffolding.](https://medium.com/@ossian.ericson/the-spec-is-the-product-the-model-is-scaffolding-a78029c0062b).

## Deterministic Workflow

Use [README.md](../README.md) for the supported commands and [decision-tree.rules.md](../decision-tree.rules.md) for authoring rules.

Notes:

- Badge colors are defined in [core/badges.yml](../core/badges.yml).
- Generator prompts live in [docs/generators](../docs/generators/).

## Repository Structure

```text
textforge/
├── decision-trees/
│   ├── internal/
│   └── public/
├── quiz/
│   ├── internal/ (optional)
│   └── public/
├── docs/
│   ├── deep-dive.md
│   ├── generators/
│   └── readme/
├── compiler/
├── core/
├── dist/
│   └── public-export/
├── output/
├── renderers/
├── scripts/
└── tools/
```

Notes:

- `README.md` in the internal source repo is generated from `docs/readme/shared.md` plus `docs/readme/internal.md`.
- The public export writes its own generated `README.md` from `docs/readme/shared.md` plus `docs/readme/public.md`.
- `dist/public-export/` is a generated release snapshot, not an authoring location.

## Compiler Flow

```mermaid
flowchart LR
   Spec[spec.md] --> Parsers[TypeScript parsers]
   Parsers --> Json[parsed JSON]
   Json --> Zod[Zod validation]
   Zod --> Template[Handlebars template]
   Template --> Html[HTML output]
   Badges[badges.yml] --> Template
```

## TypeScript Pipeline

The compiler and parser pipeline are fully TypeScript and compile to dist/ for runtime use. Source lives under compiler/, and build output lives under dist/.

Quiz output mode is a secondary example output type. See the README for the current public example command and output location.

Renderer templates now live under `renderers/`, with `html/default-v1` as the default profile unless a topic or environment override selects something else.

---

## Generator Prompts

Reusable AI generator prompts live in `docs/generators/`:

| File                                     | Purpose                           |
| ---------------------------------------- | --------------------------------- |
| `decision-tree-spec-generator-prompt.md` | Generate a new decision tree spec |
| `quiz-spec-generator-prompt.md`          | Generate a quiz or study set spec |

Per-tree author notes can live outside the public boundary when needed.

## Tools

The validator lives in [tools/validate-spec.ts](../tools/validate-spec.ts) and compiles to dist/ for runtime use.

Checks:

- Arrow syntax (→ only, not -> or =>)
- Navigation target format (`go to` or `result:` prefix)
- Question ID format (q1, q2a — no underscores or dashes)
- Result ID format (result-servicename — lowercase, hyphens only)
- Required result sections (Best For, Key Benefits, Considerations, When NOT to use, Tech Tags, Additional Considerations)
- "I don't know"/"Unsure" option on button questions
- Info Box placement above Options
- Link formatting and navigation consistency
- Underscores in navigation targets
- progressSteps start/end values and even spacing to 80%
- UTF-8 without BOM
- Version header format
- Dropdown range contiguity (no gaps, no overlaps)
- Dropdown range target format

```bash
npm run validate:spec
npm run validate:spec:fix
```

Husky + lint-staged enforce ESLint and Prettier on staged source files. Run `npm run validate:spec` manually before committing spec changes.

## UX Enhancements (Optional)

- Dropdown questions: add `**Type**: dropdown` and a `**Dropdown**:` block with `Range:` lines.
- Search tags: add `**Search Tags:**` on result cards to improve search matching.
- Deep links: the template writes the navigation path into the URL hash; result cards include a “Copy Link” button.
- Validator checks dropdown ranges for overlaps and gaps.

## Output Directory Convention

```text
output/
├── example-multicloud-compute-tree.html
├── example-quiz.html
├── internal-azure-compute-tree.html
└── ...
```

See [decision-tree.rules.md](../decision-tree.rules.md) for the validation checklist.

## Production Workflow

1. Scaffold or edit a spec under `decision-trees/internal/` or `decision-trees/public/`
2. Run `npm run validate:spec`
3. Compile one topic with `npm run compile:topic -- <scope>/<topic>` or rebuild everything with `npm run compile`
4. Review the generated HTML under `output/` against [decision-tree.rules.md](../decision-tree.rules.md)
5. Run `npm test`
6. Run `npm run verify:public-examples` if you changed shipped public examples
7. Use `npm run export:public` when preparing a public release

## Test Strategy

The repository uses an 80% coverage gate for lines, functions, branches, and statements through `npm run test:coverage`.

The test layout is intentionally split:

- Shared compiler tests live under `tests/*.test.ts`. They cover compiler behavior and ship in the public export.
- Curated public baseline verification lives under `tests/public/` and runs via `npm run verify:public-examples`.
- Internal-only checks live under `tests/internal/`. They validate repository-specific artifacts or curated internal references and do not ship in the public export.

This gives the repo two aligned workflows:

- Internal source repo: `npm test` runs the shared compiler suite plus the internal artifact guardrail.
- Public export: `npm test` runs the shared compiler suite only, but still keeps the same 80% coverage gate via `npm run test:coverage`.

Baseline example verification is curated:

- `npm run verify:public-examples` runs the curated public baseline examples and their golden snapshot checks.
- `npm run verify:internal-examples` compiles the curated internal reference examples in the source repository.

The curated references themselves are defined in `tests/baselines.ts`, which keeps the example list in one place instead of scattering hardcoded paths across multiple tests.

That keeps two separate goals clear:

- enforced coverage and compiler regression checks stay stable
- example-tree verification is available out of the box without making every newly added tree a gating failure

For a brand-new tree, the expected manual verification path is:

```bash
npm run validate:spec
npm run compile:topic -- internal/<topic>
```

Use `public/<topic>` instead of `internal/<topic>` when working on a public example tree.

`npm run export:public` is intentionally structure-first:

1. It verifies the command is running from the internal source repository.
2. It copies only an explicit public allowlist into `dist/public-export/`.
3. It writes the public `README.md` directly into the export snapshot.
4. It writes a reduced public `package.json` from an allowlist of scripts.
5. It scans the staged export for blocked internal strings.
6. It validates the generated export by running `npm install`, `npm run build`, `npm run compile`, `npm test`, `npm run verify:public-examples`, and `npm run validate:spec` inside `dist/public-export/`.

## Troubleshooting

Common issues:

- Wrong arrow token (use U+2192 instead of -> or =>)
- Missing required sections in a result card
- Invalid IDs (q2_a, result_Service)
- Encoding issues (use UTF-8 without BOM)

### Platform Notes

**M1/M2 Mac:** Use `nvm` with the ARM-native Node.js build. If `npm install` hangs, run
`arch -arm64 npm install`. Verify with `node -e "console.log(process.arch)"` - expect `arm64`.

**Windows WSL2:** Set `git config core.autocrlf false` before cloning. If Husky hooks
fail with "permission denied", run `chmod +x .husky/*` inside WSL2. Prefer WSL2 if you want a Linux-like shell environment for hooks and line-ending behavior, but standard `npm run` commands also work from PowerShell in the current repo.

## Error Codes

- DTB-001: Spec file not found
- DTB-002: Template file not found
- DTB-003: Spec parse or schema validation failed
- DTB-004: Template read failed
- DTB-005: Output write failed
- DTB-006: Navigation or progress validation failed
- DTB-007: Badge config missing or invalid
- DTB-999: Unknown compiler error

## Examples

- [decision-trees/public/example-multicloud-compute](../decision-trees/public/example-multicloud-compute/) — public decision tree example
- [quiz/public/example](../quiz/public/example/) — public quiz example

## Ownership and Support

- Core files: decision-tree.rules.md, core/, tools/
- Specs: owners of each topic under decision-trees/
- Public release flow: scripts/export-public.ts and scripts/internal-strings.ts
- HTML output: owners of output/

If unsure, start with [decision-tree.rules.md](../decision-tree.rules.md).
