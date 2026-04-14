export const linear = (t) => t;

export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const easeInCubic = (t) => t * t * t;

export const easeOutExpo = (t) =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const easeOvershoot = (t) => {
  const c1 = 2.4;
  const c3 = c1 + 1;
  const p = Math.min(1, Math.max(0, t));
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

export const pulse = (t, freq = 6) =>
  0.5 + 0.5 * Math.sin(t * freq * Math.PI * 2);

export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export const lerp = (a, b, t) => a + (b - a) * t;
