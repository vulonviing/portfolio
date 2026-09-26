import test from 'node:test';
import assert from 'node:assert/strict';
import { hasNextSlideStep, nextSlideStep, previousSlideStep } from '../src/deck-model.js';

test('native slide steps advance and stop at the final reveal', () => {
  assert.equal(nextSlideStep(0, 4), 1);
  assert.equal(nextSlideStep(2, 4), 3);
  assert.equal(nextSlideStep(3, 4), 3);
  assert.equal(hasNextSlideStep(2, 4), true);
  assert.equal(hasNextSlideStep(3, 4), false);
});

test('native slide steps reverse without becoming negative', () => {
  assert.equal(previousSlideStep(3), 2);
  assert.equal(previousSlideStep(0), 0);
});
