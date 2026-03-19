# Decision Tree Specification - Template

**Version:** v1.0  
**Date:** [DATE]  
**Status:** Draft / Review / Production Ready

---

## Version History

| Version | Date   | Author | Changes         |
| ------- | ------ | ------ | --------------- |
| v1.0    | [DATE] | [NAME] | Initial release |

---

## What's in This Version

**Services ([NUMBER]):**

- [Service 1]
- [Service 2]
- [Add more...]

**Decision Flow:**

- [Number] questions
- [Describe key paths]
- [Note any recommendations]

**Styling:**

- Follows universal Decision Tree Style Guide
- [Any custom colors or badges]
- [Any unique features]

---

# [Decision Tree Name] - Specification v1.0

**Reference:** See `core/style-guide.md` for complete styling standards.

---

## Requirements and Standards

Use `decision-tree.rules.md` for required structure, defensive logic, navigation syntax, and validation checks. Use `core/style-guide.md` for styling standards. Badge colors live in `core/badges.yml`.

**Must-haves:**

- Every branching question includes an "I don't know"/"Unsure" option to prevent dead ends.
- Use the Unicode arrow `→` for navigation lines.
- Normalize IDs in implementation with `.toLowerCase().trim()` as required by rules.
- Result titles are action-oriented (use a verb: "Use", "Deploy", "Provision").
- Result bullets use Unicode ▸ (not - or \*).
- Info Box appears above Options.
- Contact block exists at end of each result card (team email aliases).
- Breadcrumb is optional but recommended for shorter navigation labels.

### Title

**Main:** "[Decision Tree Title]"
**Subtitle:** "[Descriptive subtitle]"

---

## Decision Tree Flow

### Q1: [Question ID] (id="q1")

**Title**: "[Question Title]"
**Subtitle**: "[Question Subtitle]"
**Info Box** (optional): "[Helpful context]"
**Options**:

1. "[Option 1 text]" → go to [next_question_id] OR result: [result_id]
2. "[Option 2 text]" → go to [next_question_id] OR result: [result_id]
3. "[Option 3 text]" → go to [next_question_id] OR result: [result_id]
4. "[I don't know / need guidance]" → result: [result_id]

---

### Q2: [Question ID] (id="q2")

**Title**: "[Question Title]"
**Subtitle**: "[Question Subtitle]"
**Options**:

1. "[Option text]" → go to [next] OR result: [result]
2. "[Option text]" → go to [next] OR result: [result]

[Continue with all questions...]

---

## Result Cards ([NUMBER] Services)

### [Category Name] ([NUMBER] Services)

#### 1. [Action Verb + Service Name] (result-[service_id])

- Icon: [emoji]
- Badge: [Class from badges.yml]
- Optional: **RECOMMENDED** or **ADVANCED** tag

**Breadcrumb:** "[Short label for nav trail]" (optional)

**Overview** (optional): "[Description paragraph]"

**Footnote** (optional): "[Additional context]"

**Best For:**

▸ [Use case 1]
▸ [Use case 2]
▸ [Use case 3]

**Key Benefits:**

▸ [Benefit 1]
▸ [Benefit 2]
▸ [Benefit 3]

**Considerations:**

▸ [Consideration 1]
▸ [Consideration 2]
▸ [Organization-specific note if applicable]

**When NOT to use:**

▸ [Scenario 1]
▸ [Scenario 2]
▸ [Scenario 3]

**Tech Tags:** [Tag1], [Tag2], [Tag3], .badge.standard

**Support Section** (optional):

▸ **[Platform/Service]:** [Contact information]
▸ **[Platform/Service]:** [Contact information]

**Docs:** [Documentation URL]

**Additional Considerations:**
[Organization-specific guidance - this section appears on ALL result cards]

**Contact:**

▸ [team-alias@if.xx]

---

[Repeat for all services...]

---

## Progress Steps

```javascript
const progressSteps = {
  q1: 0,
  q2: [percentage],
  q3: [percentage],
  // ... more questions
  result: 100,
};
```

**Tips:**

- q1 is 0%, deepest question is 80%, result is 100%
- Use even spacing between levels based on depth
- Avoid arbitrary values like 33% or 40%
- Similar depth questions should have similar percentages

**Examples:**

```javascript
// 4 levels
const progressSteps = { q1: 0, q2: 27, q3: 53, q4: 80, result: 100 };

// 5 levels
const progressSteps = { q1: 0, q2: 20, q3: 40, q4: 60, q5: 80, result: 100 };
```

---

## Key Messages

### [Organization-Specific Service 1]

- **Contact:** [Contact method]
- **Services:** [Description]
- **Process:** [How to engage]

### [Organization-Specific Service 2]

- **Platform:** [Platform name]
- **Services:** [What's offered]
- **Users:** [Usage statistics if available]

### Architecture Guidance

- **Default Recommendation:** [What to use by default]
- **When [X]:** [Specific guidance]
- **When [Y]:** [Specific guidance]

### Common Considerations

- **[Topic 1]:** [Guidance]
- **[Topic 2]:** [Guidance]

---

## [Organization] Contacts

- **[Service 1]:** [Contact info]
- **[Service 2]:** [Contact info / URL]
- **[Service 3]:** [Contact info / URL]

---

END OF SPECIFICATION v1.0

---

> WARNING: Everything below this line is template instructions. Delete this section when creating your spec.

## Template Usage Guide

### Steps to Create a New Decision Tree

1. **Copy this template** to `decision-trees/internal/[topic]/spec.md`

2. **Fill in the header:**
   - Update version, date, status
   - List all services/results
   - Describe decision flow
   - Note any custom styling

3. **Map your decision flow:**
   - Start with Q1
   - Create logical question progression
   - Define all paths to results
   - Add info boxes where helpful

4. **Document all results:**
   - Use the standard result structure (Overview/Footnote optional)
   - Follow naming: result-[servicename] (lowercase, hyphens only, no spaces or underscores)
   - Include all required sections
   - Add organization-specific content

5. **Define progress steps:**
   - Assign percentages to each question
   - Test that progression feels natural

6. **Add organization context:**
   - Key messages section
   - Contact information
   - Platform-specific guidance

7. **Create companion prompt file (optional):**
   - Store at `docs/internal/prompts/[topic]-prompt.md`
   - Not used by the compiler
   - Highlight key content elements and emphasis notes

### Naming Conventions

- **Specification:** `spec.md` (inside `decision-trees/internal/[topic]/` by default)
- **Prompt (optional):** `docs/internal/prompts/[topic]-prompt.md`
- **Question IDs:** q1, q2, q3a, q3b, etc.
- **Result IDs:** result-[servicename] (lowercase, hyphens only, no spaces or underscores)

### Version Numbering

- **Major (X):** Complete restructure, new services, major changes
- **Minor (Y):** Content updates, clarifications, bug fixes

Example: v1.0 → v1.1 → v1.2 → v2.0

---

END OF TEMPLATE
