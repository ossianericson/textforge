---
name: decision-tree-html
description: Generate decision-tree HTML outputs from spec and style guide files in this repository, following the decision-tree rules and prompts.
---

# Skill Instructions

Use this skill when asked to generate or update decision-tree HTML files for this repository.

## What this skill does

- Guides the HTML generation workflow for decision trees.
- Ensures the correct source files are used.
- Keeps outputs consistent with project rules and style guide.

## When to use this skill

- Requests like “Generate azure-compute-tree.html from spec and style guide.”
- Requests to regenerate decision tree HTML outputs from spec changes.

## Steps

1. Ensure the following files are available in the workspace:
   - decision-trees/[topic]/spec.md
   - core/style-guide.md
   - decision-tree.rules.md
   - docs/prompts/[topic]-prompt.md (optional)
2. Use one of these prompts (or equivalent):
   - Generate azure-compute-tree.html from spec and style guide
   - Generate azure-data-services-tree.html from spec and style guide
3. Produce a single self-contained HTML file with inline CSS/JS.
4. Save output to output/[topic]-tree.html.

## Output requirements

- UTF-8 without BOM. Verify: ✅ 📚 → 🎯
- Confluence-compatible (no frameworks)
- Only external dependency: Google Fonts (DM Sans)
- Include required JS functions: `renderQuestion`, `renderResult`, `selectOption`, `goBack`, `restart`, `updateNavigation`

## References

- Style guide: [core/style-guide.md](../../core/style-guide.md)
- Rules: [decision-tree.rules.md](../../decision-tree.rules.md)
- Compute spec: [decision-trees/azure-compute/spec.md](../../decision-trees/azure-compute/spec.md)
- Data services spec: [decision-trees/azure-data-services/spec.md](../../decision-trees/azure-data-services/spec.md)
