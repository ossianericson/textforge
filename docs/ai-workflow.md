# AI Workflow — How This Project Is Built and Maintained

> **Editor status:** Experimental testing client only. AI-assisted authoring exists for workflow evaluation, but the UI and editor-driven compile flow are still under active iteration. Do not treat the editor as a stable or fully working product surface; use the compiler CLI as the current source of truth when output parity matters.

> **For the skeptic:** If you are looking at this repo and wondering whether
> it is AI-generated code that nobody truly understands — this document is
> written for you. Every claim below is verifiable by reading the repository.
> You do not need to take anything on trust.

## Why This Document Is Public

This document is public on purpose.

It exists to show that textforge is not built through untracked trial and
error. The project uses an AI-assisted workflow with explicit prompts, tracked
execution, changelog generation, test gates, and human review.

That workflow is part of the engineering discipline behind the repository. It
is not a runtime dependency of the product.

The distinction matters:

- AI may assist with design and implementation
- AI does not run in the compiler
- AI does not run in the generated HTML
- The repository remains maintainable with normal engineering tools alone

This repository is not asking you to trust a black box. It is showing the
process used to produce a deterministic, testable system.

---

## Two Execution Channels

textforge currently supports one established desktop execution channel and one
separate experimental AI-to-AI channel.

Claude-specific support is prepared in the repository sources, but it is not an
active day-to-day workflow today. Until licensing and internal approval are in
place, treat any Claude manifest or role reference as future-ready scaffolding,
not as a currently approved operating path.

### Channel A — Desktop

```
Approved architect assistant
  → produces prompt as a downloadable .md file
  → human pastes it into desktop Codex CLI
  → Codex executes on the developer machine
  → npm run create-pr opens the PR
```

### Channel B — AI-to-AI (experimental mobile / CI)

```
Approved architect assistant
  → produces a small prompt for AGENT_PROMPT.md
  → human commits it to an agent/* branch
  → a separate Azure DevOps pipeline using azure-pipelines.agent-experimental.yml is run
  → scripts/run_agent.ps1 invokes Codex on a throwaway Windows VM
  → success: a PR is created via Azure DevOps REST API
  → failure: AGENT_RESULT.md is written to the branch
```

This second channel is experimental. It is intended to be tested on disposable
branches first and does not replace the existing repository pipeline.

---

## What This Document Is

This document describes a **pattern** for building software with AI assistance
in a way that is auditable, maintainable, and not dependent on any specific
AI tool or vendor.

textforge uses this pattern. But the pattern itself is generic. You can lift
it and apply it to any project. The specific paths, scripts, and tool names
in the textforge sections are examples — adapt them to your setup.

---

## The Core Claim

This project was built with AI assistance. It does not depend on AI to operate.

Concretely:

- The spec files are plain Markdown. Any text editor can read and edit them.
- The compiler is deterministic TypeScript with a test suite, readable HTML
  snapshots, and browser verification. The same input always produces the same
  output.
- No AI runs at compile time. No AI runs in the compiled output.
- Every AI-assisted session is recorded in TODO.md, CHANGELOG.md, and a prompt
  file that lives in the repository. You can read exactly what was done and why.
- You can delete every prompt file and every AI tool tomorrow and continue
  maintaining this project with just a text editor and `npm test`.

AI is a **speed multiplier** during development. It is not part of the runtime,
and it is not required to maintain the product.

---

## A Concrete Example

Here is what a spec change looks like, from human intent to compiled output,
with no AI involved at any step:

**Before** — a question in `spec.md`:

```
### Question: q2a

What is your primary workload type?

- "Stateless HTTP requests" → go to q3a
- "Event-driven / queue processing" → go to q3b
- "I don't know / Unsure" → go to q3a
```

**After** — the same question with a new option added by hand:

```
### Question: q2a

What is your primary workload type?

- "Stateless HTTP requests" → go to q3a
- "Event-driven / queue processing" → go to q3b
- "Batch processing / scheduled jobs" → go to q3c
- "I don't know / Unsure" → go to q3a
```

**Then:**

