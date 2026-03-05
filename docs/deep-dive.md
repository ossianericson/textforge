# textforge Deep Dive

This document collects the detailed workflow, architecture, deployment, and troubleshooting guidance for textforge.

Related references:

- [decision-tree.rules.md](../decision-tree.rules.md)
- [core/style-guide.md](../core/style-guide.md)

## Deterministic Workflow

Use the command list in [README.md](../README.md) and [decision-tree.rules.md](../decision-tree.rules.md) as the single source of truth.

Notes:

- Badge colors are defined in [core/badges.yml](../core/badges.yml).
- `docs/prompts/[topic]-prompt.md` is optional and not used by the compiler.

## Rules and Standards

Before editing any spec file, check:

| File                                                | Purpose            | When to Use                                      |
| --------------------------------------------------- | ------------------ | ------------------------------------------------ |
| [decision-tree.rules.md](../decision-tree.rules.md) | Syntax constraints | Before every spec edit                           |
| [core/style-guide.md](../core/style-guide.md)       | Universal styling  | When updating templates or reviewing HTML output |
| [core/template.md](../core/template.md)             | Blank spec starter | Creating new tree                                |

## Repository Structure

```
textforge/
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── decision-tree.rules.md
├── compiler/
├── core/
│   ├── base-template.html
│   ├── quiz-template.html
│   ├── badges.yml
│   ├── style-guide.md
│   ├── template.md
│   └── template-blank.md
├── decision-trees/
│   └── example-multicloud-compute/spec.md
├── quiz/
│   └── example-multicloud-compute/spec.md
├── docs/
│   ├── deep-dive.md
│   ├── generators/
│   │   ├── decision-tree-spec-generator-prompt.md
│   │   └── quiz-spec-generator-prompt.md
│   └── prompts/
├── output/
│   └── production/
├── scripts/
└── tools/
```

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

Quiz output mode is a prototype example, not a fully tested feature. See the README for the example compile command and output location.

---

## Generator Prompts

Reusable AI generator prompts live in `docs/generators/`:

| File                                     | Purpose                           |
| ---------------------------------------- | --------------------------------- |
| `decision-tree-spec-generator-prompt.md` | Generate a new decision tree spec |
| `quiz-spec-generator-prompt.md`          | Generate a quiz or study set spec |

Per-tree author notes (not used by the compiler) live in `docs/prompts/`.

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
- Confluence link format (absolute `https://your-confluence-instance/...`)
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

```
output/
├── example-multicloud-compute-tree.html
└── production/
```

## Confluence Deployment

1. Upload output HTML to Confluence page attachments.
2. Use the HTML macro to render the file via iframe.
3. Adjust the iframe `height` in the inline style if the default 1400px is too short or tall.

See [decision-tree.rules.md](../decision-tree.rules.md) for the validation checklist.

## Production Workflow

1. Edit spec in decision-trees/[topic]/spec.md
2. Run `npm run build && npm run validate:spec`
3. Generate HTML to output/
4. Review against [decision-tree.rules.md](../decision-tree.rules.md)
5. Copy approved HTML to output/production/
6. Upload production file to Confluence

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
fail with "permission denied", run `chmod +x .husky/*` inside WSL2. Use the WSL2 terminal
for all `npm run` commands; PowerShell is not supported.

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

- [decision-trees/example-multicloud-compute](../decision-trees/example-multicloud-compute/) — 19 services across Azure, AWS, and GCP (button-based tree)
- [quiz/example-multicloud-compute](../quiz/example-multicloud-compute/) — companion quiz and study set for the compute tree

## Ownership and Support

- Core files: decision-tree.rules.md, core/, tools/
- Specs: owners of each topic under decision-trees/
- Prompts (optional): docs/prompts/
- HTML output: owners of output/ and output/production/

If unsure, start with [decision-tree.rules.md](../decision-tree.rules.md).
