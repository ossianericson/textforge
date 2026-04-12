<!-- GENERATED FILE — do not edit directly.
  Source: docs/readme/shared.md + docs/readme/internal.md
  Regenerate: npm run readme:internal
  Public view: npm run readme:public -->

# textforge

> One spec. One compiler. Any interactive tool your domain expert can describe in plain text.

**textforge** is a Markdown-to-HTML compiler that turns structured specification files into fully interactive, self-contained decision trees and quizzes. The runtime is deterministic: the same spec produces the same HTML every time.

It is designed to run anywhere HTML can run: browser, wiki, SharePoint, Confluence, or static hosting. No server. No plugin. No runtime AI.

You write the spec. The compiler handles everything else.

## Why This Exists

- Domain experts write knowledge in plain Markdown. The compiler turns it into a usable tool.
- The compiler is deterministic. There is no model in the loop at runtime.
- Output is a single self-contained HTML file with inline CSS and JavaScript.
- Deep links, search, keyboard navigation, and accessibility come built in.

## What It Looks Like

**[Try the live demo →](https://ossianericson.github.io/textforge/output/example-multicloud-compute-tree.html)**

![Animated GIF of a compute decision tree](docs/demo.gif)

## Origin

This project started as a small experiment: use AI to design a better interactive learning tool, then keep the useful result and remove AI from runtime entirely.

The underlying principle is simple:

> _If you can't reproduce it, you don't own it._

textforge uses AI during design and development. It removes AI from the runtime and keeps the delivered artifact deterministic.

You can write specs by hand in any text editor. You can also use the companion desktop editor — an experimental visual client for Windows and macOS that writes back to the spec file for testing and evaluation only. Either way, the spec is the source of truth. The editor is a window into it, not the supported product surface.

For the architectural philosophy behind that approach, see [The Spec Is the Product. The Model Is Scaffolding.](https://medium.com/@ossian.ericson/the-spec-is-the-product-the-model-is-scaffolding-a78029c0062b)

## What It Produces

An interactive output with:

- Branching questions with progress tracking
- Rich result cards with guidance, trade-offs, and links
- Deep links for sharing a precise point in the flow
- Full-text search across results
- Keyboard navigation and ARIA accessibility
- Zero server dependencies

## The Editor

textforge ships with a companion desktop editor for Windows and macOS.

The editor gives you a visual editing surface for spec files while keeping `spec.md`
as the source of truth. Changes are written back to the spec — the editor never
becomes the source.

The editor is not required. The compiler CLI works without it.
The editor is experimental and is included only for testing authoring patterns,
evaluation, and UI iteration. Do not represent it as a production-ready or
fully working client. Treat the compiler CLI as the only reliable and supported
path for real compile output while editor parity and workflow issues remain open.

The editor builds on top of the compiler and adds:

- Visual block editing of questions and result cards
- Live validation with inline error feedback
- AI-assisted tree and quiz generation (Azure OpenAI or OpenAI key)
- One-click compile and show the real output folder
- Git commit and push from inside the editor
- Confluence publish

The editor is built with Tauri v2, React 18, and TipTap v2.
It is currently intended only for testing and evaluation of authoring patterns.
Windows builds are available as both a portable EXE bundle and an installer,
but neither should be described as a stable end-user release. The portable
bundle is the preferred testing path at this stage.
Local desktop release bundles are staged under `artifacts/editor/<version>/<platform>/`.
For the fastest Windows smoke test, run `npm run editor:release:win:portable` and launch `artifacts/editor/<version>/windows-x64-portable/textforge-editor.exe` in place with the sibling `resources/` directory intact.
Those staged directories are local build outputs. The public repository stays source-only, and prebuilt Windows portable downloads are published through GitHub Releases as `textforge-editor-windows-x64-portable.zip`.
The staged layout and portable-bundle notes are documented in [artifacts/editor/README.md](artifacts/editor/README.md).
For Windows build instructions, see [editor/WINDOWS_BUILD.md](editor/WINDOWS_BUILD.md).

For a system-level overview, see [ARCHITECTURE.md](ARCHITECTURE.md).
For credential storage, audit logging, and security controls, see [SECURITY.md](SECURITY.md) and [docs/security/controls-mapping.md](docs/security/controls-mapping.md).

### Editor Testing Policy

React component changes in the editor are guarded by an automated testing policy:

- Vitest is the default unit and integration test runner.
- React Testing Library with user-centric selectors is the default component testing approach.
- `@testing-library/user-event` is the default interaction layer.
- Playwright is reserved for end-to-end coverage.
- HTTP API calls should be intercepted with MSW instead of ad hoc request mocks.
- Every React component change should add or update a matching `.test.tsx` file.
- Multi-state components should capture loading, error, and success states in Storybook when stories exist for that surface.

The editor release scripts now run `npm run editor:test` before packaging so UI regressions block desktop builds instead of slipping into release artifacts.

## Prerequisites

- Node.js 24 (LTS) - this is the tested and CI baseline; Node 22-23 may work but are not tested
- npm 8+

## Getting Started

There are three ways to use textforge. Pick the one that fits what you want to do.

---

### Option A — Just see it working (no install)

Open the live demo in your browser. No setup required.

[Live demo — multicloud compute decision tree](https://ossianericson.github.io/textforge/output/example-multicloud-compute-tree.html)

The compiled HTML is a single self-contained file. Download it, open it
locally, embed it in Confluence or SharePoint — it runs anywhere.

---

### Option B — Author specs and compile HTML (recommended)

This is the main path. You write spec files, the compiler turns them into
interactive HTML tools.

**Requires:** [Node.js 22–24](https://nodejs.org)

```bash
git clone https://github.com/ossianericson/textforge.git
cd textforge
npm install          # first time: ~2–3 min, downloads ~540 packages
npm run build        # ~10 sec — compiles the TypeScript compiler
```

Then create and compile your first tree:

```bash
npm run init -- my-topic --scope public
npm run compile:topic -- public/my-topic
```

Output lands in `output/`. Open the HTML file in any browser.

After the first `npm install`, `npm run build` takes about 10 seconds.
You do not need Rust, Visual Studio, or any other tooling.

---

### Option C — Try the desktop editor (Windows, no install)

A portable Windows build is attached to the
[latest GitHub Release](https://github.com/ossianericson/textforge/releases/latest).

1. Download `textforge-editor-windows-x64-portable.zip`
2. Extract the zip — keep `resources/` and `binaries/` next to the EXE
3. Double-click `textforge-editor.exe`

No installation required.
[WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
must be present — it ships with Windows 11 and is downloadable for Windows 10.

> The editor is an experimental evaluation build. The compiler CLI (Option B)
> is the stable production path.

---

### Option D — Build the editor from source (advanced)

Only needed if you want to modify the editor itself. Requires Rust, Visual
Studio Build Tools, and Windows SDK in addition to Node.js.

```bash
npm ci
cd editor
npm ci
cd ..
npm run editor:prereqs
npm run editor:release:win:portable
```

The built bundle lands in `artifacts/editor/<version>/windows-x64-portable/`.
That folder stays local to the checkout. Attach a zip made from it to GitHub Releases instead of committing the extracted payload.

For a full list of prerequisites and platform-specific notes, see
[ARCHITECTURE.md](ARCHITECTURE.md).

---

## Compile

```bash
npm run compile
```

This compiles every local decision tree under `decision-trees/**/spec.md` and every quiz under `quiz/**/spec.md`.

Outputs from scoped paths are flattened under `output/`, for example `output/internal-azure-compute-tree.html` and `output/public-example-azure-fundamentals-quiz.html`.

To compile the public examples only:

```bash
npm run compile:public
```

That command builds the curated public release artifacts with the shipped output names:

- `decision-trees/public/example-multicloud-compute/spec.md`
- `quiz/public/example/azure-fundamentals/spec.md`

## Examples

### Cloud Tree

- **File:** `output/example-multicloud-compute-tree.html`
- **What it is:** A fully interactive decision tree compiled from Markdown.

### Quiz

- **File:** `output/example-azure-fundamentals-quiz.html`
- **What it is:** A standalone HTML quiz with scoring and result output.

## How Specs Work

The compiler reads a structured `spec.md`, validates it, and injects the parsed data into a versioned HTML renderer. The pattern is:

```text
spec.md -> parser -> schema validation -> renderer -> output HTML
```

```text
textforge/
├── decision-trees/
│   └── <scope>/<topic>/spec.md
├── quiz/
│   └── <scope>/<topic>/spec.md
```

Decision trees live under `decision-trees/`.
Quiz examples live under `quiz/`.
Use the appropriate scope path for the content you are authoring.

## Pattern

The content model is the product. The compiler stays generic. Renderer profiles and per-topic `render.json` options allow output differences without forking the compiler for each tree.

The repository uses scope-based content boundaries so public example material and non-public authoring content can be managed separately.

## Create Your Own Tree

```bash
npm run init -- my-topic
```

This scaffolds a new spec under `decision-trees/<scope>/my-topic/spec.md`.

Use `npm run init -- my-topic --scope public` or `npm run init -- my-topic --scope internal` to choose the destination explicitly. The default scope depends on the repo layout.

The smallest valid branching question looks like this:

```markdown
### Q1: Start (id="q1")

**Title**: "Pick a path"
**Options**:

1. "Option A" → result: result-a
2. "Option B" → result: result-b
3. "I don't know / need guidance" → result: result-guidance
```

Key rules:

- Every branching question should include an "I don't know" path.
- Navigation uses the Unicode arrow `→`.
- Question IDs stay lowercase, for example `q1` or `q2a`.
- Result IDs stay lowercase with hyphens.

For a working public example, see `decision-trees/public/example-multicloud-compute/spec.md`.

Need more depth? See [docs/deep-dive.md](docs/deep-dive.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [SECURITY.md](SECURITY.md).

Renderer details and `render.json` examples live in [docs/renderers.md](docs/renderers.md).

### New Tree Checklist

Use this flow when creating a brand-new tree:

```bash
# 1. Scaffold the topic
npm run init -- my-topic

# 2. Validate the spec
npm run validate:spec

# 3. Compile just that tree
npm run compile:topic -- <scope>/my-topic

# 4. Open output/<scope>-my-topic-tree.html in your browser

# 5. Run the stable compiler suite
npm test

# Optional: run the corpus-only smoke verification directly
npm run verify:corpus

# 6. Check overall coverage
npm run test:coverage
```

When you compile with an explicit scoped path, the generated file name is flattened under `output/`, for example `output/public-my-topic-tree.html` or `output/internal-my-topic-tree.html`.

To confirm the shipped baseline examples still work out of the box, run `npm run verify:public-examples`.

## Generator Prompts

Use these prompt files when drafting content with a model:

| File                                                                                                             | Purpose                                                          |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [docs/generators/decision-tree-spec-generator-prompt.md](docs/generators/decision-tree-spec-generator-prompt.md) | Generate a first-pass decision tree spec for a new domain topic. |
| [docs/generators/quiz-spec-generator-prompt.md](docs/generators/quiz-spec-generator-prompt.md)                   | Generate a quiz or study set spec for learning-oriented content. |

## Key Files

| File | Purpose | Best for |
| --- | --- | --- |
| [docs/ai-workflow.md](docs/ai-workflow.md) | How AI is used at design time only and why it is excluded from the compiled output | Understanding the development methodology and runtime boundary |
| [docs/deep-dive.md](docs/deep-dive.md) | Architecture, parser pipeline, deployment details, and error-code guidance | Troubleshooting and deeper technical exploration |

## Using AI to Generate a Spec

Generator prompts live under `docs/generators/` and are intended for design-time use only.

```text
docs/generators/
├── decision-tree-spec-generator-prompt.md
└── quiz-spec-generator-prompt.md
```

Typical workflow:

```bash
# 1. Fill in the generator prompt for your domain
# 2. Use any model to draft spec content
# 3. Save the result to decision-trees/<scope>/<topic>/spec.md

npm run validate:spec
npm run compile:topic -- <scope>/<topic>
```

## Direct Quiz Compile

```bash
dtb compile --mode quiz --spec quiz/public/example/azure-fundamentals/spec.md --output output/example-azure-fundamentals-quiz.html
```

Use this only when you want to compile one quiz spec directly instead of using the repository-level `npm run compile` or `npm run compile:public` commands.

## Test

```bash
npm test
```

This runs the shared compiler test suite, the internal output guardrail, and the corpus-level smoke checks for every discovered spec under `decision-trees/**/spec.md` and `quiz/**/spec.md`.

To run only the corpus-level compile verification:

```bash
npm run verify:corpus
```

To verify the shipped public example trees out of the box:

```bash
npm run verify:public-examples
```

That command checks the curated public baseline examples, including golden snapshot verification for the shipped public outputs.

Coverage output is intentionally kept separate from `npm test`:

```bash
npm run test:coverage
```

That command reruns the suite under `c8`, prints the coverage summary, and enforces the 80% gate. Keeping coverage out of the default `npm test` path keeps local iteration faster and the default output easier to scan when you are working on a new tree.

If you want one command that runs the normal suite and then prints the coverage summary, use:

```bash
npm run test:full
```

## Command Reference

| Command                            | What it does                                                         |
| ---------------------------------- | -------------------------------------------------------------------- |
| `npm run init -- <topic>`          | Create a new spec from template, defaulting to the internal scope    |
| `npm run compile`                  | Build all decision trees and quizzes in the local repository         |
| `npm run compile:public`           | Build only the public tree and quiz examples                         |
| `npm run compile:watch`            | Auto-rebuild decision trees and quizzes on spec or template changes  |
| `npm run compile:topic -- <topic>` | Build one tree by leaf name or nested path such as `public/my-topic` |
| `npm run validate:spec`            | Check for spec errors                                                |
| `npm run validate:spec:fix`        | Auto-fix common issues                                               |
| `npm test`                         | Run shared tests plus corpus smoke checks for all discovered specs   |
| `npm run test:full`                | Run `npm test` and then print/enforce coverage                       |
| `npm run verify:corpus`            | Compile every discovered tree and quiz spec with shared invariants   |
| `npm run verify:public-examples`   | Verify the curated public baseline tree and quiz examples            |
| `npm run test:coverage`            | Run the public-safe test suite with coverage checks                  |
| `npm run build`                    | TypeScript build                                                     |
| `npm run typecheck`                | Run the TypeScript compiler without emitting files                   |
| `npm run typecheck:tests`          | Type-check the test suite                                            |
| `npm run lint`                     | Lint the repository                                                  |
| `npm run lint:fix`                 | Fix lint issues where possible                                       |
| `npm run format`                   | Format supported source and docs files                               |

Run these commands from the cloned repository root.

## Configuration

Defaults work out of the box. Override via `.env` if needed:

```bash
DTB_DECISION_TREES_DIR=decision-trees/
DTB_OUTPUT_DIR=output/
DTB_RENDERER=html/default-v1
DTB_TEMPLATE_PATH=renderers/html/default-v1/template.html
DTB_BADGE_PATH=core/badges.yml
```

`DTB_TEMPLATE_PATH` is an override for a specific template file. In the normal flow, leave it unset and let the configured renderer choose the template.

### Logging

- Default level: `info`
- JSON output: `LOG_FORMAT=json` or `LOG_JSON=true`
- Levels: `debug`, `info`, `warn`, `error`

## Programmatic Usage

```js
import { compileDecisionTree } from './dist/compiler/index.js';

compileDecisionTree({
  specPath: 'decision-trees/public/example-multicloud-compute/spec.md',
  outputPath: 'output/example-multicloud-compute-tree.html',
});
```

`compileDecisionTree` throws `DecisionTreeCompilerError` with `code` and `suggestion` fields.

## Troubleshooting

| Symptom                              | Cause                                  | Fix                                                                                           |
| ------------------------------------ | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `→` arrows show as `?` or `â`        | File is not saved as UTF-8             | Re-save the spec as UTF-8 without BOM                                                         |
| `npm run compile` exits with DTB-001 | Spec file not found                    | Check that the target `spec.md` exists                                                        |
| `npm run compile` exits with DTB-002 | Template file not found                | Verify the selected renderer template exists, or check `DTB_TEMPLATE_PATH` if you override it |
| `npm run compile` exits with DTB-003 | Spec parse or schema validation failed | Run `npm run validate:spec`                                                                   |
| `validate:spec` reports arrow errors | Using `->` or `=>` instead of `→`      | Use the Unicode arrow or run `validate:spec:fix`                                              |
| Node version warning                 | Node.js 24 is the tested baseline      | Install Node.js 24 LTS for the supported local and CI-aligned setup                           |

For deeper debugging, see [docs/deep-dive.md](docs/deep-dive.md#error-codes).

## Engineering Standards

- TypeScript strict mode
- Schema validation before compilation
- 80% coverage gate in `npm run test:coverage`
- ESLint, Prettier, and Lefthook-based pre-commit enforcement
- Repomix for AI-optimized context snapshots
- APM for agent configuration management
- Zero runtime AI dependency

## Licence

MIT. See [LICENSE](LICENSE).

---

## What's New in v1.8.1

- **Adaptive desktop editor shell** — the Tauri editor now uses a clearer grouped toolbar, richer onboarding, stronger document hierarchy, and improved settings and progress flows, but the UI client remains experimental and is still for testing only.
- **CLI-parity compile flow** — editor compile now saves and compiles the canonical `spec.md` from disk so the desktop path matches the CLI instead of compiling an in-memory variant.
- **Real output-folder handoff** — Windows portable builds now open the actual compiled output location in Explorer so the generated HTML can be validated the same way as the CLI output.
- **Live Mermaid workspace** — the editor’s graph surface now renders a live Mermaid view, making branch shape and result density easier to inspect while authoring.
- **Smaller-window support** — non-maximized windows now use adaptive workspace switching and proper scrolling instead of clipping the UI.
- **Public desktop distribution clarity** — the public export now explicitly includes the desktop editor source and release-layout guidance for downstream users.
- **Regression coverage for editor UX** — targeted tests now protect compact-window behavior, menu surfaces, empty-state scrolling, Mermaid sidebar behavior, and updated settings controls.

## Public Additions

## Engineering Approach

textforge is built with an AI-assisted development workflow, but it does not
depend on AI to run.

The important boundary is simple:

- The spec is the source of truth
- The compiler is deterministic
- The compiled HTML is self-contained
- The test suite, validation rules, and golden outputs are the quality gate

AI is used during design and implementation to move faster, but the shipped
product remains understandable, reviewable, and maintainable without AI
tooling.

For the public workflow rationale and process model, see
[docs/ai-workflow.md](docs/ai-workflow.md).

In the public export, new topics should normally use the `public` scope. For example:

```bash
npm run init -- my-topic --scope public
npm run compile:topic -- public/my-topic
```

### Contributing

Open a pull request with a focused change, tests where behavior changes, and updated docs when the public workflow changes.

Public example content should stay minimal and generic. Internal trees, internal contacts, and internal deployment details do not belong in the public export.

### Questions

Open a GitHub Issue for bugs, questions, or discussion.

### Community Inspiration Package

**Fork it and own it.** The real value is not the scaffolding — it is the knowledge your domain experts put into the specs. textforge gives you the pattern. Your content gives it meaning. Fork it, adapt it, make it yours.

### Author

**Ossian Ericson**

- **Role:** Cloud architect with 25+ years of experience in mission-critical financial services
- **Connect:** [LinkedIn](https://www.linkedin.com/in/ossian-ericson/)
- **Read:** [The Spec Is the Product. The Model Is Scaffolding.](https://medium.com/@ossian.ericson/the-spec-is-the-product-the-model-is-scaffolding-a78029c0062b)
- **Read:** [MEDIUM_ARTICLE_URL_HERE] ← replace with the new article URL before merging

## Desktop Editor

A visual editing surface for spec files is included in the public export under `editor/`. It is a [Tauri v2](https://tauri.app/) desktop application for Windows and macOS. It remains experimental, but the current portable Windows build now follows the CLI compile path and exposes the real compiled output folder for validation.

Pre-built portable bundles are available on the
[Releases page](https://github.com/ossianericson/textforge/releases/latest).
Download `textforge-editor-windows-x64-portable.zip`, extract it, and
launch `textforge-editor.exe` directly. No installation required.

**Prerequisites:** Node.js 24 (LTS) is the tested baseline, Rust stable, and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your platform. Node 22-23 may work but are not part of the tested release path.

```bash
cd editor
npm install
npm run tauri dev
```

Pre-built desktop bundles may be published for testing, but they exist only so downstream users can evaluate authoring patterns and packaging flows. The Windows portable bundle is the preferred testing path. Installer output exists as an additional packaging path to exercise, not as a recommended end-user distribution channel.
For the fastest Windows smoke test from a repo checkout, run `npm run editor:release:win:portable` from the repo root and then launch `artifacts/editor/<version>/windows-x64-portable/textforge-editor.exe` without separating it from the bundled `resources/` directory.
The exported repository stays source-only. Prebuilt Windows portable downloads belong on GitHub Releases as `textforge-editor-windows-x64-portable.zip`, not under `artifacts/editor/` in git.
The public export still includes [artifacts/editor/README.md](artifacts/editor/README.md) so downstream users can see how locally staged desktop bundles are structured.

## Security

This project follows a security-by-design approach. See [SECURITY.md](SECURITY.md) for the full security policy and [docs/security/](docs/security/) for the controls mapping and threat model. Key properties:

- The Rust backend provides memory safety guarantees at compile time.
- All AI calls use HTTPS with TLS 1.3 minimum via rustls.
- The Tauri IPC bridge is an explicit allowlist; only registered commands are callable from the frontend.
- File path access uses an allowlist of permitted root directories.
- Dependency vulnerability scanning runs on every CI build.
