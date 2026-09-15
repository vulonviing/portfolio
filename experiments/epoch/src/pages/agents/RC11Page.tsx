/**
 * RC11Page — "Blind change matching" detail screen.
 *
 * RC1.1 is the first half of a blind-pass agent pair (see AGENTS.md "Blind-
 * pass agent pairs"): it reads only the authoritative 2025/2026 DR text and
 * proposes its own old<->new matching, with no visibility into RD2's
 * deterministic candidates. RC1.2 (a separate page) is what makes the final
 * change_status call. ArtifactBar/RawPayloadFooter are shared components
 * (used by every agent page); everything else here is RC1.1-specific.
 *
 * BODY placeholder: Wave 1 replaces this with the blind-matching fan
 * (matched pair / 2026-only / dropped-row visual — see the UC4 viewer plan).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { IconInfoCircle, IconSparkles } from "@tabler/icons-react";
import ArtifactBar from "../../components/ArtifactBar";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import StageLoading from "../../components/StageLoading";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { useAgentStageState } from "../../lib/useAgentStageState";
import { StandardChip } from "../../components/uc4/tokens";
import {
  toOverlayRect,
  rightMid,
  leftMid,
  cubicPath,
  stubPath,
  type AnchorRect,
} from "../../components/da1/connectorLines";

interface BlindMatch {
  standard: string;
  old_dr_id: string;
  new_dr_ids: string[];
  basis: string;
  match_uncertain: boolean;
  confidence: number;
}

interface RC11Payload {
  registry_id: string;
  rows: BlindMatch[];
}

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const STANDARD_ORDER = ["E1", "E2", "E3", "E4", "E5"];
const ACCENT = "#2dd4bf";
const WARN = "#d9a95c";
const DANGER = "#d97a6c";
const INFO = "#5b8def";

// ── Rail item shapes ──────────────────────────────────────────────────────────

interface OldItem {
  key: string;
  id: string;
  standard: string;
  row: BlindMatch;
  dropped: boolean;
}

interface NewItem {
  key: string;
  id: string;
  standard: string;
  isNewIn2026: boolean;
  sourceRows: BlindMatch[];
}

function buildRailItems(rows: BlindMatch[]): { oldItems: OldItem[]; newItems: NewItem[] } {
  const oldItems: OldItem[] = [];
  const newItemsByKey = new Map<string, NewItem>();

  for (const row of rows) {
    if (row.old_dr_id) {
      oldItems.push({
        key: `old:${row.old_dr_id}`,
        id: row.old_dr_id,
        standard: row.standard,
        row,
        dropped: row.new_dr_ids.length === 0,
      });
    }
    for (const nid of row.new_dr_ids) {
      const key = `new:${nid}`;
      const existing = newItemsByKey.get(key);
      if (existing) {
        existing.sourceRows.push(row);
      } else {
        newItemsByKey.set(key, {
          key,
          id: nid,
          standard: row.standard,
          isNewIn2026: row.old_dr_id === "",
          sourceRows: [row],
        });
      }
    }
  }

  const byStandardThenId = <T extends { standard: string; id: string }>(a: T, b: T) => {
    const sa = STANDARD_ORDER.indexOf(a.standard);
    const sb = STANDARD_ORDER.indexOf(b.standard);
    if (sa !== sb) return (sa === -1 ? 99 : sa) - (sb === -1 ? 99 : sb);
    return a.id.localeCompare(b.id);
  };

  oldItems.sort(byStandardThenId);
  const newItems = Array.from(newItemsByKey.values()).sort(byStandardThenId);
  return { oldItems, newItems };
}

function groupByStandard<T extends { standard: string }>(items: T[]): Array<[string, T[]]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(item.standard) ?? [];
    list.push(item);
    groups.set(item.standard, list);
  }
  const known = STANDARD_ORDER.filter((s) => groups.has(s));
  const rest = Array.from(groups.keys()).filter((s) => !STANDARD_ORDER.includes(s)).sort();
  return [...known, ...rest].map((s) => [s, groups.get(s)!]);
}

// ── Per-standard stats table (mirrors the CLI's render_rc1_1 columns) ────────

interface StdStat {
  standard: string;
  matched: number;
  uncertain: number;
  noCounterpart: number;
}

function computeStats(rows: BlindMatch[]): { stats: StdStat[]; newIn2026: number } {
  const byStd = new Map<string, StdStat>();
  for (const s of STANDARD_ORDER) byStd.set(s, { standard: s, matched: 0, uncertain: 0, noCounterpart: 0 });
  let newIn2026 = 0;
  for (const row of rows) {
    if (!row.old_dr_id) {
      newIn2026 += row.new_dr_ids.length || 1;
      continue;
    }
    const stat = byStd.get(row.standard) ?? byStd.set(row.standard, {
      standard: row.standard, matched: 0, uncertain: 0, noCounterpart: 0,
    }).get(row.standard)!;
    if (row.new_dr_ids.length === 0) {
      stat.noCounterpart += 1;
    } else if (row.match_uncertain) {
      stat.uncertain += 1;
    } else {
      stat.matched += 1;
    }
  }
  const knownStats = STANDARD_ORDER.map((s) => byStd.get(s)!);
  const restStats = Array.from(byStd.keys())
    .filter((s) => !STANDARD_ORDER.includes(s))
    .sort()
    .map((s) => byStd.get(s)!);
  const stats = [...knownStats, ...restStats].filter(
    (s) => s.matched + s.uncertain + s.noCounterpart > 0,
  );
  return { stats, newIn2026 };
}

function StatsTable({ rows }: { rows: BlindMatch[] }) {
  const { stats, newIn2026 } = computeStats(rows);
  return (
    <div className={`${PANEL} mb-4 flex flex-wrap items-start gap-6 p-4`}>
      <table className="border-collapse text-[12px]">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-wide text-[#5c6780]">
            <th className="px-3 py-1 text-left font-normal">Std</th>
            <th className="px-3 py-1 text-right font-normal" style={{ color: ACCENT }}>Matched</th>
            <th className="px-3 py-1 text-right font-normal" style={{ color: WARN }}>Uncertain</th>
            <th className="px-3 py-1 text-right font-normal" style={{ color: DANGER }}>No counterpart</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.standard} className="border-t border-[#1c2740]">
              <td className="px-3 py-1.5"><StandardChip standard={s.standard} /></td>
              <td className="px-3 py-1.5 text-right font-mono">{s.matched}</td>
              <td className="px-3 py-1.5 text-right font-mono">{s.uncertain || "—"}</td>
              <td className="px-3 py-1.5 text-right font-mono">{s.noCounterpart || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {newIn2026 > 0 && (
        <div
          className="mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
          style={{ borderColor: `${INFO}66`, background: "#101a2e", color: INFO }}
        >
          <IconSparkles size={13} />
          {newIn2026} new in 2026 (no 2025 origin)
        </div>
      )}
    </div>
  );
}

// ── Left rail box (old DR) ────────────────────────────────────────────────────

function OldBox({
  item,
  boxRef,
}: {
  item: OldItem;
  boxRef: (el: HTMLElement | null) => void;
}) {
  const { row, dropped } = item;
  return (
    <div
      ref={boxRef}
      title={`${row.basis}\nconfidence ${row.confidence.toFixed(2)}`}
      className={`rounded-lg border p-2.5 text-[11.5px] transition-colors ${
        dropped
          ? "border-[#d97a6c]/35 bg-[#2a1613]/50"
          : row.match_uncertain
            ? "border-[#d9a95c]/35 bg-[#2a2013]/50"
            : "border-[#1c2740] bg-[#111a2e]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] text-[#e9eef7]">{item.id}</span>
        {dropped && (
          <span className="rounded-full border border-[#d97a6c]/40 px-1.5 py-0.5 text-[9.5px] uppercase tracking-wide text-[#d97a6c]">
            no counterpart
          </span>
        )}
      </div>
    </div>
  );
}

// ── Right rail box (new DR) ───────────────────────────────────────────────────

function NewBox({
  item,
  boxRef,
}: {
  item: NewItem;
  boxRef: (el: HTMLElement | null) => void;
}) {
  const uncertain = item.sourceRows.some((r) => r.match_uncertain);
  return (
    <div
      ref={boxRef}
      title={item.sourceRows.map((r) => r.basis).join("\n\n")}
      className={`rounded-lg border p-2.5 text-[11.5px] transition-colors ${
        item.isNewIn2026
          ? "border-[#5b8def]/35 bg-[#101a2e]"
          : uncertain
            ? "border-[#d9a95c]/35 bg-[#2a2013]/50"
            : "border-[#1c2740] bg-[#111a2e]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] text-[#e9eef7]">{item.id}</span>
        {item.isNewIn2026 && (
          <span className="rounded-full border border-[#5b8def]/40 px-1.5 py-0.5 text-[9.5px] uppercase tracking-wide text-[#5b8def]">
            new in 2026
          </span>
        )}
      </div>
    </div>
  );
}

// ── SVG connector overlay ─────────────────────────────────────────────────────

type LinePath =
  | { kind: "match"; key: string; d: string; uncertain: boolean; confidence: number }
  | { kind: "dropped"; key: string; d: string; endpoint: [number, number] }
  | { kind: "new"; key: string; d: string; endpoint: [number, number] };

function ConnectorOverlay({ paths }: { paths: LinePath[] }) {
  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" width="100%" height="100%">
      {paths.map((p) => {
        if (p.kind === "match") {
          const stroke = p.uncertain ? WARN : ACCENT;
          return (
            <path
              key={p.key}
              d={p.d}
              fill="none"
              stroke={stroke}
              strokeWidth={1.4 + p.confidence * 1.6}
              strokeOpacity={0.32 + p.confidence * 0.5}
              strokeDasharray={p.uncertain ? "5 4" : undefined}
            />
          );
        }
        if (p.kind === "dropped") {
          return (
            <g key={p.key}>
              <path d={p.d} fill="none" stroke={DANGER} strokeWidth={1.5} strokeOpacity={0.55} strokeDasharray="3 3" />
              <circle cx={p.endpoint[0]} cy={p.endpoint[1]} r={4} fill="none" stroke={DANGER} strokeWidth={1.5} strokeOpacity={0.8} />
            </g>
          );
        }
        return (
          <path
            key={p.key}
            d={p.d}
            fill="none"
            stroke={INFO}
            strokeWidth={1.5}
            strokeOpacity={0.6}
            strokeDasharray="2 3"
            markerEnd="url(#rc11-arrow-new)"
          />
        );
      })}
      <defs>
        <marker id="rc11-arrow-new" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={INFO} fillOpacity={0.7} />
        </marker>
      </defs>
    </svg>
  );
}

// ── Connector board ───────────────────────────────────────────────────────────

function topMid(r: AnchorRect): [number, number] {
  return [r.left + r.width / 2, r.top];
}

function dropStubPath(to: [number, number]): string {
  const [tx, ty] = to;
  return `M ${tx} ${ty - 26} L ${tx} ${ty}`;
}

function BlindMatchBoard({ rows }: { rows: BlindMatch[] }) {
  const { oldItems, newItems } = buildRailItems(rows);
  const oldGroups = groupByStandard(oldItems);
  const newGroups = groupByStandard(newItems);

  const overlayRef = useRef<HTMLDivElement>(null);
  const oldBoxRefs = useRef<Record<string, HTMLElement | null>>({});
  const newBoxRefs = useRef<Record<string, HTMLElement | null>>({});
  const [paths, setPaths] = useState<LinePath[]>([]);

  const recompute = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const next: LinePath[] = [];

    for (const item of oldItems) {
      const boxEl = oldBoxRefs.current[item.key];
      if (!boxEl) continue;
      const boxR = toOverlayRect(boxEl, overlay);

      if (item.dropped) {
        const from = rightMid(boxR);
        const end: [number, number] = [from[0] + 40, from[1]];
        next.push({ kind: "dropped", key: item.key, d: stubPath(from), endpoint: end });
        continue;
      }
      for (const nid of item.row.new_dr_ids) {
        const targetEl = newBoxRefs.current[`new:${nid}`];
        if (!targetEl) continue;
        const targetR = toOverlayRect(targetEl, overlay);
        next.push({
          kind: "match",
          key: `${item.key}->${nid}`,
          d: cubicPath(rightMid(boxR), leftMid(targetR)),
          uncertain: item.row.match_uncertain,
          confidence: item.row.confidence,
        });
      }
    }

    for (const item of newItems) {
      if (!item.isNewIn2026) continue;
      const boxEl = newBoxRefs.current[item.key];
      if (!boxEl) continue;
      const boxR = toOverlayRect(boxEl, overlay);
      const to = topMid(boxR);
      next.push({ kind: "new", key: item.key, d: dropStubPath(to), endpoint: to });
    }

    setPaths(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  useLayoutEffect(() => {
    recompute();
  }, [recompute]);

  useEffect(() => {
    const ro = new ResizeObserver(recompute);
    if (overlayRef.current) ro.observe(overlayRef.current);
    window.addEventListener("scroll", recompute, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", recompute, true);
    };
  }, [recompute]);

  return (
    <div className={`${PANEL} p-5`}>
      <div className="flex gap-0 relative" style={{ minHeight: "20rem" }}>
        {/* ── Left rail: 2025 DR ids ── */}
        <div className="w-64 flex-shrink-0 space-y-4 pr-3 z-10">
          <div className="text-[11px] uppercase tracking-wide text-[#5c6780]">2025 disclosure requirements</div>
          {oldGroups.map(([standard, items]) => (
            <div key={standard} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <StandardChip standard={standard} />
              </div>
              {items.map((item) => (
                <OldBox key={item.key} item={item} boxRef={(el) => { oldBoxRefs.current[item.key] = el; }} />
              ))}
            </div>
          ))}
        </div>

        {/* ── SVG connector overlay ── */}
        <div ref={overlayRef} className="relative flex-1 z-0" style={{ minWidth: "6rem" }}>
          <ConnectorOverlay paths={paths} />
        </div>

        {/* ── Right rail: 2026 DR ids ── */}
        <div className="w-64 flex-shrink-0 space-y-4 pl-3 z-10">
          <div className="text-[11px] uppercase tracking-wide text-[#5c6780]">2026 disclosure requirements</div>
          {newGroups.map(([standard, items]) => (
            <div key={standard} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <StandardChip standard={standard} />
              </div>
              {items.map((item) => (
                <NewBox key={item.key} item={item} boxRef={(el) => { newBoxRefs.current[item.key] = el; }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-[#1c2740] pt-3 text-[10.5px] text-[#5c6780]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[2px] w-4" style={{ background: ACCENT }} /> matched (opacity/width ~ confidence)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[2px] w-4 border-t-2 border-dashed" style={{ borderColor: WARN }} /> uncertain match
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border" style={{ borderColor: DANGER }} /> no 2026 counterpart
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[2px] w-4 border-t-2 border-dotted" style={{ borderColor: INFO }} /> new in 2026, no 2025 origin
        </span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RC11Page() {
  const { envelope } = useAgentEnvelope("rc1_1");
  const stageState = useAgentStageState("rc1.1");
  const p = envelope?.payload as RC11Payload | undefined;
  const isComputing = stageState === "running" || stageState === "pending";

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1400px] flex-1 p-6">
        <div className="mb-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">RC1.1</span>{" "}
            <span className="text-[#e9eef7]">— Blind change matching</span>
          </h1>
          {envelope?.registry_id && (
            <span className="font-mono text-xs text-[#5c6780]">{envelope.registry_id}</span>
          )}
        </div>
        <p className="mb-5 max-w-[92ch] text-sm text-[#8b96ad]">
          Proposes its own 2025→2026 disclosure-requirement matching from the authoritative
          standard text alone — it never saw RD2's deterministic title-matching suggestions.
        </p>

        {isComputing ? (
          <StageLoading agentLabel="RC1.1" agentName="Blind Change Matching" />
        ) : (
          <>
            <ArtifactBar envelope={envelope} agent="RC1.1" />

            {p && (
              <>
                <div className={`${PANEL} mb-4 flex items-start gap-2.5 p-3.5`}>
                  <IconInfoCircle size={15} className="mt-0.5 flex-shrink-0 text-[#5c6780]" />
                  <p className="text-[12px] leading-relaxed text-[#8b96ad]">
                    This step never saw the deterministic title-matching suggestions — it only
                    read the two versions' full text and made its own matches.
                  </p>
                </div>

                <StatsTable rows={p.rows} />
                <BlindMatchBoard rows={p.rows} />

                <RawPayloadFooter payload={p} filename="rc1_1-payload.json" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
