# Advanced Input Decision Tree - Specification

**Version:** v2.0
**Date:** 2026-03-20
**Status:** 📖 Public example
**Deployment:** GitHub Pages — public demo

---

## Requirements and Standards

### Title

**Main:** "Advanced Input Decision Tree"
**Subtitle:** "Demonstrates additive inputs and renderer features"

---

## Decision Tree Flow

### Q1: Input Type Tour Start (id="q1")

**Title**: "Choose how to explore advanced inputs"
**Subtitle**: "This public example is a guided tour. Start from here to see every input type in one run."
**Options**:

1. "Start guided tour (recommended)" → go to q2
2. "Restart from the beginning" → go to q2
3. "I don't know / show quick guidance" → result: result-guidance

---

### Q2: Dropdown Demo (id="q2")

**Title**: "[Dropdown] Select a compliance profile"
**Subtitle**: "This question demonstrates a single dropdown with range routing."
**Type**: dropdown
**Dropdown**:

- Label: "Compliance profile"
- Range: 1 (Baseline) → go to q3
- Range: 2 (Regulated) → go to q3
- Range: 3 (Strict) → go to q3

---

### Q3: Dropdown Pair Demo (id="q3")

**Title**: "[Dropdown Pair] Select RTO and RPO buckets"
**Subtitle**: "This demonstrates two linked dropdowns with a routing matrix."
**Type**: dropdown-pair
**Dropdown Left**:

- Label: "Select RTO bucket"
- Range: 10 (10 Minutes) → bucket: rto-10m
- Range: 120 (2 Hours) → bucket: rto-2h

**Dropdown Right**:

- Label: "Select RPO bucket"
- Range: 1 (1 Minute) → bucket: rpo-1m
- Range: 60 (1 Hour) → bucket: rpo-1h

**Matrix**:

- rto-10m + rpo-1m → go to q4
- rto-10m + rpo-1h → go to q4
- rto-2h + rpo-1m → go to q4
- rto-2h + rpo-1h → go to q4

---

### Q4: Slider Demo (id="q4")

**Title**: "[Slider] Set monthly budget"
**Subtitle**: "This demonstrates numeric slider input with range-based navigation."
**Type**: slider
**Slider**:

- Label: "Monthly budget (USD)"
- Range: 0–500 → go to q5
- Range: 501–2000 → go to q5
- Range: 2001–10000 → go to q5

---

### Q5: Toggle Demo (id="q5")

**Title**: "[Toggle] Is the workload customer-facing?"
**Subtitle**: "This demonstrates binary routing using On and Off branches."
**Type**: toggle
**Label**: "Customer-facing"
**On** → go to q6
**Off** → go to q6

---

### Q6: Multi-select Demo (id="q6")

**Title**: "[Multi-select] Choose all applicable requirements"
**Subtitle**: "This demonstrates exact-set route matching plus a fallback path."
**Type**: multi-select
**Tooltips**:

- "DPA": "Data Processing Agreement — required before processing personal data with a third-party vendor"
- "DPIA": "Data Protection Impact Assessment — required by GDPR Article 35 for high-risk processing"
  **Options**:

1. "High availability required"
2. "Cost sensitivity"
3. "Regulated data"
   **Routes**:

- "High availability required" + "Regulated data" → go to q7
- "Cost sensitivity" → go to q7
- fallback → go to q7

---

### Q7: Scoring Matrix Demo (id="q7")

**Title**: "[Scoring Matrix] Score workload priorities"
**Subtitle**: "Final demo step: score categories, then route by total score."
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
  q2: 13,
  q3: 27,
  q4: 40,
  q5: 53,
  q6: 67,
  q7: 80,
  result: 100,
};
```
