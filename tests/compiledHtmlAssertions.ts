import assert from 'node:assert/strict';

type CompiledKind = 'decision-tree' | 'quiz';

interface CompiledHtmlAssertionOptions {
  html: string;
  kind: CompiledKind;
  specLabel: string;
}

function extractSerializedConstObject(html: string, constName: string): unknown {
  const declaration = `const ${constName} = `;
  const declarationIndex = html.indexOf(declaration);
  assert.notEqual(declarationIndex, -1, `Expected serialized ${constName} declaration.`);

  const objectStart = html.indexOf('{', declarationIndex + declaration.length);
  assert.notEqual(objectStart, -1, `Expected serialized object body for ${constName}.`);

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = objectStart; index < html.length; index += 1) {
    const char = html[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const json = html.slice(objectStart, index + 1);
        return JSON.parse(json);
      }
    }
  }

  assert.fail(`Could not parse serialized ${constName} JSON.`);
}

function resolveDynamicTargets(target: string): string[] {
  if (!target.includes('{tier}')) {
    return [target];
  }

  return ['critical', 'high', 'medium', 'low'].map((tier) => target.replace('{tier}', tier));
}

function assertDecisionTreeDataIntegrity(html: string, specLabel: string): void {
  const questions = extractSerializedConstObject(html, 'questions') as Record<
    string,
    Record<string, unknown>
  >;
  const results = extractSerializedConstObject(html, 'results') as Record<
    string,
    Record<string, unknown>
  >;
  const progressSteps = extractSerializedConstObject(html, 'progressSteps') as Record<
    string,
    unknown
  >;

  assert.ok(Object.keys(questions).length > 0, `Expected at least one question in ${specLabel}.`);
  assert.ok(Object.keys(results).length > 0, `Expected at least one result in ${specLabel}.`);
  assert.ok(Object.keys(progressSteps).length > 0, `Expected progress data in ${specLabel}.`);
  assert.equal(
    progressSteps.result,
    100,
    `Expected result progress to end at 100 in ${specLabel}.`
  );

  const questionIds = new Set(Object.keys(questions));
  const resultIds = new Set(Object.keys(results));

  const collectTargets = (question: Record<string, unknown>): string[] => {
    const targets: string[] = [];
    const pushNextValues = (items: unknown) => {
      if (!Array.isArray(items)) {
        return;
      }
      items.forEach((item) => {
        if (
          item &&
          typeof item === 'object' &&
          typeof (item as { next?: unknown }).next === 'string'
        ) {
          targets.push((item as { next: string }).next);
        }
      });
    };

    pushNextValues(question.options);
    pushNextValues(question.dropdownRanges);
    pushNextValues(question.sliderRanges);
    pushNextValues(question.scoringMatrixRoutes);
    pushNextValues(question.multiSelectRoutes);

    if (typeof question.multiSelectFallback === 'string') {
      targets.push(question.multiSelectFallback);
    }
    if (typeof question.toggleOnNext === 'string') {
      targets.push(question.toggleOnNext);
    }
    if (typeof question.toggleOffNext === 'string') {
      targets.push(question.toggleOffNext);
    }

    if (question.dropdownMatrix && typeof question.dropdownMatrix === 'object') {
      Object.values(question.dropdownMatrix as Record<string, unknown>).forEach((row) => {
        if (!row || typeof row !== 'object') {
          return;
        }
        Object.values(row as Record<string, unknown>).forEach((target) => {
          if (typeof target === 'string') {
            targets.push(target);
          }
        });
      });
    }

    return targets;
  };

  Object.entries(questions).forEach(([questionId, question]) => {
    collectTargets(question).forEach((target) => {
      const resolvedTargets = resolveDynamicTargets(target);
      const exists = resolvedTargets.some(
        (resolvedTarget) => questionIds.has(resolvedTarget) || resultIds.has(resolvedTarget)
      );
      assert.ok(
        exists,
        `Expected target "${target}" referenced from question "${questionId}" to exist in ${specLabel}.`
      );
    });
  });
}

function assertQuizDataIntegrity(html: string, specLabel: string): void {
  const quizData = extractSerializedConstObject(html, 'quizData') as Record<string, unknown>;

  assert.equal(typeof quizData.title, 'string', `Expected quiz title text in ${specLabel}.`);
  assert.ok(Array.isArray(quizData.studyCards), `Expected study cards array in ${specLabel}.`);
  assert.ok(
    Array.isArray(quizData.quizQuestions),
    `Expected quiz questions array in ${specLabel}.`
  );
  assert.ok(
    Array.isArray(quizData.quizQuestions) && quizData.quizQuestions.length > 0,
    `Expected at least one quiz question in ${specLabel}.`
  );
}

export function assertCompiledHtml({ html, kind, specLabel }: CompiledHtmlAssertionOptions): void {
  assert.ok(html.trim().length > 500, `Expected non-trivial HTML output for ${specLabel}.`);
  assert.match(html, /<!doctype html>/i, `Expected a doctype in compiled output for ${specLabel}.`);
  assert.match(html, /<html[\s>]/i, `Expected an HTML document for ${specLabel}.`);
  assert.match(html, /<title>[^<]+<\/title>/i, `Expected a populated title tag for ${specLabel}.`);
  assert.doesNotMatch(
    html,
    /\{\{[#\/]?[^}]+\}\}/,
    `Found unresolved template markers in compiled output for ${specLabel}.`
  );
  assert.doesNotMatch(
    html,
    /#blocked-url/i,
    `Found blocked URLs in compiled output for ${specLabel}.`
  );
  assert.doesNotMatch(
    html,
    /(?:href|src)\s*=\s*["']javascript:/i,
    `Found unsafe javascript URLs in compiled output for ${specLabel}.`
  );

  if (kind === 'decision-tree') {
    assert.match(
      html,
      /const questions = \{/i,
      `Expected serialized question data in compiled decision tree output for ${specLabel}.`
    );
    assert.match(
      html,
      /const results = \{/i,
      `Expected serialized result data in compiled decision tree output for ${specLabel}.`
    );
    assert.match(
      html,
      /const progressSteps = \{/i,
      `Expected serialized progress data in compiled decision tree output for ${specLabel}.`
    );
    assertDecisionTreeDataIntegrity(html, specLabel);
    return;
  }

  assert.match(
    html,
    /const quizData = \{/i,
    `Expected serialized quiz data in compiled quiz output for ${specLabel}.`
  );
  assertQuizDataIntegrity(html, specLabel);
}
