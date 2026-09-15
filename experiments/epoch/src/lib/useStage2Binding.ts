import { useQuery } from "@tanstack/react-query";
import { fetchStage2Binding } from "../api/client";
import type { PipelineFamily, Stage2AgentSpec, Stage2Binding } from "../api/types";

export function useStage2Binding(
  topologyId: string | undefined,
  family: PipelineFamily = "tabular"
): {
  binding: Stage2Binding | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["stage2-binding", topologyId, family],
    queryFn: () => fetchStage2Binding(topologyId!, family),
    enabled: !!topologyId,
  });
  return { binding: data, isLoading };
}

export function flatStage2Agents(binding: Stage2Binding | undefined): Stage2AgentSpec[] {
  return binding?.ranks.flatMap((rank) => rank.agents) ?? [];
}
