/**
 * OverviewPage — the cockpit. Glanceable run status, current gate, and the
 * full horizontal pipeline flow. Agent pages are the detailed instrument views.
 */
import { useQuery } from "@tanstack/react-query";
import {
  IconLoader2,
  IconBolt,
  IconCheck,
  IconX,
  IconUserCheck,
  IconArrowZigZag,
} from "@tabler/icons-react";
import { fetchUsecase } from "../api/client";
import { useRun } from "../context/RunContext";
import PipelineGraph from "../components/PipelineGraph";
import ApprovalPendingBanner from "../components/ApprovalPendingBanner";
import { stepsFor } from "../lib/pipeline";

export default function OverviewPage() {
  const { selectedUsecase, run, stageState, isRunning, family } = useRun();

  const { data: detail } = useQuery({
    queryKey: ["usecase", selectedUsecase],
    queryFn: () => fetchUsecase(selectedUsecase!),
    enabled: !!selectedUsecase,
  });

  const steps = stepsFor(family);

  // Determine the current active stage label for the cockpit headline
  const activeStageKey = steps
    .map((step) => step.key)
    .find((k) => stageState(k) === "running" || stageState(k) === "gate");

  const stageLabels: Record<string, string> = Object.fromEntries(
    steps.map((step) => [step.key, `${step.label} · ${step.name}`])
  );

  return (
    <div className="flex h-full flex-col p-6">
      {/* Cockpit header */}
      <div className="mb-2 flex-shrink-0">
        <h1 className="text-[19px] font-medium text-[#e9eef7]">Pipeline cockpit</h1>
        {detail && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8b96ad]">
            {(detail.natural_request as string)?.substring(0, 180)}…
          </p>
        )}
      </div>

      {/* Live status strip */}
      {run && (
        <div
          className={`mb-4 flex flex-shrink-0 items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${
            run.status === "completed"
              ? "border-[#2dd4bf]/30 bg-[#0f2e2c]/40 text-[#2dd4bf]"
              : run.status === "failed"
              ? "border-red-700/40 bg-red-900/10 text-red-300"
              : run.status === "waiting_gate"
              ? "border-[#d9a95c]/40 bg-[#2a2013]/60 text-[#d9a95c]"
              : "border-[#1c2740] bg-[#111a2e] text-[#8b96ad]"
          }`}
        >
          {isRunning && run.status === "running" && <IconLoader2 size={16} className="animate-spin" />}
          {run.status === "waiting_gate" && <IconBolt size={16} />}
          {run.status === "completed" && <IconCheck size={16} />}
          {run.status === "failed" && <IconX size={16} />}
          <span className="font-medium capitalize">{run.status.replace("_", " ")}</span>
          {activeStageKey && (
            <span className="text-[#5c6780]">
              · <span className="text-[#8b96ad]">{stageLabels[activeStageKey]}</span>
            </span>
          )}
          <span className="ml-auto font-mono text-xs text-[#5c6780]">{run.run_id}</span>
        </div>
      )}

      {/* Approval actions live on the dedicated gate page. */}
      {run?.status === "waiting_gate" && run.current_gate && (
        <ApprovalPendingBanner gateId={run.current_gate.gate_id} />
      )}

      {/* Centered pipeline flow */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-3 text-[#5c6780]">
          <span className="h-px w-8 bg-[#1c2740]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.14em]">
            Pipeline stages
          </span>
          <span className="h-px w-8 bg-[#1c2740]" />
        </div>

        <div className="w-full max-w-full">
          <PipelineGraph />
        </div>

        <div className="flex items-center gap-5 text-[11px] text-[#5c6780]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-[3px] border border-[#2a3a5c] bg-[#111a2e]" />
            Agent stage
          </span>
          <span className="flex items-center gap-1.5">
            <IconUserCheck size={13} color="#d9a95c" />
            Human gate
          </span>
          <span className="flex items-center gap-1.5">
            <IconArrowZigZag size={13} />
            Serpentine flow
          </span>
        </div>
      </div>
    </div>
  );
}
