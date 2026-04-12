# Decision Tree Rules - Enforceable Constraints

**Purpose:** Linting/validation rules for .md specification files  
**Format:** Terse checklist style (no prose, no explanations)  
**Usage:** Reference before creating/modifying any decision tree spec

---

## Quick Reference

### Before Every Edit

- [ ] Question IDs: q1, q2a, q2b (not q2_a)
- [ ] Result IDs: result-servicename (not result_Service)
- [ ] Navigation: → go to q3 OR → result: result-aks
- [ ] Colors and layout follow core/style-guide.md
- [ ] Result sections: Best For, Key Benefits, Considerations, When NOT to use, Tech Tags, Additional Considerations (Overview/Footnote optional)
- [ ] Every question includes an "I don't know"/"Unsure" option that routes to guidance
- [ ] Progress steps: q1 is 0%, deepest question is 80%, result is 100%, even spacing between
- [ ] Result titles are action-oriented (e.g., "Deploy Azure SQL Database")
- [ ] Result bullets use Unicode ▸ (not - or \*)
- [ ] Info Box appears above Options
- [ ] Contact block exists at end of each result card (team email aliases)
- [ ] Search Tags (optional): comma-separated keywords for the search index
- [ ] Badge colors live in core/badges.yml
- [ ] A companion prompt or notes file is optional for emphasis notes
- [ ] Version header: **Version:** v1.0

---

## SYNTAX

### ID Naming

- Question IDs: `q1`, `q2`, `q3a`, `q3b` (use letters for branches, not underscores/dashes)
- Result IDs: `result-servicename` (lowercase, hyphens, no spaces)
- Badge classes: `.badge.category1` (no version numbers, no underscores)

**Examples:**

```
✓ q2a, q2b, q3
✗ q2_a, q2-option1, question_2

✓ result-sqlserver, result-aks, result-immediate-escalation
✗ result-SQL_Server, resultAKS, result_aks
```

### Navigation Syntax

- Use `→` arrow (not `->` or `=>`)
- Option targets: `go to q3` OR `result: result-aks`
- Never omit `go to` or `result:` prefix

**Examples:**

```
✓ "Option text" → go to q2a
✓ "Option text" → result: result-cosmos
✗ "Option text" → q2a
✗ "Option text" → result-cosmos
```

### Dropdown Questions

Questions can use `**Type**: dropdown` to render a `<select>` instead of buttons. Use for numeric inputs like risk scores, team size, budget bands, or data volume.

**Format:**

```markdown
### Q4: Risk Assessment (id="q4")

**Title**: "What is the workload risk score?"
**Subtitle**: "Based on your compliance assessment (0 = no risk, 10 = critical)"
**Type**: dropdown
**Dropdown**:

- Label: "Select risk score (0–10)"
- Range: 0–3 → go to q5a
- Range: 4–6 → go to q5b
- Range: 7–10 → result: result-high-risk
```

**Field placement:** `**Type**: dropdown` goes after Title/Subtitle and before Info Box (if any). The `**Dropdown**:` block replaces `**Options**:`.

**Constraints:**

- Integer values only
- Ranges must be contiguous (no gaps between max of one and min of next)
- Ranges must not overlap
- For discrete lists (min = max for every range), gaps are allowed
- En-dash `–` (U+2013) or hyphen `-` accepted as range separator
- Single values allowed: `Range: 0 → go to q5a` (min = max)
- Optional labels allowed: `Range: 60 (1 Hour) → go to q5a`
- Navigation uses standard `→` arrow syntax (`go to` or `result:`)

**Examples:**

```text
✓ Range: 0–3 → go to q5a
✓ Range: 4 → result: result-medium
✓ Range: 5–10 → result: result-high
✗ Range: 0–3 → q5a              (missing "go to")
✗ Range: 0–3, 4–6 → go to q5a   (one range per line)
✗ Range: 0–5 / Range: 3–10       (overlap: 3–5)
✗ Range: 0–3 / Range: 5–10       (gap: value 4 missing)
```

### Dropdown Pair Questions

Use `**Type**: dropdown-pair` to render two dropdowns on the same question, then route using a matrix of bucket names.