```bash
npm run validate:spec   # checks format rules — passes or fails with clear errors
npm run compile:topic -- <scope>/<topic>   # produces updated HTML
npm test                # verifies compiler behavior and corpus output
npm run test:snapshots  # verifies compiled HTML baselines with readable diffs
```

The AI was not involved in this change. The spec format is documented in
`decision-tree.rules.md`. Any contributor can make this change after reading
that file for ten minutes.

---

## The Pattern

The workflow has four roles. In a small team, one person can play all of them.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ROLE 1 — DOMAIN EXPERT                                     │
│  Knows what the decision tree or quiz should contain.       │
│  Does not need to know how the compiler works.              │
│  Describes intent in plain language.                        │
│                                                             │
│  ROLE 2 — ARCHITECT                                         │
│  Translates intent into a structured prompt file.           │
│  Can be a human, an AI assistant, or both working together. │
│  Produces a .md file with numbered steps.                   │
│  Has read access to the codebase context.                   │
│  Does NOT write directly to the repository.                 │
│                                                             │
│  ROLE 3 — CODING AGENT                                      │
│  Executes the prompt file step by step.                     │
│  Writes files, runs commands, updates TODO.md.              │
│  Can be Codex, any future equivalent, or a human developer. │
│  Receives the prompt file — needs no other context.         │
│                                                             │
│  ROLE 4 — REVIEWER                                          │
│  Reviews the pull request opened by the coding agent.       │
│  Checks TODO.md for any failed or skipped steps.            │
│  Merges or requests changes. Always a human.                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

The loop:

```
Domain Expert describes intent
  → Architect produces prompt file
    → Coding Agent executes prompt file
      → Closing sequence runs (see below)
        → Reviewer approves PR
          → Context snapshot uploaded to Architect
            → repeat
```

---

## The Prompt File

The prompt file is the handoff document between the Architect and the
Coding Agent. It is a plain `.md` file containing:

- A repository guard (stops execution in the wrong repo)
- A branch guard (stops execution on protected branches)
- The project rules (so the agent has full context)
- Numbered sections describing exactly what to do
- A TODO tracking block (so progress is recorded)
- A Git workflow block (branch name, commit message, PR)

The Coding Agent receives the prompt file and executes it.
It does not need access to the AI assistant's conversation history.
It does not need to know which AI produced the prompt.
The prompt file contains everything required to complete the session.

Prompt files are saved to the repository in `prompts/` so every session
is part of the permanent audit trail.

---

## Closing Sequence

Every tracked session ends with this sequence.
The Coding Agent runs it. If the session stops early, finish these steps
before merging the PR.

```bash
npm run health              # gate: must pass before closing
npm run update:changelog    # session audit trail from TODO.md
git add -A
git commit -m "type(scope): summary"
git push -u origin [branch]
npm run create-pr           # opens Azure DevOps PR
apm compile                 # regenerate agent manifests if instructions changed
```

context snapshot for the next session. The exact storage location is kept in the
internal companion guide rather than the public export.

---

## Auditability

Every session produces three artefacts that answer the question
"what happened and why":

**TODO.md** — written at the start of every session with all steps
listed as In Progress. Updated after every step with the actual outcome.
Contains the exact error message for every failed step and the
recommended recovery action. Status codes: Done, Failed, Skipped,
Review, In Progress, Blocked.

**CHANGELOG.md** — generated from TODO.md by `npm run update:changelog`.
Human-readable summary of what changed in each session.
Cumulative across all sessions.

