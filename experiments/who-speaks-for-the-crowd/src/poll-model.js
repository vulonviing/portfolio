export const pollPhases = ['tweet', 'candidates', 'live', 'closed'];

export function nextPollPhase(phase) {
  const index = pollPhases.indexOf(phase);
  return index === -1 || index === pollPhases.length - 1 ? phase : pollPhases[index + 1];
}

export function previousPollPhase(phase) {
  if (phase === 'candidates') return 'tweet';
  if (phase === 'live') return 'closed';
  return phase;
}

export function resultRows(candidates, counts = {}) {
  const total = candidates.reduce((sum, candidate) => sum + (counts[candidate.id] || 0), 0);
  const maximum = Math.max(0, ...candidates.map((candidate) => counts[candidate.id] || 0));
  return candidates.map((candidate) => {
    const count = counts[candidate.id] || 0;
    return {
      ...candidate,
      count,
      percentage: total === 0 ? 0 : (count / total) * 100,
      winner: total > 0 && count === maximum,
    };
  });
}

export function createParticipantId(storage) {
  const key = 'science-slam-participant-id';
  const existing = storage.getItem(key);
  if (existing) return existing;
  const created = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  storage.setItem(key, created);
  return created;
}
