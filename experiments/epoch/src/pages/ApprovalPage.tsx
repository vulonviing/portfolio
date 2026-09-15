import { useState } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconDatabase,
  IconFileDescription,
  IconShieldCheck,
  IconUserCheck,
  IconX,
} from "@tabler/icons-react";
import type { ExternalCommentary, ShelfEnvelope } from "../api/types";
import RawPayloadFooter from "../components/RawPayloadFooter";
import { ExternalCommentaryBullets } from "../components/external/ExternalCommentaryView";
import { useRun } from "../context/RunContext";
import { useActiveSet } from "../lib/useActiveSet";
import {
  approvalByKey,
  approvalVisualState,
  type ApprovalKey,
  type ApprovalVisualState,
} from "../lib/approvalGates";
import { routeForUsecase } from "../lib/routes";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const REVIEWER = "****";

const STATE_META: Record<
  ApprovalVisualState,
  { label: string; description: string; accent: string; text: string }
> = {
  queued: {
    label: "Queued",
    description: "Waiting for the pipeline to reach this gate.",
    accent: "bg-[#38445e]",
    text: "text-[#8b96ad]",
  },
  active: {
    label: "Awaiting review",
    description: "The pipeline is paused for a human decision.",
    accent: "bg-[#d9a95c]",
    text: "text-[#d9a95c]",
  },
  approved: {
    label: "Approved",
    description: "The reviewed payload may continue downstream.",
    accent: "bg-[#2dd4bf]",
    text: "text-[#2dd4bf]",
  },
  rejected: {
    label: "Rejected",
    description: "This branch stopped at the approval gate.",
    accent: "bg-red-400",
    text: "text-red-300",
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(String).join(" → ");
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return Object.keys(asRecord(value)).length === 0 ? "{}" : String(value);
  return String(value);
}

function StructuredValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="font-mono text-sm text-[#8b96ad]">[]</span>;
    }
    return (
      <div className="overflow-hidden rounded-lg border border-[#1c2740] bg-[#0a101d]/55">
        {value.map((item, index) => (
          <div
            key={index}
            className="grid gap-1 border-b border-[#1c2740] px-3 py-2 last:border-b-0 sm:grid-cols-[90px_minmax(0,1fr)] sm:gap-3"
          >
            <span className="font-mono text-xs text-[#5c6780]">[{index}]</span>
            <StructuredValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return <span className="font-mono text-sm text-[#8b96ad]">{"{}"}</span>;
    }
    return (
      <div
        className={`overflow-hidden rounded-lg border border-[#1c2740] ${
          depth > 0 ? "bg-[#0d1424]" : "bg-[#0a101d]/55"
        }`}
      >
        {entries.map(([key, nestedValue]) => (
          <div
            key={key}
            className="grid gap-1 border-b border-[#1c2740] px-3 py-2 last:border-b-0 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-3"
          >
            <span className="break-words font-mono text-xs text-[#69758e]">{key}</span>
            <StructuredValue value={nestedValue} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <span className="break-words text-sm leading-relaxed text-[#c3cbdd]">
      {displayValue(value)}
    </span>
  );
}

function Metric({
  jsonKey,
  value,
  suffix,
}: {
  jsonKey: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-[#1c2740] bg-[#111a2e] px-4 py-3">
      <div className="font-mono text-xs text-[#69758e]">{jsonKey}</div>
      <div className="mt-1.5 text-lg font-medium text-[#e9eef7]">
        {value}
        {suffix && <span className="ml-1.5 text-sm font-normal text-[#69758e]">{suffix}</span>}
      </div>
    </div>
  );
}

function FieldRow({ jsonKey, value }: { jsonKey: string; value: unknown }) {
  return (
    <div className="grid gap-1 border-b border-[#1c2740] py-2.5 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <span className="font-mono text-xs text-[#69758e]">{jsonKey}</span>
      <StructuredValue value={value} />
    </div>
  );
}

function ExpandableText({
  jsonKey,
  text,
}: {
  jsonKey: string;
  text: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = text.length > 420;
  const visible = needsToggle && !expanded ? `${text.slice(0, 420).trim()}…` : text;
  return (
    <div className="border-t border-[#1c2740] pt-4">
      <div className="mb-2 font-mono text-xs text-[#69758e]">{jsonKey}</div>
      <p className="text-sm leading-6 text-[#aeb8cc]">{visible}</p>
      {needsToggle && (
        <button
          className="mt-2 text-sm text-[#2dd4bf] hover:underline"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Show full value"}
        </button>
      )}
    </div>
  );
}

function CatalogSummary({ payload }: { payload: Record<string, unknown> }) {
  const mappingReport = asRecord(payload.mapping_report);
  const approvedScope = asRecord(payload.approved_mapping_scope);
  const fields =
    (payload.field_mappings as unknown[] | undefined) ??
    (mappingReport.field_mappings as unknown[] | undefined) ??
    (approvedScope.approved_mappings as unknown[] | undefined) ??
    [];
  const decisions =
    (payload.human_decisions as unknown[] | undefined) ??
    (approvedScope.human_decisions as unknown[] | undefined) ??
    [];
  const handoff =
    Object.keys(asRecord(payload.handoff_data_request)).length > 0
      ? asRecord(payload.handoff_data_request)
      : asRecord(approvedScope.handoff_data_request);
  const decisionCounts = decisions.reduce<Record<string, number>>((counts, item) => {
    const decision = String(asRecord(item).decision ?? "unknown");
    counts[decision] = (counts[decision] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric jsonKey="field_mappings" value={fields.length} suffix="entries" />
        <Metric jsonKey="human_decisions" value={decisions.length} suffix="entries" />
        <Metric
          jsonKey="approved_field_ids"
          value={asArray(handoff.approved_field_ids).length}
          suffix="entries"
        />
      </div>
      {Object.keys(decisionCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(decisionCounts).map(([decision, count]) => (
            <span
              key={decision}
              className="rounded-full border border-[#2a3a5c] bg-[#111a2e] px-3 py-1 text-sm text-[#aeb8cc]"
            >
              <span className="font-mono text-[#2dd4bf]">{count}</span> {decision}
            </span>
          ))}
        </div>
      )}
      {Object.keys(handoff).length > 0 && (
        <div>
          <FieldRow jsonKey="time_window" value={handoff.time_window} />
          <FieldRow jsonKey="time_grain" value={handoff.time_grain} />
          <FieldRow jsonKey="filters" value={handoff.filters ?? {}} />
        </div>
      )}
    </div>
  );
}

function ScopeSummary({ payload }: { payload: Record<string, unknown> }) {
  const humanReview = asRecord(payload.human_review);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric jsonKey="in_scope_findings" value={asArray(payload.in_scope_findings).length} />
        <Metric jsonKey="blocked_findings" value={asArray(payload.blocked_findings).length} />
        <Metric jsonKey="excluded_findings" value={asArray(payload.excluded_findings).length} />
      </div>
      {Object.keys(humanReview).length > 0 && (
        <div>
          <FieldRow jsonKey="human_review.decision" value={humanReview.decision} />
          <FieldRow jsonKey="human_review.reviewed_at" value={humanReview.reviewed_at} />
        </div>
      )}
      {typeof payload.summary === "string" && (
        <ExpandableText jsonKey="summary" text={payload.summary} />
      )}
      <FieldRow jsonKey="limitations" value={`${asArray(payload.limitations).length} entries`} />
    </div>
  );
}

function ProfileSummary({ payload }: { payload: Record<string, unknown> }) {
  const outputProfile = asRecord(payload.output_profile);
  return (
    <div className="grid gap-x-6 lg:grid-cols-2">
      <div>
        <FieldRow jsonKey="task_type" value={payload.task_type} />
        <FieldRow jsonKey="assurance_level" value={payload.assurance_level} />
        <FieldRow jsonKey="risk_level" value={payload.risk_level} />
        <FieldRow jsonKey="uncertainty" value={payload.uncertainty} />
        <FieldRow jsonKey="deadline_proximity_days" value={payload.deadline_proximity_days} />
      </div>
      <div>
        <FieldRow jsonKey="output_profile.output_type" value={outputProfile.output_type} />
        <FieldRow jsonKey="output_profile.form" value={outputProfile.form} />
        <FieldRow jsonKey="dual_method_required" value={payload.dual_method_required} />
        <FieldRow jsonKey="cross_functional_need" value={payload.cross_functional_need} />
        <FieldRow jsonKey="limitations" value={`${asArray(payload.limitations).length} entries`} />
      </div>
    </div>
  );
}

function TopologySummary({ payload }: { payload: Record<string, unknown> }) {
  const scores = asRecord(payload.topology_scores);
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#2dd4bf]/30 bg-[#0f2e2c]/40 p-4">
        <div className="font-mono text-xs text-[#6faaa3]">selected_topology_id</div>
        <div className="mt-1.5 text-xl font-medium text-[#2dd4bf]">
          {displayValue(payload.selected_topology_id)}
        </div>
      </div>
      <div>
        {Object.entries(scores).map(([topologyId, score]) => (
          <FieldRow key={topologyId} jsonKey={`topology_scores.${topologyId}`} value={score} />
        ))}
      </div>
      {typeof payload.rationale === "string" && (
        <ExpandableText jsonKey="rationale" text={payload.rationale} />
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric jsonKey="alternatives" value={asArray(payload.alternatives).length} />
        <Metric jsonKey="bindings" value={asArray(payload.bindings).length} />
        <Metric jsonKey="limitations" value={asArray(payload.limitations).length} />
      </div>
    </div>
  );
}

function PayloadSummary({
  approvalKey,
  payload,
}: {
  approvalKey: ApprovalKey;
  payload: Record<string, unknown>;
}) {
  if (approvalKey === "catalog") return <CatalogSummary payload={payload} />;
  if (approvalKey === "scope") return <ScopeSummary payload={payload} />;
  if (approvalKey === "profile") return <ProfileSummary payload={payload} />;
  return <TopologySummary payload={payload} />;
}

function StateIcon({ state }: { state: ApprovalVisualState }) {
  if (state === "approved") return <IconCheck size={19} />;
  if (state === "rejected") return <IconX size={19} />;
  if (state === "active") return <IconUserCheck size={19} />;
  return <IconClock size={19} />;
}

function approvalTime(
  approvalKey: ApprovalKey,
  payload: Record<string, unknown> | undefined,
  envelope: ShelfEnvelope | null | undefined,
): string | null {
  if (!payload) return envelope?.approved_at ?? null;
  if (approvalKey === "catalog") {
    return String(asRecord(payload.approved_mapping_scope).approved_at ?? envelope?.approved_at ?? "") || null;
  }
  if (approvalKey === "scope") {
    return String(asRecord(payload.human_review).reviewed_at ?? envelope?.approved_at ?? "") || null;
  }
  return envelope?.approved_at ?? null;
}

function AuditRail({
  state,
  approvalKey,
  payload,
  envelope,
  runId,
  children,
}: {
  state: ApprovalVisualState;
  approvalKey: ApprovalKey;
  payload: Record<string, unknown> | undefined;
  envelope: ShelfEnvelope | null | undefined;
  runId?: string;
  children?: React.ReactNode;
}) {
  const meta = STATE_META[state];
  const reviewedAt = approvalTime(approvalKey, payload, envelope);
  return (
    <aside className={`${PANEL} relative overflow-hidden lg:sticky lg:top-6`}>
      <div className={`h-1 w-full ${meta.accent}`} />
      <div className="p-5">
        <div className={`flex items-center gap-2.5 ${meta.text}`}>
          <StateIcon state={state} />
          <span className="text-base font-semibold">{meta.label}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[#8b96ad]">{meta.description}</p>

        <div className="my-4 border-t border-[#1c2740]" />

        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs text-[#5c6780]">Reviewer</div>
            <div className="mt-0.5 font-medium text-[#e9eef7]">{REVIEWER}</div>
          </div>
          {reviewedAt && (
            <div>
              <div className="text-xs text-[#5c6780]">Decision time</div>
              <div className="mt-0.5 text-[#c3cbdd]">
                {new Date(reviewedAt).toLocaleString()}
              </div>
            </div>
          )}
          {envelope?.artifact_id && (
            <div>
              <div className="text-xs text-[#5c6780]">artifact_id</div>
              <div className="mt-0.5 break-all font-mono text-xs text-[#8b96ad]">
                {envelope.artifact_id}
              </div>
            </div>
          )}
          {(runId || envelope?.run_id) && (
            <div>
              <div className="text-xs text-[#5c6780]">run_id</div>
              <div className="mt-0.5 break-all font-mono text-xs text-[#8b96ad]">
                {runId ?? envelope?.run_id}
              </div>
            </div>
          )}
          {envelope?.review_round !== undefined && (
            <div>
              <div className="text-xs text-[#5c6780]">review_round</div>
              <div className="mt-0.5 font-mono text-xs text-[#8b96ad]">
                {envelope.review_round}
              </div>
            </div>
          )}
        </div>

        {children && (
          <>
            <div className="my-4 border-t border-[#1c2740]" />
            {children}
          </>
        )}
      </div>
    </aside>
  );
}

export default function ApprovalPage({ approvalKey }: { approvalKey: ApprovalKey }) {
  const approval = approvalByKey("tabular", approvalKey);
  const { selectedUsecase, stageState } = useRun();
  const { data: activeSet } = useActiveSet(selectedUsecase);

  const envelope = activeSet?.agents[approval.artifactKey];
  const state = approvalVisualState(
    approval,
    null,
    stageState(approval.afterStage),
    undefined,
  );
  const reviewPayload = envelope?.payload as Record<string, unknown> | undefined;
  const sourceLabel = envelope ? "published artifact payload" : "no payload";

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-[1080px] flex-1 px-6 py-6">
        <Link
          to={routeForUsecase(selectedUsecase, "/overview")}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-[#69758e] transition-colors hover:text-[#aeb8cc]"
        >
          <IconArrowLeft size={14} /> Pipeline overview
        </Link>

        <header className="mb-5 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-medium text-[#e9eef7]">{approval.label}</h1>
          <span className="rounded-md border border-[#2a3a5c] px-2 py-1 font-mono text-xs text-[#8b96ad]">
            {approval.agentKey}
          </span>
          {selectedUsecase && (
            <span className="rounded-md border border-[#2a3a5c] px-2 py-1 font-mono text-xs text-[#8b96ad]">
              UC{selectedUsecase}
            </span>
          )}
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <main className={`${PANEL} overflow-hidden`}>
            <div className="flex flex-wrap items-center gap-3 border-b border-[#1c2740] px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1c2740] bg-[#111a2e] text-[#8b96ad]">
                {approvalKey === "catalog" ? <IconDatabase size={16} /> : <IconFileDescription size={16} />}
              </span>
              <div>
                <h2 className="text-base font-medium text-[#e9eef7]">Review payload</h2>
                <div className="mt-0.5 font-mono text-xs text-[#69758e]">{sourceLabel}</div>
              </div>
              <Link
                to={routeForUsecase(selectedUsecase, approval.agentPath)}
                className="ml-auto text-sm text-[#2dd4bf] hover:underline"
              >
                Open {approval.agentKey} output →
              </Link>
            </div>
            <div className="p-5">
              {reviewPayload ? (
                <PayloadSummary approvalKey={approval.key} payload={reviewPayload} />
              ) : (
                <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                  <IconShieldCheck size={24} className="mb-3 text-[#38445e]" />
                  <p className="text-sm text-[#69758e]">
                    No review payload is available for this gate yet.
                  </p>
                </div>
              )}
            </div>
          </main>

          <AuditRail
            state={state}
            approvalKey={approval.key}
            payload={reviewPayload}
            envelope={envelope}
          />
        </div>

        {!!(reviewPayload?.ex1 || reviewPayload?.ex2) && (
          <div className={`${PANEL} mt-4 overflow-hidden`}>
            <div className="border-b border-[#1c2740] px-5 py-4">
              <h2 className="text-base font-medium text-[#e9eef7]">External Perspective</h2>
              <p className="mt-0.5 font-mono text-xs text-[#69758e]">
                {reviewPayload.ex1 ? "EX1" : "EX2"} — advisory only, not part of this decision
              </p>
            </div>
            <div className="p-5">
              <ExternalCommentaryBullets
                commentary={(reviewPayload.ex1 ?? reviewPayload.ex2) as unknown as ExternalCommentary}
              />
            </div>
          </div>
        )}

        {reviewPayload && (
          <RawPayloadFooter
            payload={reviewPayload}
            filename={`${approval.key}-approval-payload.json`}
          />
        )}
      </div>
    </div>
  );
}
