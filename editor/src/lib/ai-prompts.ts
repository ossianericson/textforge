const parsedSpecExample = {
  title: { main: 'Choose a Platform', subtitle: 'Reference decision support' },
  metadata: { version: '1.0.0' },
  questions: {
    q1: {
      title: 'What do you need to optimise?',
      subtitle: 'Pick the dominant concern',
      infoBox: 'Add domain-specific context when useful.',
      type: 'buttons',
      options: [
        { text: 'Performance first', next: 'q2', recommended: true, advanced: false },
        {
          text: "I don't know / Unsure",
          next: 'result-review',
          recommended: false,
          advanced: false,
        },
      ],
    },
  },
  results: {
    'result-review': {
      title: 'Review the Current Constraints',
      icon: '🧭',
      badge: { text: 'Standard', className: 'standard' },
      bestFor: ['Clarifying inputs before making a platform choice'],
      keyBenefits: ['Avoids premature commitment'],
      considerations: ['Needs stakeholder follow-up'],
      whenNotToUse: ['When the destination architecture is already mandated'],
      techTags: ['assessment'],
      docs: [{ label: 'Reference guide', url: 'https://example.com' }],
      additionalConsiderations:
        'Capture missing requirements before finalising the recommendation.',
    },
  },
  progressSteps: { q1: 10 },
};

const quizSpecExample = {
  title: 'Networking Foundations Quiz',
  subject: 'Networking',
  grade: 'Technical',
  questions: [
    {
      id: 'quiz-1',
      prompt: 'Which service provides private Layer 3 connectivity into Azure?',
      choices: ['VPN Gateway', 'ExpressRoute', 'Application Gateway', 'Azure DNS'],
      answer: 'ExpressRoute',
      explanation:
        'ExpressRoute provides private connectivity that does not traverse the public internet.',
    },
  ],
};

export const BASE_SYSTEM_PROMPT = `You are generating JSON for the textforge editor.

Hard rules:
- Navigation arrow must be → (U+2192) and never -> or =>.
- Result bullets must be ▸ (U+25B8) and never - or *.
- Question IDs must match q[0-9]+[a-z]*.
- Result IDs must match result-[a-z0-9-]+.
- Every question must include an "I don't know / Unsure" option.
- Result titles must start with an action verb.
- Available badge classNames: iaas, paas, faas, batch, analytics, database, nosql, storage, process, domain, support, urgent, standard, advanced, danger.

Required result sections:
- Best For
- Key Benefits
- Considerations
- When NOT to use
- Tech Tags
- Additional Considerations

ParsedSpec JSON schema example:
${JSON.stringify(parsedSpecExample, null, 2)}

QuizSpec JSON schema example:
${JSON.stringify(quizSpecExample, null, 2)}

Instruction: return ONLY raw JSON, no fences, no preamble.`;

function finishPrompt(prompt: string): string {
  return `${prompt}\n\nReturn ONLY the JSON. Start with { or [. No explanation.`;
}

export function buildGenerateTreePrompt(description: string): string {
  return finishPrompt(
    `Create a complete ParsedSpec JSON object for this decision-tree request:\n${description}`
  );
}

export function buildGenerateQuizPrompt(subject: string, grade: string, material: string): string {
  return finishPrompt(
    `Create a quiz JSON object for subject \"${subject}\" at level \"${grade}\" using this material:\n${material}`
  );
}

export function buildImproveResultPrompt(resultId: string, resultJson: string): string {
  return finishPrompt(
    `Improve this result while preserving the textforge schema and keeping it practical. Return a single result JSON object for ${resultId}.\n${resultJson}`
  );
}

export function buildSuggestSectionPrompt(resultTitle: string, sectionName: string): string {
  return finishPrompt(
    `Suggest JSON array content for the ${sectionName} section of the result titled \"${resultTitle}\". Return an array of concise strings only.`
  );
}

export function buildReviewTreePrompt(specJson: string): string {
  return finishPrompt(
    `Review this ParsedSpec JSON and return an array of AIReviewIssue objects with type, nodeId, and message.\n${specJson}`
  );
}

export function buildCustomiseTemplatePrompt(specJson: string, customisation: string): string {
  return finishPrompt(
    `Customise this ParsedSpec JSON template by replacing placeholders and generic wording with concrete content for the following request. Preserve the schema and ids where possible.\nRequest: ${customisation}\nTemplate:\n${specJson}`
  );
}
