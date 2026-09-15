/**
 * RM11Page — "Blind exposure matching" detail screen.
 *
 * RM1.1 is the first half of the RM1 blind-pass pair (see AGENTS.md
 * "Blind-pass agent pairs"): it reads only the DR text and Siemens's report
 * sections and proposes its own DR-to-section matching, with no visibility
 * into the deterministic ESRS-index candidate lookup. ArtifactBar/
 * RawPayloadFooter are shared; everything else here is RM1.1-specific.
 *
 * BODY: the exposure coverage comb (report sections vs. DRs, deliberately the
 * sibling layout of RC1.1's page) — top axis = every DR id in the payload,
 * grouped by standard, bottom axis = deduplicated candidate report section
 * numbers sorted by how many DRs point to them. A connector line fans from
 * each DR to each of its candidate sections; DRs with no candidates get a
 * "no candidate found" stub.
 */
import { useMemo, useRef, useState } from "react";
import { IconAlertTriangle, IconGitFork, IconSearchOff } from "@tabler/icons-react";
import ArtifactBar from "../../components/ArtifactBar";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import StageLoading from "../../components/StageLoading";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { useAgentStageState } from "../../lib/useAgentStageState";
import { StandardChip } from "../../components/uc4/tokens";

interface BlindExposureMatch {
  standard: string;
  dr_id: string;
  candidate_section_nos: string[];
  basis: string;
  match_uncertain: boolean;
  confidence: number;
}

interface RM11Payload {
  registry_id: string;
  rows: BlindExposureMatch[];
}

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

const STANDARD_ORDER = ["E1", "E2", "E3", "E4", "E5"];

interface StandardCounts {
  standard: string;
  seen: number;
  withCandidates: number;
  uncertain: number;
}

function summarizeByStandard(rows: BlindExposureMatch[]): StandardCounts[] {
  const map = new Map<string, StandardCounts>();
  for (const row of rows) {
    const entry = map.get(row.standard) ?? {
      standard: row.standard,
      seen: 0,
      withCandidates: 0,
      uncertain: 0,
    };
    entry.seen += 1;
    if (row.candidate_section_nos.length > 0) entry.withCandidates += 1;
    if (row.match_uncertain) entry.uncertain += 1;
    map.set(row.standard, entry);
  }
  return Array.from(map.values()).sort(
    (a, b) => STANDARD_ORDER.indexOf(a.standard) - STANDARD_ORDER.indexOf(b.standard),
  );
}

// ── Comb geometry ────────────────────────────────────────────────────────────

const COL_W = 34; // px between adjacent DR columns on the top axis
const ROW_TOP = 46; // y of the top (DR) axis inside the SVG
const ROW_BOTTOM_BASE = 230; // y of the bottom (section) axis, grows with row count
const SECTION_ROW_H = 22; // extra px of svg height per bottom-axis section row wrap
const PAD_X = 70;

interface DrPoint {
  dr: BlindExposureMatch;
  x: number;
}

interface SectionPoint {
  section: string;
  x: number;
  hubCount: number;
}

