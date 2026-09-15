/**
 * R1Page — "Regulation discovery" detail screen.
 *
 * Bespoke to R1's payload shape (verdict / summary / possible_fields /
 * selected_pages) so a reviewer never has to open the raw JSON to judge the
 * result. ArtifactBar/RawPayloadFooter/CopyButton are shared components (used
 * by every agent page); everything else here is R1-specific.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconAlertTriangle,
  IconShieldCheck,
  IconListDetails,
  IconFileText,
  IconChevronRight,
} from "@tabler/icons-react";
import StageLoading from "../../components/StageLoading";
import ArtifactBar from "../../components/ArtifactBar";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { useAgentStageState } from "../../lib/useAgentStageState";
import { useRun } from "../../context/RunContext";

// ── R1 payload shape ────────────────────────────────────────────────────────

interface PossibleField {
  field_id: string;
  name: string;
  role: string;
  priority: string;
  description?: string;
  reason?: string;
  expected_unit?: string | null;
  expected_grain?: string | null;
  finding_refs?: string[];
}

interface SelectedPage {
  source_ref: string;
  source_file: string;
  page: number;
  reason: string;
}

interface Finding {
  finding_id: string;
  requirement_type: string;
  statement: string;
  source_ref: string;
  source_file: string;
  page: number;
  evidence_excerpt: string;
}

interface R1Payload {
  verdict?: string;
  stop_reason?: string | null;
  summary?: string;
  selected_pages?: SelectedPage[];
  possible_fields?: PossibleField[];
  findings?: Finding[];
  missing_regulatory_context?: string[];
}

// ── Shared style tokens (scoped to this page) ───────────────────────────────

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

const ROLE_COLORS: Record<string, string> = {
  entity: "bg-blue-900/30 border-blue-700/50 text-blue-300",
  measure: "bg-teal/10 border-teal/30 text-teal",
  time: "bg-indigo-900/30 border-indigo-700/50 text-indigo-300",
  qualifier: "bg-orange-900/30 border-orange-700/50 text-orange-300",
};
const ROLE_FALLBACK = "bg-gray-800 border-gray-700 text-gray-300";

const PRIORITY_STYLES: Record<string, string> = {
  core: "border-[#2dd4bf]/40 bg-[#0f2e2c] text-[#2dd4bf]",
};
const PRIORITY_FALLBACK = "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad]";

function humanize(name: string): string {
  const s = name.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatUsecaseLabel(selectedUsecase: string | null, registryId: string): string {
  const registryPrefix = selectedUsecase
    ? `uc${selectedUsecase.replace(/\./g, "_")}_`
    : "";
  const labelSource = registryPrefix && registryId.startsWith(registryPrefix)
    ? registryId.slice(registryPrefix.length)
    : registryId;
  const readableId = labelSource.replace(/_/g, " ");
  return selectedUsecase ? `UC${selectedUsecase} · ${readableId}` : readableId;
}

// ── Finding card (shared by EvidencePanel's Findings view and FieldsPanel) ──

function FindingCard({
  finding,
  highlighted = false,
  cardRef,
}: {
  finding: Finding;
  highlighted?: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={cardRef}
      className={`${CARD} p-3 transition-all duration-200 ${
        highlighted ? "border-[#2dd4bf] shadow-[0_0_0_1px_rgba(45,212,191,0.4),0_6px_22px_rgba(45,212,191,0.14)]" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className="font-mono text-[11px] text-[#2dd4bf]">{finding.finding_id}</span>
        <span className="px-2 py-0.5 rounded-full border border-[#2a3a5c] bg-[#111a2e] text-[10px] capitalize text-[#8b96ad]">
          {finding.requirement_type}
        </span>
        <span className="ml-auto flex-shrink-0 rounded border border-[#2a3a5c] px-1.5 py-0.5 font-mono text-[10px] text-[#8b96ad]">
          p. {finding.page}
        </span>
      </div>
      <p className="text-[11.5px] leading-relaxed text-[#8b96ad]">{finding.statement}</p>
      <p className="mt-1.5 text-[11px] italic leading-relaxed text-[#5c6780]">
        “{finding.evidence_excerpt}”
      </p>
      <div className="mt-1.5 text-[10px] font-mono text-[#5c6780]">
        {finding.source_ref} · {finding.source_file}
      </div>
    </div>
  );
}

// ── Verdict strip ────────────────────────────────────────────────────────────

function VerdictStrip({ payload }: { payload: R1Payload }) {
  const summary = payload.summary ?? "";
  const [expanded, setExpanded] = useState(false);
  const needsToggle = summary.length > 340;
  const isInsufficient = payload.verdict === "insufficient";
  const accent = isInsufficient ? "#d9a95c" : "#2dd4bf";
  const glow = isInsufficient
    ? "linear-gradient(90deg, rgba(217,169,92,0.09), transparent 60%)"
    : "linear-gradient(90deg, rgba(45,212,191,0.08), transparent 60%)";
  const VerdictIcon = isInsufficient ? IconAlertTriangle : IconShieldCheck;

  return (
    <div
      className="rounded-xl border-l-[3px] p-4 mb-4"
      style={{
        background: glow,
        borderLeftColor: accent,
        borderTop: "1px solid #1c2740",
        borderRight: "1px solid #1c2740",
        borderBottom: "1px solid #1c2740",
      }}
    >
      <div className="flex items-start gap-3">
        <VerdictIcon size={18} style={{ color: accent }} className="flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <span
            className="font-semibold tracking-wide uppercase text-sm"
            style={{ color: accent }}
          >
            {payload.verdict}
          </span>
          {isInsufficient && payload.stop_reason && (
            <div className="mt-3 rounded-lg border border-[#d9a95c]/35 bg-[#2a2013]/45 px-3 py-2.5">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#d9a95c]">
                Stop reason
              </div>
              <p className="text-[12px] leading-relaxed text-[#c1a979]">
                {payload.stop_reason}
              </p>
            </div>
          )}
          {summary && (
            <>
              <p
                className={`mt-2 text-[12px] leading-relaxed text-[#8b96ad] ${
                  !expanded && needsToggle ? "line-clamp-3" : ""
                }`}
              >
                {summary}
              </p>
              {needsToggle && (
                <button
                  className="mt-1 text-[12px] hover:underline"
                  style={{ color: accent }}
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? "Show less" : "Full summary"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MissingContextPanel({ contexts }: { contexts: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? contexts : contexts.slice(0, 3);

  if (contexts.length === 0) return null;

  return (
    <div className={`${PANEL} mb-4`}>
      <div className="flex flex-wrap items-center gap-3 border-b border-[#1c2740] p-4 pb-3">
        <IconAlertTriangle size={16} className="text-[#d9a95c]" />
        <h2 className="text-sm font-medium text-[#e9eef7]">Missing regulatory context</h2>
        <span className="font-mono text-xs text-[#5c6780]">{contexts.length}</span>
        {contexts.length > 3 && (
          <button
            className="ml-auto text-[11px] text-[#d9a95c] hover:underline"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Show fewer" : `Show all ${contexts.length}`}
          </button>
        )}
      </div>
      <div className="grid gap-2.5 p-3 md:grid-cols-2">
        {visible.map((context, index) => (
          <div key={`${index}-${context}`} className={`${CARD} p-3`}>
            <p className="text-[11.5px] leading-relaxed text-[#8b96ad]">{context}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Fields panel ─────────────────────────────────────────────────────────────

function FieldsPanel({
  fields,
  findingsById,
  onSelectFinding,
}: {
  fields: PossibleField[];
  findingsById: Map<string, Finding>;
  onSelectFinding: (id: string) => void;
}) {
  const [filter, setFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const priorities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of fields) counts.set(f.priority, (counts.get(f.priority) ?? 0) + 1);
    return Array.from(counts.entries());
  }, [fields]);

  const roles = useMemo(() => Array.from(new Set(fields.map((f) => f.role))), [fields]);

  const effectiveFilter = filter && priorities.some(([priority]) => priority === filter)
    ? filter
    : null;
  const effectiveExpandedId = expandedId && fields.some((field) => field.field_id === expandedId)
    ? expandedId
    : null;
  const visible = effectiveFilter
    ? fields.filter((field) => field.priority === effectiveFilter)
    : fields;

  return (
    <div className={`${PANEL} flex flex-col`}>
      <div className="flex flex-wrap items-center gap-3 p-4 pb-3 border-b border-[#1c2740]">
        <IconListDetails size={16} className="text-[#8b96ad]" />
        <h2 className="text-sm font-medium text-[#e9eef7]">Possible fields</h2>
        <span className="font-mono text-xs text-[#5c6780]">{fields.length}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setFilter(null)}
            className={`px-2.5 py-1 rounded-full border text-[11px] transition-colors ${
              effectiveFilter === null ? "border-[#2dd4bf]/40 bg-[#0f2e2c] text-[#2dd4bf]" : "border-[#1c2740] text-[#8b96ad] hover:border-[#2dd4bf]/40"
            }`}
          >
            All
          </button>
          {priorities.map(([p, count]) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-2.5 py-1 rounded-full border text-[11px] capitalize transition-colors ${
                effectiveFilter === p ? "border-[#2dd4bf]/40 bg-[#0f2e2c] text-[#2dd4bf]" : "border-[#1c2740] text-[#8b96ad] hover:border-[#2dd4bf]/40"
              }`}
            >
              {p} {count}
            </button>
          ))}
        </div>
      </div>

      <div className="cockpit-track overflow-y-auto p-2" style={{ maxHeight: "290px" }}>
        {visible.length === 0 && (
          <div className="px-3 py-10 text-center text-[12px] text-[#5c6780]">
            No possible fields in this artifact.
          </div>
        )}
        {visible.map((f) => {
          const isExpanded = effectiveExpandedId === f.field_id;
          return (
            <div key={f.field_id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : f.field_id)}
                className={`group grid w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${
                  isExpanded ? "bg-[#15203a] border-l-2 border-[#2dd4bf]" : "border-l-2 border-transparent hover:bg-[#15203a] hover:border-[#2dd4bf] hover:translate-x-0.5"
                }`}
                style={{ gridTemplateColumns: "56px minmax(0,1fr) auto auto 16px" }}
              >
                <span className="font-mono text-[11px] text-[#2dd4bf]">{f.field_id}</span>
                <span className="truncate text-sm text-[#e9eef7]">{humanize(f.name)}</span>
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] whitespace-nowrap ${ROLE_COLORS[f.role] ?? ROLE_FALLBACK}`}
                >
                  {f.role}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] capitalize whitespace-nowrap ${
                    PRIORITY_STYLES[f.priority] ?? PRIORITY_FALLBACK
                  }`}
                >
                  {f.priority}
                </span>
                <IconChevronRight
                  size={14}
                  className={`text-[#5c6780] transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                />
              </button>

              {isExpanded && (
                <div className="mx-3 mb-2 mt-1 rounded-lg border border-[#1c2740] bg-[#0a101d] p-3 text-[12px] leading-relaxed text-[#8b96ad] space-y-1.5">
                  {f.description && <p>{f.description}</p>}
                  {f.reason && (
                    <p className="text-[#5c6780]">
                      <span className="text-[#8b96ad]">Why: </span>
                      {f.reason}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono text-[11px] text-[#5c6780]">
                    {f.expected_grain && <span>grain: {f.expected_grain}</span>}
                    {f.expected_unit && <span>unit: {f.expected_unit}</span>}
                  </div>
                  {f.finding_refs && f.finding_refs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {f.finding_refs.map((refId) => {
                        const known = findingsById.has(refId);
                        return (
                          <button
                            key={refId}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (known) onSelectFinding(refId);
                            }}
                            disabled={!known}
                            title={known ? "Show in Evidence pages → Findings" : undefined}
                            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                              known
                                ? "border-[#2a3a5c] text-[#8b96ad] hover:border-[#2dd4bf]/40 hover:text-[#2dd4bf]"
                                : "border-[#1c2740] text-[#5c6780] cursor-default"
                            }`}
                          >
                            {refId}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-[#1c2740] px-4 py-2.5 text-[11px] text-[#5c6780]">
        {roles.map((r) => (
          <span key={r} className="flex items-center gap-1.5 capitalize">
            <span className={`h-2 w-2 rounded-full border ${ROLE_COLORS[r] ?? ROLE_FALLBACK}`} />
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Evidence panel ───────────────────────────────────────────────────────────

function EvidencePanel({
  pages,
  findings,
  focusedFindingId,
  onFocusFinding,
}: {
  pages: SelectedPage[];
  findings: Finding[];
  focusedFindingId: string | null;
  onFocusFinding: (id: string | null) => void;
}) {
  const [view, setView] = useState<"pages" | "findings">("pages");
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const effectiveView = focusedFindingId
    ? "findings"
    : view === "pages" && pages.length === 0 && findings.length > 0
      ? "findings"
      : view === "findings" && findings.length === 0 && pages.length > 0
        ? "pages"
        : view;

  // A finding was selected from the Possible fields panel — jump to it here.
  useEffect(() => {
    if (!focusedFindingId) return;
    setView("findings");
    const el = cardRefs.current[focusedFindingId];
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [focusedFindingId]);

  return (
    <div className={`${PANEL} flex flex-col`}>
      <div className="flex flex-wrap items-center gap-3 p-4 pb-3 border-b border-[#1c2740]">
        <IconFileText size={16} className="text-[#8b96ad]" />
        <h2 className="text-sm font-medium text-[#e9eef7]">Evidence</h2>
        <span className="font-mono text-xs text-[#5c6780]">
          {effectiveView === "pages" ? pages.length : findings.length}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center rounded-full border border-[#1c2740] p-0.5">
            <button
              onClick={() => {
                setView("pages");
                onFocusFinding(null);
              }}
              className={`px-2.5 py-0.5 rounded-full text-[11px] transition-colors ${
                effectiveView === "pages" ? "bg-[#0f2e2c] text-[#2dd4bf]" : "text-[#8b96ad] hover:text-[#e9eef7]"
              }`}
            >
              Pages
            </button>
            <button
              onClick={() => setView("findings")}
              className={`px-2.5 py-0.5 rounded-full text-[11px] transition-colors ${
                effectiveView === "findings" ? "bg-[#0f2e2c] text-[#2dd4bf]" : "text-[#8b96ad] hover:text-[#e9eef7]"
              }`}
            >
              Findings
            </button>
          </div>
        </div>
      </div>

      <div className="cockpit-track overflow-y-auto p-3 space-y-2.5" style={{ maxHeight: "290px" }}>
        {effectiveView === "pages" ? (
          pages.length > 0 ? (
            pages.map((pg, i) => (
              <div
                key={`${pg.source_ref}-${pg.source_file}-${pg.page}-${i}`}
                className={`${CARD} p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2dd4bf]`}
                style={{ boxShadow: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 22px rgba(45,212,191,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 rounded border border-[#2a3a5c] px-1.5 py-0.5 font-mono text-[10px] text-[#8b96ad]">
                    p. {pg.page}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs text-[#5c6780] font-mono mb-1">
                      {pg.source_ref} · {pg.source_file}
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-[#8b96ad]">{pg.reason}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-3 py-10 text-center text-[12px] text-[#5c6780]">
              No selected evidence pages in this artifact.
            </div>
          )
        ) : findings.length > 0 ? (
          findings.map((f) => (
              <FindingCard
                key={f.finding_id}
                finding={f}
                highlighted={f.finding_id === focusedFindingId}
                cardRef={(el) => {
                  cardRefs.current[f.finding_id] = el;
                }}
              />
            ))
        ) : (
          <div className="px-3 py-10 text-center text-[12px] text-[#5c6780]">
            No regulatory findings in this artifact.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function R1Page() {
  const { envelope } = useAgentEnvelope("r1");
  const stageState = useAgentStageState("r1");
  const p = envelope?.payload as R1Payload | undefined;
  const { selectedUsecase } = useRun();
  const usecaseLabel = envelope
    ? formatUsecaseLabel(selectedUsecase, envelope.registry_id)
    : null;

  const findingsById = useMemo(
    () => new Map((p?.findings ?? []).map((f) => [f.finding_id, f])),
    [p],
  );
  const [focusState, setFocusState] = useState<{
    artifactId: string;
    findingId: string | null;
  } | null>(null);
  const focusedFindingId = focusState && focusState.artifactId === envelope?.artifact_id
    ? focusState.findingId
    : null;
  const effectiveFocusedFindingId = focusedFindingId && findingsById.has(focusedFindingId)
    ? focusedFindingId
    : null;
  const setFocusedFindingId = (findingId: string | null) => {
    if (!envelope) return;
    setFocusState({ artifactId: envelope.artifact_id, findingId });
  };

  const isComputing = stageState === "running" || stageState === "pending";

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 max-w-[1400px] mx-auto w-full flex-1">
        <div className="mb-5 flex items-baseline gap-3 flex-wrap">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">R1</span>{" "}
            <span className="text-[#e9eef7]">— Regulation discovery</span>
          </h1>
          {usecaseLabel && <span className="text-xs text-[#5c6780]">{usecaseLabel}</span>}
        </div>
        <p className="mb-5 max-w-[88ch] text-sm text-[#8b96ad]">
          Reads the regulation documents and identifies candidate fields relevant to the
          selected use-case, together with their preliminary data-access signals.
        </p>

        {isComputing ? (
          <StageLoading agentLabel="R1" agentName="Regulation Discovery" />
        ) : !envelope ? (
          <div className={`${PANEL} p-5 text-sm text-[#5c6780]`}>
            No artifact yet — run the pipeline to generate this agent's output.
          </div>
        ) : (
          <>
            <ArtifactBar envelope={envelope} agent="R1" />
            {p && (
              <>
                <VerdictStrip key={`verdict-${envelope.artifact_id}`} payload={p} />
                <MissingContextPanel
                  key={`context-${envelope.artifact_id}`}
                  contexts={p.missing_regulatory_context ?? []}
                />
                <div className="grid gap-3.5" style={{ gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)" }}>
                  <FieldsPanel
                    key={`fields-${envelope.artifact_id}`}
                    fields={p.possible_fields ?? []}
                    findingsById={findingsById}
                    onSelectFinding={setFocusedFindingId}
                  />
                  <EvidencePanel
                    key={`evidence-${envelope.artifact_id}`}
                    pages={p.selected_pages ?? []}
                    findings={p.findings ?? []}
                    focusedFindingId={effectiveFocusedFindingId}
                    onFocusFinding={setFocusedFindingId}
                  />
                </div>
                <RawPayloadFooter payload={p} filename="r1-payload.json" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
