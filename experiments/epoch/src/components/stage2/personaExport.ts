/**
 * personaExport.ts — shared P4/P5/P6 CSV/Excel export column definition.
 * Used both by PersonaAssessmentView's own export buttons and by F2's
 * multi-sheet Excel export (F2 sheet + one sheet per persona).
 *
 * `PersonaRowForExport` is declared independently rather than imported from
 * PersonaAssessmentView.tsx to avoid a circular import (PersonaAssessmentView
 * itself imports this file) — matches the codebase's page-local-interface
 * convention; TypeScript's structural typing makes a PersonaVerdict[]
 * assignable here without any cast.
 */
import { resolveCitationQuotes, type RD3CitationRow } from "../../lib/citationQuotes";
import type { ExportColumn } from "../../lib/tableExport";
import type { ProvisionMap } from "../../api/types";

export interface PersonaRowForExport {
  standard: string;
  old_dr_ids: string[];
  new_dr_ids: string[];
  recommended_action: string;
  effort_estimate: "none" | "low" | "medium" | "high";
  effort_rationale: string;
  risk_posture_note: string;
  rationale: string;
  confidence: number;
  action_needed: string;
  action_priority: "required_urgent" | "required" | "not_required";
  verdict_kind: "primary" | "supplemental";
  siemens_evidence_quotes: string[];
}

export interface PersonaExportRow extends PersonaRowForExport {
  source_2025_quote: string;
  source_2026_quote: string;
  siemens_quote: string;
}

export const PERSONA_EXPORT_COLUMNS: ExportColumn<PersonaExportRow>[] = [
  { header: "Standard", get: (r) => r.standard, wch: 10 },
  { header: "DR 2025", get: (r) => r.old_dr_ids.join(", "), wch: 14 },
  { header: "DR 2026", get: (r) => r.new_dr_ids.join(", "), wch: 14 },
  { header: "Recommended action", get: (r) => r.recommended_action, wch: 50 },
  { header: "Effort estimate", get: (r) => r.effort_estimate, wch: 14 },
  { header: "Effort rationale", get: (r) => r.effort_rationale, wch: 40 },
  { header: "Risk posture note", get: (r) => r.risk_posture_note, wch: 45 },
  { header: "Rationale", get: (r) => r.rationale, wch: 50 },
  { header: "Confidence", get: (r) => r.confidence.toString(), wch: 12 },
  { header: "Action needed", get: (r) => r.action_needed, wch: 22 },
  { header: "Action priority", get: (r) => r.action_priority, wch: 16 },
  { header: "Verdict kind", get: (r) => r.verdict_kind, wch: 14 },
  { header: "Siemens evidence", get: (r) => r.siemens_quote, wch: 55 },
  { header: "Source 2025 (quote)", get: (r) => r.source_2025_quote, wch: 55 },
  { header: "Source 2026 (quote)", get: (r) => r.source_2026_quote, wch: 55 },
];

// Personas' old_dr_ids/new_dr_ids can hold more than one id (a Merged
// group); RD3 joins on a single old_dr_id, so the first id is the join key
// — a documented simplification, not a silent one.
export function buildPersonaExportRows(
  rows: PersonaRowForExport[],
  rd3ByDr: Map<string, RD3CitationRow>,
  provisions: ProvisionMap
): PersonaExportRow[] {
  return rows.map((row) => {
    const quotes = resolveCitationQuotes(
      {
        standard: row.standard,
        oldDrId: row.old_dr_ids[0] ?? "",
        newDrId: row.new_dr_ids[0] ?? "",
      },
      rd3ByDr,
      provisions
    );
    return {
      ...row,
      source_2025_quote: quotes.old2025,
      source_2026_quote: quotes.new2026,
      siemens_quote: row.siemens_evidence_quotes.join(" / "),
    };
  });
}