**prompts/** — every prompt file ever run. If you want to know exactly
what instructions the Coding Agent received for any change, the file
is here. Fully reproducible — you can re-run any prompt file.

---

## Engineering Discipline

This repository implements the Engineering Discipline for AI-Assisted Systems v1.0.

- APM provides metadata-first agent configuration from `.apm/instructions/`.
- Lefthook enforces the pre-commit workflow rules in a single cross-stack hook file.
- Repomix produces the context snapshot consumed by future AI-assisted sessions.
- git-cliff produces release changelog entries from commit history.
- Typed event streaming and structured system logs track editor operations during development.
- `TODO.md` remains the persistent workflow state that survives chat history.

### Scripts Reference

| Command | Purpose |
| --- | --- |
| `npm run changelog:unreleased` | git-cliff: unreleased entries from git commits |
| `npm run changelog:release` | git-cliff: full release changelog from git commits |
| `npm run test:snapshots` | Vitest compiler HTML snapshot tests |
| `npm run test:snapshots:update` | Update snapshots after intentional renderer change |
| `npm run test:e2e` | Playwright interactive browser tests (requires compiled output) |
| `npm run check:updates` | Show outdated npm packages and APM dependencies |

### Verification Layer

textforge uses two-level verification (Engineering Discipline 2.3):

**Level 1 — Output verification:**

- `npm test` — compiler unit and integration tests
- `npm run test:snapshots` — Vitest HTML baseline diffs
- `npm run test:e2e` — Playwright interactive browser tests
- `npm run verify:corpus` — corpus smoke check
- `npm run validate:spec` — spec format validation

**Level 2 — Harness verification:**

- `npm run health` includes harness checks for APM, Lefthook, and Repomix
- `npm run health` can optionally verify the experimental AI-to-AI pipeline assets
- Structured event logging tracks compile, validate, auth, and AI metrics
- Session metrics are available through `getSessionMetrics()` in the editor dev console

---

## Using Different AI Tools

The Architect role and the Coding Agent role are independent.
Mix and match freely.

| Architect                      | Coding Agent    | Works?                                                                                 |
| ------------------------------ | --------------- | -------------------------------------------------------------------------------------- |
| Claude (when licensed/approved) | Codex          | Yes — prepared in source, but not approved as an active textforge workflow today       |
| Gemini                         | Codex           | Yes — point Gemini at this doc and the current sanitized context snapshot for the repo |
| Grok                           | Codex           | Yes — same approach                                                                    |
| Human writing prompts manually | Codex           | Yes — no AI required                                                                   |
| Claude (when licensed/approved) | Future agent   | Yes — prompt file format is plain markdown                                             |
| Any AI                         | Human developer | Yes — developer reads and executes the prompt steps                                    |

**Onboarding a new AI assistant as Architect:**

1. Give it this document (`docs/ai-workflow.md`)
2. Give it the project instructions (stored in your AI assistant project)
3. Give it the current context snapshot that matches your repository's privacy boundary
4. Ask it to produce a prompt file for what you want to change

It does not need conversation history. The three documents above
contain everything required to produce a correct prompt file.

**Onboarding a new Coding Agent:**

The Coding Agent only needs the prompt file. Nothing else.
The prompt file is self-contained by design.

---

## Working Without Any AI

You do not need an AI assistant to contribute to this project.

```bash
# Edit spec content directly
# Format rules are in decision-tree.rules.md
code decision-trees/my-topic/spec.md

# Validate your changes
npm run validate:spec

# Compile
npm run compile:topic -- <scope>/my-topic

# Run the full test suite
npm test

# Write a prompt file manually if you want the Coding Agent to do the work
# Follow the structure in any file in prompts/
```

The spec format takes about ten minutes to learn from `decision-tree.rules.md`.
The compiler CLI takes about five minutes to learn from `README.md`.
Neither requires understanding the editor, the Rust backend, or any AI tooling.

---

## Internal Operations

This public document explains the method and the engineering rationale.

If you maintain the internal source repository, keep the repo-specific operating
details in a separate internal companion document. In textforge, that companion
covers the exact context export step, internal-only development flow, and
operational handling that should not ship in the public export.

---

## Resuming a Failed Session

If a session ended with status PARTIAL or FAILED:

1. Read `TODO.md` in the repo root
2. Note which steps are marked Failed or Skipped
3. Give TODO.md to the Architect
4. The Architect produces a resume prompt that:
   - Explicitly skips steps already marked Done
   - Retries Failed steps with a different approach
   - Continues numbering from where the session stopped
5. Paste the resume prompt into the Coding Agent

The resume prompt opens with:

```
Resume [project] implementation.
Read TODO.md in the repo root completely before doing anything else.
Do not repeat steps marked Done.
Attempt steps marked Failed with a fresh approach.
Attempt steps marked Skipped if their dependency is now resolved.
Continue with remaining steps in order.
Update TODO.md throughout as normal.
```

---

## Adapting This Pattern to Your Project

If you want to use this workflow in your own project:

**Minimum required:**

- A plain-text spec format that humans can read and edit
- A deterministic compiler or build step with a test suite
- A context snapshot export script that snapshots your codebase
- A `prompts/` folder to store prompt files as an audit trail
- A `TODO.md` convention that the Coding Agent writes during every session

**Recommended additions:**

- Readable HTML snapshots in your test suite (detect silent regressions)
- Browser-level interaction tests for your compiled output
- A `health` script that runs all checks in one command
- A `create-pr` script that reads TODO.md (removes manual PR writing)
- A `update:changelog` script that reads TODO.md (removes manual changelog)

**Not required:**

- Any specific AI vendor
- Any specific Coding Agent
- Any specific programming language or framework
- The textforge compiler or editor

The pattern works because the **prompt file is the interface** between
the Architect and the Coding Agent. As long as both sides can read and
write plain markdown, any tools can fill either role.

---

## Repository Structure Reference

```
your-project/
├── prompts/              ← every prompt file run — permanent audit trail
├── docs/
│   ├── ai-workflow.md    ← this file — adapt for your project
│   └── generators/       ← reusable AI prompts for content generation
├── TODO.md               ← current session status (overwritten each session)
├── CHANGELOG.md          ← cumulative record of all sessions
└── [your context export script]
```

Outside the repository (location is yours to choose):

```
your-ai-workspace/
├── prompts/              ← local copies of prompt files
├── your-project-context-internal.md  ← private context for internal development
├── your-project-context-external.md  ← redacted context for external-safe use
└── [context scan script]
```

In textforge, both of those snapshots are produced with Repomix. The internal snapshot comes from the full source repository. The external-safe snapshot should come from the sanitized `dist/public-export/` tree rather than from the internal repo directly.

---

_This document describes a pattern, not a product.
Adapt it. Improve it. Make it yours.
The only constraint is that it must remain understandable to a human
who has never seen an AI assistant._

**2. The compiler never changes its public API.**
`compiler/` is effectively read-only. Any prompt that touches the compiler
must explicitly justify the change and explain the impact on all callers.
The compiler's public surface is tested by golden SHA256 hashes.

**3. AI lives in the editor only.**
The editor uses AI (Azure OpenAI or public OpenAI) for spec generation and
improvement. The compiler never calls an AI service. The compiled HTML output
contains zero AI at runtime — it runs in any browser with no server, no API,
no external dependency.

**4. The compiled HTML outlasts every tool used to create it.**
It runs in a browser, a Confluence iframe, a SharePoint page, a local folder.
No server required. No plugin required. No vendor required.

**5. Every session ends with the tracked closing sequence.**
Run `npm run update:changelog`, `npm run create-pr`,
and finish with the context export step. No session is considered complete until the
export step has run and the new context file has been provided to your AI assistant
for the next session.

---

## Adopting The Pattern In Practice

If you want to use this workflow in your own project, keep the public version
of the process principles-oriented and tool-agnostic.

At a minimum, define:

- How you create and store prompt files
- How you track in-progress and failed work
- Which checks must pass before a change is complete
- How you capture a fresh repository context for the next session
- Which parts of that workflow are public versus internal-only

For textforge, the repo-specific operating details live in a separate internal
companion. That separation keeps the public story focused on engineering
discipline while preserving an internal execution manual for day-to-day work.

---

## Why This Pattern Exists

The alternative — asking an AI model to execute changes directly in the same
conversation where you design them — produces fragile, non-reproducible results.
There is no audit trail. Errors are silently propagated. Rollback is manual.

By separating design (AI assistant, conversational) from execution (Codex, autonomous),
every change is:

- Documented before it runs (the prompt file)
- Tested before it commits (npm test inside every prompt)
- Tracked as it runs (TODO.md)
- Auditable after it runs (prompts/, CHANGELOG.md, the PR body)
- Reproducible (paste the same prompt, get the same result)

The human stays in control of outcomes. The machines handle the mechanics.
