/**
 * Stage2NodePage — drill-down for one Stage-2 (output-tier) agent. Reuses the
 * R1–TS1 detail grammar (ArtifactBar, RawPayloadFooter) plus a mini-flow
 * breadcrumb showing where this node sits in the real, topology-bound chain.
 * Body branches per agent type; F1 branches again on its real `output_form`.
 */
import { useParams, Link } from "react-router-dom";
import {
  IconArrowLeft,
  IconAlertTriangle,
} from "@tabler/icons-react";
import ArtifactBar from "../components/ArtifactBar";
import RawPayloadFooter from "../components/RawPayloadFooter";
import P1ArtifactView, { type P1Payload } from "../components/stage2/P1ArtifactView";
import MethodInterpreterArtifactView, {
  type MethodInterpretationPayload,
} from "../components/stage2/MethodInterpreterArtifactView";
import F1ArtifactView, {
  type F1Payload,
} from "../components/stage2/F1ArtifactView";
import S1ArtifactView, {
  type S1Payload,
} from "../components/stage2/S1ArtifactView";
import PersonaAssessmentView, {
  type PersonaPayload,
} from "../components/stage2/PersonaAssessmentView";
import F2ArtifactView, {
  type F2Payload,
} from "../components/stage2/F2ArtifactView";
import C1ArtifactView, {
  type C1Payload,
} from "../components/stage2/C1ArtifactView";
import C2ArtifactView, {
  type C2Payload,
} from "../components/stage2/C2ArtifactView";
import { ExternalCommentaryBullets } from "../components/external/ExternalCommentaryView";
import { useAgentEnvelope } from "../lib/useAgentEnvelope";
import { flatStage2Agents, useStage2Binding } from "../lib/useStage2Binding";
import { useRun } from "../context/RunContext";
import { routeForUsecase } from "../lib/routes";
import type { ExternalCommentary, ShelfEnvelope } from "../api/types";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";

interface TS1Payload {
  selected_topology_id?: string;
}

// ── Generic real-field row table — renders whichever known columns exist on
// the first row, falls back to every primitive-valued key it finds. ──────────

const PREFERRED_COLUMNS = [
  "location_name",
  "location_display",
  "rule_label",
  "method_a_label",
  "method_b_label",
  "year",
  "status",
  "near_breach",
  "discrepancy_flag",
  "gap",
  "abs_delta",
  "pct_diff",
];

