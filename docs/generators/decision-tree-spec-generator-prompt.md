# Prompt: Generate a Decision Tree Spec File

## Your Role

You are an expert solution architect creating a structured decision tree specification.
Output ONLY a markdown file following the exact format below. No extra explanation, no prose outside the format.

## Instructions

Create a decision tree spec file for the following:

- **Tree Name:** [FILL IN — e.g. Azure Networking / Data Platform Selection / Incident Triage]
- **Purpose:** [FILL IN — what decision is this tree helping the user make?]
- **Audience:** [FILL IN — who will use this tree? e.g. platform engineers, developers, support staff]
- **Services / Outcomes:** [FILL IN — list all possible end results / recommendations this tree should route to]
- **Key questions to ask:** [FILL IN — paste any notes, logic, or criteria the tree should use to decide]

---

## Syntax Rules (follow exactly or the compiler will reject the file)

| Rule              | Correct                                          | Wrong                     |
| ----------------- | ------------------------------------------------ | ------------------------- |
| Question IDs      | `q1`, `q2`, `q3a`, `q3b`                         | `q2_a`, `question-2`      |
| Result IDs        | `result-servicename`                             | `result_AKS`, `resultAKS` |
| Navigation arrow  | `→` (Unicode U+2192)                             | `->`, `=>`                |
| Option navigation | `"Text" → go to q2a`                             | `"Text" → q2a`            |
| Result navigation | `"Text" → result: result-aks`                    | `"Text" → result-aks`     |
| Result bullets    | `▸` (Unicode U+25B8)                             | `-` or `*`                |
| Every question    | Must include an "I don't know" / "Unsure" option | —                         |
| Result titles     | Action-oriented verb: "Use", "Deploy", "Choose"  | "Azure SQL"               |
| Info Box          | Must appear ABOVE **Options** block              | —                         |

---

## Output Format

````markdown
# [Tree Name] - Specification v1.0

**Version:** v1.0
**Date:** [YYYY-MM-DD]
**Status:** Draft

---

## Version History

| Version | Date         | Author   | Changes         |
| ------- | ------------ | -------- | --------------- |
| v1.0    | [YYYY-MM-DD] | [Author] | Initial release |

---

## What's in This Version

**Services ([COUNT]):**

- [Service or outcome 1]
- [Service or outcome 2]
  [one line per result]

**Decision Flow:**

- [N] questions
- [Describe the key branching logic in 2–3 sentences]

---

# [Tree Name] - Specification v1.0

**Reference:** See `core/style-guide.md` for styling. See `decision-tree.rules.md` for syntax constraints.

---

## Decision Tree Flow

### Q1: [Opening question] (id="q1")

**Title**: "[Short display title]"
**Subtitle**: "[Optional clarifying subtitle — omit line if not needed]"

> ℹ️ **Info Box** (optional — place here, ABOVE Options, if guidance is needed before the user chooses)
> [Guidance text here. Delete this block if not needed.]

**Options**:

- "[Option A label]" → go to q2a
- "[Option B label]" → go to q2b
- "[Option C label]" → go to q2c
- "I don't know / Unsure" → go to q1-unsure

### Q1-unsure: [Guidance question for unsure users] (id="q1-unsure")

**Title**: "[Help them decide — ask a simpler clarifying question]"

**Options**:

- "[Simpler option A]" → go to q2a
- "[Simpler option B]" → go to q2b
- "I still don't know" → result: result-contact

[Continue adding questions as needed. Branch IDs use letters: q2a, q2b, q3, etc.
Every branching question must have an "I don't know" / "Unsure" option.
Questions that lead directly to a single result do not need an Unsure option.]

---

## Result Cards

#### [Action verb] [Service Name] (result-[servicename])

**Badge**: [badge-category]
**Search Tags:** [comma-separated keywords for search]

**Best For**:

▸ [Scenario or use case this result suits best]
▸ [Another scenario]

**Key Benefits**:

▸ [Benefit 1]
▸ [Benefit 2]
▸ [Benefit 3]

**Considerations**:

▸ [Known limitation or caveat]
▸ [Another consideration]

**When NOT to use**:

▸ [Scenario where this result is a poor fit]
▸ [Another anti-pattern]

**Tech Tags**: [tag1] · [tag2] · [tag3]

**Additional Considerations**:

▸ [Governance, cost, compliance, or operational note]

**Contact**: [team-alias@company.com] — [Team name] owns this recommendation.

---

[Repeat Result Card block for each possible outcome]

---

#### Get Help (result-contact)

**Badge**: badge-support

**Best For**:

▸ Users unsure which path applies to their workload

**Key Benefits**:

▸ Direct access to the platform team for tailored guidance

**When NOT to use**:

▸ If you already know your workload type — restart the tree

**Tech Tags**: support · guidance

**Additional Considerations**:

▸ Bring your workload description and SLA requirements to the conversation

**Contact**: platform-support@company.com — Platform Engineering owns this result.

---

## Progress Steps

```
q1: 0
[q2a]: [percentage — space questions evenly from 10% to 80%, last question before results = 80%]
[q2b]: [same percentage as sibling questions at same depth]
result: 100
```

[List every question ID with its percentage. q1 = 0, deepest questions = 80, results = 100.
Questions at the same depth in the tree share the same percentage value.
Space evenly: with 4 question depths → 0, 27, 54, 80]
````

---

## Quality Rules

- Write **3–8 questions** total. More than 8 makes the tree feel like a form.
- Every path through the tree must reach a result in **at most 6 clicks**
- Result IDs must be lowercase with hyphens only — no spaces, underscores, or uppercase
- Always include `result-contact` as a fallback for unsure users
- Navigation arrows must be the Unicode `→` character — copy it from this prompt if needed: →
- Result titles must start with an action verb: "Use", "Deploy", "Choose", "Adopt", "Enable"
- Do NOT add any text, headings, or explanations outside the markdown format above
- After writing the spec, verify every `go to qX` target has a matching `### QX:` heading
- After writing the spec, verify every `result: result-name` target has a matching `#### ... (result-name)` heading
