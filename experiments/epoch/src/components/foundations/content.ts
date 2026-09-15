/**
 * content.ts — the copy for FoundationsPage, kept out of JSX.
 *
 * Every claim here is sourced from AGENTS.md (project instructions). This
 * page explains concepts, not a live run — it takes no props from RunContext
 * and makes no API calls, so it renders identically with no backend running.
 */

export const PI_FORMULA = "π(case, output_profile, assurance_profile) → topology";

export interface AgentTypeCard {
  id: "llm" | "deterministic" | "hybrid";
  title: string;
  description: string;
  examples: string[];
}

export const AGENT_TYPE_CARDS: AgentTypeCard[] = [
  {
    id: "llm",
    title: "LLM",
    description: "Makes a judgment call, the way a person reads and reasons.",
    examples: ["R1", "CP1", "TS1"],
  },
  {
    id: "deterministic",
    title: "Deterministic",
    description: "Follows fixed rules — same input, same output, every time.",
    examples: ["D1", "RD3"],
  },
  {
    id: "hybrid",
    title: "Hybrid",
    description: "Combines fixed rules with a judgment call where one is needed.",
    examples: ["D2", "F2"],
  },
];

export interface TopologySpecSummary {
  id: "Direct" | "Debate" | "Coalition";
  shape: string;
  distinguishing: string;
}

export const TOPOLOGY_SUMMARIES: TopologySpecSummary[] = [
  {
    id: "Direct",
    shape: "Sequential, dependent chain (1..N steps)",
    distinguishing: "Each step deepens the last — single ownership, no independent second read.",
  },
  {
    id: "Debate",
    shape: "2..N independent parallel reads → reconciliation",
    distinguishing: "No reader sees another before reconciliation.",
  },
  {
    id: "Coalition",
    shape: "Parallel domain debates → synthesis",
    distinguishing: "Each domain resolves its own independent reads, then a coordinator merges the domains.",
  },
];

export const SHELF_PATH_EXAMPLE = "registry_profiles/<registry_id>/active.json";
export const SHELF_ARCHIVE_EXAMPLE = "registry_profiles/<registry_id>/archive/";

export const SHELF_RULES: string[] = [
  "Persistent outputs keyed by registry_id live under the owning agent's folder — no agent hardcodes a path into another agent's folder.",
  "Access goes through the owning agent's own *_profile_store module. Only the CLI is allowed to import multiple agents' store modules in one run.",
  "Whenever an artifact is consumed, the consuming record declares input_refs with the upstream artifact_id and payload_sha256 — a provenance chain, not a copy.",
];

export const ISOLATED_MEMORY_CROSSES =
  "What the experts reviewed and approved — the finalized scope, the data mapping, and the decision to proceed.";

export const ISOLATED_MEMORY_STAYS_BEHIND =
  "Everything not yet approved — early drafts, rejected options, and the original request — kept on file, not used again.";

export const GATE_RULE =
  "One human gate per topology chain, at the fully assembled output — not one per agent.";

export interface DemoNode {
  key: string;
  label: string;
  name: string;
  kind: "stage" | "gate";
}

export interface AuditCard {
  id: "kept" | "traceable" | "reviewed";
  title: string;
  sentence: string;
}

export const AUDIT_CARDS: AuditCard[] = [
  {
    id: "kept",
    title: "Every run is kept",
    sentence: "Every run is saved as its own permanent record — nothing is ever overwritten.",
  },
  {
    id: "traceable",
    title: "Every result is traceable",
    sentence: "Every result links back to exactly where it came from.",
  },
  {
    id: "reviewed",
    title: "Independently checked",
    sentence: "Nine independent reviews have checked this pipeline's outputs against the original source material.",
  },
];

export interface BenchTile {
  code: string;
  selected: boolean;
}

// The Stage-2 output-agent pool topology binding actually draws from
// (selection/stage2_binding.py: TOPOLOGY_AGENTS + DOCUMENT_TOPOLOGY_AGENTS).
// Direct's binding (D3 → P1 → F1) is the illustrated example — the simplest
// concrete pick.
export const AGENT_BENCH_TILES: BenchTile[] = [
  { code: "D3", selected: true },
  { code: "P1", selected: true },
  { code: "P2", selected: false },
  { code: "P3", selected: false },
  { code: "S1", selected: false },
  { code: "F1", selected: true },
  { code: "P4", selected: false },
  { code: "P5", selected: false },
  { code: "P6", selected: false },
  { code: "F2", selected: false },
];

export const AGENT_BENCH_CAPTION =
  "Example: Direct topology binds D3 → P1 → F1 from the bench; Debate and Coalition bind a different subset. Stage 1 discovery and approval agents (R1…CP1) aren't topology-selected — they run the same way regardless of which topology is chosen.";

export const UC4_DEMO_CHAIN: DemoNode[] = [
  { key: "rd1", label: "RD1", name: "Corpus extraction", kind: "stage" },
  { key: "rd2", label: "RD2", name: "Candidate mapping", kind: "stage" },
  { key: "rc1.1", label: "RC1.1", name: "Blind change matching", kind: "stage" },
  { key: "rc1.2", label: "RC1.2", name: "Change classification", kind: "stage" },
  { key: "rm1.1", label: "RM1.1", name: "Blind exposure matching", kind: "stage" },
  { key: "rm1.2", label: "RM1.2", name: "Siemens exposure mapping", kind: "stage" },
  { key: "rd3", label: "RD3", name: "Change/exposure join", kind: "stage" },
  { key: "gate1", label: "Gate", name: "Human review of 5 document-matching shelves", kind: "gate" },
  { key: "cp1", label: "CP1", name: "Case profile", kind: "stage" },
  { key: "ts1", label: "TS1", name: "Topology selection", kind: "stage" },
  { key: "p456", label: "P4/P5/P6", name: "Three independent persona reads", kind: "stage" },
  { key: "f2", label: "F2", name: "Reconciled impact finalization", kind: "stage" },
  { key: "gate2", label: "Gate", name: "Human review of the finished deliverable", kind: "gate" },
];
