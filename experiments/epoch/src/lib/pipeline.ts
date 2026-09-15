/**
 * pipeline.ts — the single family-aware description of the pipeline.
 *
 * Replaces five hardcoded step lists that used to drift independently
 * (Sidebar's PIPELINE_STEPS, PipelineGraph's STEPS, RunContext's
 * ACTIVE_SET_TO_STAGE + STAGE_ROUTE, ArtifactBar/EnvelopeHeader's
 * AGENT_PATHS, OverviewPage's inline arrays). Each agent has three
 * spellings that must agree: the code the backend emits ("RC1.1", in
 * envelope.agent_id / SSE event.agent), the active-set shelf key
 * ("rc1_1", from load_document_active_set), and the route ("/rc1-1",
 * a frontend-only choice — dots read as file extensions in a URL).
 * This module is where the three meet. Modeled on lib/approvalGates.ts.
 */
import type { PipelineFamily } from "../api/types";

export type { PipelineFamily };

export interface PipelineStep {
  key: string; // lowercased agent code — RunContext.stageState / SSE key
  label: string; // agent code as printed
  name: string; // reader-facing step name
  path: string; // route
  artifactKey: string; // active-set dict key
}

export const TABULAR_STEPS: PipelineStep[] = [
  { key: "r1", label: "R1", name: "Regulation discovery", path: "/r1", artifactKey: "r1" },
  { key: "da1", label: "DA1", name: "Catalog mapping", path: "/da1", artifactKey: "da1" },
  { key: "ex1", label: "EX1", name: "External perspective (Stage 1)", path: "/ex1", artifactKey: "ex1" },
  { key: "r2", label: "R2", name: "Scope review", path: "/r2", artifactKey: "r2" },
  { key: "d1", label: "D1", name: "Data load", path: "/d1", artifactKey: "d1" },
  { key: "d2", label: "D2", name: "Quality preflight", path: "/d2", artifactKey: "d2" },
  { key: "cp1", label: "CP1", name: "Case profile", path: "/cp1", artifactKey: "cp1" },
  { key: "ts1", label: "TS1", name: "Topology selection", path: "/ts1", artifactKey: "ts" },
  { key: "d3", label: "D3", name: "Site computation", path: "/d3", artifactKey: "d3" },
];

export const DOCUMENT_STEPS: PipelineStep[] = [
  { key: "rd1", label: "RD1", name: "Corpus extraction", path: "/rd1", artifactKey: "rd1" },
  { key: "rd2", label: "RD2", name: "Candidate mapping", path: "/rd2", artifactKey: "rd2" },
  { key: "rc1.1", label: "RC1.1", name: "Blind change matching", path: "/rc1-1", artifactKey: "rc1_1" },
  { key: "rc1.2", label: "RC1.2", name: "Change classification", path: "/rc1-2", artifactKey: "rc1_2" },
  { key: "rm1.1", label: "RM1.1", name: "Blind exposure matching", path: "/rm1-1", artifactKey: "rm1_1" },
  { key: "rm1.2", label: "RM1.2", name: "Siemens exposure mapping", path: "/rm1-2", artifactKey: "rm1_2" },
  { key: "rd3", label: "RD3", name: "Change/exposure join", path: "/rd3", artifactKey: "rd3" },
  { key: "ex1", label: "EX1", name: "External perspective (Stage 1)", path: "/ex1", artifactKey: "ex1" },
  { key: "cp1", label: "CP1", name: "Case profile", path: "/cp1", artifactKey: "cp1" },
  { key: "ts1", label: "TS1", name: "Topology selection", path: "/ts1", artifactKey: "ts" },
];

// Stage-2 agents are bound at runtime by the topology (see useStage2Binding),
// not by a fixed per-family step list. They appear here only so ArtifactBar
// can resolve an input_refs key to a route/label without a second registry.
export const STAGE2_STEPS: PipelineStep[] = [
  { key: "p1", label: "P1", name: "Result interpretation", path: "/stage2/p1", artifactKey: "p1" },
  { key: "p2", label: "P2", name: "Energy-method read", path: "/stage2/p2", artifactKey: "p2" },
  { key: "p3", label: "P3", name: "Reported-method read", path: "/stage2/p3", artifactKey: "p3" },
  { key: "s1", label: "S1", name: "Reconciliation", path: "/stage2/s1", artifactKey: "s1" },
  { key: "c1", label: "C1", name: "Divisional data-volume report", path: "/stage2/c1", artifactKey: "c1" },
  { key: "c2", label: "C2", name: "Coalition consolidation", path: "/stage2/c2", artifactKey: "c2" },
  { key: "ex2", label: "EX2", name: "External perspective (Stage 2)", path: "/ex2", artifactKey: "ex2" },
  { key: "f1", label: "F1", name: "Finalization", path: "/stage2/f1", artifactKey: "f1" },
  { key: "p4", label: "P4", name: "Conservative assessment", path: "/stage2/p4", artifactKey: "p4" },
  { key: "p5", label: "P5", name: "Balanced assessment", path: "/stage2/p5", artifactKey: "p5" },
  { key: "p6", label: "P6", name: "Maximum-assurance assessment", path: "/stage2/p6", artifactKey: "p6" },
  { key: "f2", label: "F2", name: "Impact finalization", path: "/stage2/f2", artifactKey: "f2" },
];

// EX2 always runs before F1/F2 regardless of topology binding — unlike the
// rest of STAGE2_STEPS it is not one of the dynamically-bound topology
// agents, so Sidebar renders it as a fixed extra entry (see Sidebar.tsx).
export const EX2_STEP = STAGE2_STEPS.find((step) => step.key === "ex2")!;

const ALL_STEPS: PipelineStep[] = [...TABULAR_STEPS, ...DOCUMENT_STEPS, ...STAGE2_STEPS];

export function stepsFor(family: PipelineFamily): PipelineStep[] {
  return family === "document" ? DOCUMENT_STEPS : TABULAR_STEPS;
}

export function stepByStageKey(family: PipelineFamily, key: string): PipelineStep | undefined {
  return stepsFor(family).find((step) => step.key === key);
}

/** Flat lookup across both families + Stage 2 — safe: cp1/ts are the only
 *  overlap between families and their entries are identical. */
export function stepByArtifactKey(artifactKey: string): PipelineStep | undefined {
  return ALL_STEPS.find((step) => step.artifactKey === artifactKey);
}

export function stageKeyForArtifactKey(family: PipelineFamily, artifactKey: string): string | undefined {
  return stepsFor(family).find((step) => step.artifactKey === artifactKey)?.key;
}
