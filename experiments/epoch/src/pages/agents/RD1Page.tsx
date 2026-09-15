/**
 * RD1Page — "Corpus extraction" detail screen.
 *
 * RD1 is deterministic (no LLM call, no shelf envelope): it parses the
 * authoritative 2025/2026 ESRS DR text and Siemens's report sections into a
 * CorpusBundle, and writes a plain summary file into the run directory
 * (regulation_cli.py's build_document_pipeline) rather than a shelf. This
 * page reads that file from the exported use-case corpus snapshot, not through
 * useAgentEnvelope. RawPayloadFooter is shared; everything else is
 * RD1-specific.
 *
 * BODY: the corpus ledger (per-standard old-vs-new DR bars with deltas) plus a
 * totals sentence that ties the RD1 counts to RD3's actual join numbers for
 * the run being viewed, read via useAgentEnvelope("rd3") rather than hardcoded.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchCorpus } from "../../api/client";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import { useRun } from "../../context/RunContext";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { StandardChip } from "../../components/uc4/tokens";
import type { RD1StandardSummary } from "../../api/types";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";

const STANDARD_ORDER = ["E1", "E2", "E3", "E4", "E5"];

function StandardBlock({
  standard,
  summary,
  maxCount,
  maxHints,
}: {
  standard: string;
  summary: RD1StandardSummary;
  maxCount: number;
  maxHints: number;
}) {
  const delta = summary.n_new_drs - summary.n_old_drs;
  const deltaLabel = delta === 0 ? "±0" : delta > 0 ? `+${delta}` : `${delta}`;
  const deltaColor =
    delta > 0 ? "#2dd4bf" : delta < 0 ? "#d97a6c" : "#5c6780";
  const oldPct = maxCount ? (summary.n_old_drs / maxCount) * 100 : 0;
  const newPct = maxCount ? (summary.n_new_drs / maxCount) * 100 : 0;
  const hintsPct = maxHints ? (summary.n_hints / maxHints) * 100 : 0;

  return (
    <div className={`${PANEL} p-4`}>
      <div className="mb-3 flex items-center gap-2">
        <StandardChip standard={standard} />
        <span
          className="ml-auto rounded-full border px-2 py-0.5 font-mono text-[11px]"
          style={{
            color: deltaColor,
            borderColor: `${deltaColor}66`,
            background: `${deltaColor}1a`,
          }}
        >
          {deltaLabel} DR{Math.abs(delta) === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-[46px] shrink-0 text-[10.5px] uppercase tracking-wide text-[#5c6780]">
            2025
          </span>
          <div className="h-[14px] flex-1 overflow-hidden rounded bg-[#111a2e]">
            <div
              className="h-full rounded bg-[#5b8def]"
              style={{ width: `${oldPct}%` }}
            />
          </div>
          <span className="w-[26px] shrink-0 text-right font-mono text-[11px] text-[#e9eef7]">
            {summary.n_old_drs}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-[46px] shrink-0 text-[10.5px] uppercase tracking-wide text-[#5c6780]">
            2026
          </span>
          <div className="h-[14px] flex-1 overflow-hidden rounded bg-[#111a2e]">
            <div
              className="h-full rounded bg-[#2dd4bf]"
              style={{ width: `${newPct}%` }}
            />
          </div>
          <span className="w-[26px] shrink-0 text-right font-mono text-[11px] text-[#e9eef7]">
            {summary.n_new_drs}
          </span>
        </div>
      </div>

      <div className="mt-3 border-t border-[#1c2740] pt-2.5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10.5px] uppercase tracking-wide text-[#5c6780]">
            Amendment hints
          </span>
          <span className="font-mono text-[10.5px] text-[#8b96ad]">
            {summary.n_hints}
          </span>
        </div>
        <div className="h-[6px] w-full overflow-hidden rounded-full bg-[#111a2e]">
          <div
            className="h-full rounded-full bg-[#9b8cf2]"
            style={{ width: `${hintsPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function RD1Page() {
  const { selectedUsecase } = useRun();
  const { data: corpus, isLoading } = useQuery({
    queryKey: ["corpus", selectedUsecase],
    queryFn: () => fetchCorpus(selectedUsecase!),
    enabled: !!selectedUsecase,
  });
  const { envelope: rd3Envelope } = useAgentEnvelope("rd3");
  const rd3Summary = rd3Envelope?.payload?.summary as
    | { n_rows?: number; n_orphan_2026?: number; n_orphan_2025?: number }
    | undefined;

  const standards = corpus
    ? [
        ...STANDARD_ORDER.filter((s) => corpus.rd1[s]),
        ...Object.keys(corpus.rd1)
          .filter((s) => !STANDARD_ORDER.includes(s))
          .sort(),
      ]
    : [];
  const totals = standards.reduce(
    (acc, s) => {
      const summary = corpus!.rd1[s];
      acc.old += summary.n_old_drs;
      acc.new += summary.n_new_drs;
      acc.hints += summary.n_hints;
      return acc;
    },
    { old: 0, new: 0, hints: 0 },
  );
  const maxCount = standards.reduce(
    (m, s) => Math.max(m, corpus!.rd1[s].n_old_drs, corpus!.rd1[s].n_new_drs),
    1,
  );
  const maxHints = standards.reduce(
    (m, s) => Math.max(m, corpus!.rd1[s].n_hints),
    1,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1400px] flex-1 p-6">
        <div className="mb-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">RD1</span>{" "}
            <span className="text-[#e9eef7]">— Corpus extraction</span>
          </h1>
          {corpus?.run_dir && (
            <span className="font-mono text-xs text-[#5c6780]" title="Not shelf-backed — read from the newest run directory">
              {corpus.run_dir}
            </span>
          )}
        </div>
        <p className="mb-5 max-w-[92ch] text-sm text-[#8b96ad]">
          Deterministically parses the authoritative 2025-amended and 2026-revised ESRS
          disclosure requirements plus Siemens's report sections into the corpus every
          downstream stage reads from.
        </p>

        {isLoading ? (
          <div className={`${PANEL} p-5 text-sm text-[#5c6780]`}>Loading corpus…</div>
        ) : corpus ? (
          <>
            <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
              {standards.map((s) => (
                <StandardBlock
                  key={s}
                  standard={s}
                  summary={corpus.rd1[s]}
                  maxCount={maxCount}
                  maxHints={maxHints}
                />
              ))}
            </div>

            <div className={`${PANEL} mt-3.5 p-5`}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-mono text-[22px] text-[#e9eef7]">
                  {totals.old}
                </span>
                <span className="text-[12.5px] text-[#8b96ad]">old DRs →</span>
                <span className="font-mono text-[22px] text-[#e9eef7]">
                  {totals.new}
                </span>
                <span className="text-[12.5px] text-[#8b96ad]">new DRs,</span>
                <span className="font-mono text-[22px] text-[#9b8cf2]">
                  {totals.hints}
                </span>
                <span className="text-[12.5px] text-[#8b96ad]">amendment hints.</span>
              </div>
              {rd3Summary && (
                <p className="mt-2.5 text-[11.5px] leading-relaxed text-[#5c6780]">
                  Every count here is auditable downstream: RM1.1 produces exactly{" "}
                  <span className="font-mono text-[#8b96ad]">{totals.old}</span> rows, one
                  per old DR, and RD3's outer join fans those{" "}
                  <span className="font-mono text-[#8b96ad]">{totals.old}</span> matched
                  origins out to{" "}
                  <span className="font-mono text-[#8b96ad]">{rd3Summary.n_rows ?? "—"}</span>{" "}
                  total rows in the current run (
                  {(rd3Summary.n_rows ?? 0) - (rd3Summary.n_orphan_2026 ?? 0)} matched +{" "}
                  {rd3Summary.n_orphan_2026 ?? 0} new-in-2026 orphans with no 2025
                  counterpart{rd3Summary.n_orphan_2025 ? `, ${rd3Summary.n_orphan_2025} old orphans with no 2026 counterpart` : ""}).
                </p>
              )}
            </div>

            <RawPayloadFooter payload={corpus.rd1} filename="rd1-corpus-summary.json" />
          </>
        ) : (
          <div className={`${PANEL} p-5 text-sm text-[#5c6780]`}>
            No corpus artifact yet — run the document pipeline to generate it.
          </div>
        )}
      </div>
    </div>
  );
}
