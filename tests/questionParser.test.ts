import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseQuestions } from '#parsers/question-parser';

function buildLines(): string[] {
  return [
    '## Decision Tree Flow',
    '',
    '### Q1: Entry (id="q1")',
    '**Title**: "Pick"',
    '**Subtitle**: "One"',
    '**Info Box**: "CafÃ© notice"',
    '**Context Capture**: dataService = optionText',
    '**Options**:',
    '1. "Yes" → go to q2',
    '2. "No" → result: result-service (recommended)',
    '',
    '### Q2: Next (id="q2")',
    '**Title**: "Next"',
    '**Subtitle**: "Step"',
    '**Options**:',
    '1. "Done" → result: result-next',
  ];
}

test('questionParser: parses questions and options', () => {
  const lines = buildLines();
  const questions = parseQuestions(lines, 0, lines.length);
  const q1 = questions.q1;
  assert.ok(q1);

  assert.equal(Object.keys(questions).length, 2);
  assert.equal(q1.title, 'Pick');
  assert.equal(q1.subtitle, 'One');
  assert.equal(q1.infoBox, 'Café notice');
  assert.deepEqual(q1.contextCapture, { key: 'dataService', from: 'optionText' });
  assert.equal(q1.options.length, 2);
  assert.ok(q1.options[0]);
  assert.ok(q1.options[1]);
  assert.equal(q1.options[0].next, 'q2');
  assert.equal(q1.options[1].next, 'result-service');
  assert.equal(q1.options[1].recommended, true);
});

test('questionParser: parses dropdown-pair matrix blocks', () => {
  const lines = [
    '## Decision Tree Flow',
    '',
    '### Q1: Recovery Objectives (id="q1")',
    '**Title**: "Recovery objectives"',
    '**Type**: dropdown-pair',
    '**Dropdown Left**:',
    '- Label: "Select RTO bucket"',
    '- Range: 10 (< 10 Minutes) → bucket: rto-10m',
    '- Range: 60 (< 2 Hours) → bucket: rto-2h',
    '**Dropdown Right**:',
    '- Label: "Select RPO bucket"',
    '- Range: 1 (< 1 Minute) → bucket: rpo-1m',
    '- Range: 60 (< 1 Hour) → bucket: rpo-1h',
    '**Tier Matrix**:',
    '- rto-10m + rpo-1m → tier: critical',
    '- rto-2h + rpo-1h → tier: high',
    '**Matrix**:',
    '- rto-10m + rpo-1m → go to q2',
    '- rto-2h + rpo-1h → result: tier-high',
    '**Matrix Table**:',
    '- Columns: < 1 Minute | < 1 Hour',
    '- Row: < 10 Minutes | Critical | Critical',
    '- Row: < 2 Hours | High | High',
  ];

  const questions = parseQuestions(lines, 0, lines.length);
  const q1 = questions.q1;
  assert.ok(q1);

  assert.equal(q1.type, 'dropdown-pair');
  assert.equal(q1.dropdownLeftLabel, 'Select RTO bucket');
  assert.equal(q1.dropdownRightLabel, 'Select RPO bucket');
  assert.ok(q1.dropdownLeftRanges);
  assert.ok(q1.dropdownRightRanges);
  assert.ok(q1.dropdownTierMatrix);
  assert.ok(q1.dropdownMatrix);
  assert.ok(q1.dropdownMatrixTable);
  assert.ok(q1.dropdownTierMatrix['rto-10m']);
  assert.ok(q1.dropdownMatrix['rto-2h']);
  assert.ok(q1.dropdownMatrixTable.rows[0]);
  assert.equal(q1.dropdownLeftRanges.length, 2);
  assert.equal(q1.dropdownRightRanges.length, 2);
  assert.equal(q1.dropdownTierMatrix['rto-10m']['rpo-1m'], 'critical');
  assert.equal(q1.dropdownMatrix['rto-2h']['rpo-1h'], 'result-tier-high');
  assert.deepEqual(q1.dropdownMatrixTable.columns, ['< 1 Minute', '< 1 Hour']);
  assert.equal(q1.dropdownMatrixTable.rows.length, 2);
  assert.equal(q1.dropdownMatrixTable.rows[0].label, '< 10 Minutes');
  assert.deepEqual(q1.dropdownMatrixTable.rows[0].cells, ['Critical', 'Critical']);
});

