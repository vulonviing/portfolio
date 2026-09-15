/**
 * RC12Page — "Change classification" detail screen.
 *
 * RC1.2 is the informed half of the RC1 blind-pass pair: it receives RC1.1's
 * blind rows AND RD2's deterministic candidates side by side, plus the
 * authoritative text, and makes the binding change_status call. Neither
 * proposal is ground truth. ArtifactBar/RawPayloadFooter/LegendStrip are
 * shared; everything else here is RC1.2-specific.
 *
 * BODY: the three-witness agreement strip — each row carries a compact
 * own-reading / blind_agreement (vs RC1.1) / deterministic_agreement (vs RD2)
 * stripe, the binding change_status chip, and (only on divergent rows) the
 * divergence_note explaining why RC1.2 didn't just take the majority read.
 * Rows sort most-divergent first. Click a row to expand old/new titles,
 * paragraph refs, and citations.
 */
import { useMemo, useState } from "react";
import { IconChevronDown, IconInfoCircle } from "@tabler/icons-react";
import ArtifactBar from "../../components/ArtifactBar";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import StageLoading from "../../components/StageLoading";
import { LegendStrip, StandardChip, StatusChip, highlightDrRefs } from "../../components/uc4/tokens";
import { CHANGE_STATUS } from "../../lib/uc4Legend";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { useAgentStageState } from "../../lib/useAgentStageState";

interface ChangeClassification {
  standard: string;
  old_dr_ids: string[];
  old_dr_titles: string[];
  new_dr_ids: string[];
  new_dr_titles: string[];
  change_status: string;
  change_description: string;
  old_paragraph_refs: string[];
  new_paragraph_refs: string[];
  mapping_uncertain: boolean;
  citations: string[];
  confidence: number;
  blind_agreement: "agree" | "partial" | "disagree";
  deterministic_agreement: "agree" | "partial" | "disagree" | "no_candidate";
  divergence_note: string;
}

interface RC12Payload {
  registry_id: string;
  rows: ChangeClassification[];
}

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

const ACCENT = "#2dd4bf";
const WARN = "#d9a95c";
const DANGER = "#d97a6c";
const MUTED = "#5c6780";

// ── Agreement -> visual tone ──────────────────────────────────────────────────

type CellTone = "own" | "agree" | "partial" | "disagree" | "no_candidate";

const CELL_STYLE: Record<CellTone, { fg: string; bg: string; border: string; glyph: string }> = {
  own: { fg: ACCENT, bg: "#0f2e2c", border: `${ACCENT}80`, glyph: "●" },
  agree: { fg: ACCENT, bg: "#0f2e2c", border: `${ACCENT}66`, glyph: "✓" },
  partial: { fg: WARN, bg: "#2a2013", border: `${WARN}66`, glyph: "~" },
  disagree: { fg: DANGER, bg: "#2a1613", border: `${DANGER}66`, glyph: "✕" },
  no_candidate: { fg: MUTED, bg: "#111a2e", border: "#2a3a5c", glyph: "–" },
};

function Cell({ tone, title }: { tone: CellTone; title: string }) {
  const s = CELL_STYLE[tone];
  return (
    <span
      title={title}
      className="inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border text-[10px] leading-none"
      style={{ color: s.fg, background: s.bg, borderColor: s.border }}
    >
      {s.glyph}
    </span>
  );
}

function AgreementStripe({ row }: { row: ChangeClassification }) {
  return (
    <div className="flex items-center gap-1">
      <Cell tone="own" title="RC1.2's own final reading (the binding call)" />
      <span className="h-px w-2 flex-shrink-0" style={{ background: "#2a3a5c" }} />
      <Cell
        tone={row.blind_agreement}
        title={`vs RC1.1 (blind pass): ${row.blind_agreement}`}
      />
      <span className="h-px w-2 flex-shrink-0" style={{ background: "#2a3a5c" }} />
      <Cell
        tone={row.deterministic_agreement}
        title={`vs RD2 (deterministic candidate): ${row.deterministic_agreement}`}
      />
    </div>
  );
}

// ── Sort: most-divergent first ────────────────────────────────────────────────

function divergenceRank(tone: string): number {
  if (tone === "disagree") return 3;
  if (tone === "partial") return 2;
  if (tone === "no_candidate") return 1;
  return 0; // agree
}

function rowRank(row: ChangeClassification): number {
  return Math.max(divergenceRank(row.blind_agreement), divergenceRank(row.deterministic_agreement));
}

