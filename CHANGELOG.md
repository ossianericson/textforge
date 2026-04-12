## [Unreleased]

## [Unreleased]

### Added / Changed

- Repository guard
- Branch guard
- Fix license field
- Verify LICENSE + README
- npm run build
- npm run validate:spec (first run)
- Fix HTML tags, re-run validate:spec
- npm test (identify failure)
- Fix compilerCli.test.ts expectation
- npm test (confirm full pass)
- Read CHANGELOG.md
- Consolidate [Unreleased] sections
- Verify CHANGELOG structure
- npm run verify:corpus
- npm test (final gate)
- Branch guard — create `feature/textforge-tooling-rationale`
- Branch guard — create `feature/textforge-ai-to-ai-mobile-pipeline`
- Branch guard — create `feature/textforge-dx-agent-roles`
- Branch guard — create `feature/textforge-security-auth`
- Create TODO.md
- Create TODO.md (21 steps)
- Create TODO.md (40 steps)
- Create TODO.md (58 steps)
- Archive previous TODO.md
- Archive existing `TODO.md`
- Archive existing `TODO.md` via `npm run todo:archive`
- Create fresh TODO.md
- Create fresh `TODO.md` with all steps
- Create fresh `TODO.md` with all steps 🔄 In progress
- Install dependencies
- npm ci (root)
- npm ci (editor)
- Prerequisite check (node, npm versions)
- npm run prereqs
- `apm install` + `npm run health` — session opening gate
- apm install + npm run health gate
- npm run health (opening gate)
- Check prepare script
- Fix prepare script
- Verify npm run prepare
- Update Quick Start install command
- Verify no stray `--ignore-scripts`
- Add live demo link
- Verify live demo link
- Add `docs/ai-workflow.md` to Key Files
- Add `docs/deep-dive.md` to Key Files
- Fix Node prerequisite to 24
- Fix quiz framing
- Link `CONTRIBUTING.md`
- Create `docs/tooling-rationale.md`
- Update README with rationale link
- Update `CONTRIBUTING.md`
- Update `CONTRIBUTING.md` with tool choices paragraph
- Update docs/ai-workflow.md
- Update `docs/ai-workflow.md` — verification layer section
- Update docs/readme/shared.md
- Update docs/readme/internal.md
- Update `docs/readme/internal.md` — tooling table additions
- Update `.apm/instructions/02-workflow.instructions.md` with rationale reference
- Update `.apm/instructions/02-workflow.instructions.md` — ensure tooling table complete
- Create apm.yml
- Create `.apm/instructions/01-project-rules.instructions.md`
- Create `.apm/instructions/02-workflow.instructions.md`
- Create `.apm/instructions/03-spec-format.instructions.md`
- Create `.apm/instructions/04-trust-tiers.instructions.md`
- Create `.apm/instructions/05-session-persistence.instructions.md`
- Create `.apm/instructions/06-prompt-template.instructions.md`
- Create `.apm/agents/architect.md`
- Create `.apm/agents/executor.md`
- Create `.apm/agents/verifier.md`
- Add AI-to-AI mode instruction source
- Update executor modes
- Create AGENT_PROMPT.md template
- Create `scripts/run_agent.ps1`
- Allow `agent:` commit messages
- Add prototype note to README.md
- Add prototype note to internal workflow doc
- Clarify Claude support as future-ready only until licensing and internal approval are in place
- Ignore locally generated `CLAUDE.md` until that workflow is approved
- Install APM CLI
- Install repomix
- Create `.repomixignore`
- Create repomix.config.json
- Add deprecation notice to `textforge-context-scan.mjs`
- Install Lefthook
- Create lefthook.yml
- Install Lefthook hooks
- Remove `.husky/` directory
- Uninstall husky and lint-staged
- Remove lint-staged block from package.json
- Verify `npx lefthook run pre-commit --dry-run`
- Create or update `prompts/README.md`
- Ensure prompts/README.md closing commands include `apm compile`
- Add `todo:archive` script to `package.json`
- Add `.sessions/` to `.gitignore`
- Expand `scripts/health.ts` with Level 2 harness checks
- Add Level 2 check to `scripts/health.ts`
- Add harness checks
- Regenerate agent manifests
- `apm compile`
- `apm compile` — regenerate `AGENTS.md` with updated instructions
- `apm compile` — regenerate `AGENTS.md` with agent role map
- `apm compile` (confirm final state)
- Add separate experimental Azure pipeline file
- Audit pipeline trigger
- Remove `fix_rel_pipeline_actions` if present
- Audit build.rs
- Fix build.rs if needed
- cargo build checkpoint
- Gate 1: cargo build
- Gate 1: `cargo build`
- Create `cliff.toml`
- Add `changelog:*` scripts to `package.json`
- Verify `npx git-cliff --config cliff.toml --unreleased`
- Install Vitest at root if not present
- Create `tests/compiler-snapshots.test.ts`
- Create or update `vitest.config.ts` at root
- Add `test:snapshots` and `test:snapshots:update` to `package.json`
- Update `update:golden` script
- `npm run compile` then `npm run test:snapshots:update`
- Verify `npm run test:snapshots`
- `cd editor && npm install --save-dev @playwright/test`
- `npx playwright install chromium --with-deps`
- Create `editor/playwright.config.ts`
- Create `editor/tests/e2e/compiled-trees.spec.ts`
- Add `test:e2e` scripts to root `package.json`
- Add Playwright artifacts to `.gitignore`
- Verify `npm run test:e2e` (skips acceptable)
- Add `check:updates` script to `package.json`
- Verify `npm run check:updates`
- Create `editor/src/lib/editorEvents.ts`
- Create `editor/src/lib/systemLog.ts`
- Wire `emitEvent` + `systemLog` into store `saveFile()`
- Wire `emitEvent` + `systemLog` into store `compile()`
- Wire `emitEvent` + `systemLog` into store `validate()`
- Wire `emitEvent` + `systemLog` into AI call actions
- Add dev-mode event subscriber in `App.tsx`
- Rust: add `set_repo_root` command
- Rust: simplify `resolve_repo_root` to use stored value
- Rust: add timeout to sidecar via `spawn_blocking`
- Rust: register `set_repo_root` in `lib.rs`
- TS: create `editor/src/lib/compileUtils.ts`
- TS: add `compileStatus`, `lastCompileError`, and `envReady` to store state
- TS: add `checkEnvironment()` called from `App.tsx` on mount
- TS: update `openFile()` and `saveFile()` to call `set_repo_root`
- TS: rewrite `compile()` to save first, compile from disk, and emit events
- TS: add `validate()` output-path fix
- TS: remove `buildSiblingPath` and `buildCompiledOutputPath` from store
- TS: import `compileUtils` functions in store
- UI: `CompileErrorBanner` component
- UI: `EnvWarningBanner` component
- UI: wire both banners into `App.tsx`
- UI: toolbar compile status on button
- UI: `RepoBrowser` warning badge + compilable filter
- Add `fs:allow-watch` to `capabilities/default.json`
- Add new state and actions to Zustand store
- Wire `setDirty` into TipTap `onUpdate`
- Wire `clearDirty` + `textforge:file-saved` into `saveFile`
- Create `useWindowCloseGuard.ts`
- Create `useSpecFileWatcher.ts`
- Add spec-switch guard to `openFile`, `openRepoSpec`, and `createNewSpec`
- Wire hooks in `App.tsx`
- Audit `EditorErrorBoundary` — name prop, error state, Reset + Copy buttons
- Wrap all missing panels/modals with named boundaries
- Read current `SettingsModal.tsx` before writing anything
- Replace startup `check_ai_auth` with `get_ai_auth_status` in `App.tsx`
- Load enterprise config on AI tab open
- Implement device code flow UI — sign in button state
- Implement device code flow UI — code display + polling state
- Implement device code flow UI — signed in + sign out state
- Implement OpenAI key card
- Implement custom endpoint card
- Add data handling notice to AI tab
- Implement Test connection + Clear all AI buttons
- Gate all AI action buttons on `isAiConfigured`
- Create `scripts/setup.mjs`
- Add `setup`, `doctor`, and `test:setup` to root `package.json`
- Run `node scripts/setup.mjs --check-only`
- Create or update `editor/WINDOWS_BUILD.md`
- Check for root-level `WINDOWS_BUILD.md` and delete if present
- Update README link
- Read `editor/src-tauri/src/commands/ai.rs` completely
- Read `editor/src-tauri/src/security.rs` completely
- Add constants to `ai.rs`
- Add types to `ai.rs`
- Add `extract_account_from_jwt` helper
- Add `try_refresh_token` helper
- Modify `get_aad_token` to call `try_refresh_token` first
- Add `PENDING_DEVICE_CODE` store and helpers
- Write `load_enterprise_config`
- Write `start_device_code_auth`
- Write `poll_device_code_auth`
- Write `try_silent_azure_auth`
- Write `get_ai_auth_status`
- Write `test_ai_connection`
- Write `save_ai_provider_pref` + `load_ai_provider_pref`
- Write `clear_azure_auth`
- Register all new commands in `lib.rs`
- Add `query_audit_log` to `security.rs`
- Register `query_audit_log` in `lib.rs`
- Update `.apm/instructions/04-trust-tiers.md` with agent role map
- Update `.apm/instructions/04-trust-tiers.md` with all new commands
- Add `query_audit_log` to trust tiers
- Update `.apm/instructions/04-trust-tiers.md` with `set_repo_root`
- Update `docs/security/controls-mapping.md`
- Create `docs/security/AI-SECURITY.md`
- Create `editor/tests/security-trust-tiers.test.ts`
- Create `editor/tests/components/isDirty.test.ts`
- Create `editor/tests/components/aiStatus.test.ts`
- Create `editor/tests/components/EditorErrorBoundary.test.tsx`
- Create `editor/tests/lib/editorEvents.test.ts`
- Create `editor/tests/lib/systemLog.test.ts`
- Create `tests/setup-script.test.mjs`
- Create `tests/agent-roles.test.mjs`
- Create `tests/tooling-rationale.test.mjs`
- Add AI-to-AI tests
- Tests: `compileUtils.test.ts`
- Tests: `CompileErrorBanner.test.tsx`
- Add `test:rationale` script to `package.json`
- Add package script
- Run targeted experimental tests
- Run `npm run test:rationale`
- Gate 1: `npm run test:rationale`
- Gate 2: `npm test`
- Gate 3: `cd editor && npm test`
- Gate 4: `npm run health`
- Gate 4: `node scripts/setup.mjs --check-only`
- Gate 4: `npx lefthook run pre-commit --dry-run`
- Gate 5: `npx lefthook run pre-commit --dry-run`
- Gate 5: `npm test`
- Gate 5: `apm compile`
- Gate 6: `apm compile`
- Gate 6: `npm run health`
- Gate 6: `npx git-cliff --config cliff.toml --unreleased`
- Gate 6: `npm run test:snapshots`
- Gate 7: `node --test tests/agent-roles.test.mjs`
- Gate 7: `npx lefthook run pre-commit --dry-run`
- Gate 7: `npm run test:e2e` (informational)
- Gate 8: `apm compile`
- Gate 8: `apm compile`
- Gate 9: `npx lefthook run pre-commit --dry-run`
- Gate 9: `npm run check:updates` (informational)
- `npx tsc --noEmit` in editor/ — fix TypeScript errors
- `npx tsc --noEmit` in editor/ — fix new TypeScript errors
- `npx tsc --noEmit` in editor/ — fix all remaining errors
- `npx tsc --noEmit` inside editor/
- `npx tsc --noEmit` inside editor/ — fix all errors
- `npm run editor:test`
- npm run build
- npm run verify:corpus
- npm test
- `npm run update:changelog`
- Commit + push + `npm run create-pr`
- Print manual steps block
- Update TODO.md final status
- Audit `CHANGELOG.md`
- Clean up `[Unreleased]` sections if needed
- Audit pack:artifact indentation
- Fix indentation if needed
- Check editor-build.log
- Check stale tarball
- Check `spec*editor*\*.md` files
- Audit PR template
- Update PR template if needed
- Audit `STATUS.md`
- Update `STATUS.md` if needed
- Run repo verification gates
- Normalise all TODO statuses to ✅ ❌ ⏭

