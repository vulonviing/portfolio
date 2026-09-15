import { useRun } from "../context/RunContext";
import { useActiveSet } from "./useActiveSet";
import type { ShelfEnvelope } from "../api/types";

/**
 * Fetches the active set for the selected use-case and returns the envelope
 * for a specific agent key.
 */
export function useAgentEnvelope(agentKey: string): {
  envelope: ShelfEnvelope | null | undefined;
  isLoading: boolean;
} {
  const { selectedUsecase } = useRun();
  const { data, isLoading } = useActiveSet(selectedUsecase);
  return {
    envelope: data
      ? ((data.agents[agentKey as keyof typeof data.agents] as ShelfEnvelope | null | undefined) ?? null)
      : undefined,
    isLoading,
  };
}