function isDivergent(row: ChangeClassification): boolean {
  return row.blind_agreement !== "agree" || row.deterministic_agreement !== "agree";
}

function rowKey(row: ChangeClassification, i: number): string {
  return `${row.standard}:${row.old_dr_ids.join("+")}:${row.new_dr_ids.join("+")}:${i}`;
}

// ── Summary strip ──────────────────────────────────────────────────────────

function SummaryStrip({ rows }: { rows: ChangeClassification[] }) {
  const total = rows.length;
  const detAgree = rows.filter((r) => r.deterministic_agreement === "agree").length;
  const blindAgree = rows.filter((r) => r.blind_agreement === "agree").length;
  const preferredOwn = rows.filter(isDivergent).length;
  const uncertain = rows.filter((r) => r.mapping_uncertain).length;

  return (
    <div className={`${PANEL} mb-4 flex flex-wrap items-center gap-x-8 gap-y-3 p-4`}>
      <Stat value={`${detAgree}/${total}`} label="agreement with deterministic candidates (RD2)" tone={ACCENT} />
      <Stat value={`${blindAgree}/${total}`} label="agreement with the blind pass (RC1.1)" tone={ACCENT} />
      <Stat
        value={String(preferredOwn)}
        label="row(s) where RC1.2 preferred its own reading over at least one proposal"
        tone={preferredOwn > 0 ? WARN : MUTED}
      />
      <span
        className="ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
        style={{
          borderColor: uncertain > 0 ? `${WARN}66` : `${ACCENT}66`,
          background: uncertain > 0 ? "#2a2013" : "#0f2e2c",
          color: uncertain > 0 ? WARN : ACCENT,
        }}
      >
        {uncertain} uncertain mapping{uncertain === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[17px] font-medium" style={{ color: tone }}>
        {value}
      </span>
      <span className="max-w-[22ch] text-[10.5px] leading-tight text-[#5c6780]">{label}</span>
    </div>
  );
}

// ── Row detail (expanded) ─────────────────────────────────────────────────

function RowDetail({ row }: { row: ChangeClassification }) {
  return (
    <div className="space-y-3 border-t border-[#1c2740] bg-[#0d1424] p-4 text-[11.5px]">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[10.5px] uppercase tracking-wide text-[#5c6780]">
            2025 disclosure requirement{row.old_dr_ids.length === 1 ? "" : "s"}
          </div>
          {row.old_dr_ids.length === 0 ? (
            <div className="text-[#5c6780]">— none (new in 2026)</div>
          ) : (
            <ul className="space-y-1">
              {row.old_dr_ids.map((id, i) => (
                <li key={id} className="flex items-baseline gap-2">
                  <span className="font-mono text-[#e9eef7]">{id}</span>
                  <span className="text-[#8b96ad]">{row.old_dr_titles[i] ?? ""}</span>
                </li>
              ))}
            </ul>
          )}
          {row.old_paragraph_refs.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {row.old_paragraph_refs.map((ref) => (
                <span
                  key={ref}
                  className="rounded border border-[#2a3a5c] bg-[#111a2e] px-1.5 py-0.5 font-mono text-[10px] text-[#8b96ad]"
                >
                  {ref}
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="mb-1 text-[10.5px] uppercase tracking-wide text-[#5c6780]">
            2026 disclosure requirement{row.new_dr_ids.length === 1 ? "" : "s"}
          </div>
          {row.new_dr_ids.length === 0 ? (
            <div className="text-[#5c6780]">— none (removed in 2026)</div>
          ) : (
            <ul className="space-y-1">
              {row.new_dr_ids.map((id, i) => (
                <li key={id} className="flex items-baseline gap-2">
                  <span className="font-mono text-[#e9eef7]">{id}</span>
                  <span className="text-[#8b96ad]">{row.new_dr_titles[i] ?? ""}</span>
                </li>
              ))}
            </ul>
          )}
          {row.new_paragraph_refs.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {row.new_paragraph_refs.map((ref) => (
                <span
                  key={ref}
                  className="rounded border border-[#2a3a5c] bg-[#111a2e] px-1.5 py-0.5 font-mono text-[10px] text-[#8b96ad]"
                >
                  {ref}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1 text-[10.5px] uppercase tracking-wide text-[#5c6780]">Change description</div>
        <p className="leading-relaxed text-[#c3cbdb]">{highlightDrRefs(row.change_description)}</p>
      </div>

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
    </div>
  );
}

// ── Row ────────────────────────────────────────────────────────────────────

function Row({
  row,
  expanded,
  onToggle,
}: {
  row: ChangeClassification;
  expanded: boolean;
  onToggle: () => void;
}) {
  const showDivergence = isDivergent(row) && row.divergence_note;
  return (
    <div className={`${CARD} overflow-hidden`}>
      <button
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-3 p-3 text-left hover:bg-[#141f38]"
      >
        <StandardChip standard={row.standard} />

        <div className="min-w-[9rem] font-mono text-[11.5px] text-[#e9eef7]">
          {row.old_dr_ids.length > 0 ? row.old_dr_ids.join(", ") : <span className="text-[#5c6780]">—</span>}
          <span className="mx-1 text-[#5c6780]">→</span>
          {row.new_dr_ids.length > 0 ? row.new_dr_ids.join(", ") : <span className="text-[#5c6780]">—</span>}
        </div>

        <AgreementStripe row={row} />

        <StatusChip dict={CHANGE_STATUS} token={row.change_status} />

        {showDivergence && (
          <span className="max-w-[38ch] flex-1 truncate text-[11px] text-[#8b96ad]" title={row.divergence_note}>
            {row.divergence_note}
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

export default function RC12Page() {
  const { envelope } = useAgentEnvelope("rc1_2");
  const stageState = useAgentStageState("rc1.2");
  const p = envelope?.payload as RC12Payload | undefined;
  const isComputing = stageState === "running" || stageState === "pending";
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const sortedRows = useMemo(() => {
    const rows = p?.rows ?? [];
    return rows
      .map((row, i) => ({ row, key: rowKey(row, i) }))
      .sort((a, b) => rowRank(b.row) - rowRank(a.row));
  }, [p]);

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1400px] flex-1 p-6">
        <div className="mb-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">RC1.2</span>{" "}
            <span className="text-[#e9eef7]">— Change classification</span>
          </h1>
          {envelope?.registry_id && (
            <span className="font-mono text-xs text-[#5c6780]">{envelope.registry_id}</span>
          )}
        </div>
        <p className="mb-5 max-w-[92ch] text-sm text-[#8b96ad]">
          Decides each disclosure requirement's final 2025→2026 change status, weighing its
          own reading against RC1.1's blind matches and RD2's deterministic candidates.
        </p>

        {isComputing ? (
          <StageLoading agentLabel="RC1.2" agentName="Change Classification" />
        ) : (
          <>
            <ArtifactBar envelope={envelope} agent="RC1.2" />

            {p && (
              <>
                <div className={`${PANEL} mb-4 flex items-start gap-2.5 p-3.5`}>
                  <IconInfoCircle size={15} className="mt-0.5 flex-shrink-0 text-[#5c6780]" />
                  <p className="text-[12px] leading-relaxed text-[#8b96ad]">
                    Every row went through up to three independent readings — RC1.2's own,
                    RC1.1's blind pass, and RD2's deterministic candidate — before this stage
                    made the binding call. The stripe below shows how those readings lined up;
                    rows where RC1.2 overruled at least one of them sort to the top.
                  </p>
                </div>

                <SummaryStrip rows={p.rows} />

                <div className="mb-2 flex items-center gap-4 px-1 text-[10.5px] text-[#5c6780]">
                  <span className="flex items-center gap-1.5">
                    <Cell tone="own" title="" /> own reading
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Cell tone="agree" title="" /> agree
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Cell tone="partial" title="" /> partial
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Cell tone="disagree" title="" /> disagree
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Cell tone="no_candidate" title="" /> no candidate to compare
                  </span>
                  <span className="ml-auto">sorted most-divergent first</span>
                </div>

                <div className="space-y-2">
                  {sortedRows.map(({ row, key }) => (
                    <Row
                      key={key}
                      row={row}
                      expanded={expandedKey === key}
                      onToggle={() => setExpandedKey((cur) => (cur === key ? null : key))}
                    />
                  ))}
                  {sortedRows.length === 0 && (
                    <div className={`${CARD} p-4 text-center text-[12px] text-[#5c6780]`}>No rows.</div>
                  )}
                </div>

                <LegendStrip dict={CHANGE_STATUS} title="RC1.2 — what each status means" />
                <RawPayloadFooter payload={p} filename="rc1_2-payload.json" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
