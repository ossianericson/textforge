# prompts

This folder contains build session prompts for the textforge project.

Each file describes a complete, self-contained session that was executed by an AI
coding agent to implement a feature, fix, or release step. The prompts are checked
into the repository so the full build history is visible and reproducible.

## How it works

1. A prompt file is written describing exactly what the session must do.
2. The prompt is pasted into an AI coding agent (any agent that can execute code).
3. The agent follows the steps, runs the tests, commits the result.
4. The prompt file itself is committed to this folder as part of the session.

The prompts are agent-agnostic. They contain bash, TypeScript, and file content —
nothing that is specific to any particular AI tool or vendor.

## Filename convention

```
YYYY-MM-DD-short-description.md
```

Files sort chronologically. The description says what the session did.

## Reading a prompt

Every prompt contains:

- A preamble with the five project rules and repository/branch guards
- An explicit branch setup step before guard checks (create/switch feature branch)
- Numbered sections describing exactly what to do
- A full execution order table
- A TODO tracking block (written to TODO.md at session start)
- A git workflow block (branch, commit message, PR)

The TODO tracking block is how you know what succeeded, what failed, and what
needs a follow-up session.

## Relationship to the workflow scripts

Every session ends with:

```bash
npm run update:changelog   # records what was done
npm run create-pr          # opens the pull request
apm compile                # regenerates AGENTS.md if .apm/instructions/ changed
```

The exported context file is never committed. It lives outside the repository and is regenerated at the end of every session.
