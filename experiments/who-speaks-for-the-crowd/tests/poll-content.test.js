import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { polls } from '../src/polls.js';

const asset = (name) => new URL(`../public/media/${name}`, import.meta.url);

test('both rounds use real posts and exact Community Note text', () => {
  assert.equal(polls[0].post.handle, '@LegitTargets');
  assert.match(polls[0].post.sourceUrl, /1862791177592050074/);
  assert.match(polls[0].post.text, /LEAVE the EU/);
  assert.match(polls[0].candidates[1].text, /let the people decide through a vote/);
  assert.match(polls[0].candidates[1].reveal.detail, /1862981658447905254/);

  assert.equal(polls[1].post.handle, '@ShiaVisuals');
  assert.equal(polls[1].post.text, 'May Allah protect him.');
  assert.equal(polls[1].candidates[2].text, 'Allah didn’t protect him.');
  assert.match(polls[1].candidates[2].reveal.sourceUrl, /theguardian\.com/);
});

test('real-post rounds have local image and avatar assets', () => {
  const expectedAssets = [
    'legitimate-targets-avatar.jpg',
    'afd-eu-weidel.jpg',
    'afd-eu-flag.jpg',
    'shia-visuals-avatar.jpg',
    'khamenei.jpg',
  ];

  for (const name of expectedAssets) assert.equal(existsSync(asset(name)), true, `${name} is missing`);
  assert.equal(polls.some((poll) => poll.post.meta === 'Demo post'), false);
  assert.equal(polls.every((poll) => Boolean(poll.post.avatarImage)), true);
  assert.equal(polls[0].post.images.length, 2);
  assert.equal(Boolean(polls[1].post.image), true);
  assert.deepEqual(polls.map((poll) => poll.candidates.length), [3, 3]);
});
