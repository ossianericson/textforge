# Advanced Input Decision Tree - Specification

**Version:** v2.0
**Date:** 2026-03-20
**Status:** Example

---

## Requirements and Standards

### Title

**Main:** "Advanced Input Decision Tree"
**Subtitle:** "Demonstrates additive inputs and renderer features"

---

## Decision Tree Flow

### Q1: Budget (id="q1")

**Title**: "What monthly budget range fits this workload?"
**Subtitle**: "Use the slider to choose a realistic operating budget."
**Type**: slider
**Slider**:

- Label: "Monthly budget (USD)"
- Range: 0–500 → go to q2a
- Range: 501–2000 → go to q2b
- Range: 2001–10000 → result: result-premium

---

### Q2a: Requirements (id="q2a")

**Title**: "Do DPA and DPIA obligations apply?"
**Subtitle**: "Select every requirement that materially shapes the recommendation."
**Type**: multi-select
**Tooltips**:

- "DPA": "Data Processing Agreement — required before processing personal data with a third-party vendor"
- "DPIA": "Data Protection Impact Assessment — required by GDPR Article 35 for high-risk processing"
  **Options**:

1. "High availability required"
2. "Budget constrained"
3. "Regulated data"
   **Routes**:

- "High availability required" + "Regulated data" → result: result-standard
- "Budget constrained" → result: result-guidance
- fallback → go to q3a

---

### Q2b: Exposure (id="q2b")

**Title**: "Should the solution prioritize uptime over simplicity?"
**Subtitle**: "A customer-facing surface usually pushes the recommendation upward."
**Type**: toggle
**Label**: "Is this customer-facing?"
**On** → go to q3a
**Off** → result: result-basic

---

### Q3a: Priority Score (id="q3a")

**Title**: "Score the workload priorities"
**Subtitle**: "Set a score for each category, then continue."
**Type**: scoring-matrix
**Categories**: Security, Cost, Performance, Scalability
**Scale**: 1–5
**Routes**:

- Range: 4–8 → result: result-basic
- Range: 9–14 → result: result-standard
- Range: 15–20 → result: result-premium

---

## Result Cards (4 Services)

#### 1. Choose Basic Guidance (result-basic)

- Icon: 🧭
- Badge: Support (green)

**Best For:**

- Small internal workloads

**Key Benefits:**

- Keeps cost low

**Considerations:**

- Limited headroom

**When NOT to use:**

- Mission-critical systems

**Tech Tags:** Guidance, Cost

**Docs:** https://example.com/basic

**Additional Considerations:**
Use the simplest operating model first.

**Responsibility Model:**

- **You manage:** workload requirements, deployment fit, and operational guardrails
- **Platform owner manages:** shared standards, escalation routing, and support expectations

**Contact:**

- support@example.com

**Expert Detail:**
▸ Baseline recommendation for low-risk, low-complexity workloads.

---

#### 2. Choose Standard Platform (result-standard)

- Icon: ✅
- Badge: Standard (blue)

**Best For:**

- Regulated or moderately scaled workloads

**Key Benefits:**

- Better resilience and governance

**Considerations:**

- Slightly higher operational cost

**When NOT to use:**

- Experimental prototypes

**Tech Tags:** Standard, Compliance

**Docs:** https://example.com/standard

**Additional Considerations:**
Balance resilience, cost, and operational simplicity.

**Responsibility Model:**

- **You manage:** resilience targets, compliance decisions, and service configuration choices
- **Platform owner manages:** baseline guardrails, platform standards, and support escalation paths

**Contact:**

- support@example.com

**Expert Detail:**
▸ Standard recommendation introduces more guardrails and resilience controls.

---

#### 3. Choose Premium Platform (result-premium)

- Icon: 🚀
- Badge: Advanced (blue)

**Best For:**

- Customer-facing critical workloads

**Key Benefits:**

- Highest resilience profile

**Considerations:**

- Highest spend and design complexity

**When NOT to use:**

- Low-priority internal tools

**Tech Tags:** Premium, High Availability

**Docs:** https://example.com/premium

**Additional Considerations:**
Reserve this route for workloads where failure cost is material.

**Responsibility Model:**

- **You manage:** workload criticality decisions, cost approval, and architecture ownership
- **Platform owner manages:** shared reliability standards, review guidance, and escalation support

**Contact:**

- support@example.com

**Expert Detail:**
▸ Premium recommendation assumes stronger HA, scale, and operational investment.

---

#### 4. Gather More Inputs (result-guidance)

- Icon: 🔎
- Badge: Support (green)

**Best For:**

- Teams still clarifying constraints

**Key Benefits:**

- Prevents premature over-design

**Considerations:**

- Decision takes longer

**When NOT to use:**

- You already know the target architecture

**Tech Tags:** Guidance, Discovery

**Docs:** https://example.com/guidance

**Additional Considerations:**
Capture missing requirements before committing to a platform tier.

**Responsibility Model:**

- **You manage:** gathering missing constraints and confirming business priorities
- **Platform owner manages:** guidance on next inputs, review expectations, and support routing

**Contact:**

- support@example.com

**Expert Detail:**
▸ Guidance result intentionally avoids a hard recommendation until constraints are clearer.

---

## Progress Steps

```javascript
const progressSteps = {
  q1: 0,
  q2a: 40,
  q2b: 40,
  q3a: 80,
  result: 100,
};
```
