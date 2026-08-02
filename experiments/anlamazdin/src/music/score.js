export const SONG = {
  title: 'Anlamazdın',
  artist: 'Ayla Dikmen',
  arrangement: 'Piyano + solo keman',
  bpm: 80,
  meter: '4/4',
  key: 'Si minör',
};

const SECONDS_PER_BEAT = 60 / SONG.bpm;
const BEATS_PER_BAR = 4;
const START_CROP_BEATS = 1;

const WISH_ONSETS = [1, 2, 3, 4, 5.5, 6, 6.5, 7, 7.5, 8];
const WISH_DURATIONS = [1, 1, 1, 1.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.5];
const WISH_SYLLABLES = ['di', 'le', 'rim', 'ki', 'mut', 'lu', 'ol', 'sev', 'gi', 'lim'];
const WISH_MIDI = [59, 61, 62, 64, 63, 64, 66, 64, 62, 64];
const WISH_SOLFEGE = ['Si', 'Do♯', 'Re', 'Mi', 'Re♯', 'Mi', 'Fa♯', 'Mi', 'Re', 'Mi'];

export const MOTIF = WISH_MIDI.map((midi, index) => ({
  midi,
  note: ['B3', 'C#4', 'D4', 'E4', 'D#4', 'E4', 'F#4', 'E4', 'D4', 'E4'][index],
  solfege: WISH_SOLFEGE[index],
  syllable: WISH_SYLLABLES[index],
  onsetBeats: WISH_ONSETS[index] - START_CROP_BEATS,
  durationBeats: WISH_DURATIONS[index],
}));

const CHORDS = {
  Bm: [35, 47, 50, 54],
  Em: [40, 52, 55, 59],
  'F#': [42, 54, 58, 61],
  'C#': [37, 49, 53, 56],
  D: [38, 50, 54, 57],
  G: [43, 55, 59, 62],
  A: [45, 57, 61, 64],
};

// Low, close voicings used only beneath the first verse. The dominant
// sevenths retain their colour without adding extra attacks above the melody.
const VERSE_PEDAL_VOICINGS = {
  Bm: [35, 47, 50, 54],
  Em: [40, 52, 55, 59],
  'F#': [42, 54, 58, 64],
  'C#': [37, 49, 53, 59],
};

const VIOLIN_TONES = {
  Bm: 66,
  Em: 67,
  'F#': 66,
  'C#': 68,
  D: 66,
  G: 67,
  A: 64,
};

// Four eight-bar modules from the published notation, transposed from A minor
// to the recording's B-minor center.
const SCORE_BARS = [
  'Em', 'A', 'D', 'G', 'C#', 'F#', 'Bm', 'Bm',
  'Bm', 'Em', 'F#', 'Bm', 'Bm', 'C#', 'F#', 'Bm',
  'Bm', 'Em', 'F#', 'Bm', 'Bm', 'C#', 'F#', 'Bm',
  'Bm', 'Em', 'A', 'D', 'G', 'Em', 'F#', 'Bm',
];

const VERSE_LINES = [
  [59, 61, 62, 59, 61, 59, 66, 64],
  [58, 59, 61, 58, 61, 58, 64, 62],
  [59, 61, 62, 59, 61, 59, 61],
  [59, 62, 61, 61, 61, 58, 59, 59],
];

const CHORUS_LINES = [
  [59, 61, 62, 59, 61, 59, 66, 64],
  [58, 59, 61, 58, 61, 58, 64, 62],
  [59, 61, 62, 54, 62, 59, 61],
  [54, 62, 59, 61, 61, 58, 61, 59],
];

const LIFT_LINES = [
  WISH_MIDI,
  [63, 64, 66, 66, 64, 62, 61, 62, 64, 62, 61, 62],
  [61, 62, 64, 64, 62, 61, 59, 61, 62, 61, 59, 61],
  [59, 58, 59, 61, 62, 59],
];

