/**
 * RD2Page — "Candidate mapping" detail screen.
 *
 * RD2 is deterministic (no LLM call, no shelf envelope): it scores candidate
 * old<->new DR mappings by title/text similarity. The full run artifact is
 * ~3.8 MB (each candidate embeds its full-text amendment hints); the backend
 * slims that to (basis, score, n_hints, a token histogram, a 3-item preview)
 * before serving it — see load_document_corpus_artifacts. This page is a
 * non-binding proposal for RC1.2/RM1.2 only; RC1.1/RM1.1 never see it (see
 * AGENTS.md "Blind-pass agent pairs"). RawPayloadFooter is shared;
 * everything else is RD2-specific.
 *
 * BODY placeholder: Wave 1 replaces this with the candidate score ledger
 * (a bipartite connector board, cloned from da1/DA1MappingBoard.tsx).
 */
import { useLayoutEffect, useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconChevronDown, IconInfoCircle } from "@tabler/icons-react";
import { fetchCorpus } from "../../api/client";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import { useRun } from "../../context/RunContext";
import { StandardChip } from "../../components/uc4/tokens";
import { toOverlayRect, rightMid, leftMid, cubicPath } from "../../components/da1/connectorLines";
import type { RD2Candidate } from "../../api/types";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const STANDARD_ORDER = ["E1", "E2", "E3", "E4", "E5"];

// ── Hint token color vocabulary ────────────────────────────────────────────

const HINT_TOKEN_COLOR: Record<string, string> = {
  AMENDED: "#2dd4bf",
  MOVED: "#5b8def",
  DELETED: "#ef5f67",
  NEW: "#9b8cf2",
  UNCHANGED: "#5c6780",
  MERGED: "#d9a95c",
};
const HINT_TOKEN_ORDER = ["AMENDED", "MOVED", "DELETED", "NEW", "UNCHANGED", "MERGED"];
const hintColor = (token: string) => HINT_TOKEN_COLOR[token] ?? "#8b96ad";

function isWeakBasis(candidate: RD2Candidate, confidenceFloor: number): boolean {
  return candidate.score < confidenceFloor || !/title match/i.test(candidate.basis);
}

// ── Bipartite connector board ──────────────────────────────────────────────

interface Ribbon {
  key: string;
  path: string;
  score: number;
  weak: boolean;
}

