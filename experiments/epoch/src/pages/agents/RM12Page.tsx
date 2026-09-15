/**
 * RM12Page — "Siemens exposure mapping" detail screen.
 *
 * RM1.2 is the informed half of the RM1 blind-pass pair: it receives RM1.1's
 * blind rows AND the deterministic ESRS-index candidates side by side, plus
 * the report text, and decides the final reported_status. RM1.1/RM1.2 do not
 * consume RC1.1/RC1.2's output (Siemens's FY2025 report was written against
 * the 2025 standard, so the 2025<->2026 classification adds nothing here).
 * ArtifactBar/RawPayloadFooter/LegendStrip are shared; everything else here
 * is RM1.2-specific.
 *
 * BODY: the reporting-status heat grid (E1-E5 comb, one cell per DR, colored
 * by reported_status) plus a proportional coverage bar and a click-through
 * evidence panel with a 2-cell agreement strip (blind_agreement vs RM1.1,
 * index_agreement vs the deterministic ESRS-index candidates).
 */
import { useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconChartBar,
  IconGitCompare,
  IconInfoCircle,
  IconQuote,
} from "@tabler/icons-react";
import ArtifactBar from "../../components/ArtifactBar";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import StageLoading from "../../components/StageLoading";
import { StandardChip, StatusChip, highlightDrRefs, LegendStrip } from "../../components/uc4/tokens";
import { AGREEMENT, REPORTED_STATUS, TONE_CLASS, legend, type Tone } from "../../lib/uc4Legend";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { useAgentStageState } from "../../lib/useAgentStageState";

interface ExposureRecord {
  standard: string;
  dr_id: string;
  dr_title: string;
  reported_status: string;
  report_section_refs: string[];
  materiality_note: string;
  omission_note: string;
  evidence_quotes: string[];
  confidence: number;
  blind_agreement: string;
  index_agreement: string;
  divergence_note: string;
}

interface RM12Payload {
  registry_id: string;
  rows: ExposureRecord[];
}

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

const STANDARD_ORDER = ["E1", "E2", "E3", "E4", "E5"];

const STATUS_BAR_ORDER = [
  "reported",
  "partially_reported",
  "omitted",
  "not_material",
  "not_applicable",
  "phase_in",
  "unclear",
  "", // blank / missing status — kept last, rendered explicitly as "blank"
];

// A blank reported_status is an edge case in the real run (2 of 32 rows).
// It gets its own tone/label rather than silently collapsing into "unclear".
function statusMeta(status: string): { tone: Tone; label: string; meaning: string } {
  if (!status) {
    return {
      tone: "warn",
      label: "blank",
      meaning: "No status was recorded for this disclosure requirement.",
    };
  }
  const entry = legend(REPORTED_STATUS, status);
  return { tone: entry.tone, label: entry.label, meaning: entry.meaning };
}

function groupByStandard(rows: ExposureRecord[]): Array<[string, ExposureRecord[]]> {
  const groups = new Map<string, ExposureRecord[]>();
  for (const row of rows) {
    const list = groups.get(row.standard) ?? [];
    list.push(row);
    groups.set(row.standard, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.dr_id.localeCompare(b.dr_id, undefined, { numeric: true }));
  }
  const known = STANDARD_ORDER.filter((s) => groups.has(s)).map(
    (s) => [s, groups.get(s)!] as [string, ExposureRecord[]],
  );
  const rest = Array.from(groups.entries()).filter(([s]) => !STANDARD_ORDER.includes(s));
  return [...known, ...rest];
}

// ── Heat grid tile ────────────────────────────────────────────────────────────

