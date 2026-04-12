import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DecisionTreeCompilerError, ERROR_CODES } from '#compiler/errors';

test('DecisionTreeCompilerError: defaults code and suggestion', () => {
  const error = new DecisionTreeCompilerError('Boom');
  assert.equal(error.name, 'DecisionTreeCompilerError');
  assert.equal(error.code, ERROR_CODES.UNKNOWN);
  assert.equal(error.suggestion, '');
});

test('DecisionTreeCompilerError: captures code and cause', () => {
  const cause = new Error('Root cause');
  const error = new DecisionTreeCompilerError('Boom', {
    code: ERROR_CODES.SPEC_INVALID,
    suggestion: 'Fix the spec.',
    cause,
  });

  assert.equal(error.code, ERROR_CODES.SPEC_INVALID);
  assert.equal(error.suggestion, 'Fix the spec.');
  assert.equal(error.cause, cause);
});