function CandidateBoard({
  candidates,
  confidenceFloor,
}: {
  candidates: Array<RD2Candidate & { key: string }>;
  confidenceFloor: number;
}) {
  const oldIds = Array.from(new Set(candidates.flatMap((c) => c.old_dr_ids)));
  const newIds = Array.from(new Set(candidates.flatMap((c) => c.new_dr_ids)));

  const overlayRef = useRef<HTMLDivElement>(null);
  const oldRefs = useRef<Record<string, HTMLElement | null>>({});
  const newRefs = useRef<Record<string, HTMLElement | null>>({});
  const [ribbons, setRibbons] = useState<Ribbon[]>([]);

  const recompute = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const next: Ribbon[] = [];
    for (const c of candidates) {
      for (const oldId of c.old_dr_ids) {
        const oldEl = oldRefs.current[oldId];
        if (!oldEl) continue;
        for (const newId of c.new_dr_ids) {
          const newEl = newRefs.current[newId];
          if (!newEl) continue;
          const oldR = toOverlayRect(oldEl, overlay);
          const newR = toOverlayRect(newEl, overlay);
          next.push({
            key: `${c.key}:${oldId}:${newId}`,
            path: cubicPath(rightMid(oldR), leftMid(newR)),
            score: c.score,
            weak: isWeakBasis(c, confidenceFloor),
          });
        }
      }
    }
    setRibbons(next);
  }, [candidates, confidenceFloor]);

  useLayoutEffect(() => {
    recompute();
  }, [recompute]);

  useEffect(() => {
    const ro = new ResizeObserver(recompute);
    if (overlayRef.current) ro.observe(overlayRef.current);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [recompute]);

  return (
    <div className="flex gap-0" style={{ minHeight: "10rem" }}>
      <div className="w-40 flex-shrink-0 space-y-1.5 pr-2">
        <div className="mb-1 text-[10px] uppercase tracking-widest text-[#5c6780]">2025 DRs</div>
        {oldIds.map((id) => (
          <div
            key={id}
            ref={(el) => { oldRefs.current[id] = el; }}
            className="rounded-md border border-[#1c2740] bg-[#111a2e] px-2.5 py-1.5 font-mono text-[11px] text-[#e9eef7]"
          >
            {id}
          </div>
        ))}
      </div>

      <div ref={overlayRef} className="relative flex-1" style={{ minWidth: "6rem" }}>
        <svg className="pointer-events-none absolute inset-0 overflow-visible" width="100%" height="100%">
          {ribbons.map((r) => (
            <path
              key={r.key}
              d={r.path}
              fill="none"
              stroke="#2dd4bf"
              strokeWidth={0.75 + r.score * 3}
              strokeOpacity={0.2 + r.score * 0.6}
              strokeDasharray={r.weak ? "4 4" : undefined}
            />
          ))}
        </svg>
      </div>

      <div className="w-40 flex-shrink-0 space-y-1.5 pl-2">
        <div className="mb-1 text-[10px] uppercase tracking-widest text-[#5c6780]">2026 DRs</div>
        {newIds.map((id) => (
          <div
            key={id}
            ref={(el) => { newRefs.current[id] = el; }}
            className="rounded-md border border-[#1c2740] bg-[#111a2e] px-2.5 py-1.5 font-mono text-[11px] text-[#e9eef7]"
          >
            {id}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hint token strip ────────────────────────────────────────────────────────

function HintStrip({ counts, total }: { counts: Record<string, number>; total: number }) {
  if (total === 0) {
    return <span className="text-[10.5px] text-[#5c6780]">no hints</span>;
  }
  const tokens = [
    ...HINT_TOKEN_ORDER.filter((t) => counts[t]),
    ...Object.keys(counts).filter((t) => !HINT_TOKEN_ORDER.includes(t) && counts[t]),
  ];
  return (
    <div className="flex h-[10px] w-full overflow-hidden rounded-full bg-[#111a2e]">
      {tokens.map((t) => (
        <div
          key={t}
          title={`${t}: ${counts[t]}`}
          style={{ width: `${(counts[t] / total) * 100}%`, background: hintColor(t) }}
        />
      ))}
    </div>
  );
}

// ── Candidate row ────────────────────────────────────────────────────────────

function CandidateRow({
  candidate,
  expanded,
  onToggle,
  confidenceFloor,
  nextBestBand,
}: {
  candidate: RD2Candidate;
  expanded: boolean;
  onToggle: () => void;
  confidenceFloor: number;
  nextBestBand: number;
}) {
  const weak = isWeakBasis(candidate, confidenceFloor);
  const totalHints = Object.values(candidate.hint_token_counts).reduce((a, b) => a + b, 0);
  const barColor = weak ? "#d9a95c" : "#2dd4bf";

  return (
    <div className={`rounded-lg border ${weak ? "border-[#d9a95c]/30" : "border-[#1c2740]"} bg-[#111a2e]`}>
      <button
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-3 p-3 text-left"
      >
        <span className="font-mono text-[11px] text-[#e9eef7]">
          {candidate.old_dr_ids.join(", ")}
        </span>
        <span className="text-[#5c6780]">→</span>
        <span className="font-mono text-[11px] text-[#e9eef7]">
          {candidate.new_dr_ids.join(", ")}
        </span>
        {weak && (
          <span className="rounded-full border border-[#d9a95c]/40 bg-[#2a2013] px-1.5 py-0.5 text-[10px] text-[#d9a95c]">
            weak basis
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[11px] text-[#8b96ad]">{candidate.n_hints} hints</span>
          <IconChevronDown
            size={13}
            className={`text-[#5c6780] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <div className="relative px-3 pb-3">
        <div className="relative h-[10px] w-full overflow-hidden rounded-full bg-[#0d1424]">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round(candidate.score * 100)}%`, background: barColor }}
          />
          {/* Confidence floor marker */}
          <div
            className="absolute top-0 h-full w-px bg-[#e9eef7]/50"
            style={{ left: `${confidenceFloor * 100}%` }}
            title={`Confidence floor: ${confidenceFloor}`}
          />
          {/* Next-best lead band */}
          <div
            className="absolute top-0 h-full bg-[#e9eef7]/10"
            style={{
              left: `${confidenceFloor * 100}%`,
              width: `${nextBestBand * 100}%`,
            }}
            title="Next-best-lead band"
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-[#5c6780]">
          <span>0.00</span>
          <span className="font-mono text-[#e9eef7]">{candidate.score.toFixed(2)}</span>
          <span>1.00</span>
        </div>

        <div className="mt-2">
          <HintStrip counts={candidate.hint_token_counts} total={totalHints} />
        </div>

        {expanded && (
          <div className="mt-3 space-y-2 border-t border-[#1c2740] pt-3">
            <p className="text-[11px] text-[#5c6780]">
              Basis: <span className="text-[#8b96ad]">{candidate.basis}</span>
            </p>
            {candidate.hint_preview.length === 0 ? (
              <p className="text-[11px] text-[#5c6780]">No hint preview available.</p>
            ) : (
              candidate.hint_preview.map((h, i) => (
                <div key={i} className="rounded-md border border-[#1c2740] bg-[#0d1424] p-2.5">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="rounded border px-1.5 py-0.5 font-mono text-[10px]"
                      style={{
                        color: hintColor(h.token),
                        borderColor: `${hintColor(h.token)}66`,
                        background: `${hintColor(h.token)}1a`,
                      }}
                    >
                      {h.token}
                    </span>
                    {h.authoritative && (
                      <span className="rounded-full border border-[#2dd4bf]/40 bg-[#0f2e2c] px-1.5 py-0.5 text-[10px] text-[#2dd4bf]">
                        authoritative
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-[#8b96ad]">{h.text}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RD2Page() {
  const { selectedUsecase } = useRun();
  const { data: corpus, isLoading } = useQuery({
    queryKey: ["corpus", selectedUsecase],
    queryFn: () => fetchCorpus(selectedUsecase!),
    enabled: !!selectedUsecase,
  });
  const nCandidates = corpus
    ? Object.values(corpus.rd2).reduce((sum, list) => sum + list.length, 0)
    : 0;
  const confidenceFloor = corpus?.confidence_floor ?? 0.45;
  const nextBestBand = corpus?.next_best_band ?? 0.15;

  const standards = corpus
    ? [
        ...STANDARD_ORDER.filter((s) => corpus.rd2[s]?.length),
        ...Object.keys(corpus.rd2)
          .filter((s) => !STANDARD_ORDER.includes(s) && corpus.rd2[s]?.length)
          .sort(),
      ]
    : [];
  const [activeStandard, setActiveStandard] = useState<string | null>(null);
  const currentStandard = activeStandard && standards.includes(activeStandard)
    ? activeStandard
    : standards[0] ?? null;

  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const candidates: Array<RD2Candidate & { key: string }> =
    corpus && currentStandard
      ? corpus.rd2[currentStandard].map((c, i) => ({ ...c, key: `${currentStandard}:${i}` }))
      : [];

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1400px] flex-1 p-6">
        <div className="mb-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">RD2</span>{" "}
            <span className="text-[#e9eef7]">— Candidate mapping</span>
          </h1>
          {corpus?.run_dir && (
            <span className="font-mono text-xs text-[#5c6780]" title="Not shelf-backed — read from the newest run directory">
              {corpus.run_dir}
            </span>
          )}
        </div>
        <p className="mb-1 max-w-[92ch] text-sm text-[#8b96ad]">
          Scores candidate old↔new disclosure-requirement matches by title and text
          similarity. A non-binding proposal: RC1.2 and RM1.2 see it alongside their own
          blind pass; RC1.1 and RM1.1 never do.
        </p>
        {corpus?.run_dir && (
          <p className="mb-5 flex items-center gap-1.5 text-[11px] text-[#5c6780]">
            <IconInfoCircle size={12} />
            Reflects the newest run directory — may differ from the currently loaded
            shelf artifacts, since RD2 is not shelf-backed.
          </p>
        )}

        {isLoading ? (
          <div className={`${PANEL} p-5 text-sm text-[#5c6780]`}>Loading candidates…</div>
        ) : corpus ? (
          <>
            <div className={`${PANEL} mb-3.5 p-4`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wide text-[#5c6780]">
                  {nCandidates} candidates across {standards.length} standards
                </span>
                <div className="ml-auto flex flex-wrap gap-1.5">
                  {standards.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setActiveStandard(s); setExpandedKey(null); }}
                      className={`rounded-md border px-1 py-0.5 transition-colors ${
                        s === currentStandard
                          ? "border-[#2dd4bf]/50"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <StandardChip standard={s} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {currentStandard && (
              <>
                <div className={`${PANEL} mb-3.5 p-4`}>
                  <div className="mb-3 text-[11px] uppercase tracking-wide text-[#5c6780]">
                    Mapping board — {candidates.length} candidates
                  </div>
                  <CandidateBoard candidates={candidates} confidenceFloor={confidenceFloor} />
                  <p className="mt-3 text-[11px] leading-relaxed text-[#5c6780]">
                    Ribbon opacity and thickness track score; a dashed ribbon means the
                    basis is not a title match, or the score is below the{" "}
                    {confidenceFloor.toFixed(2)} confidence floor.
                  </p>
                </div>

                <div className={`${PANEL} p-4`}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wide text-[#5c6780]">
                      Candidate score ledger
                    </span>
                    <span className="text-[10.5px] text-[#5c6780]">
                      Solid marker at {confidenceFloor.toFixed(2)} is the CLI's confidence
                      floor; the shaded band spans the next {nextBestBand.toFixed(2)} —
                      the zone where the CLI would also weigh a competing lead. This payload
                      does not carry other candidates' scores, so no next-best comparison is
                      computed here.
                    </span>
                  </div>
                  <div className="space-y-2">
                    {candidates.map((c) => (
                      <CandidateRow
                        key={c.key}
                        candidate={c}
                        expanded={expandedKey === c.key}
                        onToggle={() => setExpandedKey(expandedKey === c.key ? null : c.key)}
                        confidenceFloor={confidenceFloor}
                        nextBestBand={nextBestBand}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#1c2740] pt-3">
                    {HINT_TOKEN_ORDER.map((t) => (
                      <span key={t} className="flex items-center gap-1.5 text-[10.5px] text-[#5c6780]">
                        <span className="h-2 w-2 rounded-sm" style={{ background: hintColor(t) }} />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            <RawPayloadFooter payload={corpus.rd2} filename="rd2-candidates.json" />
          </>
        ) : (
          <div className={`${PANEL} p-5 text-sm text-[#5c6780]`}>
            No candidate artifact yet — run the document pipeline to generate it.
          </div>
        )}
      </div>
    </div>
  );
}