## [1.8.0] - 2026-04-02

### Added / Changed

- Reworked the desktop editor UI with a grouped toolbar, richer onboarding, premium document styling, polished settings and progress panels, and a stronger visual hierarchy.
- Replaced the old graph canvas with a live Mermaid sidebar and improved compact-window behavior with adaptive workspace switching and proper non-maximized scrolling.
- Added editor regression coverage for the adaptive app shell, toolbar menu surfaces, empty-state scrolling, Mermaid sidebar behavior, and updated settings interactions.
- Stabilized Windows Tauri development startup by logging the resolved MSVC bootstrap path and ensuring dev resource placeholders exist before launch.
- Updated public-export documentation so the desktop editor is explicitly documented as part of the public distribution model.

## [1.7.0] - 2026-03-22

### Added

- `prompts/` folder — build session prompts checked into the repository
- Seven question input types: buttons, dropdown, dropdown-pair matrix,
  multi-select, slider, toggle, and scoring matrix
- Quiz output mode with parser, schema, compiler, and HTML template
- Desktop editor (Tauri v2, React 18, TipTap v2) for Windows and macOS
- Deep links: URL hash encodes tree state for bookmarking and sharing
- Full-text search across result cards in every compiled tree
- Golden SHA256 regression protection for all compiler baselines
- Automated workflow scripts: health, PR creation, changelog update, and context export
- Pre-commit spec validation via lint-staged
- Branch guard blocks direct commits to main/master
- Public/internal content boundary with export allowlist