// Literal note values from the notation. The first lift phrase has its own
// pickup-aware rhythm; the other phrases retain their written rests.
const RHYTHMS = {
  phrase8: {
    onsets: [1, 1.5, 2, 2.5, 3, 3.5, 4, 5],
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 3],
  },
  phrase7: {
    onsets: [1, 1.5, 2, 2.5, 3, 3.5, 4],
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 3],
  },
  versePhrase7: {
    onsets: [1, 1.5, 2, 2.5, 3, 3.5, 4],
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2],
  },
  // The published score compresses this vocal pickup into even eighth notes,
  // while Dikmen's performance breathes after both "sen" and "veren".
  // Keep those word boundaries audible without changing the section length.
  chorusPhrase7: {
    onsets: [1, 1.5, 2, 3.5, 4, 4.5, 5],
    durations: [0.5, 0.5, 1, 0.5, 0.5, 0.5, 1],
  },
  verseClose: {
    onsets: [-1.5, -1, -0.5, 0, 3, 3.5, 4, 5],
    durations: [0.5, 0.5, 0.5, 3, 0.5, 0.5, 1, 3],
  },
  chorusClose: {
    onsets: [-1.5, -1, -0.5, 0, 3, 3.5, 4, 5],
    durations: [0.5, 0.5, 0.5, 3, 0.5, 0.5, 1, 2],
  },
  phrase10: {
    onsets: WISH_ONSETS,
    durations: WISH_DURATIONS,
  },
  response10: {
    onsets: [0, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 6.5],
    durations: [1.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 1, 0.5, 1.5],
  },
  lift12: {
    onsets: [1.5, 2, 2.5, 3, 3.5, 4, 5.5, 6, 6.5, 7, 7.5, 8],
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 1.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.5],
  },
  lift6: {
    onsets: [1.5, 2, 2.5, 3, 3.5, 4],
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 4],
  },
  phrase12: {
    onsets: [0, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5],
    durations: [1.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.5],
  },
  phrase6: {
    onsets: [0, 1.5, 2, 3, 4, 5.5],
    durations: [1.5, 0.5, 1, 1, 1.5, 2.5],
  },
};

function rhythmFor(module, lineIndex, noteCount) {
  if (module === 'verse' && lineIndex === 2) return RHYTHMS.versePhrase7;
  if (module === 'verse' && lineIndex === 3) return RHYTHMS.verseClose;
  if (module === 'chorus' && lineIndex === 2) return RHYTHMS.chorusPhrase7;
  if (module === 'chorus' && lineIndex === 3) return RHYTHMS.chorusClose;
  if (module === 'lift' && lineIndex === 0) return RHYTHMS.phrase10;
  if (module === 'lift' && (lineIndex === 1 || lineIndex === 2)) return RHYTHMS.lift12;
  if (module === 'lift' && lineIndex === 3) return RHYTHMS.lift6;
  if (noteCount === 10) return RHYTHMS.response10;
  return RHYTHMS[`phrase${noteCount}`];
}

function melodyForModule(moduleId) {
  if (moduleId === 'verse') return VERSE_LINES;
  if (moduleId === 'chorus') return CHORUS_LINES;
  return LIFT_LINES;
}

const PLAY_ORDER = [
  { id: 'wish-1', label: 'Dilerim ki', module: 'lift', sourceStartBar: 24, bars: 8, bridgeToVerse: true },
  { id: 'verse-2', label: 'Demedim mi?', module: 'verse', sourceStartBar: 8, bars: 8 },
  { id: 'chorus-2', label: 'Anlamazdın', module: 'chorus', sourceStartBar: 16, bars: 8, final: true },
];

const sectionBeats = (section) => section.beats ?? section.bars * BEATS_PER_BAR;
const SOURCE_TOTAL_BEATS = PLAY_ORDER.reduce((sum, section) => sum + sectionBeats(section), 0);
const MUSIC_DURATION = (SOURCE_TOTAL_BEATS - START_CROP_BEATS) * SECONDS_PER_BEAT;
export const TAIL_SECONDS = 2.5;
SONG.duration = MUSIC_DURATION + TAIL_SECONDS;

