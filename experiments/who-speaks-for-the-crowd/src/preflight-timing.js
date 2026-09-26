export function randomDelayMs(minimum, maximum, random = Math.random) {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

export const nextHealthCheckDelayMs = (random = Math.random) => randomDelayMs(4000, 7000, random);
export const nextRefreshCooldownMs = (random = Math.random) => randomDelayMs(3000, 7000, random);
