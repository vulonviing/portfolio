/**
 * Symbolic representation of match rhythm.
 * Each beat maps to a minute range and crowd tempo intensity.
 * value: 0..1 tempo density
 */

export const chantBeats = [
  { minute: [0, 10], value: 0.35, color: 'neutral' },
  { minute: [10, 30], value: 0.28, color: 'neutral' },
  { minute: [30, 45], value: 0.48, color: 'up' },
  { minute: [45, 46], value: 0.18, color: 'down' },
  { minute: [46, 65], value: 0.42, color: 'up' },
  { minute: [65, 80], value: 0.68, color: 'up' },
  { minute: [80, 90], value: 0.92, color: 'peak' },
  { minute: [90, 95], value: 0.85, color: 'peak' },
];

export const scenarios = {
  comeback: {
    baseline: 0.35,
    peak: 0.95,
    hue: 'up',
    verdicts: [{ kind: 'loss' }, { kind: 'win' }],
  },
  collapse: {
    baseline: 0.55,
    peak: 0.2,
    hue: 'down',
    verdicts: [{ kind: 'terminal' }],
  },
  grind: {
    baseline: 0.4,
    peak: 0.85,
    hue: 'peak',
    verdicts: [{ kind: 'loss' }],
  },
};

export function rhythmAt(minute, scenario) {
  const s = scenarios[scenario] ?? scenarios.grind;
  const t = Math.min(1, Math.max(0, minute / 90));
  const breath = 0.5 + 0.5 * Math.sin(minute * 0.35);
  const curve =
    scenario === 'collapse'
      ? s.baseline + (s.peak - s.baseline) * Math.pow(t, 1.6)
      : s.baseline + (s.peak - s.baseline) * Math.pow(t, 1.2);
  return Math.max(0, Math.min(1, curve * (0.85 + 0.15 * breath)));
}

export const timePhases = [
  { id: 'firstHalf' },
  { id: 'halftime' },
  { id: 'finalTen' },
];