function HeatTile({
  row,
  selected,
  onSelect,
}: {
  row: ExposureRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = statusMeta(row.reported_status);
  const label = row.dr_id.split("-").slice(1).join("-") || row.dr_id;
  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${row.dr_id} — ${meta.label}\n${row.dr_title}`}
      className={`flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-md border text-[10px] font-mono transition-all ${TONE_CLASS[meta.tone]} ${
        selected ? "ring-2 ring-[#e9eef7]/70 ring-offset-1 ring-offset-[#0d1424]" : "hover:brightness-125"
      } ${!row.reported_status ? "border-dashed" : ""}`}
    >
      <span className="leading-none">{label}</span>
    </button>
  );
}

// ── Proportional coverage bar ─────────────────────────────────────────────────

function CoverageBar({ rows }: { rows: ExposureRecord[] }) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const key of STATUS_BAR_ORDER) map.set(key, 0);
    for (const row of rows) {
      const key = row.reported_status;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return STATUS_BAR_ORDER.map((key) => ({ key, meta: statusMeta(key), count: map.get(key) ?? 0 })).filter(
      (seg) => seg.count > 0,
    );
  }, [rows]);
  const total = rows.length || 1;

  return (
    <div>
      <div className="flex h-5 w-full overflow-hidden rounded-md border border-[#1c2740]">
        {counts.map((seg) => (
          <div
            key={seg.key || "blank"}
            title={`${seg.meta.label}: ${seg.count} (${Math.round((seg.count / total) * 100)}%)`}
            className={`${TONE_CLASS[seg.meta.tone]} flex items-center justify-center border-0 border-r border-[#0d1424] last:border-r-0`}
            style={{ width: `${(seg.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-[#8b96ad]">
        {counts.map((seg) => (
          <span key={seg.key || "blank"} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-sm ${TONE_CLASS[seg.meta.tone]}`} />
            {seg.meta.label} <span className="font-mono text-[#5c6780]">{seg.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Evidence panel for the selected DR ────────────────────────────────────────

function EvidencePanel({ row }: { row: ExposureRecord | undefined }) {
  if (!row) {
    return (
      <div className={`${PANEL} p-6 text-center text-[12px] text-[#5c6780]`}>
        Select a tile in the grid above to view its evidence, section refs, and agreement reads.
      </div>
    );
  }

  return (
    <div className={`${PANEL} p-4`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StandardChip standard={row.standard} />
        <span className="font-mono text-[12.5px] text-[#e9eef7]">{row.dr_id}</span>
        <span className="text-[12px] text-[#8b96ad]">{row.dr_title}</span>
        <span className="ml-auto">
          <StatusChip dict={REPORTED_STATUS} token={row.reported_status || null} />
        </span>
        <span className="font-mono text-[10.5px] text-[#5c6780]">
          confidence {row.confidence.toFixed(2)}
        </span>
      </div>

      {!row.reported_status && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#d9a95c]/30 bg-[#2a2013]/50 p-2.5">
          <IconAlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-[#d9a95c]" />
          <p className="text-[11px] leading-relaxed text-[#c4a76c]">
            This row has a blank reported_status — treat it as unclear until reviewed at the
            human gate.
          </p>
        </div>
      )}

      {/* 2-cell agreement strip: blind vs RM1.1, index vs deterministic candidates */}
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className={`${CARD} flex items-center justify-between gap-2 p-2.5`}>
          <span className="text-[10.5px] uppercase tracking-wide text-[#5c6780]">vs RM1.1 blind reading</span>
          <StatusChip dict={AGREEMENT} token={row.blind_agreement} />
        </div>
        <div className={`${CARD} flex items-center justify-between gap-2 p-2.5`}>
          <span className="text-[10.5px] uppercase tracking-wide text-[#5c6780]">vs deterministic index</span>
          <StatusChip dict={AGREEMENT} token={row.index_agreement} />
        </div>
      </div>

      {row.report_section_refs.length > 0 && (
        <div className="mb-3">
          <div className="mb-1.5 text-[10.5px] uppercase tracking-wide text-[#5c6780]">Report section refs</div>
          <div className="flex flex-wrap gap-1.5">
            {row.report_section_refs.map((ref) => (
              <span
                key={ref}
                className="rounded border border-[#2a3a5c] bg-[#111a2e] px-1.5 py-0.5 font-mono text-[10.5px] text-[#8b96ad]"
              >
                § {ref}
              </span>
            ))}
          </div>
        </div>
      )}

      {row.evidence_quotes.length > 0 && (
        <div className="mb-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide text-[#5c6780]">
            <IconQuote size={12} />
            Evidence quotes
          </div>
          <div className="space-y-1.5">
            {row.evidence_quotes.map((quote, index) => (
              <blockquote
                key={index}
                className="border-l-2 border-[#2a3a5c] bg-[#111a2e] py-1.5 pl-3 pr-2 text-[11.5px] italic leading-relaxed text-[#aeb8cb]"
              >
                "{quote}"
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {row.materiality_note && (
        <div className="mb-3">
          <div className="mb-1 text-[10.5px] uppercase tracking-wide text-[#5c6780]">Materiality note</div>
          <p className="text-[11.5px] leading-relaxed text-[#c4cddd]">{highlightDrRefs(row.materiality_note)}</p>
        </div>
      )}

      {row.omission_note && (
        <div className="mb-3">
          <div className="mb-1 text-[10.5px] uppercase tracking-wide text-[#5c6780]">Omission note</div>
          <p className="text-[11.5px] leading-relaxed text-[#c4cddd]">{highlightDrRefs(row.omission_note)}</p>
        </div>
      )}

      {row.divergence_note && (
        <div className="flex items-start gap-2 rounded-lg border border-[#5b8def]/25 bg-[#101a2e] p-2.5">
          <IconGitCompare size={14} className="mt-0.5 flex-shrink-0 text-[#5b8def]" />
          <p className="text-[11px] leading-relaxed text-[#8b96ad]">{highlightDrRefs(row.divergence_note)}</p>
        </div>
      )}
    </div>
  );
}

export default function RM12Page() {
  const { envelope } = useAgentEnvelope("rm1_2");
  const stageState = useAgentStageState("rm1.2");
  const p = envelope?.payload as RM12Payload | undefined;
  const isComputing = stageState === "running" || stageState === "pending";
  const [selectedDrId, setSelectedDrId] = useState<string | null>(null);

  const grouped = useMemo(() => groupByStandard(p?.rows ?? []), [p]);
  const selectedRow = useMemo(
    () => p?.rows.find((r) => r.dr_id === selectedDrId),
    [p, selectedDrId],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1400px] flex-1 p-6">
        <div className="mb-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">RM1.2</span>{" "}
            <span className="text-[#e9eef7]">— Siemens exposure mapping</span>
          </h1>
          {envelope?.registry_id && (
            <span className="font-mono text-xs text-[#5c6780]">{envelope.registry_id}</span>
          )}
        </div>
        <p className="mb-3 max-w-[92ch] text-sm text-[#8b96ad]">
          Decides how Siemens's FY2025 Sustainability Statement addressed each 2025
          disclosure requirement, weighing RM1.1's blind reading against the deterministic
          section-index candidates.
        </p>

        <div className={`${PANEL} mb-5 flex items-start gap-2.5 border-[#5b8def]/25 bg-[#101a2e] p-3`}>
          <IconInfoCircle size={15} className="mt-0.5 flex-shrink-0 text-[#5b8def]" />
          <p className="text-[11.5px] leading-relaxed text-[#8b96ad]">
            Low index agreement is expected here — Siemens's report was not written against
            RD2's title-matching heuristics.
          </p>
        </div>

        {isComputing ? (
          <StageLoading agentLabel="RM1.2" agentName="Siemens Exposure Mapping" />
        ) : (
          <>
            <ArtifactBar envelope={envelope} agent="RM1.2" />

            {p && (
              <>
                {/* Reporting-status heat grid */}
                <div className={`${PANEL} mb-4 p-4`}>
                  <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#5c6780]">
                    <IconChartBar size={14} />
                    Reporting-status heat grid — {p.rows.length} disclosure requirements
                  </div>
                  <div className="space-y-3">
                    {grouped.map(([standard, rows]) => (
                      <div key={standard} className="flex items-start gap-3">
                        <div className="w-9 flex-shrink-0 pt-1.5">
                          <StandardChip standard={standard} />
                        </div>
                        <div className="flex flex-1 flex-wrap gap-1.5">
                          {rows.map((row) => (
                            <HeatTile
                              key={row.dr_id}
                              row={row}
                              selected={row.dr_id === selectedDrId}
                              onSelect={() =>
                                setSelectedDrId((current) => (current === row.dr_id ? null : row.dr_id))
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    {grouped.length === 0 && (
                      <div className="py-6 text-center text-[12px] text-[#5c6780]">No rows.</div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-[#1c2740] pt-3">
                    <CoverageBar rows={p.rows} />
                  </div>
                </div>

                <EvidencePanel row={selectedRow} />

                <LegendStrip dict={REPORTED_STATUS} title="RM1.2 — what each status means" />
                <RawPayloadFooter payload={p} filename="rm1_2-payload.json" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
