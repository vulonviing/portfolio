/**
 * RD3Page — "Change/exposure join" detail screen.
 *
 * RD3 is deterministic (no LLM call): a full outer join of RC1.2's rows and
 * RM1.2's rows on the 2025 disclosure-requirement id, producing one flat row
 * per 2025 DR plus one row per orphan 2026 DR with no 2025 origin. It derives
 * orphan_side and action_needed from change_status and reported_status alone.
 * ArtifactBar/RawPayloadFooter/LegendStrip are shared; everything else here
 * is RD3-specific.
 *
 * BODY: the change_status × reported_status join matrix (the pivot view of
 * the whole pipeline) with an orphan-row gutter pulled out to the side, a
 * click-to-filter row list, and a click-to-expand row detail panel.
 */
import { useMemo, useState } from "react";
import { IconChevronDown, IconGitMerge, IconInfoCircle } from "@tabler/icons-react";
import ArtifactBar from "../../components/ArtifactBar";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import StageLoading from "../../components/StageLoading";
import { LegendStrip, StandardChip, StatusChip, highlightDrRefs } from "../../components/uc4/tokens";
import { ExternalCommentaryBullets } from "../../components/external/ExternalCommentaryView";
import { ACTION_NEEDED, CHANGE_STATUS, ORPHAN_SIDE, REPORTED_STATUS, TONE_CLASS, legend } from "../../lib/uc4Legend";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { useAgentStageState } from "../../lib/useAgentStageState";
import { useRun } from "../../context/RunContext";
import type { ExternalCommentary } from "../../api/types";

interface RD3JoinRow {
  standard: string;
  old_dr_id: string;
  old_dr_title: string;
  new_dr_ids: string[];
  new_dr_titles: string[];
  change_status: string;
  change_description: string;
  old_paragraph_refs: string[];
  new_paragraph_refs: string[];
  citations: string[];
  mapping_uncertain: boolean;
  reported_status: string;
  report_section_refs: string[];
  materiality_note: string;
  omission_note: string;
  evidence_quotes: string[];
  orphan_side: "none" | "no_2026_counterpart" | "no_2025_origin";
  action_needed: string;
}

interface RD3JoinSummary {
  n_rows: number;
  n_orphan_2026: number;
  n_orphan_2025: number;
  n_new_report_required: number;
  n_report_rewrite_required: number;
  n_report_update_required: number;
  n_status_review_required: number;
  n_mapping_uncertain: number;
  change_status_counts: Record<string, number>;
  reported_status_counts: Record<string, number>;
  action_needed_counts: Record<string, number>;
}

interface RD3Payload {
  registry_id: string;
  rows: RD3JoinRow[];
  summary: RD3JoinSummary;
}

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

const CHANGE_STATUS_ORDER = [
  "Removed",
  "New",
  "Modified",
  "Merged",
  "Relocated",
  "Renumbered",
  "Retained",
  "ApplicabilityChange",
];

const REPORTED_STATUS_ORDER = [
  "reported",
  "partially_reported",
  "omitted",
  "not_material",
  "not_applicable",
  "phase_in",
  "unclear",
];

const ACTION_SEVERITY_ORDER = [
  "new_report_required",
  "report_rewrite_required",
  "report_update_required",
  "status_review_required",
  "no_action",
];

function rowKey(row: RD3JoinRow, i: number): string {
  return `${row.standard}:${row.old_dr_id || "none"}:${row.new_dr_ids.join("+") || "none"}:${i}`;
}

// Dominant action_needed for a set of rows, tie-broken by severity order.
function dominantAction(rows: RD3JoinRow[]): { action: string; count: number } | null {
  if (rows.length === 0) return null;
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.action_needed, (counts.get(r.action_needed) ?? 0) + 1);
  let best: { action: string; count: number } | null = null;
  for (const action of ACTION_SEVERITY_ORDER) {
    const count = counts.get(action) ?? 0;
    if (count === 0) continue;
    if (!best || count > best.count) best = { action, count };
  }
  if (best) return best;
  const [[action, count]] = counts.entries();
  return { action, count };
}

// ── KPI row ──────────────────────────────────────────────────────────────────

function Kpi({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[32px] leading-none font-medium" style={{ color: tone }}>
        {value}
      </span>
      <span className="max-w-[16ch] text-[10.5px] leading-tight text-[#5c6780]">{label}</span>
    </div>
  );
}

