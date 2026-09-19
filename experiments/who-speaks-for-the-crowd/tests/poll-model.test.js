import assert from 'node:assert/strict';
import test from 'node:test';
import { createParticipantId, nextPollPhase, previousPollPhase, resultRows } from '../src/poll-model.js';

test('poll phases advance in presentation order', () => {
  assert.equal(nextPollPhase('tweet'), 'candidates');
  assert.equal(nextPollPhase('candidates'), 'live');
  assert.equal(nextPollPhase('live'), 'closed');
  assert.equal(nextPollPhase('closed'), 'closed');
  assert.equal(previousPollPhase('candidates'), 'tweet');
  assert.equal(previousPollPhase('live'), 'closed');
});

test('result rows calculate percentages and ties', () => {
  const candidates = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
  const rows = resultRows(candidates, { A: 2, B: 2, C: 1 });
  assert.deepEqual(rows.map((row) => row.percentage), [40, 40, 20]);
  assert.deepEqual(rows.map((row) => row.winner), [true, true, false]);
});

test('zero votes do not create a winner or NaN', () => {
  const rows = resultRows([{ id: 'A' }, { id: 'B' }, { id: 'C' }], {});
  assert.deepEqual(rows.map((row) => row.percentage), [0, 0, 0]);
  assert.deepEqual(rows.map((row) => row.winner), [false, false, false]);
});

test('participant identity is reused by tabs sharing storage', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  const first = createParticipantId(storage);
  const second = createParticipantId(storage);
  assert.equal(first, second);
  assert.ok(first.length > 10);
});
