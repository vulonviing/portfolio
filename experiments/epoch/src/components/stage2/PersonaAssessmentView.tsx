/**
 * PersonaAssessmentView — one component serving P4/P5/P6 (Conservative /
 * Balanced / Maximum-Assurance), the document-family precedent for
 * MethodInterpreterArtifactView's P2/P3 pattern. All three personas share
 * this exact payload shape; only agentCode and the underlying data differ.
 *
 * BODY: an effort ladder (none / low / medium / high columns) built from
 * this persona's rows, with action_priority as each card's left-border
 * color, an explicit primary/supplemental verdict_kind count, and a
 * posture-context strip comparing this persona's effort histogram against
 * the other two personas (fetched read-only via useAgentEnvelope, no extra
 * network round trip since the active set is already cached app-wide).
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconChevronDown,
  IconDownload,
  IconFilter,
  IconLoader2,
  IconQuote,
  IconStack2,
  IconX,
} from "@tabler/icons-react";
import { StandardChip, highlightDrRefs, LegendStrip } from "../uc4/tokens";
import { EFFORT, ACTION_PRIORITY, legend, TONE_CLASS, type LegendEntry } from "../../lib/uc4Legend";
import { fetchProvisions } from "../../api/client";
import type { ProvisionMap } from "../../api/types";
import { useRun } from "../../context/RunContext";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import {
  buildRd3ByDr,
  resolveCitationQuotes,
  type RD3CitationRow,
  type ResolvedQuotes,
} from "../../lib/citationQuotes";
import { downloadCsv, downloadXlsx, rowsToCsv } from "../../lib/tableExport";
import { PERSONA_EXPORT_COLUMNS, buildPersonaExportRows } from "./personaExport";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

export interface PersonaVerdict {
  character_id: string;
  verdict_kind: "primary" | "supplemental";
  standard: string;
  old_dr_ids: string[];
  new_dr_ids: string[];
  recommended_action: string;
  effort_estimate: "none" | "low" | "medium" | "high";
  effort_rationale: string;
  risk_posture_note: string;
  rationale: string;
  citations: string[];
  siemens_evidence_quotes: string[];
  confidence: number;
  action_needed: string;
  action_priority: "required_urgent" | "required" | "not_required";
}

export interface PersonaPayload {
  registry_id?: string;
  character_id?: string;
  rows?: PersonaVerdict[];
}

// Page-local payload wrapper around the shared RD3CitationRow shape — RD3
// is the only place old_paragraph_refs/new_paragraph_refs still exist to
// resolve a persona's citations[] refs to real quoted text.
interface RD3Payload {
  rows?: RD3CitationRow[];
}

function rowIdentity(row: PersonaVerdict): string {
  return `${row.old_dr_ids.join(",")}|${row.new_dr_ids.join(",")}`;
}

const LABELS: Record<string, string> = {
  P4: "Conservative",
  P5: "Balanced",
  P6: "Maximum-Assurance",
};

const EFFORT_LEVELS: PersonaVerdict["effort_estimate"][] = ["none", "low", "medium", "high"];
const STANDARD_ORDER = ["E1", "E2", "E3", "E4", "E5"];

// Solid brand colors for the bar fill in PostureStrip — TONE_CLASS's bg-*
// values are dim chip-surface tints (e.g. accent's bg-[#0f2e2c]), not meant
// for a filled bar. Same tone mapping as EFFORT's legend (none=neutral,
// low=accent, medium=warn, high=critical), just the bright/solid variant.
const EFFORT_FILL: Record<string, string> = {
  none: "#5c6780",
  low: "#2dd4bf",
  medium: "#d9a95c",
  high: "#ef5f67",
};

function histogram(rows: PersonaVerdict[]): Record<string, number> {
  const hist: Record<string, number> = { none: 0, low: 0, medium: 0, high: 0 };
  for (const row of rows) hist[row.effort_estimate] = (hist[row.effort_estimate] ?? 0) + 1;
  return hist;
}

const PRIORITY_BORDER: Record<PersonaVerdict["action_priority"], string> = {
  required_urgent: "border-l-[#ef5f67]",
  required: "border-l-[#d9a95c]",
  not_required: "border-l-[#5c6780]",
};

export default function PersonaAssessmentView({
  agentCode,
  payload,
}: {
  agentCode: string;
  payload: PersonaPayload;
}) {
  const allRows = payload.rows ?? [];

  const { selectedUsecase } = useRun();
  const { envelope: rd3Envelope } = useAgentEnvelope("rd3");
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rd3ByDr = useMemo(
    () => buildRd3ByDr(((rd3Envelope?.payload as RD3Payload | undefined)?.rows ?? []) as RD3CitationRow[]),
    [rd3Envelope]
  );

  // Fetched lazily — only once a card is actually expanded on screen, or an
  // export is clicked — not on every persona page load.
  const { data: provisions } = useQuery({
    queryKey: ["provisions", selectedUsecase],
    queryFn: () => fetchProvisions(selectedUsecase!),
    enabled: !!selectedUsecase && expandedId !== null,
  });

  const rowQuotes = useMemo(() => {
    if (!provisions) return new Map<string, ResolvedQuotes>();
    const map = new Map<string, ResolvedQuotes>();
    for (const row of allRows) {
      map.set(
        rowIdentity(row),
        resolveCitationQuotes(
          { standard: row.standard, oldDrId: row.old_dr_ids[0] ?? "", newDrId: row.new_dr_ids[0] ?? "" },
          rd3ByDr,
          provisions
        )
      );
    }
    return map;
  }, [allRows, rd3ByDr, provisions]);

  // ── Filters — same horizontal top toolbar as F2's DR-level comparison ────
  const [filterStandard, setFilterStandard] = useState<Set<string>>(new Set());
  const [filterEffort, setFilterEffort] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<Set<string>>(new Set());
  const [filterVerdictKind, setFilterVerdictKind] = useState<Set<string>>(new Set());

  const filterOptions = useMemo(
    () => ({
      standard: Array.from(new Set(allRows.map((r) => r.standard))).sort(),
      effort: EFFORT_LEVELS.filter((level) => allRows.some((r) => r.effort_estimate === level)),
      priority: (["required_urgent", "required", "not_required"] as const).filter((p) =>
        allRows.some((r) => r.action_priority === p)
      ),
    }),
    [allRows]
  );

  const activeFilterCount =
    filterStandard.size + filterEffort.size + filterPriority.size + filterVerdictKind.size;

  const rows = useMemo(
    () =>
      allRows.filter((r) => {
        if (filterStandard.size && !filterStandard.has(r.standard)) return false;
        if (filterEffort.size && !filterEffort.has(r.effort_estimate)) return false;
        if (filterPriority.size && !filterPriority.has(r.action_priority)) return false;
        if (filterVerdictKind.size && !filterVerdictKind.has(r.verdict_kind)) return false;
        return true;
      }),
    [allRows, filterStandard, filterEffort, filterPriority, filterVerdictKind]
  );

  const clearFilters = () => {
    setFilterStandard(new Set());
    setFilterEffort(new Set());
    setFilterPriority(new Set());
    setFilterVerdictKind(new Set());
  };

  const nPrimary = rows.filter((r) => r.verdict_kind === "primary").length;
  const nSupplemental = rows.length - nPrimary;

  const byStandard = useMemo(() => {
    const present = new Set(rows.map((r) => r.standard));
    const ordered = STANDARD_ORDER.filter((s) => present.has(s));
    const rest = Array.from(present).filter((s) => !STANDARD_ORDER.includes(s));
    return [...ordered, ...rest].map((standard) => ({
      standard,
      hist: histogram(rows.filter((r) => r.standard === standard)),
    }));
  }, [rows]);

  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = { required_urgent: 0, required: 0, not_required: 0 };
    for (const row of rows) counts[row.action_priority] = (counts[row.action_priority] ?? 0) + 1;
    return counts;
  }, [rows]);

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
      const resolvedProvisions = await fetchProvisionsCached();
      const enriched = buildPersonaExportRows(rows, rd3ByDr, resolvedProvisions);
      downloadCsv(`f2-${agentCode.toLowerCase()}-assessment.csv`, rowsToCsv(PERSONA_EXPORT_COLUMNS, enriched));
    } finally {
      setExporting(null);
    }
  };

  const handleExportXlsx = async () => {
    setExporting("xlsx");
    try {
      const resolvedProvisions = await fetchProvisionsCached();
      const enriched = buildPersonaExportRows(rows, rd3ByDr, resolvedProvisions);
      await downloadXlsx(`f2-${agentCode.toLowerCase()}-assessment.xlsx`, [
        { name: agentCode, columns: PERSONA_EXPORT_COLUMNS, rows: enriched },
      ]);
    } finally {
      setExporting(null);
    }
  };

  if (allRows.length === 0) {
    return (
      <div className={`${PANEL} p-8 text-center text-sm text-[#5c6780]`}>
        {LABELS[agentCode] ?? agentCode} payload contains no assessment rows.
      </div>
    );
  }

  return (
    <div>
      <div className={`${PANEL} mb-4 flex flex-wrap items-center gap-6 p-4`}>
        <div className="min-w-[200px]">
          <div className="text-[15px] font-medium text-[#e9eef7]">
            {LABELS[agentCode] ?? agentCode} — risk-posture assessment
          </div>
          <div className="mt-1 text-[11.5px] text-[#8b96ad]">
            {nPrimary} primary{nSupplemental > 0 ? ` · ${nSupplemental} supplemental` : ""}{" "}
            verdict{rows.length === 1 ? "" : "s"} over the RD3 join
          </div>
        </div>
        <PriorityStats counts={priorityCounts} />
        <div className="ml-auto min-w-[220px] flex-1 max-w-[520px]">
          <PostureStrip agentCode={agentCode} byStandard={byStandard} />
        </div>
      </div>

      <div className={`${PANEL} mb-4 p-3`}>
        <div className="mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide text-[#5c6780]">
          <IconFilter size={12} />
          Filter
        </div>
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
            label="Effort"
            dict={EFFORT}
            values={filterOptions.effort}
            active={filterEffort}
            onToggle={(v) => toggleSet(setFilterEffort, v)}
          />
          <FilterChipRow
            label="Priority"
            dict={ACTION_PRIORITY}
            values={filterOptions.priority}
            active={filterPriority}
            onToggle={(v) => toggleSet(setFilterPriority, v)}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9.5px] uppercase tracking-wide text-[#5c6780]">Verdict</span>
            {(["primary", "supplemental"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => toggleSet(setFilterVerdictKind, v)}
                className={`rounded-full border px-2 py-0.5 text-[10px] transition-opacity ${
                  filterVerdictKind.has(v)
                    ? "border-[#9b8cf2]/40 bg-[#1a1730] text-[#9b8cf2]"
                    : "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad] opacity-40 hover:opacity-70"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
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
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              disabled={exporting !== null}
              onClick={handleExportCsv}
              title="Download the currently filtered rows as CSV, with actual quoted regulation text resolved from the corpus"
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
              title="Download the currently filtered rows as a real .xlsx workbook, with column widths set and actual quoted regulation text resolved from the corpus"
              className="flex items-center gap-1 rounded-full border border-[#2dd4bf]/30 px-2.5 py-0.5 text-[10.5px] text-[#2dd4bf] hover:bg-[#0f2e2c] disabled:opacity-50"
            >
              {exporting === "xlsx" ? (
                <IconLoader2 size={11} className="animate-spin" />
              ) : (
                <IconDownload size={11} />
              )}
              {exporting === "xlsx" ? "Preparing…" : "Export Excel"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {EFFORT_LEVELS.map((level) => {
          const entry = legend(EFFORT, level);
          const levelRows = rows.filter((r) => r.effort_estimate === level);
          return (
            <div key={level} className={`${PANEL} flex min-w-0 flex-col`}>
              <div
                className={`flex items-center justify-between gap-2 border-b border-[#1c2740] px-3 py-2.5 ${TONE_CLASS[entry.tone]}`}
                title={entry.meaning}
              >
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  {entry.label}
                </span>
                <span className="font-mono text-[10.5px]">{levelRows.length}</span>
              </div>
              <div className="cockpit-track flex flex-col gap-2 overflow-y-auto p-2" style={{ maxHeight: "min(72vh, 900px)" }}>
                {levelRows.length === 0 && (
                  <div className="px-2 py-6 text-center text-[10.5px] text-[#5c6780]">
                    No rows at this effort level.
                  </div>
                )}
                {levelRows.map((row, index) => {
                  const rowKey = `${level}-${index}-${row.old_dr_ids.join(",")}-${row.new_dr_ids.join(",")}`;
                  const expanded = expandedId === rowKey;
                  return (
                    <EffortCard
                      key={rowKey}
                      row={row}
                      expanded={expanded}
                      onToggle={() => setExpandedId(expanded ? null : rowKey)}
                      quotes={rowQuotes.get(rowIdentity(row))}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <LegendStrip dict={EFFORT} title={`${agentCode} — what each effort level means`} />
    </div>
  );
}

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

function EffortCard({
  row,
  expanded,
  onToggle,
  quotes,
}: {
  row: PersonaVerdict;
  expanded: boolean;
  onToggle: () => void;
  quotes: ResolvedQuotes | undefined;
}) {
  return (
    <div
      className={`relative rounded-lg border border-[#1c2740] border-l-2 bg-[#111a2e] ${PRIORITY_BORDER[row.action_priority]}`}
    >
      {row.verdict_kind === "supplemental" && (
        <span className="absolute right-1.5 top-1.5 rounded border border-[#9b8cf2]/40 bg-[#1a1730] px-1 py-0.5 text-[8.5px] uppercase tracking-wide text-[#9b8cf2]">
          supplemental
        </span>
      )}
      <button type="button" onClick={onToggle} className="block w-full px-2.5 py-2.5 text-left">
        <div className="flex items-center gap-1.5">
          <StandardChip standard={row.standard} />
          <StatusChipInline dict={ACTION_PRIORITY} token={row.action_priority} />
        </div>
        <div className="mt-1.5 flex items-center gap-1 font-mono text-[9.5px] text-[#8b96ad]">
          <span className="truncate">{row.old_dr_ids.join(", ") || "—"}</span>
          <span className="flex-shrink-0 text-[#5c6780]">→</span>
          <span className="truncate">{row.new_dr_ids.join(", ") || "—"}</span>
        </div>
        <p
          className={`mt-1.5 text-[11px] leading-snug text-[#c4cddd] ${expanded ? "" : "line-clamp-2"}`}
        >
          {row.recommended_action}
        </p>
        <p className="mt-1.5 text-[10px] italic leading-snug text-[#8b96ad]">
          {row.risk_posture_note}
        </p>
        <div className="mt-1.5 flex items-center gap-1 text-[9.5px] text-[#5c6780]">
          <IconChevronDown
            size={11}
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
          {expanded ? "collapse" : "expand"}
        </div>
      </button>

      {expanded && (
        <div className="space-y-2.5 border-t border-[#1c2740] px-2.5 py-2.5">
          <div>
            <div className="text-[9.5px] uppercase tracking-wide text-[#5c6780]">Rationale</div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#c4cddd]">
              {highlightDrRefs(row.rationale)}
            </p>
          </div>
          <div>
            <div className="text-[9.5px] uppercase tracking-wide text-[#5c6780]">
              Effort rationale
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#c4cddd]">
              {highlightDrRefs(row.effort_rationale)}
            </p>
          </div>
          {row.citations.length > 0 && (
            <div>
              <div className="text-[9.5px] uppercase tracking-wide text-[#5c6780]">Citations</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {row.citations.map((cite, index) => (
                  <span
                    key={index}
                    className="rounded border border-[#2a3a5c] bg-[#0d1424] px-1.5 py-0.5 font-mono text-[9.5px] text-[#8b96ad]"
                  >
                    {cite}
                  </span>
                ))}
              </div>
              {(quotes?.old2025 || quotes?.new2026) && (
                <div className="mt-1.5 space-y-1">
                  {quotes.old2025 && (
                    <blockquote className="border-l-2 border-[#2a3a5c] pl-2 text-[10.5px] italic leading-relaxed text-[#aeb8cb]">
                      {highlightDrRefs(quotes.old2025)}
                    </blockquote>
                  )}
                  {quotes.new2026 && (
                    <blockquote className="border-l-2 border-[#2a3a5c] pl-2 text-[10.5px] italic leading-relaxed text-[#aeb8cb]">
                      {highlightDrRefs(quotes.new2026)}
                    </blockquote>
                  )}
                </div>
              )}
            </div>
          )}
          {row.siemens_evidence_quotes.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-1 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
                <IconQuote size={11} /> Siemens evidence
              </div>
              <div className="space-y-1.5">
                {row.siemens_evidence_quotes.map((quote, index) => (
                  <blockquote
                    key={index}
                    className="border-l-2 border-[#2a3a5c] pl-2 text-[10.5px] italic leading-relaxed text-[#aeb8cb]"
                  >
                    {quote}
                  </blockquote>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 text-[9.5px] text-[#5c6780]">
            <span>confidence {(row.confidence * 100).toFixed(0)}%</span>
            <span className="flex items-center gap-1">
              <IconStack2 size={11} /> action needed: {row.action_needed}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusChipInline({
  dict,
  token,
}: {
  dict: Record<string, { label: string; meaning: string; tone: keyof typeof TONE_CLASS }>;
  token: string;
}) {
  const entry = legend(dict, token);
  return (
    <span
      title={entry.meaning}
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[9.5px] font-medium ${TONE_CLASS[entry.tone]}`}
    >
      {entry.label}
    </span>
  );
}

// ── Action-priority breakdown — how urgently this persona reads the join ────

const PRIORITY_STATS: { key: PersonaVerdict["action_priority"]; color: string }[] = [
  { key: "required_urgent", color: "#ef5f67" },
  { key: "required", color: "#d9a95c" },
  { key: "not_required", color: "#5c6780" },
];

function PriorityStats({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="flex items-center gap-5">
      {PRIORITY_STATS.map(({ key, color }) => {
        const entry = legend(ACTION_PRIORITY, key);
        return (
          <div key={key} className="flex flex-col gap-0.5" title={entry.meaning}>
            <span className="font-mono text-[26px] font-semibold leading-none" style={{ color }}>
              {counts[key] ?? 0}
            </span>
            <span className="max-w-[15ch] text-[9.5px] uppercase tracking-wide text-[#5c6780]">
              {entry.label.replace(/_/g, " ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PostureStrip({
  agentCode,
  byStandard,
}: {
  agentCode: string;
  byStandard: { standard: string; hist: Record<string, number> }[];
}) {
  const maxCount = Math.max(
    1,
    ...byStandard.flatMap((entry) => EFFORT_LEVELS.map((level) => entry.hist[level] ?? 0))
  );

  return (
    <div className={`${CARD} p-2.5`}>
      <div className="mb-1.5 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
        {agentCode} — effort by standard
      </div>
      <div className="space-y-1">
        {byStandard.map((entry) => (
          <div key={entry.standard} className="flex items-center gap-1.5">
            <span className="w-8 flex-shrink-0">
              <StandardChip standard={entry.standard} />
            </span>
            <div className="flex flex-1 gap-0.5">
              {EFFORT_LEVELS.map((level) => {
                const count = entry.hist[level] ?? 0;
                const width = `${(count / maxCount) * 100}%`;
                return (
                  <div key={level} className="h-3 flex-1 rounded-sm bg-[#0d1424]" title={`${level}: ${count}`}>
                    {count > 0 && (
                      <div
                        className="flex h-full items-center justify-end rounded-sm pr-1"
                        style={{ width, minWidth: "14px", background: EFFORT_FILL[level] }}
                      >
                        <span className="font-mono text-[8px] font-semibold leading-none text-[#0a101d]">
                          {count}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-0.5 pl-8 text-[8.5px] text-[#5c6780]">
        {EFFORT_LEVELS.map((level) => (
          <span key={level} className="flex-1 text-center">
            {level}
          </span>
        ))}
      </div>
    </div>
  );
}
