// Frozen record of the live audience vote at the SEDS Data Science Slam,
// 1 October 2026. Read once from the voting service's summary export of that
// run (run 6af14583…); the deck and the audience page no longer call any API.
export const archive = {
  runId: '6af14583-322e-4780-8838-f6275f26e832',
  dateLabel: '1 October 2026',
  joined: 42,
  counts: {
    'case-oxford': { A: 14, B: 6, C: 14 },
    'case-khamenei': { A: 10, B: 6, C: 19 },
  },
};

export const archiveTotal = (pollKey) => Object.values(archive.counts[pollKey] || {}).reduce((sum, count) => sum + count, 0);

export function readOwnVote(pollKey, storage = globalThis.localStorage) {
  try {
    return storage?.getItem(`science-slam-selection:${archive.runId}:${pollKey}`) || '';
  } catch {
    return '';
  }
}
