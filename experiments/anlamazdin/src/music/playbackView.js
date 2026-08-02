export const ORBIT_SECTIONS = [
  { id: 'wish', position: 'lower-left' },
  { id: 'verse', position: 'lower-right' },
  { id: 'chorus', position: 'top' },
];

export function orbitSectionId(sectionId) {
  if (sectionId === 'wish-1') return 'wish';
  if (sectionId === 'verse-2') return 'verse';
  if (sectionId === 'chorus-2') return 'chorus';
  return null;
}

export function activePianoMidis(events, position, minMidi = 48, maxMidi = 71) {
  return [...new Set(events
    .filter((event) => (
      event.track !== 'violin'
      && event.midi >= minMidi
      && event.midi <= maxMidi
      && position >= event.time
      && position < event.time + event.duration
    ))
    .map((event) => event.midi))];
}
