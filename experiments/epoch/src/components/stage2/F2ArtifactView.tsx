/**
 * F2ArtifactView — the reconciled ESRS impact report: F2's finalizer view,
 * document-family counterpart to F1ArtifactView. Reconciles the three
 * persona verdicts (P4/P5/P6) into one DR-level comparison table + business
 * summary, surfacing persona_divergence rather than silently picking one
 * persona's read.
 *
 * Five stacked bands: executive_summary prose, a standard_summary card strip
 * with fill rings, top_impacts, the DR-level master table (2025<->2026 side
 * by side), and limitations. persona_divergence is list[str] (prose
 * sentences, not objects) — each is matched to a row by a leading DR-id
 * prefix and attached as a small disagreement marker; unmatched sentences
 * fall into a residual "general divergence notes" section.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconChevronDown,
  IconDownload,
  IconFileCheck,
  IconFilter,
  IconListNumbers,
  IconLoader2,
  IconMessageCircle2,
  IconTable,
  IconX,
} from "@tabler/icons-react";
import { LegendStrip, StandardChip, StatusChip, highlightDrRefs } from "../uc4/tokens";
import {
  ACTION_NEEDED,
  ACTION_PRIORITY,
  CHANGE_STATUS,
  EFFORT,
  REPORTED_STATUS,
  TONE_CLASS,
  legend,
  type LegendEntry,
} from "../../lib/uc4Legend";
import { fetchProvisions } from "../../api/client";
import type { ProvisionMap } from "../../api/types";
import { useRun } from "../../context/RunContext";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { flatStage2Agents, useStage2Binding } from "../../lib/useStage2Binding";
import {
  buildRd3ByDr,
  resolveCitationQuotes,
  type RD3CitationRow,
  type ResolvedQuotes,
} from "../../lib/citationQuotes";
import { downloadCsv, downloadXlsx, rowsToCsv, type ExportColumn } from "../../lib/tableExport";
import {
  PERSONA_EXPORT_COLUMNS,
  buildPersonaExportRows,
  type PersonaExportRow,
  type PersonaRowForExport,
} from "./personaExport";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

export interface ImpactRow {
  standard: string;
  dr_id_2025: string;
  requirement_2025: string;
  dr_id_2026: string;
  requirement_2026: string;
  change_status: string;
  change_description: string;
  source_2025: string[];
  source_2026: string[];
  siemens_reported: string;
  siemens_source_ref: string[];
  siemens_impact: string;
  confidence: number;
  confidence_note: string;
  action_needed: string;
  agreed_priority: string;
  agreed_effort: "none" | "low" | "medium" | "high";
  effort_note: string;
}

// RD3's join row carries the two things F2's own ImpactRow does not: the
// paragraph-level refs (to look up quoted regulation text) and Siemens's
// actual evidence sentences. Page-local payload wrapper (matches the
// codebase convention) around the shared RD3CitationRow shape.
interface RD3Payload {
  rows?: RD3CitationRow[];
}

interface TS1Payload {
  selected_topology_id?: string;
}

interface P456Payload {
  character_id?: string;
  rows?: PersonaRowForExport[];
}

// The export-only enrichment: real quoted text in place of the file+
// paragraph-number references the pipeline actually carries (see the
// Context note in the plan — no agent schema carries this text downstream).
interface ExportRow extends ImpactRow {
  source_2025_quote: string;
  source_2026_quote: string;
  siemens_quote: string;
}

export interface StandardImpactSummary {
  standard: string;
  change_required: boolean;
  n_rows_action_required: number;
  n_rows_total: number;
  highest_priority: string;
}

export interface F2Payload {
  registry_id?: string;
  rows?: ImpactRow[];
  executive_summary?: string[];
  top_impacts?: string[];
  persona_divergence?: string[];
  limitations?: string[];
  standard_summary?: StandardImpactSummary[];
}

// ── persona_divergence matching ─────────────────────────────────────────────

const LEADING_DR_ID = /^([A-Z][0-9]-[0-9]+[a-z]?)/;

function matchDivergenceToRows(
  sentences: string[],
  rows: ImpactRow[]
): { byRow: Map<number, string[]>; residual: string[] } {
  const byRow = new Map<number, string[]>();
  const residual: string[] = [];
  for (const sentence of sentences) {
    const match = sentence.match(LEADING_DR_ID);
    const drId = match?.[1];
    const rowIndex = drId ? rows.findIndex((r) => r.dr_id_2025 === drId) : -1;
    if (rowIndex >= 0) {
      const list = byRow.get(rowIndex) ?? [];
      list.push(sentence);
      byRow.set(rowIndex, list);
    } else {
      residual.push(sentence);
    }
  }
  return { byRow, residual };
}

// ── Band 2 — per-standard effort distribution (none/low/medium/high) ───────
// Replaces a "% rows need action" ring with the shape that actually varies
// interestingly across standards: how much of that standard's work is
// none/low/medium/high effort, per F2's own reconciled agreed_effort.

const EFFORT_LEVELS = ["none", "low", "medium", "high"] as const;
const EFFORT_FILL: Record<string, string> = {
  none: "#5c6780",
  low: "#2dd4bf",
  medium: "#d9a95c",
  high: "#ef5f67",
};

function EffortDistribution({ hist }: { hist: Record<string, number> }) {
  const total = EFFORT_LEVELS.reduce((sum, level) => sum + (hist[level] ?? 0), 0) || 1;
  return (
    <div className="flex w-24 flex-shrink-0 flex-col gap-1">
      {EFFORT_LEVELS.map((level) => {
        const count = hist[level] ?? 0;
        const width = `${(count / total) * 100}%`;
        return (
          <div key={level} className="flex items-center gap-1.5" title={`${level}: ${count}`}>
            <span className="w-8 flex-shrink-0 text-[8.5px] uppercase tracking-wide text-[#5c6780]">
              {level}
            </span>
            <div className="h-2 flex-1 rounded-sm bg-[#0d1424]">
              {count > 0 && (
                <div
                  className="h-full rounded-sm"
                  style={{ width, minWidth: "3px", background: EFFORT_FILL[level] }}
                />
              )}
            </div>
            <span className="w-3 flex-shrink-0 text-right font-mono text-[8.5px] text-[#5c6780]">
              {count || ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StandardSummaryCard({
  summary,
  effortHist,
}: {
  summary: StandardImpactSummary;
  effortHist: Record<string, number>;
}) {
  return (
    <div className={`${CARD} flex min-w-0 items-center gap-3 p-4`}>
      <EffortDistribution hist={effortHist} />
      <div className="min-w-0 flex-1">
        <StandardChip standard={summary.standard} />
        <div className="mt-2 font-mono text-[10px] text-[#5c6780]">
          {summary.n_rows_action_required} / {summary.n_rows_total} rows need action
        </div>
      </div>
    </div>
  );
}

// ── Band 4 export — column definition shared between CSV and Excel ─────────
// `wch` (character width) is only consumed by the Excel export — a CSV file
// carries no column-width metadata, which is exactly why "Source 2025" read
// as clipped in Excel's default view even though the underlying value was
// already complete. downloadCsv/downloadXlsx/rowsToCsv live in
// lib/tableExport.ts (shared with the persona export below).

const CSV_COLUMNS: ExportColumn<ExportRow>[] = [
  { header: "Standard", get: (r) => r.standard, wch: 10 },
  { header: "DR 2025", get: (r) => r.dr_id_2025, wch: 10 },
  { header: "Requirement 2025", get: (r) => r.requirement_2025, wch: 45 },
  { header: "DR 2026", get: (r) => r.dr_id_2026, wch: 10 },
  { header: "Requirement 2026", get: (r) => r.requirement_2026, wch: 45 },
  { header: "Change status", get: (r) => r.change_status, wch: 16 },
  { header: "Change description", get: (r) => r.change_description, wch: 50 },
  { header: "Siemens reported", get: (r) => r.siemens_reported, wch: 18 },
  { header: "Siemens evidence", get: (r) => r.siemens_quote, wch: 55 },
  { header: "Siemens impact", get: (r) => r.siemens_impact, wch: 50 },
  { header: "Confidence", get: (r) => r.confidence.toString(), wch: 12 },
  { header: "Confidence note", get: (r) => r.confidence_note, wch: 40 },
  { header: "Action needed", get: (r) => r.action_needed, wch: 22 },
  { header: "Agreed priority", get: (r) => r.agreed_priority, wch: 16 },
  { header: "Agreed effort", get: (r) => r.agreed_effort, wch: 14 },
  { header: "Effort note", get: (r) => r.effort_note, wch: 35 },
  { header: "Source 2025 (quote)", get: (r) => r.source_2025_quote, wch: 55 },
  { header: "Source 2026 (quote)", get: (r) => r.source_2026_quote, wch: 55 },
];

// The compact sheet in the .xlsx export: just the columns needed for a
// quick scan (dropped: Requirement 2025/2026, Siemens evidence, Confidence,
// Confidence note, Agreed priority, Effort note, and both quote columns).
const F2_COMPACT_HEADERS = [
  "Standard",
  "DR 2025",
  "DR 2026",
  "Change status",
  "Change description",
  "Siemens reported",
  "Siemens impact",
  "Action needed",
  "Agreed effort",
];
const F2_COMPACT_COLUMNS: ExportColumn<ExportRow>[] = CSV_COLUMNS.filter((c) =>
  F2_COMPACT_HEADERS.includes(c.header)
);

function buildExportRows(
  entries: { row: ImpactRow }[],
  rd3ByDr: Map<string, RD3CitationRow>,
  provisions: ProvisionMap
): ExportRow[] {
  return entries.map(({ row }) => {
    const quotes = resolveCitationQuotes(
      { standard: row.standard, oldDrId: row.dr_id_2025, newDrId: row.dr_id_2026 },
      rd3ByDr,
      provisions
    );
    return {
      ...row,
      source_2025_quote: quotes.old2025,
      source_2026_quote: quotes.new2026,
      siemens_quote: quotes.siemens,
    };
  });
}

// ── Band 4 filters ───────────────────────────────────────────────────────────

function toggleSet(setState: (updater: (prev: Set<string>) => Set<string>) => void, value: string) {
  setState((prev) => {
    const next = new Set(prev);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  });
}

function FilterChipRow({
  label,
  dict,
  values,
  active,
  onToggle,
}: {
  label: string;
  dict: Record<string, LegendEntry>;
  values: string[];
  active: Set<string>;
  onToggle: (value: string) => void;
}) {
  if (values.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[9.5px] uppercase tracking-wide text-[#5c6780]">{label}</span>
      {values.map((value) => {
        const entry = legend(dict, value);
        const isActive = active.has(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            title={entry.meaning}
            className={`rounded-full border px-2 py-0.5 text-[10px] transition-opacity ${TONE_CLASS[entry.tone]} ${
              isActive ? "" : "opacity-40 hover:opacity-70"
            }`}
          >
            {entry.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Band 4 — master table row ───────────────────────────────────────────────

function ChipList({ items, mono = true }: { items: string[]; mono?: boolean }) {
  if (items.length === 0) return <span className="text-[11px] text-[#5c6780]">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className={`rounded-md border border-[#2a3a5c] bg-[#111a2e] px-2 py-1 text-[10px] text-[#8b96ad] ${
            mono ? "font-mono" : ""
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function ImpactTableRow({
  row,
  index,
  expanded,
  onToggle,
  divergenceSentences,
  quotes,
}: {
  row: ImpactRow;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  divergenceSentences: string[];
  quotes: ResolvedQuotes | undefined;
}) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-2 p-3 text-left transition-colors hover:bg-[#15203a] lg:flex-row lg:items-center lg:gap-3"
      >
        <div className="flex items-center gap-2 lg:w-8 lg:flex-shrink-0">
          <IconChevronDown
            size={13}
            className={`text-[#5c6780] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
          <StandardChip standard={row.standard} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] text-[#2dd4bf]">{row.dr_id_2025 || "—"}</div>
          <div className="truncate text-[11.5px] text-[#c4cddd]">{row.requirement_2025 || "—"}</div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-center px-1 lg:w-[132px]">
          <StatusChip dict={CHANGE_STATUS} token={row.change_status} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] text-[#5b8def]">{row.dr_id_2026 || "—"}</div>
          <div className="truncate text-[11.5px] text-[#c4cddd]">{row.requirement_2026 || "—"}</div>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-1.5 lg:w-[150px]">
          <StatusChip dict={REPORTED_STATUS} token={row.siemens_reported} />
          {row.siemens_source_ref.length > 0 && (
            <span className="font-mono text-[9.5px] text-[#5c6780]">
              {row.siemens_source_ref.length} src
            </span>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-1.5 lg:w-[190px]">
          <StatusChip dict={ACTION_PRIORITY} token={row.agreed_priority} />
          <StatusChip dict={EFFORT} token={row.agreed_effort} />
          {divergenceSentences.length > 0 && (
            <span
              title="Persona verdicts disagreed on this row — expand for detail"
              className="inline-flex items-center gap-1 rounded-full border border-[#9b8cf2]/40 bg-[#1a1730] px-1.5 py-0.5 text-[9.5px] text-[#9b8cf2]"
            >
              <IconMessageCircle2 size={10} />
              {divergenceSentences.length}
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-[#1c2740] bg-[#0d1424] p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
                Change description
              </div>
              <p className="text-[11.5px] leading-relaxed text-[#aeb8cb]">
                {highlightDrRefs(row.change_description || "—")}
              </p>
            </div>
            <div>
              <div className="mb-1 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
                Effort note
              </div>
              <p className="text-[11.5px] leading-relaxed text-[#aeb8cb]">
                {highlightDrRefs(row.effort_note || "—")}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#2dd4bf]/25 bg-[#0f2e2c]/25 p-3">
            <div className="mb-1 flex items-center gap-2 text-[9.5px] uppercase tracking-wide text-[#2dd4bf]">
              <IconFileCheck size={12} />
              Reconciled Siemens impact (F2)
            </div>
            <p className="text-[12px] leading-relaxed text-[#e9eef7]">
              {highlightDrRefs(row.siemens_impact || "—")}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <div className="mb-1 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
                2025 source
              </div>
              <ChipList items={row.source_2025} />
              {quotes?.old2025 && (
                <blockquote className="mt-1.5 border-l-2 border-[#2a3a5c] pl-2 text-[10.5px] italic leading-relaxed text-[#aeb8cb]">
                  {highlightDrRefs(quotes.old2025)}
                </blockquote>
              )}
            </div>
            <div>
              <div className="mb-1 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
                2026 source
              </div>
              <ChipList items={row.source_2026} />
              {quotes?.new2026 && (
                <blockquote className="mt-1.5 border-l-2 border-[#2a3a5c] pl-2 text-[10.5px] italic leading-relaxed text-[#aeb8cb]">
                  {highlightDrRefs(quotes.new2026)}
                </blockquote>
              )}
            </div>
            <div>
              <div className="mb-1 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
                Siemens source ref
              </div>
              <ChipList items={row.siemens_source_ref} />
              {quotes?.siemens && (
                <blockquote className="mt-1.5 border-l-2 border-[#2a3a5c] pl-2 text-[10.5px] italic leading-relaxed text-[#aeb8cb]">
                  {highlightDrRefs(quotes.siemens)}
                </blockquote>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] uppercase tracking-wide text-[#5c6780]">
                Confidence
              </span>
              <span className="font-mono text-[12px] text-[#e9eef7]">
                {(row.confidence * 100).toFixed(0)}%
              </span>
            </div>
            {row.confidence_note && (
              <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-[#8b96ad]">
                {row.confidence_note}
              </p>
            )}
          </div>

          <div>
            <div className="mb-1 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
              Action needed
            </div>
            <StatusChip dict={ACTION_NEEDED} token={row.action_needed} />
          </div>

          {divergenceSentences.length > 0 && (
            <div className="rounded-lg border border-[#9b8cf2]/30 bg-[#1a1730]/40 p-3">
              <div className="mb-1.5 flex items-center gap-2 text-[9.5px] uppercase tracking-wide text-[#9b8cf2]">
                <IconMessageCircle2 size={12} />
                Persona disagreement
              </div>
              <ul className="space-y-1.5">
                {divergenceSentences.map((sentence, index) => (
                  <li key={index} className="text-[11.5px] leading-relaxed text-[#c4cddd]">
                    {highlightDrRefs(sentence)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────

export default function F2ArtifactView({ payload }: { payload: F2Payload }) {
  const rows = payload.rows ?? [];
  const executiveSummary = payload.executive_summary ?? [];
  const topImpacts = payload.top_impacts ?? [];
  const standardSummary = payload.standard_summary ?? [];
  const limitations = payload.limitations ?? [];
  const personaDivergence = payload.persona_divergence ?? [];

  // RD3 is already part of the same cached active-set query (no extra
  // network round trip) — it's the only place old_paragraph_refs/
  // new_paragraph_refs/evidence_quotes still exist, F2's own ImpactRow
  // never carried them. P4/P5/P6 are fetched the same free way, for the
  // multi-sheet Excel export.
  const { selectedUsecase, family } = useRun();
  const { envelope: rd3Envelope } = useAgentEnvelope("rd3");
  const { envelope: ts1Envelope } = useAgentEnvelope("ts");
  const topologyId = (ts1Envelope?.payload as TS1Payload | undefined)?.selected_topology_id;
  const { binding } = useStage2Binding(topologyId, family);
  // Persona ids the currently bound topology actually runs — every document
  // topology binds the same P4/P5/P6 trio (AGENTS.md), but this reads the
  // binding rather than hardcoding the array, matching Stage2NodePage.tsx.
  const personaIds = flatStage2Agents(binding)
    .map((a) => a.agent_id.toLowerCase())
    .filter((id) => id !== "f2");
  const { envelope: p4Envelope } = useAgentEnvelope("p4");
  const { envelope: p5Envelope } = useAgentEnvelope("p5");
  const { envelope: p6Envelope } = useAgentEnvelope("p6");
  const personaEnvelopes: Record<string, typeof p4Envelope> = {
    p4: p4Envelope,
    p5: p5Envelope,
    p6: p6Envelope,
  };
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  const rd3ByDr = useMemo(
    () => buildRd3ByDr(((rd3Envelope?.payload as RD3Payload | undefined)?.rows ?? []) as RD3CitationRow[]),
    [rd3Envelope]
  );

  // Fetched lazily — only once a row is actually expanded on screen, or an
  // export is clicked — not on every F2 page load.
  const { data: provisions } = useQuery({
    queryKey: ["provisions", selectedUsecase],
    queryFn: () => fetchProvisions(selectedUsecase!),
    enabled: !!selectedUsecase && expandedIndex !== null,
  });

  const rowQuotes = useMemo(() => {
    if (!provisions) return new Map<number, ResolvedQuotes>();
    const map = new Map<number, ResolvedQuotes>();
    rows.forEach((row, index) => {
      map.set(
        index,
        resolveCitationQuotes(
          { standard: row.standard, oldDrId: row.dr_id_2025, newDrId: row.dr_id_2026 },
          rd3ByDr,
          provisions
        )
      );
    });
    return map;
  }, [rows, rd3ByDr, provisions]);

  const { byRow: divergenceByRow, residual: divergenceResidual } = useMemo(
    () => matchDivergenceToRows(personaDivergence, rows),
    [personaDivergence, rows]
  );

  const effortByStandard = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const row of rows) {
      const hist = map[row.standard] ?? { none: 0, low: 0, medium: 0, high: 0 };
      hist[row.agreed_effort] = (hist[row.agreed_effort] ?? 0) + 1;
      map[row.standard] = hist;
    }
    return map;
  }, [rows]);

  // ── Band 4 filters — every categorical column shown in the table ─────────
  const [filterStandard, setFilterStandard] = useState<Set<string>>(new Set());
  const [filterChangeStatus, setFilterChangeStatus] = useState<Set<string>>(new Set());
  const [filterReported, setFilterReported] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<Set<string>>(new Set());
  const [filterEffort, setFilterEffort] = useState<Set<string>>(new Set());
  const [onlyDivergent, setOnlyDivergent] = useState(false);

  const distinct = (values: (string | undefined)[]): string[] =>
    Array.from(new Set(values.filter((v): v is string => !!v)));
  const filterOptions = useMemo(
    () => ({
      standard: distinct(rows.map((r) => r.standard)).sort(),
      changeStatus: distinct(rows.map((r) => r.change_status)),
      reported: distinct(rows.map((r) => r.siemens_reported)),
      priority: distinct(rows.map((r) => r.agreed_priority)),
      effort: distinct(rows.map((r) => r.agreed_effort)),
    }),
    [rows]
  );

  const activeFilterCount =
    filterStandard.size +
    filterChangeStatus.size +
    filterReported.size +
    filterPriority.size +
    filterEffort.size +
    (onlyDivergent ? 1 : 0);

  const filteredEntries = useMemo(() => {
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row, index }) => {
        if (filterStandard.size && !filterStandard.has(row.standard)) return false;
        if (filterChangeStatus.size && !filterChangeStatus.has(row.change_status)) return false;
        if (filterReported.size && !filterReported.has(row.siemens_reported)) return false;
        if (filterPriority.size && !filterPriority.has(row.agreed_priority)) return false;
        if (filterEffort.size && !filterEffort.has(row.agreed_effort)) return false;
        if (onlyDivergent && !(divergenceByRow.get(index)?.length)) return false;
        return true;
      });
  }, [
    rows,
    filterStandard,
    filterChangeStatus,
    filterReported,
    filterPriority,
    filterEffort,
    onlyDivergent,
    divergenceByRow,
  ]);

  const clearFilters = () => {
    setFilterStandard(new Set());
    setFilterChangeStatus(new Set());
    setFilterReported(new Set());
    setFilterPriority(new Set());
    setFilterEffort(new Set());
    setOnlyDivergent(false);
  };

  const fetchProvisionsCached = async (): Promise<ProvisionMap> =>
    selectedUsecase
      ? queryClient.fetchQuery({
          queryKey: ["provisions", selectedUsecase],
          queryFn: () => fetchProvisions(selectedUsecase),
        })
      : ({} as ProvisionMap);

  const handleExportCsv = async () => {
    setExporting("csv");
    try {
      const provisions = await fetchProvisionsCached();
      const enriched = buildExportRows(filteredEntries, rd3ByDr, provisions);
      downloadCsv("f2-dr-level-comparison.csv", rowsToCsv(CSV_COLUMNS, enriched));
    } finally {
      setExporting(null);
    }
  };

  // "+3 sayfa" — exporting F2 as Excel bundles the three personas' own
  // (unfiltered — F2's row filter has no equivalent on those pages) data as
  // extra sheets in the same workbook, so a reviewer gets the finalized
  // comparison and the three postures it reconciled in one file.
  const handleExportXlsx = async () => {
    setExporting("xlsx");
    try {
      const provisions = await fetchProvisionsCached();
      const f2Rows = buildExportRows(filteredEntries, rd3ByDr, provisions);
      const personaSheets = personaIds.map((id) => {
        const envelope = personaEnvelopes[id];
        const personaRows = ((envelope?.payload as P456Payload | undefined)?.rows ??
          []) as PersonaRowForExport[];
        return {
          name: id.toUpperCase(),
          columns: PERSONA_EXPORT_COLUMNS,
          rows: buildPersonaExportRows(personaRows, rd3ByDr, provisions),
        };
      });
      await downloadXlsx("f2-dr-level-comparison.xlsx", [
        // First sheet = the one shown on open (see downloadXlsx) — the
        // compact, no-long-quotes view is what a reader should land on.
        { name: "F2 compact", columns: F2_COMPACT_COLUMNS, rows: f2Rows },
        { name: "F2 comparison", columns: CSV_COLUMNS, rows: f2Rows },
        ...personaSheets,
      ]);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Band 1 — executive summary */}
      {executiveSummary.length > 0 && (
        <section className={`${PANEL} p-6`}>
          <div className="mb-4 flex items-center gap-2">
            <IconFileCheck size={16} className="text-[#2dd4bf]" />
            <h2 className="text-sm font-medium text-[#e9eef7]">Executive summary</h2>
          </div>
          {/* Fluid width: scales with the available column instead of a
              fixed character count, so it fills wide viewports without a
              static number that stops adapting on future runs/screens. */}
          <div className="max-w-[clamp(60ch,94%,170ch)] space-y-4">
            {executiveSummary.map((paragraph, index) => (
              <p key={index} className="text-[13px] leading-[1.9] text-[#c4cddd]">
                {highlightDrRefs(paragraph)}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Band 2 — per-standard summary strip */}
      {standardSummary.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2 px-1">
            <IconTable size={14} className="text-[#8b96ad]" />
            <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8b96ad]">
              Per-standard coverage
            </h2>
          </div>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
          >
            {standardSummary.map((summary) => (
              <StandardSummaryCard
                key={summary.standard}
                summary={summary}
                effortHist={effortByStandard[summary.standard] ?? {}}
              />
            ))}
          </div>
        </section>
      )}

      {/* Band 3 — top impacts */}
      {topImpacts.length > 0 && (
        <section className={`${PANEL} p-5`}>
          <div className="mb-3 flex items-center gap-2">
            <IconListNumbers size={16} className="text-[#8b96ad]" />
            <h2 className="text-sm font-medium text-[#e9eef7]">Top impacts</h2>
          </div>
          <ol className="space-y-2">
            {topImpacts.map((impact, index) => (
              <li key={index} className={`${CARD} flex gap-3 p-3`}>
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#2dd4bf]/40 bg-[#0f2e2c] font-mono text-[11px] font-semibold text-[#2dd4bf]">
                  {index + 1}
                </span>
                <p className="text-[12px] leading-relaxed text-[#c4cddd]">
                  {highlightDrRefs(impact)}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Band 4 — master table */}
      <section className={`${PANEL} overflow-hidden`}>
        <div className="flex items-center gap-2 border-b border-[#1c2740] p-4">
          <IconTable size={16} className="text-[#8b96ad]" />
          <h2 className="text-sm font-medium text-[#e9eef7]">DR-level comparison</h2>
          <span className="font-mono text-xs text-[#5c6780]">
            {filteredEntries.length}
            {filteredEntries.length !== rows.length ? ` / ${rows.length}` : ""}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-full border border-[#2a3a5c] px-2 py-0.5 text-[10.5px] text-[#8b96ad] hover:border-[#d97a6c]/50 hover:text-[#d97a6c]"
              >
                <IconX size={11} />
                clear {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
              </button>
            )}
            {rows.length > 0 && (
              <>
                <button
                  type="button"
                  disabled={exporting !== null}
                  onClick={handleExportCsv}
                  title="Download the currently filtered rows as CSV, with actual quoted regulation/Siemens text resolved from the corpus"
                  className="flex items-center gap-1 rounded-full border border-[#2a3a5c] px-2.5 py-0.5 text-[10.5px] text-[#8b96ad] hover:border-[#2dd4bf]/40 hover:text-[#2dd4bf] disabled:opacity-50"
                >
                  {exporting === "csv" ? (
                    <IconLoader2 size={11} className="animate-spin" />
                  ) : (
                    <IconDownload size={11} />
                  )}
                  {exporting === "csv" ? "Preparing…" : "Export CSV"}
                </button>
                <button
                  type="button"
                  disabled={exporting !== null}
                  onClick={handleExportXlsx}
                  title="Download an .xlsx workbook: F2's currently filtered rows plus one sheet each for P4/P5/P6, with column widths set and actual quoted regulation/Siemens text resolved from the corpus"
                  className="flex items-center gap-1 rounded-full border border-[#2dd4bf]/30 px-2.5 py-0.5 text-[10.5px] text-[#2dd4bf] hover:bg-[#0f2e2c] disabled:opacity-50"
                >
                  {exporting === "xlsx" ? (
                    <IconLoader2 size={11} className="animate-spin" />
                  ) : (
                    <IconDownload size={11} />
                  )}
                  {exporting === "xlsx" ? "Preparing…" : "Export Excel"}
                </button>
              </>
            )}
          </div>
        </div>

        {rows.length > 0 && (
          <div className="border-b border-[#1c2740] bg-[#0a101d]/40 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide text-[#5c6780]">
              <IconFilter size={12} />
              Filter
            </div>
            {/* One flowing horizontal strip: each dimension is an inline
                group that wraps as a whole, so the filter reads as a
                compact top toolbar instead of five stacked full rows. */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9.5px] uppercase tracking-wide text-[#5c6780]">Standard</span>
                {filterOptions.standard.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleSet(setFilterStandard, v)}
                    className={`transition-opacity ${filterStandard.has(v) ? "" : "opacity-40 hover:opacity-70"}`}
                  >
                    <StandardChip standard={v} />
                  </button>
                ))}
              </div>
              <FilterChipRow
                label="Change status"
                dict={CHANGE_STATUS}
                values={filterOptions.changeStatus}
                active={filterChangeStatus}
                onToggle={(v) => toggleSet(setFilterChangeStatus, v)}
              />
              <FilterChipRow
                label="Siemens reported"
                dict={REPORTED_STATUS}
                values={filterOptions.reported}
                active={filterReported}
                onToggle={(v) => toggleSet(setFilterReported, v)}
              />
              <FilterChipRow
                label="Agreed priority"
                dict={ACTION_PRIORITY}
                values={filterOptions.priority}
                active={filterPriority}
                onToggle={(v) => toggleSet(setFilterPriority, v)}
              />
              <FilterChipRow
                label="Agreed effort"
                dict={EFFORT}
                values={filterOptions.effort}
                active={filterEffort}
                onToggle={(v) => toggleSet(setFilterEffort, v)}
              />
              <label className="flex items-center gap-1.5 text-[10.5px] text-[#8b96ad]">
                <input
                  type="checkbox"
                  checked={onlyDivergent}
                  onChange={(e) => setOnlyDivergent(e.target.checked)}
                  className="h-3 w-3 accent-[#9b8cf2]"
                />
                only rows with persona disagreement
              </label>
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#5c6780]">F2 payload contains no rows.</div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#5c6780]">
            No rows match the current filters.
          </div>
        ) : (
          <div className="cockpit-track max-h-[820px] space-y-2 overflow-y-auto p-3">
            {filteredEntries.map(({ row, index }) => (
              <ImpactTableRow
                key={`${row.dr_id_2025 || "none"}:${row.dr_id_2026 || "none"}:${index}`}
                row={row}
                index={index}
                expanded={expandedIndex === index}
                onToggle={() => setExpandedIndex((current) => (current === index ? null : index))}
                divergenceSentences={divergenceByRow.get(index) ?? []}
                quotes={rowQuotes.get(index)}
              />
            ))}
          </div>
        )}
      </section>

      {/* residual persona divergence notes */}
      {divergenceResidual.length > 0 && (
        <section className={`${PANEL} overflow-hidden`}>
          <button
            type="button"
            onClick={() => setNotesOpen((v) => !v)}
            className="flex w-full items-center gap-2 p-4 text-left"
          >
            <IconMessageCircle2 size={15} className="text-[#9b8cf2]" />
            <h2 className="text-sm font-medium text-[#e9eef7]">General divergence notes</h2>
            <span className="font-mono text-xs text-[#5c6780]">{divergenceResidual.length}</span>
            <IconChevronDown
              size={13}
              className={`ml-auto text-[#5c6780] transition-transform duration-200 ${notesOpen ? "rotate-180" : ""}`}
            />
          </button>
          {notesOpen && (
            <ul className="space-y-2 border-t border-[#1c2740] p-4">
              {divergenceResidual.map((sentence, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-[#9b8cf2]/20 bg-[#1a1730]/25 p-3 text-[11.5px] leading-relaxed text-[#c4cddd]"
                >
                  {highlightDrRefs(sentence)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Band 5 — limitations */}
      {limitations.length > 0 && (
        <section className={`${PANEL} min-w-0`}>
          <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
            <IconAlertTriangle size={15} className="text-[#d9a95c]" />
            <h2 className="text-sm font-medium text-[#e9eef7]">Limitations</h2>
            <span className="font-mono text-xs text-[#5c6780]">{limitations.length}</span>
          </div>
          <ul className="space-y-2 p-4">
            {limitations.map((item, index) => (
              <li
                key={index}
                className="rounded-lg border border-[#d9a95c]/20 bg-[#2a2013]/25 p-3 text-[11.5px] leading-relaxed text-[#aeb8cb]"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      <LegendStrip dict={ACTION_NEEDED} title="F2 — what each action means" />
    </div>
  );
}
