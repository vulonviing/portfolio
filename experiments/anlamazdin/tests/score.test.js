import test from 'node:test';
import assert from 'node:assert/strict';
import { MOTIF, SECTIONS, SONG, TAIL_SECONDS, buildSongEvents, sectionAt } from '../src/music/score.js';

test('motif is the ten-syllable Dilerim ki phrase with written note values', () => {
  assert.deepEqual(MOTIF.map((note) => note.syllable), ['di', 'le', 'rim', 'ki', 'mut', 'lu', 'ol', 'sev', 'gi', 'lim']);
  assert.deepEqual(MOTIF.map((note) => note.midi), [59, 61, 62, 64, 63, 64, 66, 64, 62, 64]);
  assert.deepEqual(MOTIF.map((note) => note.onsetBeats), [0, 1, 2, 3, 4.5, 5, 5.5, 6, 6.5, 7]);
  assert.deepEqual(MOTIF.map((note) => note.durationBeats), [1, 1, 1, 1.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.5]);
  assert.equal(MOTIF.at(-1).onsetBeats + MOTIF.at(-1).durationBeats, 8.5);
});

test('score starts directly on Dilerim ki and contains piano plus violin', () => {
  const events = buildSongEvents();
  const melody = events.filter((event) => event.track === 'melody');
  const violin = events.filter((event) => event.track === 'violin');
  assert.ok(events.length > 270);
  assert.equal(melody[0].time, 0);
  assert.equal(melody[0].midi, 59);
  assert.deepEqual(
    melody.slice(0, 10).map((event) => Number(event.time.toFixed(3))),
    MOTIF.map((note) => Number((note.onsetBeats * 0.75).toFixed(3))),
  );
  assert.deepEqual(melody.slice(0, 10).map((event) => event.midi), MOTIF.map((note) => note.midi));
  assert.equal(SONG.duration, 73.75);
  assert.equal(TAIL_SECONDS, 2.5);
  assert.ok(violin.length > 20);
  assert.equal(violin[0].time, 0);
  assert.ok(violin.every((event) => event.velocity <= 0.24));
  assert.ok(events.every((event, index) => index === 0 || events[index - 1].time <= event.time));
  assert.ok(events.every((event) => event.time >= 0 && event.time < SONG.duration && event.duration > 0));
});

test('arrangement flows directly from Dilerim ki through Demedim mi? and Anlamazdın', () => {
  assert.deepEqual(SECTIONS.map((section) => section.id), [
    'wish-1', 'verse-2', 'chorus-2',
  ]);
  assert.deepEqual(SECTIONS.map((section) => section.label), [
    'Dilerim ki', 'Demedim mi?', 'Anlamazdın',
  ]);
  assert.ok(!SECTIONS.some((section) => ['interlude', 'outro'].includes(section.id)));
  assert.equal(SECTIONS[0].start, 0);
  assert.equal(SECTIONS.at(-1).end, SONG.duration);
  SECTIONS.slice(1, -1).forEach((section, index) => {
    assert.equal(section.start, SECTIONS[index].end);
  });
  assert.equal(sectionAt(0).id, 'wish-1');
  assert.equal(sectionAt(40).id, 'verse-2');
  assert.equal(sectionAt(48).id, 'chorus-2');
  assert.equal(sectionAt(72).id, 'chorus-2');
});

test('Demedim mi? follows the complete published first-verse melody and rhythm', () => {
  const events = buildSongEvents();
  const verse = SECTIONS.find((section) => section.id === 'verse-2');
  const melody = events.filter((event) => (
    event.track === 'melody'
    && event.time >= verse.start
    && event.time < verse.end
  ));

  assert.deepEqual(melody.map((event) => event.midi), [
    59, 61, 62, 59, 61, 59, 66, 64,
    58, 59, 61, 58, 61, 58, 64, 62,
    59, 61, 62, 59, 61, 59, 61,
    59, 62, 61, 61, 61, 58, 59, 59,
  ]);
  assert.deepEqual(
    melody.map((event) => Number(((event.time - verse.start) / 0.75).toFixed(2))),
    [
      1, 1.5, 2, 2.5, 3, 3.5, 4, 5,
      9, 9.5, 10, 10.5, 11, 11.5, 12, 13,
      17, 17.5, 18, 18.5, 19, 19.5, 20,
      22.5, 23, 23.5, 24, 27, 27.5, 28, 29,
    ],
  );
  assert.deepEqual(
    melody.map((event) => Number((event.duration / 0.75).toFixed(2))),
    [
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 3,
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 3,
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2,
      0.5, 0.5, 0.5, 3, 0.5, 0.5, 1, 3,
    ],
  );
  assert.ok(melody.every((event) => event.tone === 'warm' && event.velocity <= 0.53));
  assert.equal(melody.at(-2).time + melody.at(-2).duration, melody.at(-1).time);
  assert.equal(melody.at(-1).time + melody.at(-1).duration, verse.end);
});

