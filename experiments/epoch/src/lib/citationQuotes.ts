/**
 * citationQuotes.ts — resolves a citation reference (filename + paragraph
 * number, e.g. "ESRS_E1_2025_amended.md E1-1 paras. 14, 16, 17") to the
 * actual quoted paragraph text.
 *
 * No agent downstream of RD1 carries the real text: RC1.2/RD3's citations,
 * old_paragraph_refs, new_paragraph_refs, and P4/P5/P6's citations are all
 * just references. The real text lives only in RD1's in-memory CorpusBundle
 * and is served on demand via GET /usecases/{id}/provisions
 * (load_document_provision_texts). RD3's join row is the only place that
 * still carries clean, structured old_paragraph_refs/new_paragraph_refs
 * (and Siemens's real evidence_quotes) — so every citation-resolving view
 * (F2, P4/P5/P6) joins against RD3 by DR id first, then looks up each
 * paragraph ref in the provisions map.
 */
import type { ProvisionMap } from "../api/types";

export interface RD3CitationRow {
  old_dr_id: string;
  old_paragraph_refs: string[];
  new_paragraph_refs: string[];
  evidence_quotes: string[];
}

export function buildRd3ByDr(rd3Rows: RD3CitationRow[]): Map<string, RD3CitationRow> {
  const map = new Map<string, RD3CitationRow>();
  for (const row of rd3Rows) map.set(row.old_dr_id, row);
  return map;
}

/** Resolves a list of paragraph refs against a DR's paragraph_id -> text
 *  map, joining whatever is actually found. A ref that doesn't match
 *  exactly (LLM-written refs and RD1's parsed paragraph_ids come from two
 *  different processes and can drift in formatting) is silently skipped —
 *  a shorter quote beats a broken cell. */
export function lookupText(dict: Record<string, string> | undefined, refs: string[]): string {
  if (!dict) return "";
  return refs.map((ref) => dict[ref]).filter(Boolean).join(" ¶ ");
}

export interface ResolvedQuotes {
  old2025: string;
  new2026: string;
  siemens: string;
}

const EMPTY_QUOTES: ResolvedQuotes = { old2025: "", new2026: "", siemens: "" };

/** `oldDrId`/`newDrId` are the primary (first, for multi-id rows like
 *  Merged) 2025/2026 disclosure-requirement ids for this row. Personas'
 *  old_dr_ids/new_dr_ids can hold more than one id; RD3 joins on a single
 *  old_dr_id, so the first id is the reasonable join key here — a
 *  documented simplification, not a silent one. */
export function resolveCitationQuotes(
  ref: { standard: string; oldDrId: string; newDrId: string },
  rd3ByDr: Map<string, RD3CitationRow>,
  provisions: ProvisionMap
): ResolvedQuotes {
  const rd3 = rd3ByDr.get(ref.oldDrId);
  if (!rd3) return EMPTY_QUOTES;
  const oldDict = provisions[ref.standard]?.old[ref.oldDrId];
  const newDict = provisions[ref.standard]?.new[ref.newDrId];
  return {
    old2025: lookupText(oldDict, rd3.old_paragraph_refs),
    new2026: lookupText(newDict, rd3.new_paragraph_refs),
    siemens: rd3.evidence_quotes.join(" / "),
  };
}
