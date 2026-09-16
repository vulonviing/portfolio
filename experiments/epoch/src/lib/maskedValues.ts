export const MASK = "****" as const;

export type MaskedNumber = number | string;

export function isPublicNumber(value: MaskedNumber | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatMaskedNumber(
  value: MaskedNumber | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  return isPublicNumber(value) ? value.toLocaleString(undefined, options) : (value ?? MASK);
}

export function formatMaskedPercent(value: MaskedNumber | undefined): string {
  return isPublicNumber(value) ? `${(value * 100).toFixed(2)}%` : (value ?? MASK);
}

export function formatMaskedCount(value: number): string {
  if (value <= 0) return "none";
  if (value < 10) return "<10";
  const digits = String(Math.trunc(value));
  const reveal = Math.min(3, Math.max(1, digits.length - 1));
  return `${digits.slice(0, reveal)}${"*".repeat(digits.length - reveal)}`;
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
