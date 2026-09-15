// Mirrors the Python backend JSON shapes — keep in sync with serializers.py

export type PipelineFamily = "tabular" | "document";

export interface UsecaseSummary {
  key: string;
  id: string;
  natural_request: string;
  output_type: string;
  assurance_level: string;
  pipeline_family: PipelineFamily;
}

// Mirrors registry.py OutputProfile — WHAT the case must produce.
export interface OutputProfile {
  output_type: "binary" | "qualitative" | "quantitative";
  form: "yes_no_alert" | "structured_memo" | "numeric_measurement";
  description: string;
}

// Mirrors registry.py AssuranceProfile — the declared demand signal (not an
// enforced floor; CP1 derives its own assurance_level independently).
export interface AssuranceProfile {
  level: "inform_only" | "law_reference_required" | "independently_verifiable";
  law_reference_required: boolean;
  dual_method_required?: boolean; // absent from demand_snapshot(), present in operative
  human_signoff_required: boolean;
  envelope_assurance_level: "routine" | "elevated" | "audit_ready" | "regulatory";
}

// Mirrors registry.py ComputationSpec — selects the D3 engine.
export interface ComputationSpec {
  kind: "threshold" | "dual_method" | "consolidation";
  source_domain: string;
  method_a_column?: string | null;
  method_b_column?: string | null;
  method_a_label?: string | null;
  method_b_label?: string | null;
  tolerance?: number | null;
  group_by_column?: string | null;
  measure_column?: string | null;
}

// Mirrors registry.py ThresholdSpec.
export interface ThresholdSpec {
  value: number;
  column: string;
  aggregation: "max" | "sum" | "mean";
  near_breach_ratio: number;
}

// seed.demand_snapshot() — the ONLY registry channel that reaches CP1.
export interface RegistryDemand {
  registry_id: string;
  natural_request: string;
  expected_output: string;
  output_profile: OutputProfile;
  assurance_profile: Omit<AssuranceProfile, "dual_method_required">;
}

// seed.scope_snapshot() — finalized downstream by R1 → R2 → DA1 → D1 → D2.
export interface RegistryScope {
  registry_id: string;
  regulation_refs: string[];
  regulation_sources: Record<string, string>;
  site_filter: Record<string, unknown>;
  time_window: [string, string];
  time_grain: string;
  threshold_parameters: Record<string, ThresholdSpec>;
  reduction_target: { reduction_target_pct: number; reference_year: number; note?: string } | null;
  computation_spec: ComputationSpec | null;
  pipeline_family?: PipelineFamily;
}

export interface UsecaseDetail {
  id: string;
  natural_request: string;
  demand: RegistryDemand;
  scope: RegistryScope;
  operative: Record<string, unknown>;
  output_profile: OutputProfile;
  assurance_profile: AssuranceProfile;
  time_grain: string | null;
}

export interface ShelfEnvelope {
  schema_version?: string;
  artifact_id: string;
  agent_id: string;
  registry_id: string;
  status: string;
  reason?: string;
  created_at?: string;
  approved_at?: string | null;
  run_id?: string;
  review_round?: number;
  input_refs?: Record<string, { artifact_id: string; payload_sha256: string }>;
  payload_sha256?: string;
  llm_provenance?: {
    provider?: string;
    backend_preset?: string;
    model?: string;
    reasoning?: { enabled?: boolean; effort?: string };
    tokens?: Record<string, number | string>;
  } | null;
  payload: Record<string, unknown>;
}

// Which run(s) the agents in an ActiveSet actually came from. "snapshot" means
// the frozen active_profile_set.json / active_document_set.json of the newest
// complete run; "shelf" means the live per-agent registry_profiles/*/active.json
// records, which can each be promoted by a different run (see `mixed`).
export interface RunProvenance {
  source: "example" | "snapshot" | "shelf";
  run_dir: string | null;
  started_at: string | null;
  run_ids: string[];
  mixed: boolean;
  dominant_run_id: string | null;
}

export interface RunListItem {
  run_dir: string;
  started_at: string | null;
  complete: boolean;
  agent_count: number;
}

