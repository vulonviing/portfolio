/**
 * R2Page — "Scope review" detail screen.
 *
 * R2 produces a boundary by sorting R1 findings into in-scope / blocked /
 * excluded. This screen answers at a glance what survived the boundary and why
 * the rest did not.
 * ArtifactBar/RawPayloadFooter are shared components; everything else here is
 * R2-specific, mirroring R1Page's local-subcomponent pattern.
 */
import { useMemo, useState } from "react";
import {
  IconCrop,
  IconUserCheck,
  IconListCheck,
  IconAlertTriangle,
  IconExternalLink,
  IconChevronDown,
} from "@tabler/icons-react";
import ArtifactBar from "../../components/ArtifactBar";
import ApprovalPendingBanner from "../../components/ApprovalPendingBanner";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import StageLoading from "../../components/StageLoading";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { useAgentStageState } from "../../lib/useAgentStageState";
import { useRun } from "../../context/RunContext";

// ── R2 payload shape ─────────────────────────────────────────────────────────

interface Citation {
  source_ref: string;
  source_file: string;
  page: number;
  evidence_excerpt: string;
}

interface InScopeFinding {
  r2_finding_id: string;
  statement: string;
  assessment_boundary: string;
  requirement_type: string;
  r1_finding_refs: string[];
  approved_field_ids: string[];
  citations: Citation[];
}

interface SidelinedFinding {
  r1_finding_id: string;
  reason: string;
  related_field_ids: string[];
}

interface HumanReview {
  decision: string;
  reviewed_at?: string;
  blocked_acknowledged?: string[];
  excluded_acknowledged?: string[];
}

interface R2Payload {
  summary?: string;
  in_scope_findings?: InScopeFinding[];
  blocked_findings?: SidelinedFinding[];
  excluded_findings?: SidelinedFinding[];
  limitations?: string[];
  human_review?: HumanReview;
}

type Bucket = "scope" | "blocked" | "excluded";

// ── Shared style tokens (scoped to this page) ───────────────────────────────

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";

const BUCKET_ID_COLOR: Record<Bucket, string> = {
  scope: "text-[#2dd4bf]",
  blocked: "text-[#d9a95c]",
  excluded: "text-[#8b96ad]",
};
const BUCKET_BORDER: Record<Bucket, string> = {
  scope: "border-[#2dd4bf]",
  blocked: "border-[#d9a95c]",
  excluded: "border-[#38445e]",
};
const BUCKET_TAG_LABEL: Record<Bucket, string> = {
  scope: "", // uses the real requirement_type instead
  blocked: "blocked",
  excluded: "excluded",
};

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

// ── Scope boundary panel (hero) ──────────────────────────────────────────────