### Changed

- README is now generated from `docs/readme/shared.md` source fragments
- Generated-file banner added to README.md
- Fork disclaimer replaced with direct "fork it and own it" language
- Version bumped from 1.6.0 to 1.7.0

## [1.6.0] - 2026-03-03

### Changed

- Rename package metadata and publishing flow for public distribution
- Pin Handlebars to exact version 4.7.8 (removes ^ semver range)
- Remove Node engine upper bound so installs work on Node 26+ LTS
- Simplify publish configuration and release scripts
- README: add community inspiration / no-ownership disclaimer banner
- README: add explicit install and release guidance
- README: update Prerequisites to reflect open-ended Node 22+ support
- README: remove implied maintainer support language
- README: add missing dtb quiz CLI example
- CONTRIBUTING: add fork-first policy notice
- azure-pipelines.yml: add publish step gated to main branch

## [1.5.0] - 2026-03-01

### Added

- Quiz output mode with parser, schema validation, compiler, and HTML template
- CLI quiz mode flag and `compile:quiz` npm script
- Example quiz spec for multi-cloud compute

### Changed

- README updates for quiz usage and generator prompts

## [1.4.0] - 2026-03-01

### Changed

### Migration Notes

- All three features are backward-compatible. Existing specs compile and work unchanged.
- `**Type**: dropdown` and `**Search Tags:**` are optional — no existing spec requires changes.
- Parser must be updated to recognize `**Type**: dropdown`, `**Dropdown**:` blocks, and `**Search Tags:**` fields.
- Zod schema additions: `type?: "buttons" | "dropdown"`, `dropdownLabel?: string`, `dropdownRanges?: array`, `searchTags?: string[]`

