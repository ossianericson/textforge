# textforge Architecture

## High-Level Overview

textforge is a deterministic specification-to-output platform for interactive decision trees and quizzes. It solves a specific problem: domain experts need a way to author structured knowledge once, keep that knowledge inspectable and version-controlled as plain text, and publish it as portable interactive artifacts without introducing a server runtime or runtime AI dependency.

The repository therefore has two distinct product surfaces:

- The compiler and content system, which turn `spec.md` files into self-contained HTML artifacts.
- The desktop editor, which helps users author those specs visually while still writing back to the canonical Markdown source.

The architectural constraint that drives the whole design is simple: the spec is the product, and every generated output must remain reproducible from source.

## Architectural Priorities

The current architecture is organized around five priorities:

1. Determinism over runtime dynamism.
2. Plain-text source of truth over opaque state.
3. Local portability over hosted platform lock-in.
4. Internal platform alignment wherever practical.
5. Explicit boundaries between authoring, compilation, publishing, and AI assistance.

## Reasoning and Major Choices

### Why Markdown specs?

Markdown keeps the source inspectable, diffable, and durable. Domain experts can work in plain text, while engineers can validate, compile, test, and review the same artifacts in git. This reduces tool lock-in and keeps the long-term maintenance burden low.

### Why a TypeScript compiler?

The compiler pipeline is TypeScript because the repo already needs strong text-processing, schema-validation, and CLI ergonomics, and the output target is generated HTML. TypeScript also keeps the parsing, validation, tooling, and tests in one language, reducing context switching and making the compiler easy to extend without changing its public API.

### Why static HTML output?

Compiled HTML is intended to run in browsers, Confluence iframes, SharePoint pages, and static hosting environments. A self-contained output artifact avoids backend hosting, auth coupling, and operational dependencies. That portability is a core product requirement, not an optimization.

### Why Tauri for the editor?

The editor needs native filesystem access, secure credential storage, sidecar execution, and desktop packaging while still rendering a modern React UI. Tauri provides a narrow native shell with Rust commands and system WebView rendering, which keeps the packaged app smaller and operationally simpler than Electron while preserving web-style UI development.

### Why React + TipTap in the editor?

The editor is effectively a structured authoring environment rather than a generic form UI. React provides a predictable component model for the application shell, while TipTap gives the team a document-oriented editing surface that maps more naturally to `spec.md` semantics than a large collection of ad hoc input forms.

### Why Rust for the desktop backend?

Rust handles privileged desktop operations: filesystem access, git integration, credential access, secure logging, and sidecar orchestration. That separation keeps privileged operations out of the WebView layer and gives the project a safer place to enforce validation, path controls, HTTPS restrictions, and credential handling rules.

### Why internal platforms first?

The repository explicitly prefers internal infrastructure when an equivalent internal path exists. Azure DevOps is the primary CI/CD system, Azure Artifacts is the distribution channel for packages and desktop bundles, Azure OpenAI is the preferred AI integration path, and internal Confluence deployment is preserved as an internal publishing surface. This aligns the project with enterprise governance, security review, and existing operational tooling.

## System Context

At a system level, textforge looks like this:

```text
Author
  -> spec.md
  -> compiler pipeline
  -> self-contained HTML output

Author
  -> desktop editor
  -> writes spec.md
  -> invokes compiler sidecars
  -> preview / git / publish flows
```

The important boundary is that AI capabilities live only in the editor authoring workflow. They are not present in the compiler runtime and never shipped in compiled HTML.

## Component Breakdown

### Root CLI and build surface

The root workspace owns repository-level commands, validation, compilation, health checks, changelog generation, PR automation, and public export automation. It is the orchestration layer for the full repo.

### `compiler/`

This is the deterministic compilation engine. It parses decision tree and quiz specs, validates the resulting structure, and renders HTML output. The repository instructions treat this area as read-only unless a prompt explicitly requires compiler changes, which protects renderer stability and public behavior.

Responsibilities:

- Parse `spec.md` into structured intermediate representations.
- Enforce schema and navigation correctness.
- Render validated models through HTML templates.
- Preserve deterministic output behavior.

### `renderers/` and `core/`

These directories define the reusable presentation layer used by compilation. `renderers/` contains renderer versions and templates; `core/` contains shared templates, badges, and style guidance.

Responsibilities:

- Provide versioned renderer profiles.
- Keep presentation concerns separate from parsing logic.
- Allow multiple output variants without forking compiler behavior.

### `decision-trees/` and `quiz/`

These directories contain the source content. Public and internal scopes are intentionally separated so the same repo can support internal authoring while producing controlled public exports.

Responsibilities:

- Hold source-of-truth authored specs.
- Preserve content boundary between internal and public assets.
- Feed both local authoring and automated corpus verification.

### `editor/`

This is the desktop authoring application.

Subcomponents:

