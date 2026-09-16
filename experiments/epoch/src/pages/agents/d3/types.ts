import type { MaskedNumber } from "../../../lib/maskedValues";

export interface DualMethodRow {
  location_id: string;
  location_name: string;
  year: string;
  method_a: MaskedNumber;
  method_b: MaskedNumber;
  method_a_label: string;
  method_b_label: string;
  abs_delta: MaskedNumber;
  pct_diff: MaskedNumber;
  discrepancy_flag: boolean;
  country_code?: string;
}

export interface DualMethodPayload {
  kind: "dual_method";
  source_domain: string;
  method_a_column: string;
  method_b_column: string;
  tolerance: MaskedNumber;
  rows: DualMethodRow[];
  site_count: MaskedNumber;
  n_flagged: MaskedNumber;
  handoff_column: string[];
}

export interface ThresholdRow {
  location_id: string;
  location_name: string;
  rule_id: string;
  rule_label: string;
  threshold: MaskedNumber;
  avg_3yr: MaskedNumber;
  gap: MaskedNumber;
  status: string;
  near_breach: boolean;
  years_used: string[];
  country_code?: string;
}

export interface ThresholdPayload {
  kind: "threshold";
  column: string;
  rows: ThresholdRow[];
  site_count: MaskedNumber;
  n_obligated: MaskedNumber;
  n_near_breach: MaskedNumber;
  n_compliant: MaskedNumber;
  handoff_column: string[];
}

export interface ConsolidationRow {
  division: string;
  year: string;
  subtotal_t: MaskedNumber;
  n_sites: MaskedNumber;
  n_rows: MaskedNumber;
}

export interface ConsolidationPayload {
  kind: "consolidation";
  source_domain?: string;
  measure_column: string;
  group_by_column: string;
  rows: ConsolidationRow[];
  portfolio_total_t: MaskedNumber;
  division_count: MaskedNumber;
  site_count: MaskedNumber;
  handoff_column: string[];
}

export type D3Payload = DualMethodPayload | ThresholdPayload | ConsolidationPayload;

export function isD3Kind(kind: unknown): kind is D3Payload["kind"] {
  return kind === "dual_method" || kind === "threshold" || kind === "consolidation";
}

export type Granularity = { label: string; plural: string };

export function resolveGranularity(
  declaredGrain: string | null | undefined,
  periods: string[]
): Granularity {
  const declared: Record<string, Granularity> = {
    year: { label: "year", plural: "years" },
    quarter: { label: "quarter", plural: "quarters" },
    month: { label: "month", plural: "months" },
    week: { label: "week", plural: "weeks" },
    multi_year: { label: "period", plural: "periods" },
  };
  if (declaredGrain && declared[declaredGrain]) return declared[declaredGrain];
  if (periods.length > 0 && periods.every((p) => /^\d{4}$/.test(p))) {
    return { label: "year", plural: "years" };
  }
  if (periods.length > 0 && periods.every((p) => /^\d{4}-\d{2}$/.test(p))) {
    return { label: "month", plural: "months" };
  }
  if (periods.length > 0 && periods.every((p) => /^\d{4}-W\d{2}$/.test(p))) {
    return { label: "week", plural: "weeks" };
  }
  if (periods.length > 0 && periods.every((p) => /(?:^|[-\s])Q[1-4]$/i.test(p))) {
    return { label: "quarter", plural: "quarters" };
  }
  return { label: "period", plural: "periods" };
}