function ScopeBoundaryPanel({ payload }: { payload: R2Payload }) {
  const [expanded, setExpanded] = useState(false);
  const inScope = payload.in_scope_findings ?? [];
  const blocked = payload.blocked_findings ?? [];
  const excluded = payload.excluded_findings ?? [];
  const total = inScope.length + blocked.length + excluded.length;
  const percentageBase = total || 1;

  const pct = {
    scope: (inScope.length / percentageBase) * 100,
    blocked: (blocked.length / percentageBase) * 100,
    excluded: (excluded.length / percentageBase) * 100,
  };

  const summary = payload.summary ?? "";
  const needsToggle = summary.length > 340;

  return (
    <div className={`${PANEL} p-4 mb-4`}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <IconCrop size={16} className="text-[#8b96ad]" />
        <h2 className="text-sm font-medium text-[#e9eef7]">Scope boundary</h2>
        <span className="text-xs text-[#5c6780]">
          {total} R1 findings classified into the proposed R2 boundary
        </span>
      </div>

      <div className="flex h-2 w-full overflow-hidden rounded-full gap-px">
        <div className="bg-[#2dd4bf] transition-opacity hover:opacity-80" style={{ width: `${pct.scope}%` }} />
        <div className="bg-[#d9a95c] transition-opacity hover:opacity-80" style={{ width: `${pct.blocked}%` }} />
        <div className="bg-[#38445e] transition-opacity hover:opacity-80" style={{ width: `${pct.excluded}%` }} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px]">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#2dd4bf]" />
          <span className="font-semibold text-[#e9eef7]">{inScope.length} in scope</span>
          <span className="text-[#5c6780]">— proposed for the R2 boundary</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#d9a95c]" />
          <span className="font-semibold text-[#e9eef7]">{blocked.length} blocked</span>
          <span className="text-[#5c6780]">— blocked by the R2 review</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#38445e]" />
          <span className="font-semibold text-[#e9eef7]">{excluded.length} excluded</span>
          <span className="text-[#5c6780]">— excluded from the proposed boundary</span>
        </span>
      </div>

      {summary && (
        <>
          <div className="my-3 border-t border-[#1c2740]" />
          <p className={`text-[12px] leading-relaxed text-[#8b96ad] ${!expanded && needsToggle ? "line-clamp-3" : ""}`}>
            {summary}
          </p>
          {needsToggle && (
            <button
              className="mt-1 text-[12px] text-[#2dd4bf] hover:underline"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Show less" : "Full summary"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Findings panel (left) ────────────────────────────────────────────────────

interface RowItem {
  key: string;
  bucket: Bucket;
  id: string;
  typeTag: string;
  crossRef: string[];
  text: string;
}

function FindingsPanel({
  rows,
  selectedKey,
  onSelect,
}: {
  rows: Record<Bucket, RowItem[]>;
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  const [filter, setFilter] = useState<Bucket>("scope");
  const visible = rows[filter];

  const chip = (bucket: Bucket, label: string, count: number, activeClass: string) => (
    <button
      key={bucket}
      onClick={() => setFilter(bucket)}
      className={`px-2.5 py-1 rounded-full border text-[11px] transition-colors ${
        filter === bucket ? activeClass : "border-[#1c2740] text-[#8b96ad] hover:border-[#2a3a5c]"
      }`}
    >
      {label} {count}
    </button>
  );

  return (
    <div className={`${PANEL} flex flex-col`}>
      <div className="flex flex-wrap items-center gap-3 p-4 pb-3 border-b border-[#1c2740]">
        <IconListCheck size={16} className="text-[#8b96ad]" />
        <h2 className="text-sm font-medium text-[#e9eef7]">Findings</h2>
        <div className="ml-auto flex items-center gap-1.5">
          {chip("scope", "In scope", rows.scope.length, "border-[#2dd4bf]/40 bg-[#0f2e2c] text-[#2dd4bf]")}
          {chip("blocked", "Blocked", rows.blocked.length, "border-[#d9a95c]/40 bg-[#2a2013] text-[#d9a95c]")}
          {chip("excluded", "Excluded", rows.excluded.length, "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad]")}
        </div>
      </div>

      <div className="cockpit-track overflow-y-auto p-2" style={{ maxHeight: "330px" }}>
        {visible.length === 0 && (
          <div className="px-3 py-8 text-center text-[12px] text-[#5c6780]">
            No findings in this category.
          </div>
        )}
        {visible.map((row) => {
          const isSelected = row.key === selectedKey;
          return (
            <button
              key={row.key}
              onClick={() => onSelect(row.key)}
              className={`block w-full rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${
                isSelected
                  ? `bg-[#15203a] border-l-2 ${BUCKET_BORDER[row.bucket]} shadow-[inset_0_0_0_1px_rgba(45,212,191,0.15)]`
                  : "border-l-2 border-transparent hover:bg-[#15203a] hover:translate-x-0.5"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`font-mono text-[11px] font-semibold ${BUCKET_ID_COLOR[row.bucket]}`}>
                  {row.id}
                </span>
                <span className="px-1.5 py-0.5 rounded border border-[#2a3a5c] text-[9px] uppercase tracking-wide text-[#8b96ad]">
                  {row.typeTag}
                </span>
                {row.crossRef.length > 0 && (
                  <span
                    className={`ml-auto font-mono text-[10px] ${
                      row.bucket === "blocked" ? "text-[#d9a95c]" : "text-[#5c6780]"
                    }`}
                  >
                    {row.crossRef.join(" · ")}
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#8b96ad]">{row.text}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Detail panel (right) ─────────────────────────────────────────────────────

function CitationCard({ citation }: { citation: Citation }) {
  return (
    <div
      className="rounded-lg border-l-2 border-[#2dd4bf] p-3 transition-all duration-200 hover:-translate-y-0.5"
      style={{ backgroundColor: "#0b1220" }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 22px rgba(45,212,191,0.12)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="rounded border border-[#2a3a5c] px-1.5 py-0.5 font-mono text-[10px] text-[#8b96ad]">
          p. {citation.page}
        </span>
        <span className="text-[11px] text-[#5c6780] font-mono">
          {citation.source_ref} · {citation.source_file}
        </span>
        <IconExternalLink size={12} className="ml-auto text-[#5c6780]" />
      </div>
      <p className="text-[11.5px] italic leading-relaxed text-[#8b96ad]">
        “{citation.evidence_excerpt}”
      </p>
    </div>
  );
}

function DetailPanel({
  selected,
}: {
  selected: { bucket: Bucket; scope?: InScopeFinding; sidelined?: SidelinedFinding } | null;
}) {
  if (!selected) {
    return (
      <div className={`${PANEL} p-5 text-sm text-[#5c6780]`}>Select a finding to see its detail.</div>
    );
  }

  const { bucket } = selected;

  if (bucket === "scope" && selected.scope) {
    const f = selected.scope;
    return (
      <div className={`${PANEL} flex flex-col`}>
        <div className="flex flex-wrap items-center gap-2 p-4 pb-3 border-b border-[#1c2740]">
          <span className="font-mono text-sm font-semibold text-[#2dd4bf]">{f.r2_finding_id}</span>
          <span className="px-1.5 py-0.5 rounded border border-[#2a3a5c] text-[9px] uppercase tracking-wide text-[#8b96ad]">
            {f.requirement_type}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {f.approved_field_ids.map((id) => (
              <span key={id} className="rounded border border-[#2a3a5c] px-1.5 py-0.5 font-mono text-[10px] text-[#8b96ad] hover:border-[#2dd4bf]/40 hover:text-[#2dd4bf] transition-colors">
                {id}
              </span>
            ))}
            {f.r1_finding_refs.length > 0 && (
              <span className="rounded border border-[#2a3a5c] px-1.5 py-0.5 font-mono text-[10px] text-[#5c6780]">
                ← {f.r1_finding_refs.join(", ")}
              </span>
            )}
          </div>
        </div>

        <div className="cockpit-track overflow-y-auto p-4 space-y-3" style={{ maxHeight: "330px" }}>
          <p className="text-[12.5px] leading-relaxed text-[#e9eef7]">{f.statement}</p>

          <div
            className="rounded-lg border border-[#2dd4bf]/40 p-3"
            style={{ background: "linear-gradient(180deg, rgba(45,212,191,0.08), transparent 70%)" }}
          >
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#2dd4bf]">
              Assessment boundary
            </div>
            <p className="text-[11.5px] leading-relaxed text-[#8b96ad]">{f.assessment_boundary}</p>
          </div>

          {f.citations.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5c6780]">Evidence</span>
                <span className="rounded-full border border-[#1c2740] px-2 py-0.5 font-mono text-[10px] text-[#8b96ad]">
                  {f.citations[0].source_ref} · {f.citations[0].source_file}
                </span>
              </div>
              <div className="space-y-2">
                {f.citations.map((c, i) => (
                  <CitationCard key={i} citation={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Blocked / excluded — simpler layout, only reason + related fields exist.
  const s = selected.sidelined!;
  const isBlocked = bucket === "blocked";
  return (
    <div className={`${PANEL} flex flex-col`}>
      <div className="flex flex-wrap items-center gap-2 p-4 pb-3 border-b border-[#1c2740]">
        <span className={`font-mono text-sm font-semibold ${BUCKET_ID_COLOR[bucket]}`}>{s.r1_finding_id}</span>
        <span className="px-1.5 py-0.5 rounded border border-[#2a3a5c] text-[9px] uppercase tracking-wide text-[#8b96ad]">
          {BUCKET_TAG_LABEL[bucket]}
        </span>
        {s.related_field_ids.length > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {s.related_field_ids.map((id) => (
              <span
                key={id}
                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                  isBlocked ? "border-[#d9a95c]/40 text-[#d9a95c]" : "border-[#2a3a5c] text-[#8b96ad]"
                }`}
              >
                {id}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-4">
        <div
          className={`rounded-lg border p-3 ${
            isBlocked ? "border-[#d9a95c]/40" : "border-[#38445e]"
          }`}
          style={{
            background: isBlocked
              ? "linear-gradient(180deg, rgba(217,169,92,0.08), transparent 70%)"
              : "transparent",
          }}
        >
          <div
            className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${
              isBlocked ? "text-[#d9a95c]" : "text-[#8b96ad]"
            }`}
          >
            <IconAlertTriangle size={13} /> {BUCKET_TAG_LABEL[bucket]}
          </div>
          <p className="text-[12.5px] leading-relaxed text-[#8b96ad]">{s.reason}</p>
        </div>
      </div>
    </div>
  );
}

// ── Limitations strip ────────────────────────────────────────────────────────

function LimitationsStrip({ limitations }: { limitations: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? limitations : limitations.slice(0, 6);

  return (
    <div className={`${PANEL} p-4 mt-4`}>
      <div className="flex items-center gap-3 mb-3">
        <IconAlertTriangle size={16} className="text-[#d9a95c]" />
        <h2 className="text-sm font-medium text-[#e9eef7]">Limitations carried to downstream stages</h2>
        <span className="font-mono text-xs text-[#5c6780]">{limitations.length}</span>
        {limitations.length > 6 && (
          <button
            className="ml-auto flex items-center gap-1 rounded-full border border-[#1c2740] px-2.5 py-1 text-[11px] text-[#8b96ad] hover:border-[#2a3a5c] transition-colors"
            onClick={() => setExpanded((v) => !v)}
          >
            <IconChevronDown size={12} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Show fewer" : "Show all"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {visible.map((limitation, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg border border-[#1c2740] bg-[#111a2e] p-3">
            <IconAlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-[#d9a95c]" />
            <p className="text-[11.5px] leading-relaxed text-[#8b96ad]">{limitation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function R2Page() {
  const { envelope } = useAgentEnvelope("r2");
  const stageState = useAgentStageState("r2");
  const { run, selectedUsecase } = useRun();
  const p = envelope?.payload as R2Payload | undefined;
  const usecaseLabel = envelope?.registry_id
    ? formatUsecaseLabel(selectedUsecase, envelope.registry_id)
    : null;

  const isR2Gate = run?.status === "waiting_gate" && run.current_gate?.gate_id === "r2";
  const isComputing = stageState === "running" || stageState === "pending";

  const rows: Record<Bucket, RowItem[]> = useMemo(() => {
    const scope = (p?.in_scope_findings ?? []).map((f) => ({
      key: `scope:${f.r2_finding_id}`,
      bucket: "scope" as Bucket,
      id: f.r2_finding_id,
      typeTag: f.requirement_type,
      crossRef: f.r1_finding_refs,
      text: f.statement,
    }));
    const blocked = (p?.blocked_findings ?? []).map((f) => ({
      key: `blocked:${f.r1_finding_id}`,
      bucket: "blocked" as Bucket,
      id: f.r1_finding_id,
      typeTag: BUCKET_TAG_LABEL.blocked,
      crossRef: f.related_field_ids,
      text: f.reason,
    }));
    const excluded = (p?.excluded_findings ?? []).map((f) => ({
      key: `excluded:${f.r1_finding_id}`,
      bucket: "excluded" as Bucket,
      id: f.r1_finding_id,
      typeTag: BUCKET_TAG_LABEL.excluded,
      crossRef: f.related_field_ids,
      text: f.reason,
    }));
    return { scope, blocked, excluded };
  }, [p]);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedKeyExists = selectedKey
    ? Object.values(rows).some((bucketRows) => bucketRows.some((row) => row.key === selectedKey))
    : false;
  const effectiveKey = selectedKeyExists
    ? selectedKey
    : rows.scope[0]?.key ?? rows.blocked[0]?.key ?? rows.excluded[0]?.key ?? null;

  const selected = useMemo(() => {
    if (!effectiveKey || !p) return null;
    const [bucket, id] = effectiveKey.split(":") as [Bucket, string];
    if (bucket === "scope") {
      const f = p.in_scope_findings?.find((x) => x.r2_finding_id === id);
      return f ? { bucket, scope: f } : null;
    }
    const list = bucket === "blocked" ? p.blocked_findings : p.excluded_findings;
    const f = list?.find((x) => x.r1_finding_id === id);
    return f ? { bucket, sidelined: f } : null;
  }, [effectiveKey, p]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 max-w-[1400px] mx-auto w-full flex-1">
        <div className="mb-2 flex items-baseline gap-3 flex-wrap">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">R2</span>{" "}
            <span className="text-[#e9eef7]">— Scope review</span>
          </h1>
          {usecaseLabel && <span className="text-xs text-[#5c6780]">{usecaseLabel}</span>}
        </div>
        <p className="mb-5 max-w-[92ch] text-sm text-[#8b96ad]">
          Reviews the regulation boundary together with the DA1 data mapping and frames the final
          scope: which R1 findings survive as in-scope, which are blocked by unresolved fields, and
          which fall outside the boundary.
        </p>

        {isR2Gate && run?.current_gate && (
          <ApprovalPendingBanner gateId={run.current_gate.gate_id} />
        )}

        {isComputing && !isR2Gate ? (
          <StageLoading agentLabel="R2" agentName="Scope Review" />
        ) : (
          <>
            <ArtifactBar envelope={envelope} agent="R2" />

            {p && (
              <>
                <ScopeBoundaryPanel payload={p} />

                <div className="grid gap-3.5" style={{ gridTemplateColumns: "minmax(0,.85fr) minmax(0,1.15fr)" }}>
                  <FindingsPanel rows={rows} selectedKey={effectiveKey ?? ""} onSelect={setSelectedKey} />
                  <DetailPanel selected={selected} />
                </div>

                {p.limitations && p.limitations.length > 0 && <LimitationsStrip limitations={p.limitations} />}

                <RawPayloadFooter payload={p} filename="r2-payload.json" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
