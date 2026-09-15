/**
 * uc4Legend.ts — plain-language meaning of every UC4 status token.
 *
 * CHANGE_STATUS, REPORTED_STATUS, ACTION_NEEDED, and EFFORT are ported
 * verbatim from regulation_cli.py's RC1_STATUS_LEGEND (:999),
 * RM1_STATUS_LEGEND (:1081), ACTION_NEEDED_LEGEND (:1146), and
 * EFFORT_LEGEND (:1193) so the viewer and the CLI say the same sentence
 * about the same token. ACTION_PRIORITY, ORPHAN_SIDE, and AGREEMENT have no
 * CLI counterpart (the CLI renders them as bare values) — their wording is
 * new but follows the same house style: one short, non-technical sentence.
 *
 * `tone` is a shared severity vocabulary; each page still maps tone -> its
 * own classes via TONE_CLASS, keeping the page-local style convention
 * (AGENTS.md plain-language disclosure rule).
 */

export type Tone = "neutral" | "accent" | "info" | "warn" | "danger" | "critical";

export interface LegendEntry {
  label: string;
  meaning: string;
  tone: Tone;
}

function build(entries: Record<string, [string, Tone]>): Record<string, LegendEntry> {
  return Object.fromEntries(
    Object.entries(entries).map(([token, [meaning, tone]]) => [
      token,
      { label: token, meaning, tone },
    ])
  );
}

// RC1_STATUS_LEGEND (regulation_cli.py:999) — RC1.2 / RD3 / F2 change_status.
export const CHANGE_STATUS = build({
  Removed: ["No longer required under the 2026 standard.", "critical"],
  New: ["Did not exist under the 2025 standard.", "accent"],
  Modified: ["Same requirement, but what must be disclosed changed.", "warn"],
  Merged: ["Two or more 2025 requirements combined into one 2026 requirement.", "warn"],
  Relocated: ["Moved to a different place in the standard, content unchanged.", "info"],
  Renumbered: ["Same content, only the requirement's identifier changed.", "info"],
  Retained: ["No material change.", "neutral"],
  ApplicabilityChange: ["The phase-in or applicability condition changed, not the substance.", "warn"],
});

// RM1_STATUS_LEGEND (regulation_cli.py:1081) — RM1.2 / RD3 reported_status.
export const REPORTED_STATUS = build({
  reported: ["The report substantively addresses this requirement.", "accent"],
  partially_reported: ["Some but not all elements of the requirement are covered.", "warn"],
  omitted: ["Not addressed, and materiality is unclear.", "danger"],
  not_material: ["The double-materiality assessment found this topic non-material.", "neutral"],
  not_applicable: ["The requirement does not apply to Siemens's situation.", "neutral"],
  phase_in: ["Siemens invokes a phase-in / transitional provision here.", "info"],
  unclear: ["Not enough evidence in the report to determine status.", "warn"],
});

// ACTION_NEEDED_LEGEND (regulation_cli.py:1146) — RD3 / P4-P6 / F2 action_needed.
export const ACTION_NEEDED = build({
  new_report_required: ["New 2026 requirement, no 2025 origin -- report from scratch.", "critical"],
  report_rewrite_required: ["Siemens's existing report content has no place under 2026.", "danger"],
  report_update_required: ["Reported requirement whose 2026 content, number, or scope changed.", "warn"],
  status_review_required: ["The 2025 reporting status is omitted or unclear and must be reviewed first.", "warn"],
  no_action: ["Nothing to do -- unchanged and already handled, or not reported and not required.", "neutral"],
});

// EFFORT_LEGEND (regulation_cli.py:1193) — P4-P6 / F2 effort_estimate / agreed_effort.
export const EFFORT = build({
  none: ["No incremental reporting work -- already covered as-is.", "neutral"],
  low: ["Small, quick change -- wording or a short addition.", "accent"],
  medium: ["Real but bounded work -- a new paragraph or data pull.", "warn"],
  high: ["Substantial work -- a rewrite or new data collection.", "critical"],
});

// No CLI counterpart — P4-P6 / F2 action_priority.
export const ACTION_PRIORITY = build({
  required_urgent: ["This assessor treats the action as time-critical.", "critical"],
  required: ["This assessor recommends acting on this finding.", "warn"],
  not_required: ["This assessor found no action needed here.", "neutral"],
});

// No CLI counterpart — RD3 orphan_side.
export const ORPHAN_SIDE = build({
  none: ["Present on both the 2025 and 2026 side of the join.", "neutral"],
  no_2026_counterpart: ["Reported under 2025 but has no 2026 requirement to join to.", "info"],
  no_2025_origin: ["New in 2026 with nothing to join back to in 2025.", "info"],
});

// No CLI counterpart — RC1.2 blind_agreement/deterministic_agreement,
// RM1.2 blind_agreement/index_agreement.
export const AGREEMENT = build({
  agree: ["This reading matches the other pass.", "accent"],
  partial: ["This reading partly matches the other pass.", "warn"],
  disagree: ["This reading contradicts the other pass.", "danger"],
  no_candidate: ["The other pass had no proposal to compare against.", "neutral"],
});

export const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad]",
  accent: "border-[#2dd4bf]/40 bg-[#0f2e2c] text-[#2dd4bf]",
  info: "border-[#5b8def]/40 bg-[#101a2e] text-[#5b8def]",
  warn: "border-[#d9a95c]/40 bg-[#2a2013] text-[#d9a95c]",
  danger: "border-[#d97a6c]/40 bg-[#2a1613] text-[#d97a6c]",
  critical: "border-[#ef5f67]/50 bg-[#301417] text-[#ef5f67]",
};

const FALLBACK: LegendEntry = { label: "", meaning: "No description available.", tone: "neutral" };

export function legend(dict: Record<string, LegendEntry>, token: string | undefined | null): LegendEntry {
  if (!token) return { ...FALLBACK, label: "—" };
  return dict[token] ?? { ...FALLBACK, label: token };
}