export default function RM11Page() {
  const { envelope } = useAgentEnvelope("rm1_1");
  const stageState = useAgentStageState("rm1.1");
  const p = envelope?.payload as RM11Payload | undefined;
  const isComputing = stageState === "running" || stageState === "pending";
  const [hoverDr, setHoverDr] = useState<string | null>(null);
  const [hoverSection, setHoverSection] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const standardCounts = useMemo(() => summarizeByStandard(p?.rows ?? []), [p]);

  const { drPoints, sectionPoints, svgWidth, svgHeight, noCandidateCount } = useMemo(() => {
    const rows = p?.rows ?? [];
    // DR points, grouped/ordered by standard.
    const sortedRows = [...rows].sort((a, b) => {
      const so = STANDARD_ORDER.indexOf(a.standard) - STANDARD_ORDER.indexOf(b.standard);
      return so !== 0 ? so : a.dr_id.localeCompare(b.dr_id);
    });
    const drPoints: DrPoint[] = sortedRows.map((dr, i) => ({
      dr,
      x: PAD_X + i * COL_W,
    }));

    // Section hub counts (dedup candidate_section_nos across all rows).
    const hub = new Map<string, number>();
    for (const row of rows) {
      for (const sec of row.candidate_section_nos) {
        hub.set(sec, (hub.get(sec) ?? 0) + 1);
      }
    }
    const sortedSections = Array.from(hub.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]; // descending by DR count (hubs first)
      return a[0].localeCompare(b[0], undefined, { numeric: true });
    });
    const bottomSpan = Math.max(drPoints.length * COL_W, sortedSections.length * COL_W);
    const sectionPoints: SectionPoint[] = sortedSections.map(([section, count], i) => ({
      section,
      x: PAD_X + (sortedSections.length <= 1 ? bottomSpan / 2 : (i * bottomSpan) / (sortedSections.length - 1)),
      hubCount: count,
    }));

    const width = Math.max(PAD_X * 2, drPoints.length * COL_W + PAD_X, bottomSpan + PAD_X);
    const height = ROW_BOTTOM_BASE + SECTION_ROW_H;
    const noCandidateCount = rows.filter((r) => r.candidate_section_nos.length === 0).length;

    return {
      drPoints,
      sectionPoints,
      svgWidth: width,
      svgHeight: height,
      noCandidateCount,
    };
  }, [p]);

  const drX = useMemo(() => {
    const m = new Map<string, number>();
    for (const dp of drPoints) m.set(dp.dr.dr_id, dp.x);
    return m;
  }, [drPoints]);

  const sectionX = useMemo(() => {
    const m = new Map<string, number>();
    for (const sp of sectionPoints) m.set(sp.section, sp.x);
    return m;
  }, [sectionPoints]);

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1400px] flex-1 p-6">
        <div className="mb-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">RM1.1</span>{" "}
            <span className="text-[#e9eef7]">— Blind exposure matching</span>
          </h1>
          {envelope?.registry_id && (
            <span className="font-mono text-xs text-[#5c6780]">{envelope.registry_id}</span>
          )}
        </div>
        <p className="mb-3 max-w-[92ch] text-sm text-[#8b96ad]">
          Proposes which Siemens report sections might address each 2025 disclosure
          requirement — it never saw RD2's deterministic section-index candidates.
        </p>

        <div className={`${PANEL} mb-5 flex items-start gap-2.5 border-[#5b8def]/25 bg-[#101a2e] p-3`}>
          <IconSearchOff size={15} className="mt-0.5 flex-shrink-0 text-[#5b8def]" />
          <p className="text-[11.5px] leading-relaxed text-[#8b96ad]">
            This step never saw RD2's deterministic section-index proposals — it only read the
            old DR text and Siemens's report sections and proposed its own candidates.
          </p>
        </div>

        {isComputing ? (
          <StageLoading agentLabel="RM1.1" agentName="Blind Exposure Matching" />
        ) : (
          <>
            <ArtifactBar envelope={envelope} agent="RM1.1" />

            {p && (
              <>
                {/* Counts-per-standard summary */}
                <div className={`${PANEL} mb-3.5 overflow-x-auto`}>
                  <table className="w-full min-w-[480px] border-collapse text-[12px]">
                    <thead>
                      <tr className="border-b border-[#1c2740] text-left text-[11px] uppercase tracking-wide text-[#5c6780]">
                        <th className="px-4 py-2.5 font-normal">Std</th>
                        <th className="px-4 py-2.5 font-normal">DRs seen</th>
                        <th className="px-4 py-2.5 font-normal">With candidate section(s)</th>
                        <th className="px-4 py-2.5 font-normal">Uncertain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standardCounts.map((row) => (
                        <tr key={row.standard} className="border-b border-[#1c2740] last:border-b-0">
                          <td className="px-4 py-2">
                            <StandardChip standard={row.standard} />
                          </td>
                          <td className="px-4 py-2 font-mono text-[#e9eef7]">{row.seen}</td>
                          <td className="px-4 py-2 font-mono text-[#2dd4bf]">{row.withCandidates}</td>
                          <td className="px-4 py-2 font-mono text-[#d9a95c]">{row.uncertain}</td>
                        </tr>
                      ))}
                      {standardCounts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-center text-[#5c6780]">
                            No rows.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Exposure coverage comb */}
                <div className={`${PANEL} mb-3.5 p-4`}>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#5c6780]">
                      <IconGitFork size={14} />
                      Exposure coverage comb
                    </div>
                    <span className="text-[10.5px] text-[#5c6780]">
                      top: {drPoints.length} DR id{drPoints.length === 1 ? "" : "s"} by standard ·
                      bottom: report sections, busiest hub first
                    </span>
                    {noCandidateCount > 0 && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-[#d97a6c]/40 bg-[#2a1613] px-2 py-0.5 text-[10.5px] text-[#d97a6c]">
                        <IconAlertTriangle size={11} />
                        {noCandidateCount} DR{noCandidateCount === 1 ? "" : "s"} with no candidate
                      </span>
                    )}
                  </div>

                  <div ref={containerRef} className="overflow-x-auto">
                    <svg
                      width={svgWidth}
                      height={svgHeight}
                      className="block"
                      style={{ minWidth: "100%" }}
                    >
                      {/* Axis lines */}
                      <line
                        x1={0}
                        y1={ROW_TOP}
                        x2={svgWidth}
                        y2={ROW_TOP}
                        stroke="#1c2740"
                        strokeWidth={1}
                      />
                      <line
                        x1={0}
                        y1={ROW_BOTTOM_BASE}
                        x2={svgWidth}
                        y2={ROW_BOTTOM_BASE}
                        stroke="#1c2740"
                        strokeWidth={1}
                      />

                      {/* Connector lines (drawn first, under the axis dots) */}
                      {drPoints.map(({ dr, x: fx }) => {
                        const isHoverActive = hoverDr === dr.dr_id || hoverSection !== null;
                        if (dr.candidate_section_nos.length === 0) {
                          // "no candidate found" stub: short dashed danger tick going down
                          const dim = hoverDr !== null && hoverDr !== dr.dr_id;
                          return (
                            <line
                              key={`stub-${dr.dr_id}`}
                              x1={fx}
                              y1={ROW_TOP}
                              x2={fx}
                              y2={ROW_TOP + 26}
                              stroke="#d97a6c"
                              strokeWidth={2}
                              strokeDasharray="3 3"
                              opacity={dim ? 0.25 : 0.85}
                            />
                          );
                        }
                        return dr.candidate_section_nos.map((sec) => {
                          const tx = sectionX.get(sec);
                          if (tx === undefined) return null;
                          const dim =
                            (hoverDr !== null && hoverDr !== dr.dr_id) ||
                            (hoverSection !== null && hoverSection !== sec);
                          const midY = (ROW_TOP + ROW_BOTTOM_BASE) / 2;
                          const path = `M ${fx} ${ROW_TOP} C ${fx} ${midY}, ${tx} ${midY}, ${tx} ${ROW_BOTTOM_BASE}`;
                          return (
                            <path
                              key={`${dr.dr_id}-${sec}`}
                              d={path}
                              fill="none"
                              stroke={dr.match_uncertain ? "#d9a95c" : "#2dd4bf"}
                              strokeDasharray={dr.match_uncertain ? "4 3" : undefined}
                              strokeWidth={1 + dr.confidence * 1.6}
                              opacity={dim ? 0.12 : 0.3 + dr.confidence * 0.6}
                              style={{ transition: "opacity 0.15s ease" }}
                            />
                          );
                        });
                      })}

                      {/* Top axis: DR points */}
                      {drPoints.map(({ dr, x }) => {
                        const noCandidate = dr.candidate_section_nos.length === 0;
                        return (
                          <g
                            key={dr.dr_id}
                            onMouseEnter={() => setHoverDr(dr.dr_id)}
                            onMouseLeave={() => setHoverDr(null)}
                            style={{ cursor: "pointer" }}
                          >
                            <circle
                              cx={x}
                              cy={ROW_TOP}
                              r={noCandidate ? 3.5 : 4}
                              fill={
                                noCandidate
                                  ? "#301417"
                                  : dr.match_uncertain
                                    ? "#2a2013"
                                    : "#0f2e2c"
                              }
                              stroke={
                                noCandidate ? "#d97a6c" : dr.match_uncertain ? "#d9a95c" : "#2dd4bf"
                              }
                              strokeWidth={1.5}
                            />
                            <text
                              x={x}
                              y={ROW_TOP - 10}
                              textAnchor="start"
                              transform={`rotate(-55 ${x} ${ROW_TOP - 10})`}
                              className="font-mono"
                              fontSize={9.5}
                              fill={hoverDr === dr.dr_id ? "#e9eef7" : "#8b96ad"}
                            >
                              {dr.dr_id}
                            </text>
                          </g>
                        );
                      })}

                      {/* Bottom axis: section points */}
                      {sectionPoints.map(({ section, x, hubCount }) => (
                        <g
                          key={section}
                          onMouseEnter={() => setHoverSection(section)}
                          onMouseLeave={() => setHoverSection(null)}
                          style={{ cursor: "pointer" }}
                        >
                          <circle
                            cx={x}
                            cy={ROW_BOTTOM_BASE}
                            r={3 + Math.min(hubCount, 8) * 0.5}
                            fill="#111a2e"
                            stroke="#2dd4bf"
                            strokeWidth={1.5}
                          />
                          <text
                            x={x}
                            y={ROW_BOTTOM_BASE + 16}
                            textAnchor="start"
                            transform={`rotate(55 ${x} ${ROW_BOTTOM_BASE + 16})`}
                            className="font-mono"
                            fontSize={9.5}
                            fill={hoverSection === section ? "#e9eef7" : "#8b96ad"}
                          >
                            {section} ({hubCount})
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-[#1c2740] pt-3 text-[10.5px] text-[#5c6780]">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-[2px] w-4 rounded bg-[#2dd4bf]" />
                      candidate match
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-[2px] w-4 rounded"
                        style={{
                          background:
                            "repeating-linear-gradient(90deg,#d9a95c 0 4px,transparent 4px 7px)",
                        }}
                      />
                      match uncertain
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-[2px] w-4 rounded"
                        style={{
                          background:
                            "repeating-linear-gradient(90deg,#d97a6c 0 3px,transparent 3px 6px)",
                        }}
                      />
                      no candidate found
                    </span>
                    <span>line weight/opacity ∝ confidence</span>
                  </div>
                </div>

                {/* Hovered DR detail */}
                {hoverDr && (
                  <div className={`${CARD} mb-3.5 p-4`}>
                    {(() => {
                      const row = p.rows.find((r) => r.dr_id === hoverDr);
                      if (!row) return null;
                      return (
                        <div>
                          <div className="mb-1.5 flex items-center gap-2">
                            <StandardChip standard={row.standard} />
                            <span className="font-mono text-[12px] text-[#e9eef7]">{row.dr_id}</span>
                            <span className="font-mono text-[10.5px] text-[#5c6780]">
                              confidence {row.confidence.toFixed(2)}
                            </span>
                            {row.match_uncertain && (
                              <span className="rounded-full border border-[#d9a95c]/40 bg-[#2a2013] px-2 py-0.5 text-[10px] text-[#d9a95c]">
                                uncertain
                              </span>
                            )}
                            {row.candidate_section_nos.length === 0 && (
                              <span className="rounded-full border border-[#d97a6c]/40 bg-[#2a1613] px-2 py-0.5 text-[10px] text-[#d97a6c]">
                                no candidate found
                              </span>
                            )}
                          </div>
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {row.candidate_section_nos.map((sec) => (
                              <span
                                key={sec}
                                className="rounded border border-[#2a3a5c] bg-[#111a2e] px-1.5 py-0.5 font-mono text-[10.5px] text-[#8b96ad]"
                              >
                                § {sec}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11.5px] leading-relaxed text-[#8b96ad]">{row.basis}</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <RawPayloadFooter payload={p} filename="rm1_1-payload.json" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
