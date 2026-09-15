import type { PipelineFamily, RunState } from "../api/types";

export type ApprovalKey = "catalog" | "scope" | "profile" | "topology" | "mapping";
export type ApprovalOutcome = "approved" | "rejected" | "returned";
export type ApprovalVisualState = "queued" | "active" | "approved" | "rejected";

export interface ApprovalGateDefinition {
  key: ApprovalKey;
  label: string;
  // null = the gate has no dedicated review screen in this (read-only) build;
  // it still renders as a non-clickable marker in the sidebar/flow.
  route: string | null;
  gateIds: string[];
  afterStage: string;
  agentKey: string;
  agentPath: string;
  artifactKey: string;
  family: PipelineFamily;
}

export const APPROVAL_GATES: ApprovalGateDefinition[] = [
  {
    key: "catalog",
    label: "Catalog approval",
    route: "/approvals/catalog",
    gateIds: ["da1_fields", "da1_scope"],
    afterStage: "da1",
    agentKey: "DA1",
    agentPath: "/da1",
    artifactKey: "da1",
    family: "tabular",
  },
  {
    key: "scope",
    label: "Scope approval",
    route: "/approvals/scope",
    gateIds: ["r2"],
    afterStage: "r2",
    agentKey: "R2",
    agentPath: "/r2",
    artifactKey: "r2",
    family: "tabular",
  },
  {
    key: "profile",
    label: "Profile approval",
    route: "/approvals/profile",
    gateIds: ["cp1"],
    afterStage: "cp1",
    agentKey: "CP1",
    agentPath: "/cp1",
    artifactKey: "cp1",
    family: "tabular",
  },
  {
    key: "topology",
    label: "Topology approval",
    route: "/approvals/topology",
    gateIds: ["ts"],
    afterStage: "ts1",
    agentKey: "TS1",
    agentPath: "/ts1",
    artifactKey: "ts",
    family: "tabular",
  },
  // Document family (UC4). Read-only build: no dedicated /approvals/* screen,
  // so route is null — the gate still shows as a marker in the pipeline flow.
  {
    key: "mapping",
    label: "Mapping approval",
    route: null,
    gateIds: ["mapping"],
    afterStage: "rd3",
    agentKey: "RD3",
    agentPath: "/rd3",
    artifactKey: "rd3",
    family: "document",
  },
  {
    key: "profile",
    label: "Profile approval",
    route: null,
    gateIds: ["cp1"],
    afterStage: "cp1",
    agentKey: "CP1",
    agentPath: "/cp1",
    artifactKey: "cp1",
    family: "document",
  },
  {
    key: "topology",
    label: "Topology approval",
    route: null,
    gateIds: ["ts"],
    afterStage: "ts1",
    agentKey: "TS1",
    agentPath: "/ts1",
    artifactKey: "ts",
    family: "document",
  },
];

export function approvalByKey(family: PipelineFamily, key: ApprovalKey): ApprovalGateDefinition {
  return APPROVAL_GATES.find((gate) => gate.family === family && gate.key === key)!;
}

export function approvalForGateId(gateId: string | undefined): ApprovalGateDefinition | undefined {
  if (!gateId) return undefined;
  return APPROVAL_GATES.find((gate) => gate.gateIds.includes(gateId));
}

export function approvalAfterStage(
  family: PipelineFamily,
  stageKey: string
): ApprovalGateDefinition | undefined {
  return APPROVAL_GATES.find((gate) => gate.family === family && gate.afterStage === stageKey);
}

export function approvalVisualState(
  gate: ApprovalGateDefinition,
  run: RunState | null,
  stageState: string,
  outcome: ApprovalOutcome | undefined,
): ApprovalVisualState {
  if (outcome === "rejected") return "rejected";
  if (
    run?.status === "waiting_gate" &&
    gate.gateIds.includes(run.current_gate?.gate_id ?? "")
  ) {
    return "active";
  }
  if (outcome === "approved" || stageState === "done") return "approved";
  return "queued";
}
