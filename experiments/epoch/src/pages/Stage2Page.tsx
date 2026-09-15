import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconAlertTriangle,
  IconBinaryTree,
  IconChecks,
  IconTopologyStar,
  IconUsers,
} from "@tabler/icons-react";
import type { ShelfEnvelope } from "../api/types";
import FlowCanvas, { type FlowRank } from "../components/stage2/FlowCanvas";
import type { FlowNodeConfig, FlowNodeState } from "../components/stage2/FlowNode";
import HumanGatePill, { type HumanGateState } from "../components/stage2/HumanGatePill";
import {
  artifactMetrics,
  documentOverviewSignals,
  overviewSignals,
} from "../components/stage2/artifactSummary";
import { useRun } from "../context/RunContext";
import { useActiveSet } from "../lib/useActiveSet";
import { flatStage2Agents, useStage2Binding } from "../lib/useStage2Binding";
import { routeForUsecase } from "../lib/routes";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";

function nodeStatus(state: FlowNodeState): string {
  if (state === "approved") return "Approved artifact";
  if (state === "available") return "Artifact available";
  if (state === "running") return "Running now";
  if (state === "review") return "Waiting for human review";
  return "Awaiting artifact";
}

export default function Stage2Page() {
  const navigate = useNavigate();
  const {
    selectedUsecase,
    run,
    stageState,
    family,
  } = useRun();
  const { data: activeSet } = useActiveSet(selectedUsecase);

  const ts1Envelope = activeSet?.agents.ts;
  const topologyId =
    typeof ts1Envelope?.payload.selected_topology_id === "string"
      ? ts1Envelope.payload.selected_topology_id
      : undefined;
  const { binding, isLoading: bindingLoading } = useStage2Binding(topologyId, family);
  const agents = useMemo(() => flatStage2Agents(binding), [binding]);
  // Retained state derivation also supports viewing older envelope shapes;
  // published snapshots themselves never expose a live run.
  const runMatches =
    !!run &&
    run.registry_id === selectedUsecase &&
    (run.status === "running" || run.status === "waiting_gate");

  const envelopeFor = (agentId: string): ShelfEnvelope | null | undefined =>
    activeSet?.agents[agentId.toLowerCase()];

  const stateFor = (agentId: string): FlowNodeState => {
    const liveState = runMatches ? stageState(agentId) : "idle";
    if (liveState === "gate") return "review";
    if (liveState === "running") return "running";
    if (liveState === "pending") return "pending";

    const envelope = envelopeFor(agentId);
    if (agentId === binding?.final_agent_id && envelope?.approved_at) return "approved";
    return envelope ? "available" : "pending";
  };

  const ranks: FlowRank[] = useMemo(
    () =>
      (binding?.ranks ?? []).map((rank, rankIndex, allRanks) => {
        const previousCount = rankIndex > 0 ? allRanks[rankIndex - 1].agents.length : 0;
        const hub = previousCount > rank.agents.length;
        const nodes: FlowNodeConfig[] = rank.agents.map((agent) => {
          const envelope = envelopeFor(agent.agent_id);
          const state = stateFor(agent.agent_id);
          return {
            key: agent.agent_id.toLowerCase(),
            code: agent.agent_id,
            role: agent.role,
            metrics: artifactMetrics(envelope),
            status: nodeStatus(state),
            state,
            hub,
          };
        });
        return {
          caption: `${rank.mode} rank ${rankIndex + 1}`,
          nodes,
        };
      }),
    [binding, activeSet, runMatches, run?.status, run?.current_gate, stageState]
  );

  const availableCount = agents.filter((agent) => !!envelopeFor(agent.agent_id)).length;
  const finalEnvelope = binding?.final_agent_id
    ? envelopeFor(binding.final_agent_id)
    : null;
  const gateActive =
    runMatches &&
    run?.status === "waiting_gate" &&
    run.current_gate?.agent === binding?.human_gate_after;
  const gateState: HumanGateState = gateActive
    ? "active"
    : finalEnvelope?.approved_at
      ? "approved"
      : "queued";

  const signals =
    family === "document"
      ? documentOverviewSignals(activeSet?.agents.rd3)
      : overviewSignals(agents.map((agent) => envelopeFor(agent.agent_id)));
  const finalReviewLabel = binding?.human_gate_after
    ? gateState === "approved"
      ? "Approved"
      : gateState === "active"
        ? "Review active"
        : "Queued"
    : "Not bound";

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">Stage 2</span>{" "}
            <span className="text-[#e9eef7]">— Output-tier overview</span>
          </h1>
        </div>
        <p className="mb-5 max-w-[96ch] text-sm leading-relaxed text-[#8b96ad]">
          The selected TS1 topology determines this runtime flow. Agent roles come from the
          Python binding; metrics and completion states come from the active artifacts and live
          run. D3 remains on the Site computation page because it is the upstream computation stage.
        </p>

        {!ts1Envelope && (
          <div className={`${PANEL} p-5 text-sm text-[#5c6780]`}>
            No TS1 topology artifact exists for {selectedUsecase ? `UC${selectedUsecase}` : "this use-case"}.
          </div>
        )}

        {ts1Envelope && bindingLoading && (
          <div className={`${PANEL} p-5 text-sm text-[#5c6780]`}>Loading runtime binding…</div>
        )}

        {ts1Envelope && binding && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <CockpitKpi
                icon={<IconTopologyStar size={16} />}
                label="Selected topology"
                value={binding.topology_id}
                detail="TS1 artifact"
                accent
              />
              <CockpitKpi
                icon={<IconBinaryTree size={16} />}
                label="Execution shape"
                value={`${binding.ranks.length} ranks`}
                detail={`${agents.length} bound agents`}
              />
              <CockpitKpi
                icon={<IconUsers size={16} />}
                label="Artifacts"
                value={`${availableCount} / ${agents.length}`}
                detail="active shelves available"
              />
              <CockpitKpi
                icon={<IconChecks size={16} />}
                label="Final review"
                value={finalReviewLabel}
                detail={binding.human_gate_after ? `after ${binding.human_gate_after}` : "no output-tier gate"}
                tone={gateState === "active" ? "amber" : gateState === "approved" ? "teal" : "muted"}
              />
            </div>

            {signals.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {signals.map((signal) => (
                  <span
                    key={signal.key}
                    className={`rounded-full border px-3 py-1 text-[11px] ${
                      signal.tone === "danger"
                        ? "border-[#d97a6c]/45 bg-[#2d1818] text-[#d97a6c]"
                        : "border-[#d9a95c]/40 bg-[#2a2013] text-[#d9a95c]"
                    }`}
                  >
                    {signal.count} {signal.label}
                  </span>
                ))}
              </div>
            )}

            {!binding.implemented ? (
              <div className={`${PANEL} mt-5 flex items-start gap-3 p-6`}>
                <IconAlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-[#d9a95c]" />
                <div>
                  <div className="text-sm font-medium text-[#e9eef7]">
                    No output-tier binding is implemented for {binding.topology_id}
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[#8b96ad]">
                    The runtime binding currently returns no Stage 2 ranks. The existing D3 artifact
                    belongs to the upstream Site computation page and is intentionally not shown here.
                  </p>
                </div>
              </div>
            ) : (
              <div className={`${PANEL} mt-5 p-4`}>
                <FlowCanvas
                  ranks={ranks}
                  onSelectNode={(key) => navigate(routeForUsecase(selectedUsecase, `/stage2/${key}`))}
                  gateSlot={
                    binding.human_gate_after
                      ? <HumanGatePill state={gateState} />
                      : undefined
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CockpitKpi({
  icon,
  label,
  value,
  detail,
  accent = false,
  tone = "muted",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
  tone?: "teal" | "amber" | "muted";
}) {
  const valueColor = accent || tone === "teal"
    ? "text-[#2dd4bf]"
    : tone === "amber"
      ? "text-[#d9a95c]"
      : "text-[#e9eef7]";
  return (
    <div className={`${PANEL} p-4`}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-[#5c6780]">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-3 font-mono text-xl font-semibold ${valueColor}`}>{value}</div>
      <div className="mt-1 text-[11px] text-[#5c6780]">{detail}</div>
    </div>
  );
}
