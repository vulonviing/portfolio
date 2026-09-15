import type { ShelfEnvelope } from "../../api/types";

function labelFor(key: string): string {
  return key.replace(/_/g, " ");
}

/** Compact metrics taken only from fields present in the loaded payload. */
export function artifactMetrics(envelope: ShelfEnvelope | null | undefined): string[] {
  if (!envelope) return [];
  const payload = envelope.payload;
  const metrics: string[] = [];

  if (typeof payload.output_form === "string") {
    metrics.push(payload.output_form.replace(/_/g, " "));
  }

  for (const [key, value] of Object.entries(payload)) {
    if (key === "registry_id" || !Array.isArray(value)) continue;
    metrics.push(`${value.length} ${labelFor(key)}`);
  }

  return metrics.slice(0, 3);
}

export interface OverviewSignal {
  key: string;
  count: number;
  label: string;
  tone: "danger" | "warning";
}

function artifactRows(
  envelope: ShelfEnvelope | null | undefined
): Record<string, unknown>[] | null {
  const rows = envelope?.payload.rows;
  if (!Array.isArray(rows)) return null;
  return rows.filter(
    (row): row is Record<string, unknown> =>
      typeof row === "object" && row !== null
  );
}

/** Case-agnostic overview signals derived only from fields exposed by artifacts. */
export function overviewSignals(
  envelopes: Array<ShelfEnvelope | null | undefined>
): OverviewSignal[] {
  const rowSets = envelopes
    .map(artifactRows)
    .filter((rows): rows is Record<string, unknown>[] => rows !== null);
  const signals: OverviewSignal[] = [];

  const thresholdRows = rowSets.find((rows) =>
    rows.some((row) => typeof row.status === "string")
  );
  if (thresholdRows) {
    signals.push(
      {
        key: "obligated",
        count: thresholdRows.filter((row) => row.status === "obligated").length,
        label: "obligated entries",
        tone: "danger",
      },
      {
        key: "near-breach",
        count: thresholdRows.filter((row) => row.status === "near_breach").length,
        label: "near-breach entries",
        tone: "warning",
      }
    );
  }

  const discrepancyRows = rowSets.find((rows) =>
    rows.some((row) => "discrepancy_flag" in row)
  );
  if (discrepancyRows) {
    signals.push({
      key: "discrepancy",
      count: discrepancyRows.filter((row) => row.discrepancy_flag === true).length,
      label: "flagged discrepancies",
      tone: "warning",
    });
  }

  return signals;
}

/** Document-family (UC4) counterpart to overviewSignals, read from RD3's
 *  deterministic join summary rather than per-row status fields. */
export function documentOverviewSignals(
  rd3: ShelfEnvelope | null | undefined
): OverviewSignal[] {
  const summary = rd3?.payload.summary as Record<string, number> | undefined;
  if (!summary) return [];
  const entries: Array<{ key: string; label: string; tone: OverviewSignal["tone"] }> = [
    { key: "n_new_report_required", label: "new report required", tone: "danger" },
    { key: "n_report_rewrite_required", label: "report rewrite required", tone: "danger" },
    { key: "n_status_review_required", label: "status review required", tone: "warning" },
    { key: "n_mapping_uncertain", label: "mapping uncertain", tone: "warning" },
  ];
  return entries
    .map(({ key, label, tone }) => ({ key, count: summary[key] ?? 0, label, tone }))
    .filter((signal) => signal.count > 0);
}
