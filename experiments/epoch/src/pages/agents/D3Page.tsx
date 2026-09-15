import { useQuery } from "@tanstack/react-query";
import { IconLock } from "@tabler/icons-react";
import { fetchUsecase } from "../../api/client";
import ArtifactBar from "../../components/ArtifactBar";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import StageLoading from "../../components/StageLoading";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { useAgentStageState } from "../../lib/useAgentStageState";
import { useRun } from "../../context/RunContext";
import D3Results from "./d3/D3Results";
import { isD3Kind, type D3Payload } from "./d3/types";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";

function descriptionFor(kind: unknown): string {
  if (kind === "threshold") {
    return "Computes each site's three-year average against the applicable rules and classifies every site-rule result.";
  }
  if (kind === "consolidation") {
    return "Aggregates the approved measures into division-level period totals and a consolidated portfolio result.";
  }
  return "Compares two independently computed values for each site and period, then flags differences above the approved tolerance.";
}

export default function D3Page() {
  const { envelope } = useAgentEnvelope("d3");
  const stageState = useAgentStageState("d3");
  const { selectedUsecase } = useRun();
  const rawPayload = envelope?.payload;
  const kind = rawPayload?.kind;
  const isComputing = stageState === "running" || stageState === "pending";

  const { data: usecase } = useQuery({
    queryKey: ["usecase", selectedUsecase],
    queryFn: () => fetchUsecase(selectedUsecase!),
    enabled: !!selectedUsecase,
  });
  const usecaseLabel = usecase ? `UC${selectedUsecase} · ${usecase.id.replace(/_/g, " ")}` : null;

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1400px] flex-1 p-6">
        <div className="mb-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">D3</span>{" "}
            <span className="text-[#e9eef7]">— Site computation</span>
          </h1>
          <span className="flex items-center gap-1.5 rounded-full border border-[#2a3a5c] px-2.5 py-0.5 text-[11px] text-[#8b96ad]">
            <IconLock size={11} /> deterministic · no model
          </span>
          {usecaseLabel && <span className="text-xs text-[#5c6780]">{usecaseLabel}</span>}
          {typeof rawPayload?.source_domain === "string" && (
            <span className="rounded-full border border-[#1c2740] px-2.5 py-0.5 text-[11px] text-[#5c6780]">
              {rawPayload.source_domain}
            </span>
          )}
        </div>
        <p className="mb-5 max-w-[92ch] text-sm text-[#8b96ad]">{descriptionFor(kind)}</p>

        {isComputing ? (
          <StageLoading agentLabel="D3" agentName="Site Computation" />
        ) : (
          <>
            <ArtifactBar envelope={envelope} />

            {rawPayload && isD3Kind(kind) ? (
              <D3Results
                payload={rawPayload as unknown as D3Payload}
                declaredGrain={usecase?.time_grain}
              />
            ) : rawPayload && kind ? (
              <div className={`${PANEL} p-5 text-sm text-[#5c6780]`}>
                Unrecognized D3 payload kind "{String(kind)}" — showing raw payload only.
              </div>
            ) : null}

            {rawPayload && (
              <RawPayloadFooter
                payload={rawPayload}
                filename="d3-payload.json"
                note={
                  Array.isArray(rawPayload.handoff_column)
                    ? `handoff ${rawPayload.handoff_column.length} columns`
                    : undefined
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