function KpiRow({ summary }: { summary: RD3JoinSummary }) {
  const ACCENT = "#2dd4bf";
  const WARN = "#d9a95c";
  const DANGER = "#d97a6c";
  const CRITICAL = "#ef5f67";
  const MUTED = "#5c6780";
  return (
    <div className={`${PANEL} mb-4 flex flex-wrap items-start gap-x-8 gap-y-4 p-5`}>
      <Kpi value={summary.n_rows} label="joined rows" tone={ACCENT} />
      <Kpi value={summary.n_report_update_required} label="report update required" tone={WARN} />
      <Kpi value={summary.n_report_rewrite_required} label="report rewrite required" tone={DANGER} />
      <Kpi value={summary.n_new_report_required} label="new report required" tone={CRITICAL} />
      <Kpi value={summary.n_status_review_required} label="status review required" tone={WARN} />
      <Kpi
        value={summary.n_mapping_uncertain}
        label="mapping uncertain"
        tone={summary.n_mapping_uncertain > 0 ? WARN : MUTED}
      />
    </div>
  );
}

// ── Join matrix ──────────────────────────────────────────────────────────────

interface SelectedCell {
  changeStatus: string;
  reportedStatus: string;
}

function sameCell(a: SelectedCell | null, b: SelectedCell): boolean {
  return !!a && a.changeStatus === b.changeStatus && a.reportedStatus === b.reportedStatus;
}

