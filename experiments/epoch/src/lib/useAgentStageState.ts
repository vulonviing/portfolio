/**
 * Returns the artifact-derived state for the published example.
 */
import { useRun } from "../context/RunContext";

export type AgentStageState = "idle" | "pending" | "running" | "gate" | "done";

export function useAgentStageState(agentKey: string): AgentStageState {
  const { stageState } = useRun();
  return stageState(agentKey.toLowerCase());
}
