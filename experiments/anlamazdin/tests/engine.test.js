import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIO_SAMPLE_BYTES,
  AUDIO_TIMING,
  ArrangementEngine,
  chooseSampleAnchor,
  clampPosition,
  clampTrackLevel,
  firstPlayableEvent,
  VIOLIN_MIX,
  violinMixLevel,
} from '../src/audio/ArrangementEngine.js';

test('a preferred sample anchor keeps a short phrase on one piano recording', () => {
  const anchors = [57, 60, 63, 66];
  assert.equal(chooseSampleAnchor(62, anchors, 60), 60);
  assert.equal(chooseSampleAnchor(62, anchors, 61), 63);
});

test('violin rises smoothly into Demedim mi and remains lifted afterward', () => {
  const liftAt = 24;
  assert.equal(violinMixLevel(19, liftAt), VIOLIN_MIX.base);
  assert.equal(violinMixLevel(20, liftAt), VIOLIN_MIX.base);
  assert.equal(violinMixLevel(22, liftAt), (VIOLIN_MIX.base + VIOLIN_MIX.lifted) / 2);
  assert.equal(violinMixLevel(24, liftAt), VIOLIN_MIX.lifted);
  assert.equal(violinMixLevel(60, liftAt), VIOLIN_MIX.lifted);
});

test('audio scheduling keeps a wide buffer against a busy main thread', () => {
  assert.ok(AUDIO_TIMING.scheduleAheadSeconds >= 1);
  assert.ok(AUDIO_TIMING.schedulerIntervalMs / 1000 < AUDIO_TIMING.scheduleAheadSeconds / 5);
  assert.ok(AUDIO_TIMING.progressIntervalMs >= AUDIO_TIMING.schedulerIntervalMs);
});

test('track mix controls support mute and the violin four-times ceiling', () => {
  assert.equal(clampTrackLevel(-1), 0);
  assert.equal(clampTrackLevel(0.65), 0.65);
  assert.equal(clampTrackLevel(1.25), 1.25);
  assert.equal(clampTrackLevel(2), 2);
  assert.equal(clampTrackLevel(4), 4);
  assert.equal(clampTrackLevel(5), 4);
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

test('audio loading exposes determinate progress from the idle state', () => {
  const engine = new ArrangementEngine([], 10);
  assert.deepEqual(engine.snapshot().loadProgress, {
    stage: 'idle',
    loaded: 0,
    total: 21,
    loadedBytes: 0,
    totalBytes: AUDIO_SAMPLE_BYTES.total,
  });
  assert.equal(AUDIO_SAMPLE_BYTES.total, AUDIO_SAMPLE_BYTES.piano + AUDIO_SAMPLE_BYTES.violin);
});
