import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseSampleAnchor, clampPosition, firstPlayableEvent } from '../src/audio/ArrangementEngine.js';

test('a preferred sample anchor keeps a short phrase on one piano recording', () => {
  const anchors = [57, 60, 63, 66];
  assert.equal(chooseSampleAnchor(62, anchors, 60), 60);
  assert.equal(chooseSampleAnchor(62, anchors, 61), 63);
});

test('seek positions are clamped to the arrangement', () => {
  assert.equal(clampPosition(-4, 100), 0);
  assert.equal(clampPosition(48.25, 100), 48.25);
  assert.equal(clampPosition(104, 100), 100);
});

test('seeking includes a sustained note that began before the target', () => {
  const events = [
    { time: 0, duration: 1 },
    { time: 2, duration: 4 },
    { time: 7, duration: 1 },
  ];
  assert.equal(firstPlayableEvent(events, 4), 1);
  assert.equal(firstPlayableEvent(events, 9), events.length);
});

test('seeking into an overlapping pedal chord keeps the earlier resonance playable', () => {
  const events = [
    { time: 12, duration: 3.1125, track: 'pedal' },
    { time: 15, duration: 3.1125, track: 'pedal' },
    { time: 18, duration: 3.1125, track: 'pedal' },
  ];
  assert.equal(firstPlayableEvent(events, 15.05), 0);
});