**Format:**

```markdown
### Q2: RTO and RPO (id="q2")

**Title**: "Recovery objectives"
**Subtitle**: "Select RTO and RPO buckets"
**Type**: dropdown-pair
**Dropdown Left**:

- Label: "Select RTO bucket"
- Range: 10 (10 Minutes) → bucket: rto-a
- Range: 60 (1 Hour) → bucket: rto-b

**Dropdown Right**:

- Label: "Select RPO bucket"
- Range: 1 (1 Minute) → bucket: rpo-1
- Range: 60 (1 Hour) → bucket: rpo-60

**Matrix**:

- rto-a + rpo-1 → go to q2d
- rto-a + rpo-60 → go to q2c
- rto-b + rpo-1 → go to q2c
- rto-b + rpo-60 → go to q2b
```

**Constraints:**

- Bucket names are lowercase with hyphens (e.g., `rto-a`, `rpo-60`)
- Bucket ranges must be numeric, same rules as dropdown ranges (no overlap, contiguous unless discrete)
- Matrix targets use standard navigation syntax (`go to` or `result:`)
- Optional tier mapping: `**Tier Matrix**` with `→ tier: critical|high|medium|low`
- Optional image: `**Matrix Image**: "docs/your-image.png"` and `**Matrix Image Alt**: "Alt text"`
- Optional matrix table: `**Matrix Table**` with Columns and Row entries

### Slider Questions

Use `**Type**: slider` for a numeric range input rendered as a slider.

**Format:**

```markdown
**Type**: slider
**Slider**:

- Label: "Monthly budget (USD)"
- Range: 0–500 → go to q2a
- Range: 501–2000 → go to q2b
- Range: 2001–10000 → result: result-premium
```

**Constraints:**

- Integer values only
- Same numeric validation rules as dropdown ranges
- Use standard `go to` or `result:` targets

### Multi-select Questions

Use `**Type**: multi-select` when the user can choose more than one option before routing.

**Format:**

```markdown
**Type**: multi-select
**Options**:

1. "High availability required"
2. "Budget constrained"
3. "Regulated data"

**Routes**:

- "High availability required" + "Regulated data" → result: result-premium
- "Budget constrained" → result: result-standard
- fallback → result: result-guidance
```

**Constraints:**

- Route matching is exact-set and order-insensitive
- `fallback` is required
- Option labels must be unique within the question

### Toggle Questions

Use `**Type**: toggle` for a binary yes/no style branch.

**Format:**

```markdown
**Type**: toggle
**Label**: "Is this customer-facing?"
**On** → go to q2a
**Off** → go to q2b
```

**Constraints:**

- Both `On` and `Off` routes are required
- Use standard navigation syntax for both branches

### Scoring Matrix Questions

Use `**Type**: scoring-matrix` when users score several categories and routing depends on the total.

**Format:**

```markdown
**Type**: scoring-matrix
**Categories**: Security, Cost, Performance, Scalability
**Scale**: 1–5
**Routes**:

- Range: 4–8 → result: result-basic
- Range: 9–14 → result: result-standard
- Range: 15–20 → result: result-premium
```

**Constraints:**

- Categories must be unique
- Scale must be an integer min/max range
- Route ranges must fit the theoretical total score bounds
- Same numeric validation rules as dropdown ranges

**Matrix Table Format:**

```markdown
**Matrix Table**:

- Columns: "< 1 Minute | < 1 Hour | < 6 Hours | < 1 Day | > 1 Day"
- Row: "< 10 Minutes | Critical | Critical | High | Medium | Medium"
- Row: "< 2 Hours | Critical | High | Medium | Medium | Low"
```

### Context Capture (Optional)

Use `**Context Capture**` to store the selected option text in state.

**Format:**

```markdown
**Context Capture**: dataService = optionText
```

**Notes:**

- Only `optionText` is supported today
- Use camelCase keys (e.g., `dataService`, `computeService`)

### Search Tags (Optional)

Result cards can include an optional `**Search Tags:**` field to improve search discoverability. If omitted, search uses the result title, Tech Tags, badge text, and "Best For" items.