test('questionParser: defaults to buttons for unknown type', () => {
  const lines = [
    '## Decision Tree Flow',
    '',
    '### Q1: Entry (id="q1")',
    '**Title**: "Pick"',
    '**Subtitle**: "One"',
    '**Type**: mystery',
    '**Options**:',
    '1. "Yes" → result: result-yes',
  ];

  const questions = parseQuestions(lines, 0, lines.length);
  const q1 = questions.q1;
  assert.ok(q1);
  assert.equal(q1.type, 'buttons');
  assert.equal(q1.options.length, 1);
});

test('questionParser: parses slider blocks with tooltips', () => {
  const lines = [
    '## Decision Tree Flow',
    '',
    '### Q1: Budget (id="q1")',
    '**Title**: "Do DPA obligations affect budget?"',
    '**Type**: slider',
    '**Tooltips**:',
    '- "DPA": "Data Processing Agreement"',
    '**Slider**:',
    '- Label: "Monthly budget (USD)"',
    '- Range: 0–500 → go to q2',
    '- Range: 501–1000 → result: result-standard',
  ];

  const questions = parseQuestions(lines, 0, lines.length);
  const q1 = questions.q1;
  assert.ok(q1);
  assert.equal(q1.type, 'slider');
  assert.equal(q1.sliderLabel, 'Monthly budget (USD)');
  assert.equal(q1.sliderRanges?.length, 2);
  assert.equal(q1.sliderRanges?.[1]?.next, 'result-standard');
  assert.equal(q1.tooltips?.[0]?.term, 'DPA');
});

test('questionParser: parses multi-select routes and fallback', () => {
  const lines = [
    '## Decision Tree Flow',
    '',
    '### Q1: Requirements (id="q1")',
    '**Title**: "Pick requirements"',
    '**Type**: multi-select',
    '**Options**:',
    '1. "High availability required"',
    '2. "Budget constrained"',
    '**Routes**:',
    '- "High availability required" → result: result-premium',
    '- fallback → result: result-guidance',
  ];

  const questions = parseQuestions(lines, 0, lines.length);
  const q1 = questions.q1;
  assert.ok(q1);
  assert.equal(q1.type, 'multi-select');
  assert.deepEqual(q1.multiSelectOptions, ['High availability required', 'Budget constrained']);
  assert.equal(q1.multiSelectRoutes?.[0]?.next, 'result-premium');
  assert.equal(q1.multiSelectFallback, 'result-guidance');
});

test('questionParser: parses toggle routes', () => {
  const lines = [
    '## Decision Tree Flow',
    '',
    '### Q1: Exposure (id="q1")',
    '**Title**: "Workload exposure"',
    '**Type**: toggle',
    '**Label**: "Is this customer-facing?"',
    '**On** → go to q2',
    '**Off** → result: result-basic',
  ];

  const questions = parseQuestions(lines, 0, lines.length);
  const q1 = questions.q1;
  assert.ok(q1);
  assert.equal(q1.type, 'toggle');
  assert.equal(q1.toggleLabel, 'Is this customer-facing?');
  assert.equal(q1.toggleOnNext, 'q2');
  assert.equal(q1.toggleOffNext, 'result-basic');
});

test('questionParser: parses scoring-matrix routes', () => {
  const lines = [
    '## Decision Tree Flow',
    '',
    '### Q1: Score (id="q1")',
    '**Title**: "Score priorities"',
    '**Type**: scoring-matrix',
    '**Categories**: Security, Cost, Performance, Scalability',
    '**Scale**: 1–5',
    '**Routes**:',
    '- Range: 4–8 → result: result-basic',
    '- Range: 9–14 → result: result-standard',
  ];

  const questions = parseQuestions(lines, 0, lines.length);
  const q1 = questions.q1;
  assert.ok(q1);
  assert.equal(q1.type, 'scoring-matrix');
  assert.deepEqual(q1.scoringMatrixCategories, ['Security', 'Cost', 'Performance', 'Scalability']);
  assert.deepEqual(q1.scoringMatrixScale, { min: 1, max: 5 });
  assert.equal(q1.scoringMatrixRoutes?.[1]?.next, 'result-standard');
});
