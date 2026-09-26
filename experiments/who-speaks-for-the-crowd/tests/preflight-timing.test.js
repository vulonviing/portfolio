import assert from 'node:assert/strict';
import test from 'node:test';
import { nextHealthCheckDelayMs, nextRefreshCooldownMs } from '../src/preflight-timing.js';

test('automatic VPS checks are spaced 4–7 seconds apart', () => {
  assert.equal(nextHealthCheckDelayMs(() => 0), 4000);
  assert.equal(nextHealthCheckDelayMs(() => 0.999999), 7000);
});

test('manual refresh locks out repeat clicks for 3–7 seconds', () => {
  assert.equal(nextRefreshCooldownMs(() => 0), 3000);
  assert.equal(nextRefreshCooldownMs(() => 0.999999), 7000);
});