**Format:**

```markdown
**Search Tags:** SQL, Azure SQL, PaaS database, managed SQL, serverless SQL
```

**Placement:** After the badge line, before **Best For**.

### Tooltips (Optional)

Use `**Tooltips**` inside a question to define inline technical term help.

**Format:**

```markdown
**Tooltips**:

- "DPA": "Data Processing Agreement"
- "DPIA": "Data Protection Impact Assessment"
```

### Expert Detail (Optional)

Use `**Expert Detail:**` inside a result card to add content that renderer v2 can hide behind an expert-view toggle.

---

## VISUAL STANDARDS

Use core/style-guide.md as the single source of truth for colors, typography, layout, interactive states, and badge styling. Badge color values live in core/badges.yml.

---

## TECHNICAL

### HTML/CSS Constraints

**Single File:**

- Everything inline (HTML + CSS + JavaScript)
- Only external: Google Fonts (DM Sans)
- No frameworks, no separate CSS files

**Forbidden Elements:**

```text
Don't:
- Use <form> tags (use button click handlers instead)
- Use inline onclick handlers (escaping breaks easily)
- Use localStorage.setItem('state', ...)

Do:
- Use <button class="option-btn" data-next="q2a" data-text="..."></button> with addEventListener
- Use sessionStorage.setItem('state', ...)
- Use const state = { currentQuestion: 'q1', ... };
```

**Links:**

- All external links: `target="_blank"`
- All documentation links: new tab

**Example:**

```html
✓ <a href="https://..." target="_blank">Docs</a> ✗ <a href="https://...">Docs</a>
```

### Confluence Compatibility

- Must render in Confluence
- No advanced CSS features requiring polyfills
- Mobile breakpoint: 720px max-width

### Progress Steps Object

Must match question IDs exactly:

**Example:**

```javascript
✓ const progressSteps = {
    'q1': 0,
    'q2a': 33,
    'q2b': 33,
    'result': 100
  };

✗ const progressSteps = {
    'question1': 0,  // wrong ID format
    'q2': 50,
    'result': 100
  };
```

### Required Functions

All must be present (no renaming allowed):

- `renderQuestion(questionId)`
- `renderResult(resultId)`
- `selectOption(nextId, optionText, silent?)`
- `goBack()`
- `restart()`
- `updateNavigation()`

Pass `silent = true` during deep-link replay to skip writing to the URL hash.

### Defensive Logic (Required)

- **Normalization:** All IDs must be passed through a helper function that performs `.toLowerCase().trim()` to prevent "result-aks" from breaking if typed as "Result-AKS ".
- **Startup Audit:** The code must include an onload function that scans every `nextId` in the spec (including dropdown range targets). If a target ID is missing, it must log a `console.error(...)` immediately.
- **Fail-Safe Navigation:** The `selectOption(...)` function must check if the target exists before changing the screen. If it's missing, render a visible error message in the content area naming the specific missing ID and provide a “Start Over” action.

### Encoding

UTF-8 without BOM. Verify: ✅ 📚 → 🎯

---

## Validation Checklists

---

## Author Alignment Checklist

- [ ] IDs: q[number] or result-[name], lowercase, no spaces, no underscores
- [ ] Navigation: Unicode → with go to / result: prefix
- [ ] Safety Net: Every question has an "I don't know"/"Unsure" option
- [ ] Headers: Result section headers are green (#10b981)
- [ ] Content: Every result includes "When NOT to use" and "Additional Considerations"
- [ ] Validation: npm run validate:spec runs with zero errors

---

## Automated Spec Validation (Recommended)

Run the spec validator after creating or editing any spec to catch common syntax issues early.

**What it checks (automated):**

- UTF-8 without BOM
- Version header format: `**Version:** v1.0`
- Navigation arrow syntax inside **Options** and **Dropdown** blocks
- Dropdown range contiguity (no gaps, no overlaps)
- Dropdown range target format (must use `go to` or `result:` prefix)

Run from repo root:

```bash
npm run validate:spec
```

Auto-fix common issues (arrows, missing sections):

```bash
npm run validate:spec:fix
```

---

END OF RULES