export const SECTIONS = PLAY_ORDER.map((section, index) => {
  const sourceStart = PLAY_ORDER.slice(0, index).reduce((sum, item) => sum + sectionBeats(item), 0);
  const sourceEnd = sourceStart + sectionBeats(section);
  return {
    id: section.id,
    label: section.label,
    kind: section.kind ?? 'music',
    start: Math.max(0, sourceStart - START_CROP_BEATS) * SECONDS_PER_BEAT,
    end: section.final ? SONG.duration : (sourceEnd - START_CROP_BEATS) * SECONDS_PER_BEAT,
  };
});

function addAccompaniment(events, chordName, barBeat, velocity, options = {}) {
  const chord = CHORDS[chordName];
  const pattern = [0, 1, 2, 3, 1, 2, 1, 3];
  pattern.forEach((toneIndex, index) => {
    if (options.firstHalfOnly && index > 3) return;
    const ramp = options.ramp ? 0.56 + index * 0.063 : 1;
    events.push({
      beat: barBeat + index * 0.5,
      durationBeats: index === 0 || index === 4 ? 0.9 : 0.62,
      midi: chord[toneIndex],
      velocity: (index === 0 ? 0.4 : 0.27) * velocity * ramp,
      hand: toneIndex === 0 ? 'left' : 'right',
      track: 'harmony',
    });
  });
}

function addPedalAccompaniment(events, chordName, barBeat) {
  const chord = VERSE_PEDAL_VOICINGS[chordName];
  chord.forEach((midi, index) => {
    events.push({
      beat: barBeat,
      durationBeats: 4.15,
      midi,
      velocity: [0.23, 0.17, 0.14, 0.12][index],
      hand: index === 0 ? 'left' : 'right',
      track: 'pedal',
      tone: 'pedal',
    });
  });
}

function addViolin(events, chordName, barBeat, section, localBar) {
  if (section.module === 'verse') {
    const verseViolin = {
      0: { offset: 0.55, duration: 7.17, midi: 71, velocity: 0.18 },
      2: { offset: 0, duration: 7.72, midi: 66, velocity: 0.19 },
      4: { offset: 0, duration: 7.72, midi: 71, velocity: 0.18 },
      6: { offset: 0, duration: 3.72, midi: 70, velocity: 0.21 },
      7: { offset: 0, duration: 3.72, midi: 71, velocity: 0.2 },
    }[localBar];
    if (verseViolin) {
      events.push({
        beat: barBeat + verseViolin.offset,
        durationBeats: verseViolin.duration,
        midi: verseViolin.midi,
        velocity: verseViolin.velocity,
        track: 'violin',
        articulation: 'pad',
      });
    }
    return;
  }
  if (section.delayedViolin && localBar <= 1) return;
  if (section.bridgeToVerse && localBar === section.bars - 1) return;
  if (section.final && localBar === section.bars - 1) return;
  const sectionLevel = section.module === 'chorus' ? 0.24 : 0.19;
  events.push({
    beat: barBeat,
    durationBeats: 3.72,
    midi: VIOLIN_TONES[chordName],
    velocity: sectionLevel,
    track: 'violin',
  });
}

function addMelodyLine(events, notes, lineStartBeat, module, lineIndex, final = false) {
  const rhythm = rhythmFor(module, lineIndex, notes.length);
  notes.forEach((midi, index) => {
    const cohesiveHaniOpening = module === 'chorus' && lineIndex === 2 && index < 3;
    const isVersePhrase = module === 'verse';
    const verseVelocity = [
      [0.46, 0.49, 0.5, 0.47, 0.5, 0.47, 0.53, 0.46],
      [0.43, 0.47, 0.49, 0.46, 0.49, 0.46, 0.51, 0.45],
      [0.43, 0.47, 0.49, 0.47, 0.5, 0.48, 0.46],
      [0.47, 0.5, 0.48, 0.5, 0.47, 0.48, 0.5, 0.44],
    ][lineIndex]?.[index];
    events.push({
      beat: lineStartBeat + rhythm.onsets[index],
      durationBeats: rhythm.durations[index],
      midi,
      velocity: isVersePhrase
        ? verseVelocity
        : final && lineIndex === 3 && index === notes.length - 1
          ? 0.43
          : 0.59,
      hand: 'right',
      track: 'melody',
      tone: isVersePhrase ? 'warm' : 'natural',
      ...(cohesiveHaniOpening ? { sampleAnchor: 60 } : {}),
    });
  });
}