## [1.2.3] - 2026-02-10

### Changed

- Data services SQL Server options updated with clearer wording and ordering
- Azure SQL Database and SQL Server on Azure VM result cards updated with order form links and doc placement

## [1.2.2] - 2026-02-10

### Changed

- Documentation consolidation and references cleanup
- Data services spec updated with guidance fallback and version alignment
- Node guardrails restored for 22-24

## [1.2.1] - 2026-02-10

### Added

- README “What it looks like” GIF
- Compiler flow diagram in deep-dive docs
- Validator warnings for long paths, large option counts, and missing contact/responsibility info

### Changed

- Documentation consolidated; removed redundant getting-started/tools/validation guides
- Data services history cleaned up with distinct versions
- Compute spec removes orphan Azure Batch result
- README adds output naming note and Confluence deployment steps
- Rules checklist clarifies required vs optional result sections

### Removed

- Legacy PowerShell validator script
- docs/getting-started.md — content merged into README.md and docs/deep-dive.md
- core/quick-reference.md, tools/README.md, validation-guide.md, tools/validate-spec.ps1 — consolidated into README.md, docs/deep-dive.md, and the Node-based validator

### Fixed

- Malformed forbidden HTML example in rules

## [1.2.0] - 2026-02-10

### Added

- Scaffold command (`npm run init`) for creating new decision tree specs
- Golden HTML regression test with fixtures
- Shared test helpers and readable spec fixtures
- Deep-dive documentation in docs/deep-dive.md