function MatrixCell({
  rows,
  selected,
  onSelect,
}: {
  rows: RD3JoinRow[];
  selected: boolean;
  onSelect: () => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex h-16 w-full items-center justify-center rounded-lg border border-dashed border-[#1c2740] text-[11px] text-[#3a4560]">
        —
      </div>
    );
  }
  const dominant = dominantAction(rows);
  const entry = legend(ACTION_NEEDED, dominant?.action);
  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${rows.length} row(s) — mostly ${entry.label}: ${entry.meaning}`}
      className={`flex h-16 w-full flex-col items-center justify-center gap-0.5 rounded-lg border transition-all ${TONE_CLASS[entry.tone]} ${
        selected ? "ring-2 ring-[#e9eef7]/70 ring-offset-1 ring-offset-[#0d1424]" : "hover:brightness-125"
      }`}
    >
      <span className="font-mono text-[19px] font-semibold leading-none">{rows.length}</span>
      <span className="text-[9.5px] uppercase tracking-wide opacity-90">{entry.label}</span>
    </button>
  );
}

function JoinMatrix({
  rows,
  selectedCell,
  onSelectCell,
}: {
  rows: RD3JoinRow[];
  selectedCell: SelectedCell | null;
  onSelectCell: (cell: SelectedCell | null) => void;
}) {
  const matrixRows = useMemo(() => rows.filter((r) => r.orphan_side === "none"), [rows]);

  const changeStatuses = useMemo(() => {
    const present = new Set(matrixRows.map((r) => r.change_status).filter(Boolean));
    const ordered = CHANGE_STATUS_ORDER.filter((s) => present.has(s));
    const rest = Array.from(present).filter((s) => !CHANGE_STATUS_ORDER.includes(s));
    return [...ordered, ...rest];
  }, [matrixRows]);

  const reportedStatuses = useMemo(() => {
    const present = new Set(matrixRows.map((r) => r.reported_status).filter(Boolean));
    const ordered = REPORTED_STATUS_ORDER.filter((s) => present.has(s));
    const rest = Array.from(present).filter((s) => !REPORTED_STATUS_ORDER.includes(s));
    const hasBlank = matrixRows.some((r) => !r.reported_status);
    return [...ordered, ...rest, ...(hasBlank ? [""] : [])];
  }, [matrixRows]);

  const cellRows = (changeStatus: string, reportedStatus: string) =>
    matrixRows.filter((r) => r.change_status === changeStatus && r.reported_status === reportedStatus);

  if (changeStatuses.length === 0 || reportedStatuses.length === 0) {
    return (
      <div className={`${PANEL} p-6 text-center text-[12px] text-[#5c6780]`}>
        No matrix-eligible rows (all rows are orphans).
      </div>
    );
  }

  return (
    <div className={`${PANEL} overflow-x-auto p-4`}>
      <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#5c6780]">
        <IconGitMerge size={14} />
        change status × reported status — click a cell to filter rows below
      </div>
      <div
        className="grid min-w-[640px] gap-2"
        style={{ gridTemplateColumns: `9rem repeat(${reportedStatuses.length}, minmax(6rem, 1fr))` }}
      >
        <div />
        {reportedStatuses.map((status) => (
          <div key={status || "blank"} className="flex items-end justify-center pb-1">
            <StatusChip dict={REPORTED_STATUS} token={status || null} />
          </div>
        ))}

        {changeStatuses.map((status) => (
          <div key={status} className="contents">
            <div className="flex items-center pr-2">
              <StatusChip dict={CHANGE_STATUS} token={status} />
            </div>
            {reportedStatuses.map((reportedStatus) => {
              const cell = { changeStatus: status, reportedStatus };
              return (
                <MatrixCell
                  key={reportedStatus || "blank"}
                  rows={cellRows(status, reportedStatus)}
                  selected={sameCell(selectedCell, cell)}
                  onSelect={() => onSelectCell(sameCell(selectedCell, cell) ? null : cell)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Orphan gutter ────────────────────────────────────────────────────────────

function OrphanGutter({ rows }: { rows: RD3JoinRow[] }) {
  const orphans = useMemo(() => rows.filter((r) => r.orphan_side !== "none"), [rows]);
  if (orphans.length === 0) return null;

  const noNew = orphans.filter((r) => r.orphan_side === "no_2026_counterpart");
  const noOld = orphans.filter((r) => r.orphan_side === "no_2025_origin");

  return (
    <div className={`${PANEL} mb-4 p-4`}>
      <div className="mb-2.5 flex items-start gap-2.5">
        <IconInfoCircle size={15} className="mt-0.5 flex-shrink-0 text-[#5b8def]" />
        <p className="text-[12px] leading-relaxed text-[#8b96ad]">
          An orphan finding here is a positive signal: it points at reporting content to
          strengthen or newly produce, not a data gap.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <OrphanGroup
          title="No 2026 counterpart"
          side="no_2026_counterpart"
          rows={noNew}
        />
        <OrphanGroup
          title="No 2025 origin"
          side="no_2025_origin"
          rows={noOld}
        />
      </div>
    </div>
  );
}

function OrphanGroup({
  title,
  side,
  rows,
}: {
  title: string;
  side: "no_2026_counterpart" | "no_2025_origin";
  rows: RD3JoinRow[];
}) {
  return (
    <div className={`${CARD} p-3`}>
      <div className="mb-2 flex items-center gap-2">
        <StatusChip dict={ORPHAN_SIDE} token={side} />
        <span className="text-[11px] text-[#8b96ad]">{title}</span>
        <span className="ml-auto font-mono text-[11px] text-[#5c6780]">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <div className="py-2 text-center text-[11px] text-[#3a4560]">none</div>
      ) : (
        <div className="space-y-1.5">
          {rows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-[11px]">
              <StandardChip standard={row.standard} />
              <span className="font-mono text-[#e9eef7]">
                {row.old_dr_id || <span className="text-[#5c6780]">—</span>}
                <span className="mx-1 text-[#5c6780]">→</span>
                {row.new_dr_ids.length > 0 ? row.new_dr_ids.join(", ") : <span className="text-[#5c6780]">—</span>}
              </span>
              <StatusChip dict={ACTION_NEEDED} token={row.action_needed} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Row list + detail ────────────────────────────────────────────────────────

function RowDetail({ row }: { row: RD3JoinRow }) {
  return (
    <div className="space-y-3 border-t border-[#1c2740] bg-[#0d1424] p-4 text-[11.5px]">
      <div>
        <div className="mb-1 text-[10.5px] uppercase tracking-wide text-[#5c6780]">Change description</div>
        <p className="leading-relaxed text-[#c3cbdb]">
          {row.change_description ? highlightDrRefs(row.change_description) : <span className="text-[#5c6780]">—</span>}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {row.old_paragraph_refs.length > 0 && (
          <div>
            <div className="mb-1.5 text-[10.5px] uppercase tracking-wide text-[#5c6780]">2025 paragraph refs</div>
            <div className="flex flex-wrap gap-1.5">
              {row.old_paragraph_refs.map((ref) => (
                <span key={ref} className="rounded border border-[#2a3a5c] bg-[#111a2e] px-1.5 py-0.5 font-mono text-[10px] text-[#8b96ad]">
                  {ref}
                </span>
              ))}
            </div>
          </div>
        )}
        {row.new_paragraph_refs.length > 0 && (
          <div>
            <div className="mb-1.5 text-[10.5px] uppercase tracking-wide text-[#5c6780]">2026 paragraph refs</div>
            <div className="flex flex-wrap gap-1.5">
              {row.new_paragraph_refs.map((ref) => (
                <span key={ref} className="rounded border border-[#2a3a5c] bg-[#111a2e] px-1.5 py-0.5 font-mono text-[10px] text-[#8b96ad]">
                  {ref}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {row.report_section_refs.length > 0 && (
        <div>
          <div className="mb-1.5 text-[10.5px] uppercase tracking-wide text-[#5c6780]">Report section refs</div>
          <div className="flex flex-wrap gap-1.5">
            {row.report_section_refs.map((ref) => (
              <span key={ref} className="rounded border border-[#2a3a5c] bg-[#111a2e] px-1.5 py-0.5 font-mono text-[10.5px] text-[#8b96ad]">
                § {ref}
              </span>
            ))}
          </div>
        </div>
      )}

      {row.citations.length > 0 && (
        <div>
          <div className="mb-1 text-[10.5px] uppercase tracking-wide text-[#5c6780]">Citations</div>
          <ul className="space-y-1">
            {row.citations.map((c, i) => (
              <li key={i} className="text-[#8b96ad]">
                {highlightDrRefs(c)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {row.evidence_quotes.length > 0 && (
        <div>
          <div className="mb-1.5 text-[10.5px] uppercase tracking-wide text-[#5c6780]">Evidence quotes</div>
          <div className="space-y-1.5">
            {row.evidence_quotes.map((quote, i) => (
              <blockquote
                key={i}
                className="border-l-2 border-[#2a3a5c] bg-[#111a2e] py-1.5 pl-3 pr-2 text-[11.5px] italic leading-relaxed text-[#aeb8cb]"
              >
                "{quote}"
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {row.materiality_note && (
        <div>
          <div className="mb-1 text-[10.5px] uppercase tracking-wide text-[#5c6780]">Materiality note</div>
          <p className="leading-relaxed text-[#c4cddd]">{highlightDrRefs(row.materiality_note)}</p>
        </div>
      )}

      {row.omission_note && (
        <div>
          <div className="mb-1 text-[10.5px] uppercase tracking-wide text-[#5c6780]">Omission note</div>
          <p className="leading-relaxed text-[#c4cddd]">{highlightDrRefs(row.omission_note)}</p>
        </div>
      )}
    </div>
  );
}

function Row({
  row,
  expanded,
  onToggle,
}: {
  row: RD3JoinRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <button onClick={onToggle} className="flex w-full flex-wrap items-center gap-3 p-3 text-left hover:bg-[#141f38]">
        <StandardChip standard={row.standard} />

        <div className="min-w-[9rem] font-mono text-[11.5px] text-[#e9eef7]">
          {row.old_dr_id || <span className="text-[#5c6780]">—</span>}
          <span className="mx-1 text-[#5c6780]">→</span>
          {row.new_dr_ids.length > 0 ? row.new_dr_ids.join(", ") : <span className="text-[#5c6780]">—</span>}
        </div>

        <StatusChip dict={CHANGE_STATUS} token={row.change_status} />
        <StatusChip dict={REPORTED_STATUS} token={row.reported_status || null} />
        <StatusChip dict={ACTION_NEEDED} token={row.action_needed} />

        {row.orphan_side !== "none" && <StatusChip dict={ORPHAN_SIDE} token={row.orphan_side} />}
        {row.mapping_uncertain && (
          <span className="rounded-full border border-[#d9a95c]/40 bg-[#2a2013] px-2 py-0.5 text-[10px] text-[#d9a95c]">
            uncertain mapping
          </span>
        )}

        <IconChevronDown
          size={14}
          className={`ml-auto flex-shrink-0 text-[#5c6780] transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && <RowDetail row={row} />}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function RD3Page() {
  const { envelope } = useAgentEnvelope("rd3");
  const stageState = useAgentStageState("rd3");
  const { run } = useRun();
  const p = envelope?.payload as RD3Payload | undefined;
  const isComputing = stageState === "running" || stageState === "pending";

  // EX1 runs immediately before the mapping gate that follows RD3 — its
  // commentary lives only in the live gate payload until the human decides.
  const gateEx1 =
    run?.status === "waiting_gate" && run.current_gate?.gate_id === "mapping"
      ? ((run.current_gate.payload as Record<string, unknown> | undefined)?.ex1 as
          | ExternalCommentary
          | undefined)
      : undefined;
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const keyedRows = useMemo(() => (p?.rows ?? []).map((row, i) => ({ row, key: rowKey(row, i) })), [p]);

  const listRows = useMemo(() => {
    if (!selectedCell) return keyedRows;
    return keyedRows.filter(
      ({ row }) => row.change_status === selectedCell.changeStatus && row.reported_status === selectedCell.reportedStatus,
    );
  }, [keyedRows, selectedCell]);

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1400px] flex-1 p-6">
        <div className="mb-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">RD3</span>{" "}
            <span className="text-[#e9eef7]">— Change/exposure join</span>
          </h1>
          {envelope?.registry_id && (
            <span className="font-mono text-xs text-[#5c6780]">{envelope.registry_id}</span>
          )}
        </div>
        <p className="mb-5 max-w-[92ch] text-sm text-[#8b96ad]">
          Deterministic full outer join of RC1.2's 2025↔2026 classification and RM1.2's
          Siemens exposure mapping, on the 2025 disclosure-requirement id — no LLM call.
        </p>

        {isComputing ? (
          <StageLoading agentLabel="RD3" agentName="Change/Exposure Join" />
        ) : (
          <>
            <ArtifactBar envelope={envelope} />

            {gateEx1 && (
              <div className={`${PANEL} mb-4 overflow-hidden`}>
                <div className="border-b border-[#1c2740] px-4 py-3">
                  <h2 className="text-sm font-medium text-[#e9eef7]">External Perspective (EX1)</h2>
                  <p className="mt-0.5 font-mono text-xs text-[#69758e]">
                    advisory only — not part of this decision
                  </p>
                </div>
                <div className="p-4">
                  <ExternalCommentaryBullets commentary={gateEx1} />
                </div>
              </div>
            )}

            {p && (
              <>
                <KpiRow summary={p.summary} />

                <div className={`${PANEL} mb-4 flex items-start gap-2.5 p-3.5`}>
                  <IconInfoCircle size={15} className="mt-0.5 flex-shrink-0 text-[#5c6780]" />
                  <p className="text-[12px] leading-relaxed text-[#8b96ad]">
                    This is a deterministic full outer join of RC1.2 (2025↔2026) and RM1.2
                    (2025↔Siemens) on the 2025 Disclosure Requirement id — no LLM call.
                  </p>
                </div>

                <OrphanGutter rows={p.rows} />

                <div className="mb-4">
                  <JoinMatrix rows={p.rows} selectedCell={selectedCell} onSelectCell={setSelectedCell} />
                </div>

                <div className="mb-2 flex items-center gap-3 px-1">
                  <span className="text-[10.5px] text-[#5c6780]">
                    {listRows.length} of {keyedRows.length} row{keyedRows.length === 1 ? "" : "s"}
                    {selectedCell ? " — filtered by matrix cell" : ""}
                  </span>
                  {selectedCell && (
                    <button
                      onClick={() => setSelectedCell(null)}
                      className="rounded-full border border-[#2a3a5c] bg-[#111a2e] px-2 py-0.5 text-[10.5px] text-[#8b96ad] hover:text-[#e9eef7]"
                    >
                      clear filter
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {listRows.map(({ row, key }) => (
                    <Row
                      key={key}
                      row={row}
                      expanded={expandedKey === key}
                      onToggle={() => setExpandedKey((cur) => (cur === key ? null : key))}
                    />
                  ))}
                  {listRows.length === 0 && (
                    <div className={`${CARD} p-4 text-center text-[12px] text-[#5c6780]`}>No rows.</div>
                  )}
                </div>

                <LegendStrip dict={ACTION_NEEDED} title="RD3 — what each action means" />
                <RawPayloadFooter payload={p} filename="rd3-payload.json" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
