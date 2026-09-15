/** Read-only viewer state derived from one published example per use case. */
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCorpus } from "../api/client";
import type { PipelineFamily, RunProvenance, RunState } from "../api/types";
import type { ApprovalKey, ApprovalOutcome } from "../lib/approvalGates";
import { EX2_STEP, stepsFor } from "../lib/pipeline";
import { useActiveSet } from "../lib/useActiveSet";

type StageState = "idle" | "pending" | "running" | "gate" | "done";

interface RunContextValue {
  selectedUsecase: string | null;
  setSelectedUsecase: (key: string) => void;
  selectedRunDir: string | null;
  run: RunState | null;
  stageState: (key: string) => StageState;
  isRunning: false;
  activeSetVersion: 0;
  approvalOutcomes: Partial<Record<ApprovalKey, ApprovalOutcome>>;
  family: PipelineFamily;
  corpusRunDir: string | null;
  runProvenance: RunProvenance | null;
}

const RunContext = createContext<RunContextValue | null>(null);

export function RunProvider({ children }: { children: React.ReactNode }) {
  const [selectedUsecase, setSelectedUsecaseState] = useState<string | null>(null);
  const setSelectedUsecase = useCallback((key: string) => setSelectedUsecaseState(key), []);
  const { data: activeSet } = useActiveSet(selectedUsecase);
  const family: PipelineFamily = activeSet?.pipeline_family ?? "tabular";
  const runDir = activeSet?.run?.run_dir ?? null;

  const { data: corpus } = useQuery({
    queryKey: ["corpus", selectedUsecase],
    queryFn: () => fetchCorpus(selectedUsecase!),
    enabled: !!selectedUsecase && family === "document",
  });

  const artifactStages = useMemo(() => {
    const present = new Set<string>();
    if (activeSet) {
      for (const step of stepsFor(family)) {
        if (activeSet.agents[step.artifactKey]) present.add(step.key);
      }
      if (activeSet.agents[EX2_STEP.artifactKey]) present.add(EX2_STEP.key);
    }
    if (corpus) {
      if (Object.keys(corpus.rd1).length > 0) present.add("rd1");
      if (Object.keys(corpus.rd2).length > 0) present.add("rd2");
    }
    return present;
  }, [activeSet, family, corpus]);

  const stageState = useCallback(
    (key: string): StageState => artifactStages.has(key.toLowerCase()) ? "done" : "idle",
    [artifactStages],
  );

  return (
    <RunContext.Provider
      value={{
        selectedUsecase,
        setSelectedUsecase,
        selectedRunDir: null,
        run: null,
        stageState,
        isRunning: false,
        activeSetVersion: 0,
        approvalOutcomes: {},
        family,
        corpusRunDir: runDir,
        runProvenance: activeSet?.run ?? null,
      }}
    >
      {children}
    </RunContext.Provider>
  );
}

export function useRun(): RunContextValue {
  const context = useContext(RunContext);
  if (!context) throw new Error("useRun must be used inside <RunProvider>");
  return context;
}
