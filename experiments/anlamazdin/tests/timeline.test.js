import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSongEvents, SECTIONS, SONG } from '../src/music/score.js';
import { buildTimelineBins, timelinePercent } from '../src/music/timeline.js';

test('timeline bins preserve harmony, melody and violin energy', () => {
  const bins = buildTimelineBins(buildSongEvents(), SONG.duration, 128);
  assert.equal(bins.length, 128);
  assert.ok(bins.some((bin) => bin.harmony > 0));
  assert.ok(bins.some((bin) => bin.melody > 0));
  assert.ok(bins.some((bin) => bin.violin > 0));
  assert.ok(bins.every((bin) => Object.values(bin).every((value) => value >= 0 && value <= 1)));
});

test('section marker positions stay inside the seek surface', () => {
  const markers = SECTIONS.map((section) => timelinePercent(section.start, SONG.duration));
  assert.equal(markers[0], 0);
  assert.ok(markers.every((marker) => marker >= 0 && marker <= 100));
  assert.ok(markers.every((marker, index) => index === 0 || marker > markers[index - 1]));
  assert.equal(timelinePercent(SONG.duration, SONG.duration), 100);
});
