import test from 'node:test';
import assert from 'node:assert/strict';
import { experienceReducer, initialExperience } from '../src/state/experience.js';

test('correct notes advance exactly one step', () => {
  const ready = experienceReducer(initialExperience, { type: 'ENTER' });
  const next = experienceReducer(ready, { type: 'PRESS_CORRECT', midi: 59 });
  assert.equal(next.step, 1);
  assert.deepEqual(next.pressed, [59]);
});

test('wrong notes do not advance', () => {
  const ready = experienceReducer(initialExperience, { type: 'ENTER' });
  const next = experienceReducer(ready, { type: 'PRESS_WRONG', midi: 60 });
  assert.equal(next.step, 0);
  assert.equal(next.mistakeMidi, 60);
});

test('notes cannot advance during playback', () => {
  const playing = { ...initialExperience, phase: 'playing', step: 10 };
  const next = experienceReducer(playing, { type: 'PRESS_CORRECT', midi: 59 });
  assert.equal(next.step, 10);
});

test('seeking back from the end returns to paused playback', () => {
  const ended = { ...initialExperience, phase: 'ended', step: 10 };
  const next = experienceReducer(ended, { type: 'SEEK' });
  assert.equal(next.phase, 'paused');
});
