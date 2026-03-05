# Changelog

## [1.0.0] - 2026-03-05

### Added
- Markdown-to-HTML compiler for interactive decision trees
- Zod schema validation on all spec fields
- Handlebars templating with badge color registry
- CLI commands: init, compile, compile:topic, compile:watch,
  validate:spec, validate:spec:fix
- Quiz output mode
- Example decision tree: multi-cloud compute (19 services,
  Azure / AWS / GCP)
- Example quiz spec for multi-cloud compute
- AI generator prompts for decision trees and quizzes
- TypeScript strict mode, ESLint, Prettier, Husky hooks
- 80%+ test coverage gate
- Deep links, full-text search, keyboard navigation, ARIA support
- Self-contained HTML output — runs in any browser or
  Confluence iframe
- **Deep links (Feature 10):** Tree state is encoded in the URL hash (`#path=...`). Users can bookmark or share any point in the tree. On load, the tree replays the encoded path. "Copy Link" button added to all result cards.
- **Search / filter (Feature 3):** Search bar above the navigation allows users to type keywords and jump directly to matching result cards. Search indexes result title, badge, Tech Tags, Search Tags (optional), and "Best For" items. Keyboard navigable (arrow keys, Enter, Escape).
- **Dropdown question type (Feature 1):** New `**Type**: dropdown` spec syntax renders a `<select>` with range-to-target mapping instead of buttons. Ideal for numeric inputs (risk scores, team size, data volume). Range hints displayed below the dropdown. Validator checks for contiguous ranges with no gaps or overlaps.

### Changed

- `core/base-template.html` updated with search bar, deep link hash logic, dropdown renderer, and "Copy Link" button on result cards
- `decision-tree.rules.md` updated with dropdown syntax section, search tags documentation, and dropdown validation in automated checks
- `selectOption()` now accepts optional `silent` parameter (used during deep link replay to skip hash writes)
- `validateOptionTargets()` now also validates dropdown range targets on startup audit
- Result cards include optional `searchTags` field in Zod schema

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