- React UI: document editing, navigation, preview flow, dialogs, and workspace UX.
- TypeScript sidecars: packaged helper executables that bridge to existing compiler workflows.
- Rust Tauri backend: privileged commands for file I/O, git, credentials, and secure local operations.

Responsibilities:

- Edit and save canonical specs.
- Invoke compile and validation flows locally.
- Store credentials in OS keychains rather than plaintext files.
- Support internal git and publishing workflows.

### `scripts/`

This directory is the automation layer for the repo lifecycle.

Responsibilities:

- Health and prerequisite checks.
- Public export creation.
- PR creation and changelog updates.
- Release staging and signing helpers.
- Dependency audit reporting.

### `tests/`

This is the regression safety layer for compiler behavior, corpus verification, CI scripts, and output stability.

Responsibilities:

- Catch behavior regressions in compilation.
- Validate example and corpus outputs.
- Enforce repository expectations in CI.

### `docs/`

This directory holds supporting documentation for operating and extending the system. Security review material now lives under `docs/security/`, while README source fragments live under `docs/readme/`.

Responsibilities:

- Explain workflows and repo conventions.
- Capture security review artifacts.
- Feed generated top-level documentation such as `README.md`.

## Data Flow

### Primary compilation flow

```text
spec authoring
  -> spec.md saved in decision-trees/ or quiz/
  -> parser pipeline reads Markdown
  -> schema and navigation validation runs
  -> renderer profile and templates are selected
  -> HTML is generated under output/
  -> artifact is opened locally or published externally
```

### Desktop editor flow

```text
user edits document in React UI
  -> structured editor state is serialized back to spec.md
  -> Tauri command validates file and path inputs
  -> sidecar executable runs compile or parse operation
  -> compiler logic produces output or diagnostics
  -> UI surfaces preview, errors, git actions, or publish actions
```

### AI-assisted authoring flow

```text
user configures Azure OpenAI or OpenAI credentials in editor
  -> credentials are stored in OS keychain
  -> editor requests AI assistance through Rust backend
  -> HTTPS-only client calls configured provider
  -> response is returned to editor workflow
  -> user accepts, edits, or rejects suggested content
  -> final persisted output remains spec.md
```

### Git and publish flow

```text
editor or developer updates spec/content
  -> repo-level validation and tests run
  -> Azure DevOps pipeline executes validation and security audit stages
  -> packages and desktop artifacts are staged
  -> Azure Artifacts publishes approved distributables
  -> internal consumers use published package or installer
```

## Internal Alignment

The architecture deliberately leans on internal platforms and enterprise-ready tooling:

- CI/CD: Azure DevOps pipelines in `azure-pipelines.yml` are the primary automation path.
- Package distribution: Azure Artifacts is used for npm package publication and desktop bundle distribution.
- AI integration: Azure OpenAI is the preferred enterprise AI path, with OpenAI key support retained where needed.
- Publishing: Internal Confluence remains part of the editor workflow for organization-specific publishing.
- Security posture: OS keychain storage, repo health gates, dependency audits, and internal review docs support enterprise governance.

This matters operationally because it keeps build, release, and security review inside the platforms the organization already governs.

## Security Boundaries

The key architectural boundaries are:

- `spec.md` is authoritative; generated outputs are derived artifacts.
- The compiler is deterministic and AI-free at runtime.
- The desktop editor can use AI during authoring, but never changes the compiler’s deterministic runtime model.
- Privileged operations stay in Rust Tauri commands, not in the browser UI layer.
- Credentials live in OS-managed secure storage, not repo files.

For detailed control mapping and threat analysis, see `SECURITY.md`, `docs/security/controls-mapping.md`, and `docs/security/threat-model.md`.

## Scalability and Evolution

The current architecture scales well in four directions:

- Content scale: more specs can be added without changing compiler structure because compilation is convention-driven.
- Renderer scale: new renderer profiles can be introduced through versioned templates rather than compiler forks.
- Workflow scale: repo scripts and CI stages already separate validation, publishing, desktop packaging, and security auditing.
- Editor scale: additional desktop workflows can be added behind Tauri commands and sidecars without changing the core compiler contract.

The next logical evolution would be:

1. Stronger separation between compiler core and editor integration contracts.
2. More explicit package boundaries for shared parser and schema logic.
3. Expanded internal publishing connectors beyond the current Confluence path.
4. Full certificate-backed release signing in CI once signing infrastructure is provisioned.
5. Potentially richer spec tooling, such as language-server-style authoring assistance, while preserving spec-as-source.

## Summary

textforge is intentionally not a conventional web application. It is a deterministic content compiler with a companion desktop editor, organized to keep authored knowledge durable, generated output portable, and enterprise workflows aligned with internal platforms. The most important design choice is the separation between source, compiler, and authoring convenience: the spec remains canonical, the compiler remains deterministic, and the editor remains a tool around that core rather than a replacement for it.