function isPrimitive(v: unknown): v is string | number | boolean {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

function RowsTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return <p className="p-4 text-[12.5px] text-[#5c6780]">No rows.</p>;
  const columns = PREFERRED_COLUMNS.filter((c) => c in rows[0]);
  const cols = columns.length > 0 ? columns : Object.keys(rows[0]).filter((k) => isPrimitive(rows[0][k]));

  const sorted = [...rows].sort((a, b) => {
    const af = a.discrepancy_flag ? 1 : 0;
    const bf = b.discrepancy_flag ? 1 : 0;
    return bf - af;
  });

  return (
    <div className="cockpit-track overflow-auto" style={{ maxHeight: 480 }}>
      <table className="w-full text-[12px]">
        <thead className="sticky top-0" style={{ backgroundColor: "#0d1424" }}>
          <tr className="border-b border-[#1c2740] text-left text-[#5c6780]">
            {cols.map((c) => (
              <th key={c} className="px-3 py-2 font-medium">
                {c.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-[#111a2e] hover:bg-[#111a2e] ${
                row.discrepancy_flag ? "bg-[#2a2013]/30" : ""
              }`}
            >
              {cols.map((c) => {
                const v = row[c];
                return (
                  <td key={c} className="whitespace-nowrap px-3 py-1.5 text-[#8b96ad]">
                    {typeof v === "boolean" ? (
                      v ? (
                        <span className="text-[#d9a95c]">{c === "discrepancy_flag" ? "flagged" : "true"}</span>
                      ) : (
                        <span className="text-[#5c6780]">—</span>
                      )
                    ) : (
                      String(v ?? "—")
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CaveatsList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className={`${PANEL} mt-4 p-4`}>
      <div className="mb-2.5 flex items-center gap-2">
        <IconAlertTriangle size={15} className="text-[#d9a95c]" />
        <h2 className="text-sm font-medium text-[#e9eef7]">Carried caveats</h2>
        <span className="font-mono text-xs text-[#5c6780]">{items.length}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((c, i) => (
          <li key={i} className="text-[12px] leading-relaxed text-[#8b96ad]">
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Mini-flow breadcrumb ──────────────────────────────────────────────────────

function MiniFlowBreadcrumb({
  topologyId,
  chainAgents,
  current,
  hasGate,
}: {
  topologyId: string | undefined;
  chainAgents: string[];
  current: string;
  hasGate: boolean;
}) {
  const { selectedUsecase } = useRun();
  const idx = chainAgents.indexOf(current);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Link
        to={routeForUsecase(selectedUsecase, "/stage2")}
        className="flex items-center gap-1 rounded-full border border-[#1c2740] px-2.5 py-1 text-[11px] text-[#8b96ad] hover:border-[#2a3a5c] hover:text-[#e9eef7] transition-colors"
      >
        <IconArrowLeft size={12} /> Stage 2
      </Link>
      {topologyId && (
        <span className="rounded-full border border-[#2dd4bf]/40 bg-[#0f2e2c] px-2.5 py-0.5 text-[11px] text-[#2dd4bf]">
          {topologyId}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        {chainAgents.map((code) => (
          <span
            key={code}
            className={`rounded-full border px-2 py-0.5 font-mono text-[10.5px] ${
              code === current
                ? "border-[#2dd4bf] text-[#2dd4bf] bg-[#0f2e2c]"
                : "border-[#1c2740] text-[#5c6780]"
            }`}
          >
            {code}
          </span>
        ))}
        {hasGate && (
          <span className="rounded-full border border-dashed border-[#d9a95c]/50 px-2 py-0.5 text-[10.5px] text-[#d9a95c]">
            gate
          </span>
        )}
      </div>
      {idx >= 0 && (
        <span className="ml-auto text-[11px] text-[#5c6780]">
          node {idx + 1} of {chainAgents.length}
        </span>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Stage2NodePage() {
  const { agentKey = "" } = useParams<{ agentKey: string }>();
  const code = agentKey.toUpperCase();
  const { selectedUsecase, family, run } = useRun();
  const { envelope: ts1Envelope } = useAgentEnvelope("ts");
  const { envelope } = useAgentEnvelope(agentKey.toLowerCase());

  // EX2 runs immediately before this node's own Stage-2 gate (F1 tabular,
  // F2 document) — its commentary lives only in the live gate payload until
  // the human decides, since F1/F2 haven't promoted to their shelf yet.
  const gateEx2 =
    (code === "F1" || code === "F2") &&
    run?.status === "waiting_gate" &&
    run.current_gate?.gate_id === code.toLowerCase()
      ? ((run.current_gate.payload as Record<string, unknown> | undefined)?.ex2 as
          | ExternalCommentary
          | undefined)
      : undefined;

  const topologyId = (ts1Envelope?.payload as TS1Payload | undefined)?.selected_topology_id;
  const { binding } = useStage2Binding(topologyId, family);
  const agentSpecs = flatStage2Agents(binding);
  const chainAgents = agentSpecs.map((agent) => agent.agent_id);
  const hasGate = !!binding?.human_gate_after;
  const role = agentSpecs.find((agent) => agent.agent_id === code)?.role ?? code;
  const payload = envelope?.payload as Record<string, unknown> | undefined;
  const caveats = (payload?.carried_caveats as string[] | undefined) ?? [];
  const rows = (payload?.rows as Record<string, unknown>[] | undefined) ?? [];

  if (binding && !chainAgents.includes(code)) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 max-w-[1400px] mx-auto w-full flex-1">
          <MiniFlowBreadcrumb topologyId={topologyId} chainAgents={chainAgents} current={code} hasGate={hasGate} />
          <div className={`${PANEL} p-5 text-sm text-[#5c6780]`}>
            {code} is not part of the {topologyId} chain for {selectedUsecase ? `UC${selectedUsecase}` : "this use-case"}.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 max-w-[1400px] mx-auto w-full flex-1">
        <MiniFlowBreadcrumb topologyId={topologyId} chainAgents={chainAgents} current={code} hasGate={hasGate} />

        <div className="mb-2 flex items-baseline gap-3 flex-wrap">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">{code}</span>{" "}
            <span className="text-[#e9eef7]">— {role}</span>
          </h1>
        </div>

        <ArtifactBar envelope={envelope} agent={code} />

        {gateEx2 && (
          <div className={`${PANEL} mb-4 overflow-hidden`}>
            <div className="border-b border-[#1c2740] px-4 py-3">
              <h2 className="text-sm font-medium text-[#e9eef7]">External Perspective (EX2)</h2>
              <p className="mt-0.5 font-mono text-xs text-[#69758e]">
                advisory only — not part of this decision
              </p>
            </div>
            <div className="p-4">
              <ExternalCommentaryBullets commentary={gateEx2} />
            </div>
          </div>
        )}

        {payload && (
          <>
            {code === "F1" ? (
              <F1ArtifactView
                payload={payload as unknown as F1Payload}
              />
            ) : code === "P1" ? (
              <P1ArtifactView payload={payload as unknown as P1Payload} />
            ) : code === "P2" || code === "P3" ? (
              <MethodInterpreterArtifactView
                agentCode={code}
                payload={payload as unknown as MethodInterpretationPayload}
              />
            ) : code === "S1" ? (
              <S1ArtifactView payload={payload as unknown as S1Payload} />
            ) : code === "C1" ? (
              <C1ArtifactView payload={payload as unknown as C1Payload} />
            ) : code === "C2" ? (
              <C2ArtifactView payload={payload as unknown as C2Payload} />
            ) : code === "P4" || code === "P5" || code === "P6" ? (
              <PersonaAssessmentView
                agentCode={code}
                payload={payload as unknown as PersonaPayload}
              />
            ) : code === "F2" ? (
              <F2ArtifactView payload={payload as unknown as F2Payload} />
            ) : (
              <>
                <div className={PANEL}>
                  <div className="flex items-center gap-3 p-4 pb-3 border-b border-[#1c2740]">
                    <h2 className="text-sm font-medium text-[#e9eef7]">Rows</h2>
                    <span className="font-mono text-xs text-[#5c6780]">{rows.length}</span>
                  </div>
                  <RowsTable rows={rows} />
                </div>
                <CaveatsList items={caveats} />
              </>
            )}

            <RawPayloadFooter payload={payload} filename={`${agentKey}-payload.json`} />
          </>
        )}

        {!envelope && binding?.implemented && (
          <div className={`${PANEL} p-5 text-sm text-[#5c6780] mt-4`}>
            {code} is part of this topology's chain but has not produced an artifact yet.
          </div>
        )}
      </div>
    </div>
  );
}
