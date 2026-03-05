# Azure [Decision Tree Title] - Specification

**Version:** v1.0
**Date:** [DATE]
**Status:** Draft

---

## Version History

| Version | Date   | Author | Changes         |
| ------- | ------ | ------ | --------------- |
| v1.0    | [DATE] | [NAME] | Initial release |

---

## What's in This Version

**Services (1):**

- [Service 1]

**Decision Flow:**

- 1 question, 1 result

---

# Azure [Decision Tree Title] - Specification v1.0

**Reference:** See `decision-tree.rules.md` for constraints. See `core/style-guide.md` for styling.

### Title

**Main:** "Azure [Decision Tree Title]"
**Subtitle:** "[Subtitle]"

---

## Decision Tree Flow

### Q1: Start (id="q1")

**Title**: "What do you need?"
**Options**:

1. "Option A" → result: result-service-a
2. "Option B" → result: result-service-b
3. "I don't know / need guidance" → result: result-guidance

---

## Result Cards (2 Services)

#### 1. Use Service A (result-service-a)

- Icon: 🔧
- Badge: .badge.standard

**Best For:**

▸ [Use case]

**Key Benefits:**

▸ [Benefit]

**Considerations:**

▸ [Consideration]

**When NOT to use:**

▸ [Scenario]

**Tech Tags:** [Tag1], .badge.standard

**Additional Considerations:**
[Guidance]

**Contact:**

▸ [maintainers]

---

#### 2. Get Guidance (result-guidance)

- Icon: 💡
- Badge: .badge.standard

**Best For:**

▸ Teams unsure which path to take

**Key Benefits:**

▸ Expert guidance tailored to your situation

**Considerations:**

▸ Contact the team for a consultation

**When NOT to use:**

▸ If you already know your requirements

**Tech Tags:** Guidance, .badge.standard

**Additional Considerations:**
Reach out to the architecture team for personalized recommendations.

**Contact:**

▸ [maintainers]

---

## Progress Steps
```javascript
const progressSteps = {
  q1: 0,
  result: 100,
};
```

---

END OF SPECIFICATION v1.0
