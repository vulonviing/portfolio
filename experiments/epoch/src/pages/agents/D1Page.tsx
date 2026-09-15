/**
 * D1Page — "Data load" detail screen.
 *
 * D1 is deterministic (no LLM). This screen renders only D1's own payload:
 * the normalized request it executed and the summary of tables it delivered.
 * Approved PF identifiers are audit references, not physical column names.
 */
import { useState } from "react";
import {
  IconLock,
  IconCircleCheck,
  IconArrowsExchange,
  IconCheck,
  IconAlertTriangle,
  IconTable,
  IconTarget,
  IconChevronDown,
} from "@tabler/icons-react";
import ArtifactBar from "../../components/ArtifactBar";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import StageLoading from "../../components/StageLoading";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { useAgentStageState } from "../../lib/useAgentStageState";
import type { MaskedNumber } from "../../lib/maskedValues";

interface Validation {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

interface DataRequest {
  request_id: string;
  intent: string;
  source_domain: string;
  entity_grain: string;
  time_grain: string;
  time_window: { start: string; end: string };
  filters: Record<string, unknown>;
  measures: string[];
  quality_policy: string;
  approved_field_ids: string[];
  validation: Validation;
}

interface TableDetail {
  row_count: number;
  column_count: number;
  columns: string[];
  quality_summary: Record<string, Record<string, MaskedNumber>>;
}

interface D1Summary {
  tables: string[];
  total_rows: number;
  measures: string[];
  grain: string;
  time_range: [string, string];
  requested_time_range: [string, string];
  effective_time_range: [string, string];
  time_window_clamped: boolean;
  source_domain: string;
  quality_policy: string;
  tables_detail: Record<string, TableDetail>;
  validation: Validation;
}

interface D1Payload {
  data_request: DataRequest;
  summary: D1Summary;
}

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function sameMembers(left: string[], right: string[]): boolean {
  const a = [...new Set(left)].sort();
  const b = [...new Set(right)].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function CompareRow({
  label,
  requested,
  delivered,
  ok,
}: {
  label: string;
  requested: string;
  delivered: string;
  ok: boolean;
}) {
  return (
    <div
      className="grid items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 transition-all duration-200 hover:border-[#2dd4bf] hover:bg-[#15203a]"
      style={{ gridTemplateColumns: "112px minmax(0,1fr) 16px minmax(0,1fr) 16px" }}
    >
      <span className="text-[12px] text-[#8b96ad]">{label}</span>
      <span className="truncate font-mono text-[11.5px] text-[#5c6780]">{requested}</span>
      <span className="text-[#5c6780]">→</span>
      <span className="truncate font-mono text-[11.5px] font-medium text-[#e9eef7]">{delivered}</span>
      {ok ? (
        <IconCheck size={14} className="text-[#2dd4bf]" />
      ) : (
        <IconAlertTriangle size={14} className="text-[#d9a95c]" />
      )}
    </div>
  );
}

export default function D1Page() {
  const { envelope } = useAgentEnvelope("d1");
  const stageState = useAgentStageState("d1");
  const p = envelope?.payload as D1Payload | undefined;
  const [intentExpanded, setIntentExpanded] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const isComputing = stageState === "running" || stageState === "pending";
  const tableNames = p?.summary.tables ?? [];
  const activeTableName =
    selectedTable && tableNames.includes(selectedTable) ? selectedTable : tableNames[0];
  const activeTable = activeTableName
    ? p?.summary.tables_detail[activeTableName]
    : undefined;
  const requestedGrain = p
    ? `${p.data_request.entity_grain} × ${p.data_request.time_grain}`
    : "";
  const deliveredRequestedMeasures = p
    ? p.data_request.measures.filter((measure) => p.summary.measures.includes(measure))
    : [];
  const filters = p ? Object.entries(p.data_request.filters) : [];
  const validation = p?.summary.validation;

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1400px] flex-1 p-6">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">D1</span>{" "}
            <span className="text-[#e9eef7]">— Data load</span>
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1c2740] px-2.5 py-0.5 text-[11px] text-[#8b96ad]">
            <IconLock size={12} />
            deterministic · no model
          </span>
        </div>
        <p className="mb-5 max-w-[92ch] text-sm text-[#8b96ad]">
          Executes the human-approved DA1 handoff deterministically. This screen shows
          the normalized request and the tables reported in D1&apos;s own output.
        </p>

        {isComputing ? (
          <StageLoading agentLabel="D1" agentName="Data Load" />
        ) : (
          <>
            <ArtifactBar envelope={envelope} />

            {p && (
              <>
                <div className={`${PANEL} mb-4 p-4`}>
                  <div className="flex flex-wrap items-start gap-3">
                    {validation?.ok ? (
                      <IconCircleCheck size={22} className="text-[#2dd4bf]" />
                    ) : (
                      <IconAlertTriangle size={22} className="text-[#d9a95c]" />
                    )}
                    <div>
                      <div className="text-[15px] font-medium text-[#e9eef7]">
                        {validation?.ok
                          ? "Request validation passed"
                          : "Request validation issues reported"}
                      </div>
                      <div className="mt-0.5 text-[12px] text-[#8b96ad]">
                        {validation?.errors.length ?? 0} errors ·{" "}
                        {validation?.warnings.length ?? 0} warnings · time window{" "}
                        {p.summary.time_window_clamped ? "clamped" : "not clamped"} · quality policy{" "}
                        <span className="font-mono">{p.summary.quality_policy}</span>
                      </div>
                    </div>
                    <span className="ml-auto rounded-full border border-[#1c2740] px-3 py-1 font-mono text-[11px] text-[#8b96ad]">
                      {p.data_request.request_id}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                    {[
                      { value: String(p.summary.total_rows), label: "rows reported" },
                      { value: String(tableNames.length), label: "tables reported" },
                      { value: String(p.summary.measures.length), label: "output measures" },
                      {
                        value: String(p.data_request.approved_field_ids.length),
                        label: "approved field refs",
                      },
                      { value: p.summary.grain, label: "delivered grain" },
                    ].map((tile) => (
                      <div
                        key={tile.label}
                        className={`${CARD} p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2dd4bf] hover:shadow-[0_6px_22px_rgba(45,212,191,0.12)]`}
                      >
                        <div className="font-mono text-[17px] text-[#e9eef7]">{tile.value}</div>
                        <div className="mt-0.5 text-[11px] text-[#5c6780]">{tile.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="grid gap-3.5"
                  style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}
                >
                  <div className={PANEL}>
                    <div className="flex items-center gap-3 border-b border-[#1c2740] p-4 pb-3">
                      <IconArrowsExchange size={16} className="text-[#8b96ad]" />
                      <h2 className="text-sm font-medium text-[#e9eef7]">Request → load</h2>
                      <span className="ml-auto rounded-full border border-[#2dd4bf]/40 bg-[#0f2e2c] px-2.5 py-0.5 text-[11px] text-[#2dd4bf]">
                        D1 payload
                      </span>
                    </div>

                    <div className="p-2">
                      <CompareRow
                        label="Source domain"
                        requested={p.data_request.source_domain}
                        delivered={p.summary.source_domain}
                        ok={p.data_request.source_domain === p.summary.source_domain}
                      />
                      <CompareRow
                        label="Grain"
                        requested={requestedGrain}
                        delivered={p.summary.grain}
                        ok={requestedGrain === p.summary.grain}
                      />
                      <CompareRow
                        label="Measures"
                        requested={p.data_request.measures.join(", ") || "—"}
                        delivered={deliveredRequestedMeasures.join(", ") || "—"}
                        ok={sameMembers(p.data_request.measures, deliveredRequestedMeasures)}
                      />
                      <CompareRow
                        label="Quality policy"
                        requested={p.data_request.quality_policy}
                        delivered={p.summary.quality_policy}
                        ok={p.data_request.quality_policy === p.summary.quality_policy}
                      />
                    </div>

                    <div className="border-t border-[#1c2740] px-4 py-3">
                      <div className="mb-2 text-[11px] uppercase tracking-wide text-[#5c6780]">
                        Executed filters
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {filters.length > 0 ? (
                          filters.map(([key, value]) => (
                            <span
                              key={key}
                              className="rounded border border-[#2a3a5c] bg-[#111a2e] px-2 py-1 font-mono text-[10.5px] text-[#8b96ad]"
                            >
                              {key} = {formatValue(value)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#5c6780]">No filters reported.</span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-[#1c2740] px-4 py-3">
                      <div className="mb-1 text-[11px] uppercase tracking-wide text-[#5c6780]">
                        Approved field references · {p.data_request.approved_field_ids.length}
                      </div>
                      <p className="mb-2 text-[11px] text-[#5c6780]">
                        PF identifiers carried by the request; they are not physical column names.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.data_request.approved_field_ids.length > 0 ? (
                          p.data_request.approved_field_ids.map((fieldId) => (
                            <span
                              key={fieldId}
                              className="rounded border border-[#2dd4bf]/40 bg-[#0f2e2c] px-2 py-1 font-mono text-[10.5px] text-[#2dd4bf]"
                            >
                              {fieldId}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#5c6780]">
                            No approved field references reported.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-[#1c2740] px-4 py-3">
                      <div className="mb-1.5 flex items-center justify-between text-[12px]">
                        <span className="text-[#8b96ad]">Time window</span>
                        <span
                          className={`font-mono ${
                            p.summary.time_window_clamped ? "text-[#d9a95c]" : "text-[#2dd4bf]"
                          }`}
                        >
                          {p.summary.time_window_clamped ? "clamped" : "not clamped"}
                        </span>
                      </div>
                      <div className="h-[9px] w-full overflow-hidden rounded-full bg-[#111a2e]">
                        <div
                          className="h-full"
                          style={{
                            width: "100%",
                            background: p.summary.time_window_clamped
                              ? "linear-gradient(90deg, #d9a95c, #b8894a)"
                              : "linear-gradient(90deg, #2dd4bf, #1f9c8f)",
                          }}
                        />
                      </div>
                      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[11px]">
                        <div>
                          <div className="text-[#5c6780]">requested</div>
                          <div className="font-mono text-[#8b96ad]">
                            {p.summary.requested_time_range.join(" → ")}
                          </div>
                        </div>
                        <span className="text-[#5c6780]">→</span>
                        <div className="text-right">
                          <div className="text-[#5c6780]">effective</div>
                          <div className="font-mono text-[#8b96ad]">
                            {p.summary.effective_time_range.join(" → ")}
                          </div>
                        </div>
                      </div>
                    </div>

                    {validation &&
                      (validation.errors.length > 0 || validation.warnings.length > 0) && (
                      <div className="border-t border-[#1c2740] px-4 py-3">
                        {validation.errors.map((message, index) => (
                          <div
                            key={`error-${index}`}
                            className="mb-1 flex items-start gap-2 text-[11.5px] text-[#d97a6c]"
                          >
                            <IconAlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                            <span>{message}</span>
                          </div>
                        ))}
                        {validation.warnings.map((message, index) => (
                          <div
                            key={`warning-${index}`}
                            className="mb-1 flex items-start gap-2 text-[11.5px] text-[#d9a95c]"
                          >
                            <IconAlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                            <span>{message}</span>
                          </div>
                        ))}
                      </div>
                      )}
                  </div>

                  <div className={`${PANEL} flex flex-col`}>
                    <div className="flex flex-wrap items-center gap-3 border-b border-[#1c2740] p-4 pb-3">
                      <IconTable size={16} className="text-[#8b96ad]" />
                      <h2 className="text-sm font-medium text-[#e9eef7]">
                        Loaded tables{" "}
                        <span className="font-normal text-[#5c6780]">· {tableNames.length}</span>
                      </h2>
                    </div>

                    {tableNames.length > 0 ? (
                      <>
                        <div className="flex flex-wrap gap-1.5 border-b border-[#1c2740] px-3 py-2.5">
                          {tableNames.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setSelectedTable(name)}
                              className={`rounded-full border px-2.5 py-1 font-mono text-[10.5px] transition-colors ${
                                name === activeTableName
                                  ? "border-[#2dd4bf]/50 bg-[#0f2e2c] text-[#2dd4bf]"
                                  : "border-[#2a3a5c] text-[#8b96ad] hover:border-[#2dd4bf]/40 hover:text-[#2dd4bf]"
                              }`}
                            >
                              {name}
                            </button>
                          ))}
                        </div>

                        {activeTable ? (
                          <>
                            <div className="flex items-center gap-3 border-b border-[#1c2740] px-4 py-3">
                              <span className="font-mono text-[12px] font-semibold text-[#e9eef7]">
                                {activeTableName}
                              </span>
                              <span className="ml-auto text-[11px] text-[#5c6780]">
                                {activeTable.row_count} rows · {activeTable.column_count} columns
                              </span>
                            </div>

                            <div
                              className="cockpit-track flex-1 overflow-y-auto p-3"
                              style={{ maxHeight: "330px" }}
                            >
                              <div className="mb-2 text-[11px] uppercase tracking-wide text-[#5c6780]">
                                Reported columns
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {activeTable.columns.map((column) => (
                                  <span
                                    key={column}
                                    className="rounded border border-[#2a3a5c] bg-[#111a2e] px-2 py-1 font-mono text-[10.5px] text-[#8b96ad] transition-colors hover:border-[#2dd4bf]/40 hover:text-[#2dd4bf]"
                                  >
                                    {column}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-[#1c2740] px-4 py-3">
                              <div className="mb-2 text-[11px] uppercase tracking-wide text-[#5c6780]">
                                Quality summary
                              </div>
                              {Object.entries(activeTable.quality_summary).length > 0 ? (
                                <div className="space-y-2">
                                  {Object.entries(activeTable.quality_summary).map(
                                    ([group, values]) => (
                                      <div key={group} className="flex flex-wrap items-center gap-1.5">
                                        <span className="mr-1 text-[11px] text-[#5c6780]">{group}</span>
                                        {Object.entries(values).map(([label, count]) => (
                                          <span
                                            key={`${group}-${label}`}
                                            className="rounded border border-[#2a3a5c] bg-[#111a2e] px-2 py-0.5 text-[10.5px] text-[#8b96ad]"
                                          >
                                            {label} <span className="font-mono text-[#e9eef7]">{count}</span>
                                          </span>
                                        ))}
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#5c6780]">
                                  No quality summary reported.
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-1 items-center justify-center p-8 text-[12px] text-[#5c6780]">
                            No detail reported for the selected table.
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-1 items-center justify-center p-8 text-[12px] text-[#5c6780]">
                        No tables reported in the D1 payload.
                      </div>
                    )}
                  </div>
                </div>

                <div className={`${PANEL} mt-4 p-4`}>
                  <div className="mb-2 flex items-center gap-3">
                    <IconTarget size={16} className="text-[#8b96ad]" />
                    <h2 className="text-sm font-medium text-[#e9eef7]">Request intent</h2>
                    <button
                      type="button"
                      className="ml-auto flex items-center gap-1 rounded-full border border-[#1c2740] px-2.5 py-1 text-[11px] text-[#8b96ad] transition-colors hover:border-[#2a3a5c]"
                      onClick={() => setIntentExpanded((value) => !value)}
                      aria-expanded={intentExpanded}
                    >
                      <IconChevronDown
                        size={12}
                        className={`transition-transform duration-200 ${
                          intentExpanded ? "rotate-180" : ""
                        }`}
                      />
                      {intentExpanded ? "Collapse" : "Expand"}
                    </button>
                  </div>
                  <p
                    className={`text-[12.5px] leading-relaxed text-[#8b96ad] ${
                      !intentExpanded ? "line-clamp-2" : ""
                    }`}
                  >
                    {p.data_request.intent}
                  </p>
                </div>

                <RawPayloadFooter payload={p} filename="d1-payload.json" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