### Changed

- Result parser refactor with clearer warning capture and section handling
- README consolidated with a single create-tree path
- CI now runs on Node 24
- Validator script now exposes `npm run validate:spec:fix`
- Link styling updated in info/support/additional considerations boxes (unvisited: #80C7FF, visited: #D1A7FF; previously browser default link colors)

### Fixed

- Inline warning parsing now preserves subsequent section parsing
- Badge resolver warns explicitly on default class fallbacks

## [1.1.0] - 2026-02-09

### Added

- Programmatic usage example in README
- Parser-focused typecheck script (typecheck:parsers) and CI helper script
- Additional test coverage for parser edge cases, badge matching, and compiler error paths

### Changed

- CLI parsing now uses node:util parseArgs with --help support
- Watch tool no longer threads chalk through the call stack
- ESLint config converted to ESM flat config (eslint.config.js)
- Tests run with NODE_ENV=test (quiet dotenv tips and badge fallback logs)

### Fixed

- Hardened markdown href sanitization against quote injection
- Deterministic badge class resolution with explicit fallback warnings
- Lazy config initialization to avoid dotenv side effects on import
- Simplified cleanInlineText and added regression coverage

## [1.0.2] - 2026-02-09

### Changed

- TypeScript build output now targets dist/ with runtime imports aligned to compiled modules
- Node 24 is the supported runtime and CI baseline
- Package metadata updated for publishing (main, files, prepublishOnly)
- CLI entrypoint removed (internal scripts only)

## [1.0.1] - 2026-02-07

### Changed

- Compiler no longer requires prompt files; validation now runs before writing output
- Azure Troubleshooting spec: updated DNS docs label to "Private endpoint troubleshoot (WIP)"

## [1.0.0] - 2026-02-07

### Added

- Getting started guide in docs/getting-started.md

### Changed

- README quick start and create-tree flow now emphasize CLI init
- Watch mode validates specs before compiling
- Setup script prints clearer next steps
- .gitignore covers dotenv variants, logs, and eslint cache

## [1.0.0-alpha.9] - 2026-02-06

### Added

- Setup scripts, CONTRIBUTING guide, and expanded lint-staged automation
- ESLint/Prettier tooling and Azure DevOps pipeline
- Subpath import aliases for parsers and shared utilities

### Changed

- Enabled stricter TypeScript checks and updated env/engine guardrails
- Parser and utility modules renamed to kebab-case
- Compile-all now limits concurrency

### Fixed

- Inline markdown rendering now escapes HTML and blocks unsafe links
- Doc link schema now enforces http/https URLs

## [1.0.0-alpha.8] - 2026-02-06

### Added

- Structured logging with log levels and JSON option
- CLI commands for compile, validate, and init flows
- Watch mode for spec/template changes
- Environment configuration via dotenv and config.js
- TypeScript scaffolding with gradual migration support
- Coverage reporting via c8

### Changed

- Parser split into focused modules
- Compiler error handling with error codes and suggestions
- ES module migration (imports/exports, package type)
- README reorganized with prerequisites, environment, CLI, and watch usage

### Removed

- Legacy AI documentation and docs folder
- GitHub Actions workflow (moved to Azure DevOps)

### Fixed

- Navigation validation now fails builds on warnings

## [1.0.0-alpha.7] - 2026-02-06

### Fixed

- Data services spec option navigation now targets result IDs with the required result: result-\* format
- Recompiled HTML outputs after spec validation fixes
- Tested regenerated HTML trees and moved them to output/production

## [1.0.0-alpha.6] - 2026-02-06

### Added

- Badge color registry in core/badges.yml
- Topic auto-discovery compiler (npm run compile)
- Topic-based compiler CLI (npm run compile:topic -- <topic>)
- Compiler integration tests (node --test)
- Pre-commit hook via Husky + lint-staged
- Validator --fix option for arrow conversion and missing sections

### Changed

- Compiler now reads badge colors from core/badges.yml
- Prompt files are optional emphasis notes (no badge CSS)
- Parser uses structured context object for result parsing
- Validator shows richer error context and avoids double file reads
- Output naming avoids double azure- prefix for azure-\* topics

### Fixed

- Defensive spec parsing now checks for missing Decision Tree Flow section

## [1.0.0-alpha.5] - 2026-02-06

### Added

- Node-based spec validator (tools/validate-spec.js)
- Compiler-based HTML generation workflow documented

### Rationale

- Deterministic compiler removes AI as a single point of failure for HTML generation
- Repeatable builds enable CI/CD, consistent reviews, and faster iteration
- Validation is now cross-platform (Node) instead of PowerShell-only

### Removed

- Legacy PowerShell spec validator

### Changed

- README and validation guide updated to deterministic workflow
- Recompiled outputs using the compiler (generated to output/ then manually moved to output/production after testing):
  - output/azure-compute-tree.html
  - output/azure-data-services-tree.html
  - output/azure-troubleshooting-tree.html

## [1.0.0-alpha.4] - 2026-02-06

### Added

- Pull request template with validation checklist
- Quick reference cheat sheet (core/quick-reference.md)
- Accessibility requirements in core/style-guide.md
- Encoding and version checks in tools/validate-spec.ps1
- Internal standard checklist in README
- Production deployment and rollback guidance in README
- See It In Action links in README

### Changed

- README.md version/date updated to 1.0 / 2026-02-06
- core/style-guide.md version/date updated to 1.0 / 2026-02-06
- validation-guide.md version/date updated to 1.0 / 2026-02-06
- Prompts remove manual encoding verification line
- Validator limits arrow checks to options and ignores mermaid blocks
- Validator output includes context lines for issues
- Added .gitignore to track production outputs only

## [1.0.0-alpha.3] - 2026-02-05

### Added

- Azure Troubleshooting Guide decision tree (11 services)
- Tools documentation (tools/README.md)

### Changed

- README structure validation updates

## [1.0.0-alpha.2] - 2026-02-04

### Changed

- Data Services: Normalized result IDs to hyphenated format
- Data Services: Added Responsibility Model sections to all 26 services

## [1.0.0-alpha.1] - 2026-02-04

### Added

- Compute: Note that Azure Batch is reference-only