export interface ActiveSet {
  registry_id: string;
  pipeline_family: PipelineFamily;
  ready: boolean;
  run: RunProvenance;
  agents: {
    [agentKey: string]: ShelfEnvelope | null | undefined;
    // Tabular family (UC1-3).
    r1?: ShelfEnvelope | null;
    da1?: ShelfEnvelope | null;
    r2?: ShelfEnvelope | null;
    cp1?: ShelfEnvelope | null;
    d1?: ShelfEnvelope | null;
    d2?: ShelfEnvelope | null;
    ts?: ShelfEnvelope | null;
    d3?: ShelfEnvelope | null;
    // Stage-2 / output-tier agents — present when the case's topology ran them.
    p1?: ShelfEnvelope | null;
    p2?: ShelfEnvelope | null;
    p3?: ShelfEnvelope | null;
    s1?: ShelfEnvelope | null;
    f1?: ShelfEnvelope | null;
    // Document family (UC4). cp1/ts are shared keys with the tabular family.
    rc1_1?: ShelfEnvelope | null;
    rc1_2?: ShelfEnvelope | null;
    rm1_1?: ShelfEnvelope | null;
    rm1_2?: ShelfEnvelope | null;
    rd3?: ShelfEnvelope | null;
    p4?: ShelfEnvelope | null;
    p5?: ShelfEnvelope | null;
    p6?: ShelfEnvelope | null;
    f2?: ShelfEnvelope | null;
    // Advisory-only external commentary — every use case, both pipeline
    // families. Never part of ready's chain-integrity check.
    ex1?: ShelfEnvelope | null;
    ex2?: ShelfEnvelope | null;
  };
}

// ── EX1/EX2 external-perspective commentary (advisory only, never binding) ────

export interface CommentarySource {
  institution: string;
  url: string;
  title: string;
  published: string | null;
}

export interface CommentaryBullet {
  point: string;
  stance: "supports" | "challenges" | "adds_context" | "flags_gap";
  relevance: "high" | "medium" | "low";
  grounding: "web_verified" | "model_knowledge";
  sources: CommentarySource[];
}

export interface ExternalCommentary {
  registry_id: string;
  stage_id: "EX1" | "EX2";
  bullets: CommentaryBullet[];
  institutions_consulted: string[];
  search_notes: string[];
}

// ── UC4 document corpus (RD1/RD2 — no shelf envelope, read from the run dir) ───

export interface RD2Candidate {
  standard: string;
  old_dr_ids: string[];
  new_dr_ids: string[];
  basis: string;
  score: number;
  n_hints: number;
  hint_token_counts: Record<string, number>;
  hint_preview: Array<{ token: string; text: string; authoritative: boolean }>;
}

export interface RD1StandardSummary {
  n_old_drs: number;
  n_new_drs: number;
  n_hints: number;
}

export interface CorpusArtifacts {
  run_dir: string | null;
  rd1: Record<string, RD1StandardSummary>;
  rd2: Record<string, RD2Candidate[]>;
  confidence_floor: number | null;
  next_best_band: number | null;
}

// Full DR paragraph text (RD1's CorpusBundle, re-parsed on demand from the
// static ESRS source files) — standard -> old|new -> dr_id -> paragraph_id
// -> quoted text. See load_document_provision_texts. Used only to resolve a
// paragraph reference (old_paragraph_refs/new_paragraph_refs) to its actual
// text for the F2 CSV/Excel export; not fetched during normal browsing.
export type ProvisionMap = Record<
  string,
  { old: Record<string, Record<string, string>>; new: Record<string, Record<string, string>> }
>;

export interface Slot {
  position_id: string;
  role: string;
  role_description: string;
}

export interface TopologySpec {
  id: string;
  display_name: string;
  description: string;
  interaction_pattern: string;
  slots: Slot[];
}

export interface TopologyLibrary {
  topologies: Record<string, TopologySpec>;
  cascade_order: string[];
}

export interface Stage2AgentSpec {
  agent_id: string;
  role: string;
}

export interface Stage2Rank {
  mode: "sequential" | "parallel";
  agents: Stage2AgentSpec[];
}

export interface Stage2Binding {
  topology_id: string;
  implemented: boolean;
  ranks: Stage2Rank[];
  final_agent_id: string | null;
  human_gate_after: string | null;
}

export interface GateInfo {
  gate_id: string;   // "da1_fields" | "da1_scope" | "r2" | "cp1" | "ts"
  agent: string;
  kind: string;      // "da1_fields" | "bool" | "review"
  payload: Record<string, unknown>;
}

export type RunStatus = "running" | "waiting_gate" | "completed" | "failed";

export interface RunState {
  run_id: string;
  registry_id: string;
  experiment_dir: string | null;
  status: RunStatus;
  error: string | null;
  current_gate: GateInfo | null;
}

