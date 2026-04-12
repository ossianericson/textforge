# Decision Tree Style Guide - Universal Template

**Version:** v1.3  
**Date:** February 9, 2026  
**Purpose:** Reusable styling standards for all Azure decision trees

> Style guide versioning is independent of the project version in package.json.

---

## Version History

| Version | Date       | Changes                                                                             |
| ------- | ---------- | ----------------------------------------------------------------------------------- |
| v1.3    | 2026-02-09 | Metadata refresh to align with tooling updates                                      |
| v1.2    | 2026-02-06 | Added accessibility requirements section                                            |
| v1.1    | 2026-02-06 | Release aligned with deterministic compiler workflow (content unchanged)            |
| v1.0    | 2026-02-04 | Added guidance to bind option handlers with addEventListener (avoid inline onclick) |
| v0.9    | 2026-01-28 | Initial release - Extracted from Azure Compute and Data Services implementations    |

---

## Technical Foundation

### Single HTML File Requirements

- Everything inline (HTML, CSS, JavaScript)
- Only external dependency: Google Fonts (DM Sans)
- Confluence compatible
- Mobile responsive
- No frameworks

### Typography

- **Font:** DM Sans (Google Fonts) - weights 400, 500, 700
- **Main Title:** 2.5rem, weight 700
- **Subtitle:** 1.125rem
- **Question Titles:** 1.5rem, weight 700
- **Section Headers:** 1.125rem, weight 700, GREEN (#10b981)

---

## Color Palette

### Background & Structure

```css
--color-bg-start: #667eea; /* Gradient start */
--color-bg-end: #06b6d4; /* Gradient end */
--color-card-bg: #1e293b; /* Card background */
--color-card-border: #334155; /* Card borders */
```

### Text Colors

```css
--color-text-primary: #f8fafc; /* Primary text (light) */
--color-text-secondary: #cbd5e1; /* Secondary text */
--color-text-muted: #94a3b8; /* Muted/hint text */
```

### Semantic Colors

```css
--color-recommended: #10b981; /* Success/Green - headers, bullets, hover */
--color-warning: #f59e0b; /* Warning/Orange - advanced options */
--color-danger: #ef4444; /* Danger/Red - warning boxes */
--color-advanced: #f59e0b; /* Advanced/Orange - advanced options */
--color-info: #3b82f6; /* Info/Blue - info boxes */
```

Use `--color-recommended` (#10b981) for all section headers, bullets, and hover borders to keep a consistent visual hierarchy.

### Badge Colors (Customize per tree)

Define based on your categorization needs. Examples:

```css
--color-badge-1: #3b82f6; /* e.g., IaaS, Analytics */
--color-badge-2: #8b5cf6; /* e.g., PaaS, Database */
--color-badge-3: #ec4899; /* e.g., FaaS, NoSQL */
--color-badge-4: #06b6d4; /* e.g., Batch, Storage */
```

### Badge Palette (Recommended)

Tie badges to risk, effort, and urgency. These names should match `core/badges.yml` keys.

| Meaning          | Color   | Badge Class     | Example Usage                         |
| ---------------- | ------- | --------------- | ------------------------------------- |
| High Risk/Urgent | #f59e0b | .badge.urgent   | Emergency escalation, outages         |
| Stable/Standard  | #10b981 | .badge.standard | PaaS, general workflows               |
| Complex/Advanced | #3b82f6 | .badge.advanced | IaaS, hybrid networking               |
| Critical Warning | #ef4444 | .badge.danger   | Security breach, compliance violation |

---

## Layout Components

### Navigation Elements

**Progress Bar:**

```css
.progress-container {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  height: 8px;
  overflow: hidden;
}

.progress-bar {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
  height: 100%;
  transition: width 0.3s ease;
}
```

**Breadcrumbs:**

- Show complete path including final selection
- Format: "Start → Option 1 → Option 2 → Final Selection"
- Font size: 0.875rem, use secondary text color

**Back Button:**

- Disabled at start (opacity 0.4, cursor not-allowed)
- Enabled after first selection
- Shows "← Go Back" or "← Back"
- Minimum height: 44px

---

## Interactive Elements

### Option Buttons

**Default State:**

```css
.option-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid #334155;
  border-radius: 0.5rem;
  padding: 1rem 1.5rem;
  transition: all 0.2s ease;
}
```

**Hover State (CRITICAL):**

```css
.option-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #10b981; /* GREEN - Key visual feedback */
  transform: translateX(4px);
}
```

**Recommended Options:**

```css
.option-btn.recommended {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.option-btn.recommended::after {
  content: '✓ Recommended';
  position: absolute;
  right: 1rem;
  background: #10b981;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
}
```

**Advanced/Warning Options:**

```css
.option-btn.advanced {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.option-btn.advanced::after {
  content: '⚠ Advanced';
  position: absolute;
  right: 1rem;
  background: #f59e0b;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
}
```

---

## Accessibility Requirements

### ARIA Labels

Use explicit labels for interactive controls and dynamic regions.

```html
<button class="option-btn" aria-label="Choose Azure Functions">Azure Functions</button>
<div id="question-title" aria-live="polite"></div>
```

### Keyboard Navigation

- All interactive elements must be native `<button>` or `<a>` elements (inherently focusable). Do not add `tabindex="0"` to elements that are already focusable.
- Use `:focus-visible` styles to show a clear focus ring for keyboard users
- Skip links: `<a href="#main-content" class="skip-link">Skip to content</a>`

### Color Contrast

- All text: Minimum 4.5:1 contrast ratio
- Test tool: https://webaim.org/resources/contrastchecker/

---

## Content Boxes

### Info Box (Blue)

**Use for:** Question hints, additional considerations, helpful context

```css
.info-box,
.additional-considerations {
  background: rgba(59, 130, 246, 0.1);
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
}

.info-box h4,
.additional-considerations h4 {
  color: #3b82f6;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 0.5rem;
}
```

### Warning Box (Red)

**Use for:** "When NOT to use" sections, critical warnings

```css
.warning-box {
  background: rgba(239, 68, 68, 0.1);
  border-left: 4px solid #ef4444;
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
}

.warning-box h4 {
  color: #ef4444;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.warning-box ul {
  list-style: none;
  padding-left: 0;
  margin-top: 0;
}

.warning-box li {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
  position: relative;
  color: #f8fafc;
}

.warning-box li::before {
  content: '•';
  color: #ef4444;
}
```

### Support Section (Light Background)

**Use for:** Contact information, platform-specific details

```css
.support-section {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.support-section h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
}
```

### Footnote (Muted Text)

**Use for:** Secondary information, platform variations

```css
.footnote {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  color: #94a3b8;
  font-style: italic;
}
```

---

## Result Cards

### Header Structure

```css
.result-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px dashed #334155; /* Dashed separator */
}

.service-icon {
  font-size: 3rem;
}

.service-title-group h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f8fafc;
}
```

### Section Styling (CRITICAL - GREEN THEME)

```css
.result-section h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #10b981; /* GREEN - Key brand element */
}

.result-section ul {
  list-style: none;
  padding-left: 0;
}

.result-section li {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
  position: relative;
  color: #f8fafc;
}

.result-section li::before {
  content: '▸'; /* Green triangle/arrow */
  position: absolute;
  left: 0;
  color: #10b981; /* GREEN */
}
```

### Badges

```css
.badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: white;
}
```

### Tech Tags

```css
.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tech-tag {
  background: rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
}
```

---

## Standard Result Card Structure

Every result card should follow this structure:

```html
<div class="result-card">
  <!-- 1. Header with icon, title, badge -->
  <div class="result-header">
    <div class="service-icon">🎯</div>
    <div class="service-title-group">
      <h2>Service Name</h2>
      <span class="badge badge-type">Type</span>
    </div>
  </div>

  <!-- 2. Overview (optional) -->
  <p style="margin-bottom: 1.5rem; color: #cbd5e1;">Overview text...</p>

  <!-- 3. Footnote (optional) -->
  <div class="footnote">Additional context...</div>

  <!-- 4. Best For -->
  <div class="result-section">
    <h3>Best For</h3>
    <ul>
      <li>Use case 1</li>
      <li>Use case 2</li>
    </ul>
  </div>

  <!-- 5. Key Benefits -->
  <div class="result-section">
    <h3>Key Benefits</h3>
    <ul>
      <li>Benefit 1</li>
      <li>Benefit 2</li>
    </ul>
  </div>

  <!-- 6. Considerations -->
  <div class="result-section">
    <h3>Considerations</h3>
    <ul>
      <li>Consideration 1</li>
      <li>Consideration 2</li>
    </ul>
  </div>

  <!-- 7. When NOT to use (Red Warning Box) -->
  <div class="warning-box">
    <h4>When NOT to use</h4>
    <ul>
      <li>Scenario 1</li>
      <li>Scenario 2</li>
    </ul>
  </div>

  <!-- 8. Tech Tags -->
  <div class="tech-tags">
    <span class="tech-tag">Tag1</span>
    <span class="tech-tag">Tag2</span>
  </div>

  <!-- 9. Support Section (optional) -->
  <div class="support-section">
    <h4>Contact Information</h4>
    <p>Contact details...</p>
  </div>

  <!-- 10. Additional Considerations (Blue Info Box) -->
  <div class="additional-considerations">
    <h4>Additional Considerations</h4>
    <p>Context-specific guidance...</p>
  </div>

  <!-- 11. Action Buttons -->
  <div class="action-buttons">
    <a href="..." target="_blank" class="btn btn-primary">View Documentation</a>
    <button class="btn btn-secondary" id="restart-result-btn">Start Over</button>
  </div>
</div>
```

---

## Mobile Responsiveness

### Breakpoint: 720px

```css
@media (max-width: 720px) {
  .header h1 {
    font-size: 1.75rem;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .option-btn.recommended::after,
  .option-btn.advanced::after {
    position: static;
    display: block;
    margin-top: 0.5rem;
  }

  .action-buttons {
    flex-direction: column;
  }
}

@media (max-width: 400px) {
  .header h1 {
    font-size: 1.5rem;
  }

  .card {
    padding: 16px;
  }

  .option-btn {
    padding: 0.75rem 1rem;
  }
}
```

---

## Animations

### Fade In

```css
.fade-in {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## JavaScript State Management

### Required State Variables

```javascript
const state = {
  currentQuestion: 'q1',
  history: [],
  breadcrumbPath: ['Start'],
  lastOptionText: '',
};

const progressSteps = {
  // Define progress percentage for each question/result
  q1: 0,
  // ... additional questions
  result: 100,
};
```

### Essential Functions

1. `renderQuestion(questionId)` - Display a question
2. `renderResult(resultId)` - Display a result card
3. `selectOption(nextId, optionText, silent?)` - Handle option selection
4. `goBack()` - Navigate to previous question
5. `restart()` - Reset to beginning
6. `updateNavigation()` - Update progress bar, breadcrumbs, back button

### Defensive Logic (Required)

- **Validation scan on load:** Iterate through all questions/options and verify every `nextId` exists in the spec (questions or results). Log any dead links with clear messages.
- **Error fallback in selection:** If a target ID is missing, halt navigation, `console.error(...)`, and render a visible error message with a “Start Over” action.
- **ID normalization:** Trim whitespace and compare IDs case-insensitively before routing.

---

## Best Practices

### Do's ✅

- Keep option text concise and action-oriented
- Use green for all positive/recommended elements
- Include "When NOT to use" section for every result
- Make hover effects clearly visible (green border)
- Show complete breadcrumb path including final selection
- Use semantic HTML and ARIA labels for accessibility
- Bind option handlers with addEventListener using data attributes (avoid inline onclick)

### Don'ts ❌

- Don't use custom fonts beyond DM Sans
- Don't add external dependencies
- Don't use complex CSS animations (keep it simple)
- Don't hide the progress bar or breadcrumbs
- Don't make option buttons too small (min 1rem padding)
- Don't use colors outside the defined palette

---

## Customization Guide

### For New Decision Trees

1. **Define Badge Categories:** Determine your result types (e.g., service types, data categories)
2. **Set Badge Colors:** Assign colors to each category
3. **Map Decision Flow:** Create question hierarchy
4. **Define Progress Steps:** Assign percentage to each question
5. **Write Result Cards:** Follow the 11-element structure
6. **Add Context-Specific Elements:** Support sections, footnotes, etc.

### Example: Creating a "Storage" Decision Tree

```css
/* 1. Define badges */
.badge.hot { background: #f59e0b; }    /* Frequently accessed */
.badge.cool { background: #3b82f6; }   /* Infrequently accessed */
.badge.archive { background: #8b5cf6; } /* Long-term storage */

// 2. Map flow
Q1: Access Frequency → Q2a (Hot) / Q2b (Cool) / Q2c (Archive)
Q2a: Redundancy Level → Results...

// 3. Progress steps
'q1': 0,
'q2a': 33,
'q2b': 33,
'q2c': 33,
'result': 100
```

---

## Common Pitfalls

1. **Forgetting hover effects:** Green border must change on hover
2. **Wrong section header color:** Must be green (#10b981), not white
3. **Missing Additional Considerations:** Must appear on ALL result cards
4. **Incomplete breadcrumbs:** Must show final selection, not just last question
5. **Wrong bullet style:** Must use green triangle (▸), not default bullets

---

## Testing Checklist

- [ ] All option buttons show green border on hover
- [ ] Section headers are green (#10b981)
- [ ] Bullet points have green triangles
- [ ] Breadcrumbs show complete path
- [ ] Back button disabled at start
- [ ] Progress bar animates smoothly
- [ ] Mobile layout works (test at 720px)
- [ ] All external links open in new tab
- [ ] "Additional Considerations" appears on all results
- [ ] No console errors

---

END OF STYLE GUIDE

**Usage:** Reference this guide when creating new decision trees or updating existing ones. Maintain consistency across all implementations.
