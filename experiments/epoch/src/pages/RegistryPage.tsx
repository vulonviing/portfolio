/**
 * RegistryPage — the pipeline's starting point.
 *
 * Answers "where does this pipeline begin?": the registry is the hand-authored
 * catalog of use cases (registry.py) that R1 reads first. Pick a use case here,
 * see the registered request and its initial scope, then follow the pipeline
 * from the persistent sidebar.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconCheck,
  IconChevronDown,
  IconDatabase,
  IconTarget,
  IconMapPin,
  IconShieldCheck,
  IconShieldOff,
} from "@tabler/icons-react";
import { fetchRegistrySnapshot, fetchUsecase, fetchUsecases } from "../api/client";
import RawSourceFooter from "../components/RawSourceFooter";
import { useRun } from "../context/RunContext";
import type { UsecaseDetail, UsecaseSummary } from "../api/types";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";

const OUTPUT_TYPE_LABEL: Record<string, string> = {
  binary: "Yes / no alert",
  qualitative: "Structured memo",
  quantitative: "Numeric measurement",
};

const ASSURANCE_LABEL: Record<string, string> = {
  routine: "Routine",
  elevated: "Elevated",
  audit_ready: "Audit-ready",
  regulatory: "Regulatory",
};

const FIELD_LABEL: Record<string, string> = {
  energy_mwh: "Annual final energy consumption",
  scope2_market_proxy_t: "Energy-derived Scope 2 CO₂e",
  scope2_location_t: "Reported Scope 2 CO₂e",
  bu_rc_group: "Business-unit division",
};

const DOMAIN_LABEL: Record<string, string> = {
  energy: "Energy data",
  emissions: "Emissions data",
};

const FIELD_UNIT: Record<string, string> = {
  energy_mwh: "MWh",
  scope2_market_proxy_t: "tCO₂e",
  scope2_location_t: "tCO₂e",
};

function readableId(id: string): string {
  return id.replace(/_/g, " ");
}

// ── small building blocks ───────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#5c6780]">
        {label}
      </span>
      <div className="text-[12.5px] leading-relaxed text-[#c3cbdd]">{children}</div>
    </div>
  );
}

function BoolBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
        value
          ? "border-[#d9a95c]/40 bg-[#2a2013]/60 text-[#d9a95c]"
          : "border-[#1c2740] bg-[#111a2e] text-[#5c6780]"
      }`}
    >
      {value ? <IconShieldCheck size={12} /> : <IconShieldOff size={12} />}
      {label}
    </span>
  );
}

function RegisteredField({ name }: { name: string }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span>{FIELD_LABEL[name] ?? readableId(name)}</span>
      <span className="rounded border border-[#2a3a5c] bg-[#0a101d] px-1.5 py-0.5 font-mono text-[10px] text-[#8b96ad]">
        {name}
      </span>
    </span>
  );
}

function ExplanationStep({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-w-0 rounded-lg border border-[#1c2740] bg-[#111a2e]/65 p-3.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#2dd4bf]/35 bg-[#0f2e2c] font-mono text-[10px] font-semibold text-[#2dd4bf]">
          {number}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#69758e]">
          {title}
        </span>
      </div>
      <div className="text-[12.5px] leading-relaxed text-[#c3cbdd]">{children}</div>
    </div>
  );
}

function UsecaseExplanation({ detail }: { detail: UsecaseDetail }) {
  const spec = detail.scope.computation_spec;
  const thresholds = Object.entries(detail.scope.threshold_parameters ?? {});
  const kind = spec?.kind ?? (thresholds.length > 0 ? "threshold" : null);
  const sourceDomain = spec?.source_domain
    ? DOMAIN_LABEL[spec.source_domain] ?? readableId(spec.source_domain)
    : "Registered data";

  if (!kind) {
    return (
      <div className="px-4 py-3.5">
        <p className="text-sm leading-relaxed text-[#c3cbdd]">
          This registry entry defines the requested outcome, but it does not prescribe a fixed
          field comparison or deterministic calculation.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#69758e]">
          The data mapping and final scope are established later by the agents and human review.
        </p>
      </div>
    );
  }

  let dataUsed: React.ReactNode;
  let calculation: React.ReactNode;
  let expectedResult: React.ReactNode;

  if (kind === "threshold") {
    const columns = [...new Set(thresholds.map(([, threshold]) => threshold.column))];
    dataUsed = (
      <div className="space-y-1.5">
        <p>For each site, read the registered metric from {sourceDomain.toLowerCase()}.</p>
        {columns.map((column) => (
          <div key={column}>
            <RegisteredField name={column} />
          </div>
        ))}
      </div>
    );
    calculation = (
      <div className="space-y-2">
        {thresholds.map(([rule, threshold]) => (
          <div key={rule} className="border-b border-[#1c2740] pb-2 last:border-b-0 last:pb-0">
            Average each site&apos;s yearly <RegisteredField name={threshold.column} /> values
            across the selected period, then compare that average with{" "}
            <span className="font-medium text-[#e9eef7]">
              {threshold.value.toLocaleString()}
              {FIELD_UNIT[threshold.column] ? ` ${FIELD_UNIT[threshold.column]}` : ""}
            </span>
            .
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="rounded border border-[#2a3a5c] px-1.5 py-0.5 font-mono text-[10px] text-[#8b96ad]">
                {rule}
              </span>
              <span className="text-[11px] text-[#69758e]">
                Near breach begins at {(threshold.near_breach_ratio * 100).toLocaleString()}%
                of the limit.
              </span>
            </div>
          </div>
        ))}
      </div>
    );
    expectedResult = (
      <p>
        Return a per-site priority flag, the distance from each limit, and a near-breach warning
        where needed.
      </p>
    );
  } else if (kind === "dual_method" && spec) {
    dataUsed = (
      <div className="space-y-2">
        <p>Use two independent CO₂e figures from {sourceDomain.toLowerCase()}.</p>
        <div>
          <span className="mr-1.5 text-[#69758e]">A</span>
          <RegisteredField name={spec.method_a_column ?? ""} />
        </div>
        <div>
          <span className="mr-1.5 text-[#69758e]">B</span>
          <RegisteredField name={spec.method_b_column ?? ""} />
        </div>
      </div>
    );
    calculation = (
      <p>
        Compare A and B for every site and every {detail.scope.time_grain}. Flag the result when
        their absolute difference is more than{" "}
        <span className="font-medium text-[#e9eef7]">
          {((spec.tolerance ?? 0) * 100).toLocaleString()}%
        </span>{" "}
        of the higher value.
      </p>
    );
    expectedResult = (
      <p>
        Produce a structured memo containing both figures, their difference, and the material
        discrepancy decision.
      </p>
    );
  } else if (kind === "consolidation" && spec) {
    dataUsed = (
      <div className="space-y-2">
        <p>Use the registered Scope 2 measure from {sourceDomain.toLowerCase()}.</p>
        <RegisteredField name={spec.measure_column ?? ""} />
      </div>
    );
    calculation = (
      <p>
        Group the measure by <RegisteredField name={spec.group_by_column ?? ""} />, calculate
        each division subtotal, and combine those subtotals into the portfolio total.
      </p>
    );
    expectedResult = (
      <p>
        Return the division subtotals and consolidated total, while keeping each division&apos;s
        provenance and data-volume status visible.
      </p>
    );
  } else {
    dataUsed = <p>Use the fields named in the registered calculation.</p>;
    calculation = <p>Apply the calculation exactly as recorded in the registry.</p>;
    expectedResult = <p>{detail.demand.expected_output}</p>;
  }

  return (
    <div className="px-4 py-3.5">
      <div className="grid gap-2.5 lg:grid-cols-3">
        <ExplanationStep number="1" title="Data used">
          {dataUsed}
        </ExplanationStep>
        <ExplanationStep number="2" title="Registered calculation">
          {calculation}
        </ExplanationStep>
        <ExplanationStep number="3" title="Expected result">
          {expectedResult}
        </ExplanationStep>
      </div>
      <p className="mt-3 border-t border-[#1c2740] pt-3 text-[11.5px] leading-relaxed text-[#69758e]">
        This is the calculation requested at the registry starting point. The available data,
        final mapping, and approved scope are established later by the agents and human review.
      </p>
    </div>
  );
}

function AccordionSection({
  icon,
  title,
  hint,
  summary,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  summary: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className={`${PANEL} overflow-hidden`}>
      <button
        className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#111a2e]/60 ${
          expanded ? "border-b border-[#1c2740]" : ""
        }`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-[#1c2740] bg-[#111a2e]">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-sm font-medium text-[#e9eef7]">{title}</span>
            <span className="rounded-full border border-[#1c2740] bg-[#111a2e] px-2 py-0.5 font-mono text-[10px] text-[#8b96ad]">
              {summary}
            </span>
          </span>
          <span className="mt-0.5 block text-[11.5px] leading-relaxed text-[#5c6780]">
            {hint}
          </span>
        </span>
        <IconChevronDown
          size={15}
          className={`mt-1 flex-none text-[#5c6780] transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {expanded && (
        <div className="cockpit-track">
          {children}
        </div>
      )}
    </section>
  );
}

// ── use-case card ────────────────────────────────────────────────────────────

function UsecaseCard({
  uc,
  selected,
  onSelect,
}: {
  uc: UsecaseSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative flex min-w-0 flex-col items-start rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
        selected
          ? "border-[#2dd4bf]/70 shadow-[0_0_0_1px_rgba(45,212,191,0.18),0_8px_24px_rgba(45,212,191,0.08)]"
          : "border-[#1c2740] hover:border-[#2a3a5c] hover:bg-[#111a2e]/60"
      }`}
      style={
        selected
          ? { background: "linear-gradient(135deg, rgba(45,212,191,0.08), transparent 55%), #0d1424" }
          : { backgroundColor: "#0d1424" }
      }
    >
      <div className="mb-2 flex w-full items-center justify-between">
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
            selected
              ? "border-[#2dd4bf]/35 bg-[#0f2e2c] text-[#2dd4bf]"
              : "border-[#2a3a5c] text-[#8b96ad]"
          }`}
        >
          UC{uc.key}
        </span>
        {selected && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#2dd4bf]/40 bg-[#0f2e2c] text-[#2dd4bf]">
            <IconCheck size={11} />
          </span>
        )}
      </div>
      <div className="mb-2 w-full truncate text-[12.5px] font-medium capitalize text-[#e9eef7]">
        {readableId(uc.id)}
      </div>
      <div className="mt-auto flex flex-wrap gap-1.5">
        <span className="rounded-full border border-[#1c2740] bg-[#111a2e] px-2 py-0.5 text-[10px] text-[#8b96ad]">
          {OUTPUT_TYPE_LABEL[uc.output_type] ?? uc.output_type}
        </span>
        <span className="rounded-full border border-[#1c2740] bg-[#111a2e] px-2 py-0.5 text-[10px] text-[#8b96ad]">
          {ASSURANCE_LABEL[uc.assurance_level] ?? uc.assurance_level}
        </span>
      </div>
    </button>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function RegistryPage() {
  const { selectedUsecase, setSelectedUsecase } = useRun();
  const [usecasesExpanded, setUsecasesExpanded] = useState(true);
  const [explanationExpanded, setExplanationExpanded] = useState(true);
  const [requestExpanded, setRequestExpanded] = useState(true);
  const [initialScopeExpanded, setInitialScopeExpanded] = useState(false);

  useEffect(() => {
    setExplanationExpanded(true);
    setRequestExpanded(true);
    setInitialScopeExpanded(false);
  }, [selectedUsecase]);

  const { data: usecases, isLoading: listLoading } = useQuery({
    queryKey: ["usecases"],
    queryFn: fetchUsecases,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["usecase", selectedUsecase],
    queryFn: () => fetchUsecase(selectedUsecase!),
    enabled: !!selectedUsecase,
  });

  const {
    data: registrySource,
    isLoading: sourceLoading,
    isError: sourceError,
  } = useQuery({
    queryKey: ["registry-public"],
    queryFn: fetchRegistrySnapshot,
  });

  const scopeEntries = detail ? Object.entries(detail.scope.site_filter ?? {}) : [];
  const regEntries = detail ? detail.scope.regulation_refs ?? [] : [];

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Header */}
        <div className="mb-1 flex items-baseline gap-3">
          <h1 className="text-[19px] font-medium text-[#e9eef7]">Registry</h1>
        </div>
        <p className="mb-4 max-w-[80ch] text-sm leading-relaxed text-[#8b96ad]">
          The pipeline starts here. Each card is a request the team registered ahead of time —
          what was asked, which regulation it cites, and how the answer must be delivered. Pick
          one to inspect its request and initial scope.
        </p>

        {/* Compact, collapsible registry selector */}
        <section className={`${PANEL} overflow-hidden`}>
          <button
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#111a2e]/60 ${
              usecasesExpanded ? "border-b border-[#1c2740]" : ""
            }`}
            onClick={() => setUsecasesExpanded((value) => !value)}
            aria-expanded={usecasesExpanded}
          >
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-[#2dd4bf]/25 bg-[#0f2e2c] text-[#2dd4bf]">
              <IconDatabase size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-[#e9eef7]">Registry entries</span>
                <span className="rounded-full border border-[#1c2740] bg-[#111a2e] px-2 py-0.5 font-mono text-[10px] text-[#8b96ad]">
                  {usecases?.length ?? 0} use cases
                </span>
                {selectedUsecase && (
                  <span className="rounded-full border border-[#2dd4bf]/30 bg-[#0f2e2c] px-2 py-0.5 font-mono text-[10px] text-[#2dd4bf]">
                    UC{selectedUsecase} selected
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[11.5px] text-[#5c6780]">
                Choose the registered request that starts this run.
              </span>
            </span>
            <IconChevronDown
              size={15}
              className={`flex-none text-[#5c6780] transition-transform duration-200 ${
                usecasesExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
          {usecasesExpanded && (
            <div className="cockpit-track overflow-x-auto p-3">
              {listLoading ? (
                <p className="text-sm text-[#5c6780]">Loading registry…</p>
              ) : (
                <div className="grid min-w-[820px] grid-flow-col auto-cols-fr gap-2.5">
                  {usecases?.map((uc) => (
                    <UsecaseCard
                      key={uc.key}
                      uc={uc}
                      selected={selectedUsecase === uc.key}
                      onSelect={() => setSelectedUsecase(uc.key)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Detail */}
        {selectedUsecase && detailLoading && (
          <div className={`${PANEL} mt-3 p-3 text-sm text-[#5c6780]`}>
            Loading use-case detail…
          </div>
        )}

        {detail && (
          <div className="mt-2.5 space-y-2.5">
            <AccordionSection
                icon={<IconTarget size={16} className="text-[#2dd4bf]" />}
                title="How this use case works"
                hint="A plain-language view of the fields, comparison, and result registered for this case."
                summary={
                  detail.scope.computation_spec?.kind === "dual_method"
                    ? "Two-method comparison"
                    : detail.scope.computation_spec?.kind === "consolidation"
                      ? "Division consolidation"
                      : Object.keys(detail.scope.threshold_parameters ?? {}).length > 0
                        ? "Threshold check"
                        : "Requested outcome"
                }
                expanded={explanationExpanded}
                onToggle={() => setExplanationExpanded((value) => !value)}
              >
                <UsecaseExplanation detail={detail} />
            </AccordionSection>

            <AccordionSection
                icon={<IconTarget size={16} className="text-[#8b96ad]" />}
                title="Request"
                hint="The registered question and intended deliverable, carried forward as demand context."
                summary={`${
                  OUTPUT_TYPE_LABEL[detail.output_profile.output_type] ??
                  detail.output_profile.output_type
                } · ${
                  ASSURANCE_LABEL[detail.assurance_profile.envelope_assurance_level] ??
                  detail.assurance_profile.envelope_assurance_level
                }`}
                expanded={requestExpanded}
                onToggle={() => setRequestExpanded((value) => !value)}
              >
                <div className="divide-y divide-[#1c2740] px-4">
                  <Field label="Natural request">{detail.demand.natural_request}</Field>
                  <Field label="Expected output">{detail.demand.expected_output}</Field>
                  <Field label="Output form">
                    {OUTPUT_TYPE_LABEL[detail.output_profile.output_type] ?? detail.output_profile.output_type}
                    {detail.output_profile.description && (
                      <span className="text-[#5c6780]"> — {detail.output_profile.description}</span>
                    )}
                  </Field>
                  <Field label="Assurance">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-[#1c2740] bg-[#111a2e] px-2 py-0.5 text-[10.5px] text-[#8b96ad]">
                        {ASSURANCE_LABEL[detail.assurance_profile.envelope_assurance_level] ??
                          detail.assurance_profile.envelope_assurance_level}
                      </span>
                      <BoolBadge label="Law reference required" value={detail.assurance_profile.law_reference_required} />
                      <BoolBadge label="Human sign-off required" value={detail.assurance_profile.human_signoff_required} />
                    </div>
                  </Field>
                </div>
            </AccordionSection>

            <AccordionSection
                icon={<IconMapPin size={16} className="text-[#8b96ad]" />}
                title="Initial scope"
                hint="Starting sites, time, and regulation. R1, DA1, R2, and human review finalize the downstream scope."
                summary={`${regEntries.length} regulation${
                  regEntries.length === 1 ? "" : "s"
                } · ${detail.scope.time_grain}`}
                expanded={initialScopeExpanded}
                onToggle={() => setInitialScopeExpanded((value) => !value)}
              >
                <div className="divide-y divide-[#1c2740] px-4">
                  <Field label="Regulation">
                    <div className="flex flex-col gap-1">
                      {regEntries.map((ref) => (
                        <div key={ref}>
                          <span className="rounded border border-[#2a3a5c] px-1.5 py-0.5 font-mono text-[10px] text-[#8b96ad]">
                            {ref}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Field>
                  <Field label="Site filter">
                    {scopeEntries.length === 0 ? (
                      <span className="text-[#5c6780]">No site filter</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {scopeEntries.map(([k, v]) => (
                          <span
                            key={k}
                            className="rounded-full border border-[#1c2740] bg-[#111a2e] px-2 py-0.5 font-mono text-[10.5px] text-[#8b96ad]"
                          >
                            {k}={Array.isArray(v) ? v.join("/") : String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </Field>
                  <Field label="Time window">
                    <span className="font-mono text-[11.5px]">
                      {detail.scope.time_window?.[0]} → {detail.scope.time_window?.[1]}
                    </span>
                    <span className="ml-2 text-[#5c6780]">grain: {detail.scope.time_grain}</span>
                  </Field>
                </div>
            </AccordionSection>
          </div>
        )}

        <div className="mt-2.5 space-y-2.5 pb-2">
          {sourceLoading && (
            <div className={`${PANEL} p-3 text-sm text-[#5c6780]`}>
              Loading public registry snapshot…
            </div>
          )}
          {sourceError && (
            <div className={`${PANEL} p-3 text-sm text-[#d9a95c]`}>
              The public registry snapshot could not be loaded.
            </div>
          )}
          {registrySource && (
            <RawSourceFooter
              source={registrySource}
              filename="registry-public.json"
              label="Public registry snapshot"
              language="JSON"
              description="A curated, anonymized view of the definitions behind every registry card."
              mediaType="application/json;charset=utf-8"
            />
          )}
        </div>
      </div>
    </div>
  );
}