export interface SseEvent {
  type: "run_started" | "stage_started" | "progress" | "gate_reached" | "completed" | "failed" | "abandoned";
  // run_started
  stages?: string[];       // lowercase stage keys, e.g. ["r1","da1",...]
  refresh?: boolean;
  // stage_started
  index?: number;
  total?: number;
  label?: string;
  // gate_reached
  gate_id?: string;
  agent?: string;
  kind?: string;
  payload?: Record<string, unknown>;
  // progress (legacy)
  message?: string;
  // failed
  error?: string;
  // completed
  result?: unknown;
}

// ── Backend presets ───────────────────────────────────────────────────────────

export interface BackendPreset {
  name: string;
  model: string;
  kind: string;
}

export interface BackendInfo {
  active_backend: string;
  model: string;
  presets: BackendPreset[];
}

// ── Per-agent model overrides ───────────────────────────────────────────────

export interface AgentModel {
  agent: string; // e.g. "R1", "RC1.1", "EX1"
  backend: string | null; // override preset name, or null when using the default
  model: string; // resolved model id actually in effect
  source: "override" | "default";
}

export interface AgentModelsInfo {
  agents: AgentModel[];
  presets: BackendPreset[];
}

// DA1 field decision (sent as batch)
export interface FieldDecision {
  field_id: string;
  decision: "approved" | "excluded" | "remapped" | "unresolved";
  catalog_target?: Record<string, unknown> | null;
}

// ── DA1 mapping board shapes ──────────────────────────────────────────────────

export interface CatalogTarget {
  kind: "entity_grain" | "time_grain" | "measure" | "filter" | "source_domain";
  name: string;
  source_table?: string | null;
  source_column?: string | null;
  aggregation?: string | null;
  filters?: unknown[];
  quality_flags?: string[];
}

export interface FieldMapping {
  field_id: string;
  field_name: string;
  role: string;
  priority: "core" | "related" | "optional";
  status: string;
  catalog_targets: CatalogTarget[];
  alternative_targets?: CatalogTarget[];
  reason?: string;
}

/**
 * Raw catalog_snapshot from the DA1 envelope / da1_fields gate.
 * measures and selectable_filters are nested dicts:
 *   measures.{group}: { measure_name: {unit, aggregation, ...} }
 *   selectable_filters.{group}: { filter_name: string[] | {deferred, note, ...} }
 * Use Object.keys(group) to enumerate names — do NOT use Object.values (they are metadata objects).
 */
export interface CatalogShape {
  allowed_grains: {
    entity_grain: string[];
    time_grain: string[];
  };
  source_domains?: Record<string, unknown>;
  measures: Record<string, Record<string, unknown>>;
  selectable_filters: Record<string, Record<string, unknown>>;
  measure_definitions?: Record<string, unknown>;
  filter_definitions?: Record<string, unknown>;
  grain_definitions?: Record<string, unknown>;
  source_tables?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DA1HumanDecision {
  field_id: string;
  field_name: string;
  priority: string;
  decision: FieldDecision["decision"];
  catalog_target: CatalogTarget | null;
  reviewed_at?: string;
}

export interface DA1HandoffDataRequest {
  request_id?: string;
  intent?: string;
  source_domain?: string | null;
  entity_grain?: string | null;
  time_grain?: string | null;
  time_window?: {
    start?: string;
    end?: string;
  };
  filters?: Record<string, unknown>;
  measures?: string[];
  quality_policy?: string;
  approved_field_ids?: string[];
  [key: string]: unknown;
}

export interface DA1MappingValidation {
  ok?: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface DA1MappingReport {
  summary?: string;
  field_mappings?: FieldMapping[];
  suggested_request?: DA1HandoffDataRequest;
  notes?: string[];
  validation?: DA1MappingValidation;
}

export interface DA1ApprovedMapping extends FieldMapping {
  human_decision?: FieldDecision["decision"];
}

export interface DA1ApprovedMappingScope {
  schema_version?: string;
  registry_id?: string;
  approved_at?: string;
  approved_field_ids?: string[];
  approved_mappings?: DA1ApprovedMapping[];
  human_decisions?: DA1HumanDecision[];
  handoff_data_request?: DA1HandoffDataRequest;
}

export interface DA1Payload {
  catalog_snapshot?: CatalogShape;
  mapping_report?: DA1MappingReport;
  human_decisions?: DA1HumanDecision[];
  approved_mapping_scope?: DA1ApprovedMappingScope;
  handoff_data_request?: DA1HandoffDataRequest;
}

/** Typed da1_fields gate payload (field_mappings + catalog). */
export interface DA1FieldsPayload {
  field_mappings: FieldMapping[];
  suggested_request?: DA1HandoffDataRequest;
  catalog: CatalogShape;
}
