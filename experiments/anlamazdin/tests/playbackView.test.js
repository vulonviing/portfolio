import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activePianoMidis,
  musicalProgressPercent,
  orbitSectionId,
  ORBIT_SECTIONS,
  shouldUseLowPowerMode,
} from '../src/music/playbackView.js';

test('orbit exposes the three language-neutral section positions', () => {
  assert.deepEqual(ORBIT_SECTIONS, [
    { id: 'wish', position: 'lower-left' },
    { id: 'verse', position: 'lower-right' },
    { id: 'chorus', position: 'top' },
  ]);
  assert.equal(orbitSectionId('wish-1'), 'wish');
  assert.equal(orbitSectionId('wish-2'), null);
  assert.equal(orbitSectionId('verse-2'), 'verse');
  assert.equal(orbitSectionId('chorus-2'), 'chorus');
  assert.equal(orbitSectionId('breath'), null);
  assert.equal(orbitSectionId('threshold'), null);
});

test('active piano notes include simultaneous playable events without violin or duplicates', () => {
  const events = [
    { time: 1, duration: 2, midi: 59, track: 'melody' },
    { time: 1.5, duration: 1, midi: 59, track: 'harmony' },
    { time: 1, duration: 2, midi: 62, track: 'harmony' },
    { time: 1, duration: 2, midi: 66, track: 'violin' },
    { time: 1, duration: 2, midi: 47, track: 'harmony' },
  ];
  assert.deepEqual(activePianoMidis(events, 2), [59, 62]);
  assert.deepEqual(activePianoMidis(events, 3), []);
});

test('record progress reaches 100 at the musical ending before the transition tail', () => {
  assert.equal(musicalProgressPercent(70.99, 73.5, 2.5), 99);
  assert.equal(musicalProgressPercent(71, 73.5, 2.5), 100);
  assert.equal(musicalProgressPercent(73.5, 73.5, 2.5), 100);
});

test('visuals fall back to the light renderer on constrained devices', () => {
  assert.equal(shouldUseLowPowerMode({ hardwareConcurrency: 4, deviceMemory: 8 }), true);
  assert.equal(shouldUseLowPowerMode({ hardwareConcurrency: 8, deviceMemory: 4 }), true);
  assert.equal(shouldUseLowPowerMode({ hardwareConcurrency: 8, deviceMemory: 8 }), false);
  assert.equal(shouldUseLowPowerMode({ reduceMotion: true }), true);
});
