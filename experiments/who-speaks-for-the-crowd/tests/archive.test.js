import assert from 'node:assert/strict';
import test from 'node:test';
import { archive, archiveTotal, readOwnVote } from '../src/archive.js';
import { pollKeys, polls } from '../src/polls.js';

test('archive holds exactly the recorded counts for every round', () => {
  assert.deepEqual(Object.keys(archive.counts).sort(), [...pollKeys].sort());
  assert.equal(archiveTotal('case-oxford'), 34);
  assert.equal(archiveTotal('case-khamenei'), 35);
  for (const poll of polls) {
    assert.deepEqual(Object.keys(archive.counts[poll.key]), poll.candidates.map((candidate) => candidate.id));
  }
});

test('own vote is read from the run-scoped selection key and tolerates blocked storage', () => {
  const storage = { getItem: (key) => (key === `science-slam-selection:${archive.runId}:case-oxford` ? 'B' : null) };
  assert.equal(readOwnVote('case-oxford', storage), 'B');
  assert.equal(readOwnVote('case-khamenei', storage), '');
  assert.equal(readOwnVote('case-oxford', { getItem: () => { throw new Error('blocked'); } }), '');
});
