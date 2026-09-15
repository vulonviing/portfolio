/**
 * DA1Page — catalog mapping and human-approved data boundary.
 *
 * The live field gate renders DA1's proposal as a review input. Completed
 * artifacts render human_decisions and handoff_data_request as the authority;
 * mapping_report remains available as the proposal/audit record.
 */
import { useState } from "react";
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconDatabase,
  IconRoute,
} from "@tabler/icons-react";
import ApprovalPendingBanner from "../../components/ApprovalPendingBanner";
import ArtifactBar from "../../components/ArtifactBar";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import StageLoading from "../../components/StageLoading";
import ErrorBoundary from "../../components/ErrorBoundary";
import DA1MappingBoard from "../../components/da1/DA1MappingBoard";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { useAgentStageState } from "../../lib/useAgentStageState";
import { useRun } from "../../context/RunContext";
import type {
  CatalogShape,
  DA1HandoffDataRequest,
  DA1HumanDecision,
  DA1MappingReport,
  DA1Payload,
  FieldMapping,
} from "../../api/types";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";

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

function formatKey(key: string): string {
  return key.replace(/_/g, " ");
}

function StructuredValue({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="font-mono text-[#5c6780]">null</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="font-mono text-[#5c6780]">[]</span>;
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, index) => (
          <span
            key={`${index}-${JSON.stringify(item)}`}
            className="rounded border border-[#2a3a5c] bg-[#111a2e] px-2 py-0.5 font-mono text-[10px] text-[#8b96ad]"
          >
            {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return <span className="font-mono text-[#5c6780]">{"{}"}</span>;
    }
    return (
      <div className="space-y-1.5">
        {entries.map(([key, nested]) => (
          <div key={key} className="grid grid-cols-[130px_minmax(0,1fr)] gap-3">
            <span className="text-[#5c6780]">{formatKey(key)}</span>
            <StructuredValue value={nested} />
          </div>
        ))}
      </div>
    );
  }
  return <span className="font-mono text-[#c7d0df]">{String(value)}</span>;
}

function StructuredObject({
  value,
  omit = [],
}: {
  value: Record<string, unknown>;
  omit?: string[];
}) {
  const entries = Object.entries(value).filter(([key]) => !omit.includes(key));
  return (
    <div className="divide-y divide-[#1c2740]">
      {entries.map(([key, item]) => (
        <div
          key={key}
          className="grid grid-cols-[180px_minmax(0,1fr)] gap-4 px-4 py-2.5 text-[11.5px]"
        >
          <span className="capitalize text-[#5c6780]">{formatKey(key)}</span>
          <StructuredValue value={item} />
        </div>
      ))}
    </div>
  );
}