test('Demedim mi? keeps held harmony and phrase-shaped violin beneath every line', () => {
  const events = buildSongEvents();
  const verse = SECTIONS.find((section) => section.id === 'verse-2');
  const accompaniment = events.filter((event) => (
    event.track !== 'melody'
    && event.time >= verse.start
    && event.time < verse.end
  ));
  const violin = accompaniment.filter((event) => event.track === 'violin');
  const pedal = accompaniment.filter((event) => event.track === 'pedal');

  assert.deepEqual(violin.map((event) => event.midi), [71, 66, 71, 70, 71]);
  assert.deepEqual(
    violin.map((event) => Number(((event.time - verse.start) / 0.75).toFixed(2))),
    [0.55, 8, 16, 24, 28],
  );
  assert.deepEqual(violin.map((event) => event.velocity), [0.18, 0.19, 0.18, 0.21, 0.2]);
  assert.ok(violin.every((event) => event.articulation === 'pad'));
  assert.equal(pedal.length, 32);
  assert.ok(pedal.every((event) => (
    event.tone === 'pedal'
    && Math.abs(event.duration - 4.15 * 0.75) < 0.000001
  )));
  assert.deepEqual(
    [...new Set(pedal.map((event) => Number(((event.time - verse.start) / 0.75).toFixed(2))))],
    [0, 4, 8, 12, 16, 20, 24, 28],
  );
  assert.deepEqual(
    pedal.filter((_, index) => index % 4 === 0).map((event) => event.midi),
    [35, 40, 42, 35, 35, 37, 42, 35],
  );
  assert.ok(!accompaniment.some((event) => event.track === 'harmony'));
});

test('Demedim mi? resolves directly into Anlamazdın and the song ends there', () => {
  const events = buildSongEvents();
  const verse = SECTIONS.find((section) => section.id === 'verse-2');
  const chorus = SECTIONS.find((section) => section.id === 'chorus-2');
  const firstChorusMelody = events.find((event) => event.track === 'melody' && event.time >= chorus.start);

  assert.equal(verse.end, chorus.start);
  assert.equal(firstChorusMelody.time, chorus.start + 0.75);
  assert.equal(SECTIONS.at(-1).id, 'chorus-2');

  const musicEnd = SONG.duration - TAIL_SECONDS;
  const finalAttack = musicEnd - 3;
  const finalEvents = events.filter((event) => event.time === finalAttack);
  assert.ok(finalEvents.some((event) => event.track === 'violin' && event.midi === 66 && event.duration === 3));
  assert.ok([47, 62, 66].every((midi) => finalEvents.some((event) => event.track === 'harmony' && event.midi === midi)));
});

test('Anlamazdın closes with the published Hani sen and Kalpsizlerden phrases', () => {
  const events = buildSongEvents();
  const chorus = SECTIONS.find((section) => section.id === 'chorus-2');
  const closing = events.filter((event) => (
    event.track === 'melody'
    && event.time >= chorus.start + 16 * 0.75
    && event.time < chorus.start + 32 * 0.75
  ));

  assert.deepEqual(closing.map((event) => event.midi), [
    59, 61, 62, 54, 62, 59, 61,
    54, 62, 59, 61, 61, 58, 61, 59,
  ]);
  assert.deepEqual(
    closing.map((event) => Number(((event.time - chorus.start) / 0.75).toFixed(2))),
    [17, 17.5, 18, 19.5, 20, 20.5, 21, 22.5, 23, 23.5, 24, 27, 27.5, 28, 29],
  );
  assert.deepEqual(
    closing.map((event) => Number((event.duration / 0.75).toFixed(2))),
    [0.5, 0.5, 1, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 3, 0.5, 0.5, 1, 2],
  );
  const sen = closing[2];
  const aci = closing[3];
  const veren = closing[6];
  const kalpsizlerden = closing[7];
  assert.equal(aci.time - (sen.time + sen.duration), 0.5 * 0.75);
  assert.equal(kalpsizlerden.time - (veren.time + veren.duration), 0.5 * 0.75);
  assert.deepEqual(closing.slice(0, 3).map((event) => event.sampleAnchor), [60, 60, 60]);
  assert.ok(closing.slice(3).every((event) => event.sampleAnchor === undefined));
  assert.equal(closing.at(-1).time + closing.at(-1).duration, chorus.start + 31 * 0.75);
});
