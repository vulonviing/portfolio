import test from 'node:test';
import assert from 'node:assert/strict';
import { createPresenterBridge } from '../src/presenter-bridge.js';

test('public presentation accepts only its local opener and a matching response', async () => {
  const sent = [];
  const opener = { closed: false, postMessage: (data, origin) => sent.push({ data, origin }) };
  let handler;
  const window = {
    opener,
    crypto: { randomUUID: () => 'request-1' },
    addEventListener: (_name, listener) => { handler = listener; },
    removeEventListener: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout,
    clearTimeout,
  };
  const pairing = [];
  const resets = [];
  const keyChanges = [];
  const bridge = createPresenterBridge(window, {
    onPairChange: (value) => pairing.push(value),
    onReset: () => resets.push(true),
    onKeyChange: (value) => keyChanges.push(value),
  });
  bridge.start();
  assert.equal(sent.filter(({ data }) => data.type === 'seds-presenter-ready').length, 2);
  handler({ source: opener, origin: 'https://evil.example', data: { type: 'seds-presenter-paired' } });
  await assert.rejects(bridge.command('open', 'case-great-wall'), /management panel/);
  handler({ source: {}, origin: 'http://127.0.0.1:8765', data: { type: 'seds-presenter-paired' } });
  await assert.rejects(bridge.command('open', 'case-great-wall'), /management panel/);
  handler({ source: opener, origin: 'http://127.0.0.1:8765', data: { type: 'seds-presenter-paired' } });
  assert.deepEqual(pairing, [true]);
  const result = bridge.command('open', 'case-great-wall');
  assert.equal(sent.at(-1).origin, 'http://127.0.0.1:8765');
  assert.deepEqual(sent.at(-1).data, {
    type: 'seds-presenter-command', requestId: 'request-1', action: 'open', pollKey: 'case-great-wall',
  });
  handler({ source: opener, origin: 'https://evil.example', data: { type: 'seds-presenter-response', requestId: 'request-1', ok: true, state: {} } });
  const state = { pollKey: 'case-great-wall', phase: 'open' };
  handler({ source: opener, origin: 'http://127.0.0.1:8765', data: { type: 'seds-presenter-response', requestId: 'request-1', ok: true, state } });
  assert.deepEqual(await result, state);
  handler({ source: opener, origin: 'http://127.0.0.1:8765', data: { type: 'seds-presenter-reset' } });
  assert.deepEqual(resets, [true]);
  handler({ source: opener, origin: 'http://127.0.0.1:8765', data: { type: 'seds-presenter-key', on: true } });
  assert.deepEqual(keyChanges, [true]);
  handler({ source: {}, origin: 'http://127.0.0.1:8765', data: { type: 'seds-presenter-reset' } });
  assert.deepEqual(resets, [true]);
  bridge.stop();
});

test('unpaired presentation does not send voting commands', async () => {
  const bridge = createPresenterBridge({ opener: null });
  await assert.rejects(bridge.command('open', 'case-oxford'), /management panel/);
});

test('an iframe parent is not accepted as the controller', async () => {
  const sent = [];
  const parent = { closed: false, postMessage: (data, origin) => sent.push({ data, origin }) };
  const window = {
    parent, // not opener — must be ignored
    opener: null,
    crypto: { randomUUID: () => 'request-2' },
    addEventListener: () => {},
    removeEventListener: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout,
    clearTimeout,
  };
  const bridge = createPresenterBridge(window);
  bridge.start();
  assert.equal(sent.length, 0);
  await assert.rejects(bridge.command('open', 'case-oxford'), /management panel/);
});