function HandoffPanel({ handoff }: { handoff?: DA1HandoffDataRequest }) {
  const [expanded, setExpanded] = useState(false);
  if (!handoff) return null;
  const raw = handoff as Record<string, unknown>;

  return (
    <section className={`${PANEL} mb-4`}>
      <button
        className={`flex w-full items-center gap-3 p-4 text-left ${
          expanded ? "border-b border-[#1c2740]" : ""
        }`}
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <IconRoute size={17} className="text-[#2dd4bf]" />
        <span className="text-sm font-medium text-[#e9eef7]">Final handoff data request</span>
        {handoff.request_id && (
          <span className="ml-auto font-mono text-[10px] text-[#5c6780]">
            {handoff.request_id}
          </span>
        )}
        <IconChevronDown
          size={15}
          className={`text-[#5c6780] transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <>
          {handoff.intent && (
            <p className="border-b border-[#1c2740] px-4 py-3 text-[12px] leading-relaxed text-[#8b96ad]">
              {handoff.intent}
            </p>
          )}
          <StructuredObject value={raw} omit={["intent", "request_id"]} />
        </>
      )}
    </section>
  );
}

function ProposalAuditPanel({ report }: { report?: DA1MappingReport }) {
  const [expanded, setExpanded] = useState(false);
  if (!report) return null;

  const validation = report.validation;
  const errors = validation?.errors ?? [];
  const warnings = validation?.warnings ?? [];
  const notes = report.notes ?? [];

  return (
    <section className={`${PANEL} mb-4`}>
      <button
        className="flex w-full items-center gap-3 p-4 text-left"
        onClick={() => setExpanded((value) => !value)}
      >
        <IconDatabase size={17} className="text-[#8b96ad]" />
        <span className="text-sm font-medium text-[#e9eef7]">DA1 proposal audit</span>
        {validation?.ok !== undefined && (
          <span className="font-mono text-[10px] text-[#5c6780]">
            validation.ok = {String(validation.ok)}
          </span>
        )}
        <span className="ml-auto text-[11px] text-[#5c6780]">
          {errors.length} errors · {warnings.length} warnings · {notes.length} notes
        </span>
        <IconChevronDown
          size={15}
          className={`text-[#5c6780] transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-[#1c2740] p-4">
          {report.summary && (
            <p className="mb-4 text-[12px] leading-relaxed text-[#8b96ad]">
              {report.summary}
            </p>
          )}

          {errors.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-red-400">
                <IconAlertTriangle size={14} /> Errors
              </div>
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <p key={`${index}-${error}`} className="rounded-lg border border-red-700/30 bg-red-900/10 p-3 text-[11.5px] text-red-300">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#d9a95c]">
                <IconAlertTriangle size={14} /> Warnings
              </div>
              <div className="space-y-2">
                {warnings.map((warning, index) => (
                  <p key={`${index}-${warning}`} className="rounded-lg border border-[#d9a95c]/25 bg-[#2a2013]/35 p-3 text-[11.5px] text-[#bba475]">
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          )}

          {notes.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 text-[11px] uppercase tracking-wide text-[#8b96ad]">
                Notes
              </div>
              <div className="space-y-2">
                {notes.map((note, index) => (
                  <p key={`${index}-${note}`} className="rounded-lg border border-[#1c2740] bg-[#111a2e] p-3 text-[11.5px] leading-relaxed text-[#8b96ad]">
                    {note}
                  </p>
                ))}
              </div>
            </div>
          )}

          {report.suggested_request && (
            <div>
              <div className="mb-2 text-[11px] uppercase tracking-wide text-[#8b96ad]">
                Suggested request
              </div>
              <div className="overflow-hidden rounded-lg border border-[#1c2740] bg-[#111a2e]">
                <StructuredObject value={report.suggested_request as Record<string, unknown>} />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function DA1Page() {
  const { envelope } = useAgentEnvelope("da1");
  const stageState = useAgentStageState("da1");
  const { run, selectedUsecase } = useRun();
  const payload = envelope?.payload as DA1Payload | undefined;

  const isDA1FieldsGate =
    run?.status === "waiting_gate" &&
    run.current_gate?.gate_id === "da1_fields";
  const isDA1ScopeGate =
    run?.status === "waiting_gate" &&
    run.current_gate?.gate_id === "da1_scope";
  const isDA1Gate = isDA1FieldsGate || isDA1ScopeGate;
  const isComputing = stageState === "running" || stageState === "pending";

  const mappingReport = payload?.mapping_report;
  const approvedScope = payload?.approved_mapping_scope;
  const persistedFields: FieldMapping[] =
    mappingReport?.field_mappings ?? approvedScope?.approved_mappings ?? [];
  const persistedCatalog: CatalogShape | undefined = payload?.catalog_snapshot;
  const humanDecisions: DA1HumanDecision[] =
    payload?.human_decisions ?? approvedScope?.human_decisions ?? [];
  const handoff =
    payload?.handoff_data_request ?? approvedScope?.handoff_data_request;

  const registryId = isDA1Gate
    ? run?.registry_id
    : envelope?.registry_id;
  const usecaseLabel = registryId
    ? formatUsecaseLabel(selectedUsecase, registryId)
    : null;

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-4 sm:px-4 sm:py-5 xl:px-6">
        <div className="mb-5 flex flex-wrap items-baseline gap-3">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">DA1</span>{" "}
            <span className="text-[#e9eef7]">— Catalog mapping</span>
          </h1>
          {usecaseLabel && (
            <span className="text-xs text-[#5c6780]">{usecaseLabel}</span>
          )}
        </div>
        <p className="mb-5 max-w-[92ch] text-sm text-[#8b96ad]">
          Maps R1 regulation fields to entries in the runtime data catalog. The
          human-reviewed decisions and final handoff define the approved data
          boundary for downstream stages.
        </p>

        {isDA1Gate && run?.current_gate && (
          <ApprovalPendingBanner gateId={run.current_gate.gate_id} />
        )}

        {!isDA1Gate && isComputing && (
          <StageLoading agentLabel="DA1" agentName="Catalog Mapping" />
        )}

        {!isDA1Gate && !isComputing && !envelope && (
          <div className={`${PANEL} p-5 text-sm text-[#5c6780]`}>
            No artifact yet — run the pipeline to generate this agent's output.
          </div>
        )}

        {!isDA1Gate && !isComputing && envelope && (
          <>
            <ArtifactBar envelope={envelope} agent="DA1" />
            <HandoffPanel handoff={handoff} />

            {persistedFields.length > 0 && persistedCatalog ? (
              <div className="mb-5">
                <div className="mb-3 flex items-center gap-2 text-xs text-[#5c6780]">
                  <IconCheck size={14} className="text-[#2dd4bf]" />
                  Human decisions and selected catalog targets — read only
                </div>
                <ErrorBoundary label="DA1 mapping board (completed)">
                  <DA1MappingBoard
                    key={envelope.artifact_id}
                    fields={persistedFields}
                    catalog={persistedCatalog}
                    humanDecisions={humanDecisions}
                    readOnly
                  />
                </ErrorBoundary>
              </div>
            ) : (
              <div className={`${PANEL} mb-4 p-5 text-sm text-[#5c6780]`}>
                This artifact does not contain mapping fields and a catalog snapshot.
              </div>
            )}

            <ProposalAuditPanel
              key={`audit-${envelope.artifact_id}`}
              report={mappingReport}
            />
            {payload && (
              <RawPayloadFooter payload={payload} filename="da1-payload.json" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
