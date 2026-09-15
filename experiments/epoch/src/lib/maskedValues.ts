export const MASK = "****" as const;

export type MaskedNumber = number | typeof MASK;

export function isPublicNumber(value: MaskedNumber | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatMaskedNumber(
  value: MaskedNumber | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  return isPublicNumber(value) ? value.toLocaleString(undefined, options) : MASK;
}

export function formatMaskedPercent(value: MaskedNumber | undefined): string {
  return isPublicNumber(value) ? `${(value * 100).toFixed(2)}%` : MASK;
}

export function subtractMasked(
  left: MaskedNumber | undefined,
  right: MaskedNumber | undefined,
): MaskedNumber {
  return isPublicNumber(left) && isPublicNumber(right) ? left - right : MASK;
}

export function compareMaskedDescending(left: MaskedNumber, right: MaskedNumber): number {
  return isPublicNumber(left) && isPublicNumber(right) ? right - left : 0;
}
