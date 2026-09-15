/**
 * TopologyPage (TS1) — "Topology selection" detail screen.
 *
 * Case-specific content on this screen comes only from the TS1 payload.
 * The topology diagrams are fixed visual references; they do not claim
 * agent bindings or ownership details for the current case.
 */
import { useState } from "react";
import {
  IconBulb,
  IconAdjustmentsHorizontal,
  IconStar,
  IconGitBranch,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import ArtifactBar from "../components/ArtifactBar";
import ApprovalPendingBanner from "../components/ApprovalPendingBanner";
import RawPayloadFooter from "../components/RawPayloadFooter";
import StageLoading from "../components/StageLoading";
import { useAgentEnvelope } from "../lib/useAgentEnvelope";
import { useAgentStageState } from "../lib/useAgentStageState";
import { useRun } from "../context/RunContext";

// ── TS1 payload shape ────────────────────────────────────────────────────────

interface Alternative {
  topology_id: string;
  why_not: string;
}

interface TS1Payload {
  topology_scores: Record<string, number>;
  selected_topology_id: string;
  rationale: string;
  alternatives: Alternative[];
  signal_sources: Record<string, string[]>;
  bindings: unknown[];
  limitations: string[];
}

// ── Shared style tokens (scoped to this page) ───────────────────────────────

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";

function firstSentence(text: string): string {
  const idx = text.indexOf(". ");
  return idx === -1 ? text : text.slice(0, idx + 1);
}

/** Highlight real key=value signal mentions and R2F-xxx claim ids, mono teal. */
function highlightRationale(text: string) {
  const parts = text.split(/(\b\w+=\w+\b|R2F-\d+)/g);
  return parts.map((part, i) =>
    /^(\w+=\w+|R2F-\d+)$/.test(part) ? (
      <span key={i} className="font-mono text-[#2dd4bf]">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

// ── Topology diagram (illustrative, fixed shape per type) ───────────────────

function TopologyDiagram({ topologyId, winner }: { topologyId: string; winner: boolean }) {
  const color = winner ? "#2dd4bf" : "#38445e";
  const fill = winner ? "rgba(45,212,191,0.14)" : "rgba(56,68,94,0.18)";

  return (
    <div
      className="rounded-lg border border-[#1c2740] p-1.5 transition-colors duration-200 group-hover:[--diagram-color:#8b96ad]"
      style={{ backgroundColor: "#0a1020" }}
    >
      <svg viewBox="0 0 230 104" width="100%" height="104" style={{ color }}>
        {topologyId === "Direct" && (
          <>
            <line x1="48" y1="44" x2="98" y2="44" stroke="currentColor" strokeWidth="1.5" className="ts1-flow-dash" />
            <line x1="130" y1="44" x2="180" y2="44" stroke="currentColor" strokeWidth="1.5" className="ts1-flow-dash" />
            {[32, 115, 198].map((cx, i) => (
              <circle key={i} cx={cx} cy={44} r={15} fill={fill} stroke="currentColor" strokeWidth="1.5" />
            ))}
            <text x="115" y="96" textAnchor="middle" fontSize="8.5" fontFamily="monospace" fill="#5c6780">
              sequential · one owner
            </text>
          </>
        )}

        {topologyId === "Debate" && (
          <>
            {[18, 44, 70].map((cy, i) => (
              <path
                key={i}
                d={`M 49 ${cy} Q 115 ${cy} 159 44`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="ts1-flow-dash"
              />
            ))}
            {[18, 44, 70].map((cy, i) => (
              <circle key={i} cx={36} cy={cy} r={12} fill={fill} stroke="currentColor" strokeWidth="1.5" />
            ))}
            <circle cx={178} cy={44} r={19} fill={fill} stroke="currentColor" strokeWidth="1.8" />
            <path d="M 170 44 l 5 5 l 10 -11" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <text x="115" y="96" textAnchor="middle" fontSize="8.5" fontFamily="monospace" fill="#5c6780">
              independent reads · one reconciled figure
            </text>
          </>
        )}

        {topologyId === "Coalition" && (
          <>
            <rect x={8} y={4} width={84} height={32} rx={8} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            <rect x={8} y={56} width={84} height={32} rx={8} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            {[12, 20, 28].map((cy, i) => (
              <path key={`t1-${i}`} d={`M 24 ${cy} Q 48 ${cy} 66 20`} fill="none" stroke="currentColor" strokeWidth="1.2" className="ts1-flow-dash" />
            ))}
            {[12, 20, 28].map((cy, i) => (
              <circle key={`t1c-${i}`} cx={17} cy={cy} r={7} fill={fill} stroke="currentColor" strokeWidth="1.2" />
            ))}
            <circle cx={74} cy={20} r={11} fill={fill} stroke="currentColor" strokeWidth="1.4" />
            {[64, 72, 80].map((cy, i) => (
              <path key={`t2-${i}`} d={`M 24 ${cy} Q 48 ${cy} 66 72`} fill="none" stroke="currentColor" strokeWidth="1.2" className="ts1-flow-dash" />
            ))}
            {[64, 72, 80].map((cy, i) => (
              <circle key={`t2c-${i}`} cx={17} cy={cy} r={7} fill={fill} stroke="currentColor" strokeWidth="1.2" />
            ))}
            <circle cx={74} cy={72} r={11} fill={fill} stroke="currentColor" strokeWidth="1.4" />

            <path d="M 85 20 Q 145 20 177 44" fill="none" stroke="currentColor" strokeWidth="1.5" className="ts1-flow-dash" />
            <path d="M 85 72 Q 145 72 177 44" fill="none" stroke="currentColor" strokeWidth="1.5" className="ts1-flow-dash" />
            <circle cx={198} cy={44} r={21} fill={fill} stroke="currentColor" strokeWidth="2" />
            <path d="M 189 44 l 5 6 l 12 -13" fill="none" stroke="currentColor" strokeWidth="2" />

            <text x={50} y={96} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#5c6780">
              two reporting teams
            </text>
            <text x={198} y={96} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#5c6780">
              consolidation
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

// ── Candidate card ───────────────────────────────────────────────────────────

function CandidateCard({
  topologyId,
  score,
  winner,
}: {
  topologyId: string;
  score: number;
  winner: boolean;
}) {
  return (
    <div
      className={`group rounded-xl border p-4 transition-all duration-200 hover:-translate-y-1 ${
        winner
          ? "border-[#2dd4bf] shadow-[0_0_0_1px_rgba(45,212,191,0.3),0_10px_30px_rgba(45,212,191,0.12)]"
          : "border-[#1c2740] opacity-70 hover:opacity-100"
      }`}
      style={
        winner
          ? { background: "linear-gradient(180deg, rgba(45,212,191,0.06), transparent 60%), #0d1424" }
          : { backgroundColor: "#0d1424" }
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-base font-semibold text-[#e9eef7]">{topologyId}</span>
        {winner ? (
          <span className="flex items-center gap-1 rounded-full border border-[#2dd4bf]/40 bg-[#0f2e2c] px-2.5 py-0.5 text-[11px] text-[#2dd4bf]">
            <IconCheck size={12} /> selected
          </span>
        ) : (
          <span className="rounded-full border border-[#2a3a5c] px-2.5 py-0.5 text-[11px] text-[#8b96ad]">
            ruled out
          </span>
        )}
      </div>

      <TopologyDiagram topologyId={topologyId} winner={winner} />

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={`font-mono text-[19px] font-semibold ${winner ? "text-[#2dd4bf]" : "text-[#8b96ad]"}`}>
          {score}
        </span>
        <span className="text-[12px] text-[#5c6780]">/ 100</span>
      </div>
      <div className="mt-1.5 h-[7px] w-full overflow-hidden rounded-full bg-[#111a2e]">
        <div
          className={`h-full rounded-full ${winner ? "bg-[#2dd4bf]" : "bg-[#38445e]"}`}
          style={{ width: `${score}%` }}
        />
      </div>

    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TopologyPage() {
  const { envelope } = useAgentEnvelope("ts");
  const stageState = useAgentStageState("ts1");
  const { run } = useRun();
  const p = envelope?.payload as TS1Payload | undefined;
  const [rationaleExpanded, setRationaleExpanded] = useState(false);

  const isTS1Gate = run?.status === "waiting_gate" && run.current_gate?.gate_id === "ts";
  const isComputing = stageState === "running" || stageState === "pending";

  const rationaleGloss = p ? firstSentence(p.rationale) : "";
  const rationaleRest = p ? p.rationale.slice(rationaleGloss.length).trim() : "";
  const needsToggle = rationaleRest.length > 260;
  const topologyEntries = p ? Object.entries(p.topology_scores) : [];
  const signalGroups = p ? Object.entries(p.signal_sources) : [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 max-w-[1400px] mx-auto w-full flex-1">
        <div className="mb-2 flex items-baseline gap-3 flex-wrap">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">TS1</span>{" "}
            <span className="text-[#e9eef7]">— Topology selection</span>
          </h1>
        </div>
        <p className="mb-5 max-w-[92ch] text-sm text-[#8b96ad]">
          Shows the topology scores, selected execution shape, rationale, decisive signals,
          alternatives, and limitations reported by TS1.
        </p>

        {isTS1Gate && run?.current_gate && (
          <ApprovalPendingBanner gateId={run.current_gate.gate_id} />
        )}

        {isComputing && !isTS1Gate ? (
          <StageLoading agentLabel="TS1" agentName="Topology Selection" />
        ) : (
          <>
            <ArtifactBar envelope={envelope} agent="TS1" />

            {p && (
              <>
                {/* ── Candidate score cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
                  {topologyEntries.map(([topologyId, score]) => (
                    <CandidateCard
                      key={topologyId}
                      topologyId={topologyId}
                      score={score}
                      winner={topologyId === p.selected_topology_id}
                    />
                  ))}
                </div>

                {/* ── Rationale + decisive signals ── */}
                <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                  {p.rationale && (
                    <div className={PANEL}>
                      <div className="flex items-center gap-3 border-b border-[#1c2740] p-4 pb-3">
                        <IconBulb size={16} className="text-[#8b96ad]" />
                        <h2 className="text-sm font-medium text-[#e9eef7]">
                          Why {p.selected_topology_id}
                        </h2>
                      </div>
                      <div className="p-4">
                        <p
                          className={`text-[12.5px] leading-relaxed text-[#8b96ad] ${
                            !rationaleExpanded && needsToggle ? "line-clamp-5" : ""
                          }`}
                        >
                          {highlightRationale(rationaleGloss)}{" "}
                          {highlightRationale(rationaleRest)}
                        </p>
                        {needsToggle && (
                          <button
                            className="mt-2 text-[12px] text-[#2dd4bf] hover:underline"
                            onClick={() => setRationaleExpanded((value) => !value)}
                          >
                            {rationaleExpanded ? "Show less" : "Full rationale"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {signalGroups.length > 0 && (
                    <div className={PANEL}>
                      <div className="flex items-center gap-3 border-b border-[#1c2740] p-4 pb-3">
                        <IconAdjustmentsHorizontal size={16} className="text-[#8b96ad]" />
                        <h2 className="text-sm font-medium text-[#e9eef7]">Deciding signals</h2>
                        <span className="font-mono text-xs text-[#5c6780]">
                          {signalGroups.reduce((total, [, signals]) => total + signals.length, 0)}
                        </span>
                        <span className="ml-auto rounded-full border border-[#1c2740] px-2.5 py-0.5 text-[11px] text-[#8b96ad]">
                          TS1 artifact
                        </span>
                      </div>
                      <div className="space-y-3 p-3">
                        {signalGroups.map(([field, signals]) => (
                          <div key={field} className="rounded-lg border border-[#1c2740] bg-[#111a2e] p-3">
                            <div className="mb-2 font-mono text-[10.5px] uppercase tracking-wide text-[#5c6780]">
                              {field}
                            </div>
                            <div className="space-y-1.5">
                              {signals.map((signal, index) => (
                                <div key={`${field}-${signal}`} className="flex items-start gap-2">
                                  {index === 0 ? (
                                    <IconStar size={13} className="mt-0.5 flex-shrink-0 text-[#d9a95c]" />
                                  ) : (
                                    <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-[#5c6780]" />
                                  )}
                                  <span className="break-words font-mono text-[11.5px] leading-relaxed text-[#8b96ad]">
                                    {signal}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Alternatives ── */}
                {p.alternatives.length > 0 && (
                  <div className={`${PANEL} mt-4`}>
                    <div className="flex items-center gap-3 border-b border-[#1c2740] p-4 pb-3">
                      <IconGitBranch size={16} className="text-[#8b96ad]" />
                      <h2 className="text-sm font-medium text-[#e9eef7]">Why not the others</h2>
                      <span className="font-mono text-xs text-[#5c6780]">{p.alternatives.length}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-2">
                      {p.alternatives.map((alternative) => {
                        const score = p.topology_scores[alternative.topology_id];
                        return (
                          <div
                            key={alternative.topology_id}
                            className="rounded-lg border border-[#1c2740] bg-[#111a2e] p-3.5 transition-colors hover:border-[#2a3a5c]"
                          >
                            <div className="flex items-baseline gap-2">
                              <span className="text-[12.5px] font-semibold text-[#e9eef7]">
                                {alternative.topology_id}
                              </span>
                              {score !== undefined && (
                                <span className="font-mono text-[11px] text-[#5c6780]">{score} / 100</span>
                              )}
                            </div>
                            <p className="mt-2 text-[11.5px] leading-relaxed text-[#8b96ad]">
                              {alternative.why_not}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Limitations ── */}
                {p.limitations.length > 0 && (
                  <div className={`${PANEL} mt-4`}>
                    <div className="flex items-center gap-3 border-b border-[#1c2740] p-4 pb-3">
                      <IconAlertTriangle size={16} className="text-[#d9a95c]" />
                      <h2 className="text-sm font-medium text-[#e9eef7]">Limitations on this selection</h2>
                      <span className="font-mono text-xs text-[#5c6780]">{p.limitations.length}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-2">
                      {p.limitations.map((limitation, index) => (
                        <div
                          key={`${index}-${limitation}`}
                          className="flex items-start gap-2.5 rounded-lg border border-[#d9a95c]/20 bg-[#171a20] p-3.5"
                        >
                          <IconAlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-[#d9a95c]" />
                          <p className="text-[11.5px] leading-relaxed text-[#8b96ad]">{limitation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <RawPayloadFooter
                  payload={p}
                  filename="ts1-payload.json"
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
