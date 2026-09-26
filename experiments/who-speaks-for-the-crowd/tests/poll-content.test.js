import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { polls } from '../src/polls.js';

const asset = (name) => new URL(`../public/media/${name}`, import.meta.url);

test('the first two rounds use real posts and exact Community Note text', () => {
  assert.equal(polls[0].post.handle, '@Inevitablewest');
  assert.match(polls[0].post.sourceUrl, /1891443393684774979/);
  assert.match(polls[0].post.text, /AfD are winning every single one/);
  assert.match(polls[0].candidates[0].text, /placed fourth with 15\.5%/);
  assert.match(polls[0].candidates[0].reveal.detail, /1891720468169720267/);

  assert.equal(polls[1].post.handle, '@LegitTargets');
  assert.match(polls[1].post.sourceUrl, /1862791177592050074/);
  assert.match(polls[1].post.text, /LEAVE the EU/);
  assert.match(polls[1].candidates[1].text, /let the people decide through a vote/);
  assert.match(polls[1].candidates[1].reveal.detail, /1862981658447905254/);
});

test('real-post rounds have local image and avatar assets', () => {
  const expectedAssets = [
    'inevitable-west-avatar.jpg',
    'afd-juniorwahl-result.jpg',
    'afd-juniorwahl-parties.jpg',
    'afd-juniorwahl-pie-chart.jpg',
    'legitimate-targets-avatar.jpg',
    'afd-eu-weidel.jpg',
    'afd-eu-flag.jpg',
    'shia-visuals-avatar.jpg',
  ];

  for (const name of expectedAssets) assert.equal(existsSync(asset(name)), true, `${name} is missing`);
  assert.equal(polls.some((poll) => poll.post.meta === 'Demo post'), false);
  assert.equal(polls.every((poll) => Boolean(poll.post.avatarImage)), true);
  assert.deepEqual(polls.slice(0, 2).map((poll) => poll.post.images.length), [2, 2]);
  assert.equal(polls[0].post.images.every((image) => image.splitDocument), true);
  assert.deepEqual(polls.slice(0, 2).map((poll) => poll.candidates.length), [3, 3]);
});
