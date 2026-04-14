export const palette = {
  bg: '#050816',
  bgDeep: '#02030a',
  bgElev: '#0b1028',
  textPrimary: '#f5f5f5',
  textSecondary: '#a0a4b0',
  accent: '#ffb400',
  accentStrong: '#b31237',
  accentWarm: '#ff7a3c',
  border: '#1a1f33',
};

export const momentumColors = {
  down: { line: '#b31237', glow: 'rgba(179, 18, 55, 0.55)' },
  neutral: { line: '#a0a4b0', glow: 'rgba(160, 164, 176, 0.35)' },
  up: { line: '#ffb400', glow: 'rgba(255, 180, 0, 0.55)' },
  peak: { line: '#ff7a3c', glow: 'rgba(255, 122, 60, 0.6)' },
};

export const timeModeColors = {
  firstHalf: {
    base: '#1a2033',
    accent: '#ffb400',
    accentSoft: '#ffd97a',
    mood: 'steady',
  },
  halftime: {
    base: '#060a1a',
    accent: '#6a8dff',
    accentSoft: '#b8c6ff',
    mood: 'focused',
  },
  finalTen: {
    base: '#2a0a12',
    accent: '#ff3a5c',
    accentSoft: '#ffb400',
    mood: 'intense',
  },
};

export function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mixHex(a, b, t) {
  const clamp = Math.max(0, Math.min(1, t));
  const ah = a.replace('#', '');
  const bh = b.replace('#', '');
  const ar = parseInt(ah.slice(0, 2), 16);
  const ag = parseInt(ah.slice(2, 4), 16);
  const ab = parseInt(ah.slice(4, 6), 16);
  const br = parseInt(bh.slice(0, 2), 16);
  const bg = parseInt(bh.slice(2, 4), 16);
  const bb = parseInt(bh.slice(4, 6), 16);
  const r = Math.round(ar + (br - ar) * clamp);
  const g = Math.round(ag + (bg - ag) * clamp);
  const bl = Math.round(ab + (bb - ab) * clamp);
  const toHex = (v) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}