function cropOpening(event) {
  const sourceEnd = event.beat + event.durationBeats;
  if (sourceEnd <= START_CROP_BEATS) return null;
  const croppedStart = Math.max(event.beat, START_CROP_BEATS);
  return {
    ...event,
    beat: croppedStart - START_CROP_BEATS,
    durationBeats: sourceEnd - croppedStart,
  };
}

export function buildSongEvents() {
  const beatEvents = [];
  let cursorBeat = 0;

  PLAY_ORDER.forEach((section) => {
    if (section.kind === 'breath') {
      beatEvents.push({ beat: cursorBeat, durationBeats: section.beats, midi: 47, velocity: 0.27, hand: 'left', track: 'harmony' });
      cursorBeat += section.beats;
      return;
    }

    const sectionStartBeat = cursorBeat;
    for (let localBar = 0; localBar < section.bars; localBar += 1) {
      const sourceBar = section.sourceStartBar + localBar;
      const chordName = SCORE_BARS[sourceBar];
      const barBeat = cursorBeat;

      if (section.final && localBar === section.bars - 1) {
        [47, 62, 66].forEach((midi, index) => beatEvents.push({
          beat: barBeat,
          durationBeats: 4,
          midi,
          velocity: [0.24, 0.32, 0.36][index],
          hand: index === 0 ? 'left' : 'right',
          track: 'harmony',
        }));
        beatEvents.push({ beat: barBeat, durationBeats: 4, midi: 66, velocity: 0.16, track: 'violin' });
      } else {
        if (section.module === 'verse') {
          addPedalAccompaniment(beatEvents, chordName, barBeat);
        } else {
          addAccompaniment(beatEvents, chordName, barBeat, 1, {
            firstHalfOnly: section.bridgeToVerse && localBar === section.bars - 1,
            ramp: section.softEntry && localBar === 0,
          });
        }
        addViolin(beatEvents, chordName, barBeat, section, localBar);
      }

      if (section.bridgeToVerse && localBar === section.bars - 1) {
        [47, 50, 54].forEach((midi, index) => beatEvents.push({
          beat: barBeat + 2,
          durationBeats: 2.35,
          midi,
          velocity: [0.24, 0.27, 0.31][index],
          hand: index === 0 ? 'left' : 'right',
          track: 'harmony',
        }));
        beatEvents.push({ beat: barBeat, durationBeats: 4.58, midi: 66, velocity: 0.19, track: 'violin' });
      }

      cursorBeat += BEATS_PER_BAR;
    }

    if (section.delayedViolin) {
      beatEvents.push({ beat: sectionStartBeat + 4, durationBeats: 3.72, midi: 67, velocity: 0.19, track: 'violin' });
    }

    const lines = melodyForModule(section.module);
    lines.forEach((notes, lineIndex) => {
      addMelodyLine(
        beatEvents,
        notes,
        sectionStartBeat + lineIndex * 2 * BEATS_PER_BAR,
        section.module,
        lineIndex,
        section.final,
      );
    });
  });

  return beatEvents
    .map(cropOpening)
    .filter(Boolean)
    .map((event) => ({
      ...event,
      time: event.beat * SECONDS_PER_BEAT,
      duration: event.durationBeats * SECONDS_PER_BEAT,
    }))
    .filter((event) => event.time < SONG.duration)
    .sort((a, b) => a.time - b.time || a.midi - b.midi);
}

export function sectionAt(position) {
  return SECTIONS.find((section) => position >= section.start && position < section.end) ?? SECTIONS.at(-1);
}
