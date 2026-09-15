import { useEffect, useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconBell,
  IconBook2,
  IconChevronRight,
  IconFileCheck,
  IconFilter,
  IconMapPin,
  IconQuote,
  IconSearch,
} from "@tabler/icons-react";
import {
  MASK,
  formatMaskedNumber,
  formatMaskedPercent,
  isPublicNumber,
  type MaskedNumber,
} from "../../lib/maskedValues";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

export interface F1SiteAlert {
  location_id: string;
  location_name: string;
  location_display: string;
  rule_id: string;
  rule_label: string;
  status: string;
  near_breach: boolean;
  alert: boolean;
  gap: MaskedNumber;
  headline: string;
}

export interface F1PortfolioSummary {
  n_sites: MaskedNumber;
  n_obligated: MaskedNumber;
  n_near_breach: MaskedNumber;
  n_compliant: MaskedNumber;
  narrative: string;
}

export interface F1YesNoAlertPayload {
  registry_id?: string;
  output_form: "yes_no_alert";
  headline?: string;
  portfolio_summary?: F1PortfolioSummary;
  site_alerts?: F1SiteAlert[];
  limitations?: string[];
  citations?: string[];
}

export interface F1MemoPortfolioSummary {
  n_entries: MaskedNumber;
  n_sites: MaskedNumber;
  n_flagged: MaskedNumber;
  n_material: MaskedNumber;
  narrative: string;
}

export interface F1MemoSection {
  heading: string;
  body: string;
}

export interface F1MemoEntry {
  location_id: string;
  location_name: string;
  location_display: string;
  year: string;
  method_a: MaskedNumber;
  method_b: MaskedNumber;
  abs_delta: MaskedNumber;
  pct_diff: MaskedNumber;
  discrepancy_flag: boolean;
  material: boolean;
  scope_determination: string;
  entry_text: string;
  citations: string[];
}

export interface F1StructuredMemoPayload {
  registry_id?: string;
  output_form: "structured_memo";
  headline?: string;
  portfolio_summary?: F1MemoPortfolioSummary;
  sections?: F1MemoSection[];
  entries?: F1MemoEntry[];
  limitations?: string[];
  citations?: string[];
}

export interface F1NumericDivisionResult {
  division: string;
  subtotal_t: MaskedNumber;
  years: string[];
  n_rows: MaskedNumber;
  data_volume_status: string;
  provenance_note: string;
  entry_text: string;
  citations: string[];
}

export interface F1NumericPortfolioSummary {
  portfolio_total_t: MaskedNumber;
  division_count: MaskedNumber;
  n_adequate: MaskedNumber;
  n_thin: MaskedNumber;
  narrative: string;
}

export interface F1NumericPayload {
  registry_id?: string;
  output_form: "numeric_measurement";
  headline?: string;
  portfolio_summary?: F1NumericPortfolioSummary;
  division_results?: F1NumericDivisionResult[];
  readiness_assessment?: string;
  limitations?: string[];
  citations?: string[];
}

export type F1Payload =
  | F1YesNoAlertPayload
  | F1StructuredMemoPayload
  | F1NumericPayload;

interface SiteGroup {
  locationId: string;
  identity: F1SiteAlert;
  alerts: F1SiteAlert[];
  obligatedCount: number;
  nearBreachCount: number;
  sourceIndex: number;
}

type StatusFilter = "all" | "obligated" | "near_breach" | "compliant";

const STATUS_CLASS: Record<string, string> = {
  obligated: "border-[#d97a6c]/45 bg-[#2d1818] text-[#d97a6c]",
  near_breach: "border-[#d9a95c]/45 bg-[#2a2013] text-[#d9a95c]",
  compliant: "border-[#2dd4bf]/35 bg-[#0f2e2c] text-[#2dd4bf]",
};

function statusClass(status: string): string {
  return STATUS_CLASS[status] ?? "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad]";
}

function groupBySite(alerts: F1SiteAlert[]): SiteGroup[] {
  const groups = new Map<string, SiteGroup>();
  for (const [sourceIndex, alert] of alerts.entries()) {
    const existing = groups.get(alert.location_id);
    if (existing) {
      existing.alerts.push(alert);
      if (alert.status === "obligated") existing.obligatedCount += 1;
      if (alert.status === "near_breach" || alert.near_breach) {
        existing.nearBreachCount += 1;
      }
    } else {
      groups.set(alert.location_id, {
        locationId: alert.location_id,
        identity: alert,
        alerts: [alert],
        obligatedCount: alert.status === "obligated" ? 1 : 0,
        nearBreachCount:
          alert.status === "near_breach" || alert.near_breach ? 1 : 0,
        sourceIndex,
      });
    }
  }
  return [...groups.values()].sort(
    (left, right) =>
      right.obligatedCount - left.obligatedCount ||
      right.nearBreachCount - left.nearBreachCount ||
      left.sourceIndex - right.sourceIndex
  );
}

function matchesStatus(alert: F1SiteAlert, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "near_breach") {
    return alert.status === "near_breach" || alert.near_breach;
  }
  return alert.status === filter;
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: MaskedNumber;
  tone: "neutral" | "danger" | "warning" | "success";
}) {
  const toneClass = {
    neutral: "text-[#e9eef7]",
    danger: "text-[#d97a6c]",
    warning: "text-[#d9a95c]",
    success: "text-[#2dd4bf]",
  }[tone];

  return (
    <div className={`${CARD} min-w-0 px-4 py-3`}>
      <div className={`font-mono text-[22px] font-semibold leading-none ${toneClass}`}>
        {value}
      </div>
      <div className="mt-2 text-[9.5px] uppercase tracking-[0.13em] text-[#5c6780]">
        {label}
      </div>
    </div>
  );
}

function LiteralField({
  label,
  value,
  status,
  tone,
}: {
  label: string;
  value: string;
  status?: string;
  tone?: "danger" | "warning" | "success";
}) {
  const valueClass =
    tone === "danger"
      ? "text-[#d97a6c]"
      : tone === "warning"
        ? "text-[#d9a95c]"
        : tone === "success"
          ? "text-[#2dd4bf]"
          : "text-[#e9eef7]";

  return (
    <div className={`${CARD} min-w-0 overflow-hidden`}>
      <div className="px-3 pt-2.5 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
        {label}
      </div>
      <div className="px-3 pb-3 pt-1.5">
        {status ? (
          <span
            className={`inline-flex max-w-full rounded-md border px-2 py-1 text-[12px] ${statusClass(status)}`}
          >
            {value}
          </span>
        ) : (
          <span className={`break-words font-mono text-[12px] ${valueClass}`}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

function EvidencePanels({
  limitations,
  citations,
}: {
  limitations: string[];
  citations: string[];
}) {
  if (limitations.length === 0 && citations.length === 0) return null;

  return (
    <div className="mt-4 grid gap-4 xl:grid-cols-2">
      {limitations.length > 0 && (
        <section className={`${PANEL} min-w-0`}>
          <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
            <IconAlertTriangle size={15} className="text-[#d9a95c]" />
            <h2 className="text-sm font-medium text-[#e9eef7]">Limitations</h2>
            <span className="font-mono text-xs text-[#5c6780]">{limitations.length}</span>
          </div>
          <ul className="cockpit-track max-h-[420px] space-y-2 overflow-y-auto p-4">
            {limitations.map((item, index) => (
              <li
                key={index}
                className="rounded-lg border border-[#d9a95c]/20 bg-[#2a2013]/25 p-3 text-[11.5px] leading-relaxed text-[#aeb8cb]"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {citations.length > 0 && (
        <section className={`${PANEL} min-w-0`}>
          <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
            <IconQuote size={15} className="text-[#8b96ad]" />
            <h2 className="text-sm font-medium text-[#e9eef7]">Citations</h2>
            <span className="font-mono text-xs text-[#5c6780]">{citations.length}</span>
          </div>
          <ul className="cockpit-track max-h-[420px] space-y-2 overflow-y-auto p-4">
            {citations.map((item, index) => (
              <li
                key={index}
                className="rounded-lg border border-[#1c2740] bg-[#111a2e] p-3 font-mono text-[11px] leading-relaxed text-[#8b96ad]"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

interface MemoSiteGroup {
  locationId: string;
  identity: F1MemoEntry;
  entries: F1MemoEntry[];
  flaggedCount: number;
  materialCount: number;
  sourceIndex: number;
}

type MemoSiteFilter = "flagged" | "material" | "false" | null;

function groupMemoSites(entries: F1MemoEntry[]): MemoSiteGroup[] {
  const groups = new Map<string, MemoSiteGroup>();
  for (const [sourceIndex, entry] of entries.entries()) {
    const existing = groups.get(entry.location_id);
    if (existing) {
      existing.entries.push(entry);
      if (entry.discrepancy_flag) existing.flaggedCount += 1;
      if (entry.material) existing.materialCount += 1;
    } else {
      groups.set(entry.location_id, {
        locationId: entry.location_id,
        identity: entry,
        entries: [entry],
        flaggedCount: entry.discrepancy_flag ? 1 : 0,
        materialCount: entry.material ? 1 : 0,
        sourceIndex,
      });
    }
  }
  return [...groups.values()].sort(
    (left, right) =>
      Number(right.flaggedCount > 0) - Number(left.flaggedCount > 0) ||
      Number(right.materialCount > 0) - Number(left.materialCount > 0) ||
      left.sourceIndex - right.sourceIndex
  );
}

function defaultMemoEntry(site: MemoSiteGroup | undefined): F1MemoEntry | undefined {
  return (
    site?.entries.find((entry) => entry.discrepancy_flag) ??
    site?.entries.find((entry) => entry.material) ??
    site?.entries[0]
  );
}

function memoSignalClass(entry: F1MemoEntry): string {
  if (entry.discrepancy_flag) {
    return "border-[#d97a6c]/45 bg-[#2d1818] text-[#d97a6c]";
  }
  if (entry.material) {
    return "border-[#d9a95c]/45 bg-[#2a2013] text-[#d9a95c]";
  }
  return "border-[#2dd4bf]/35 bg-[#0f2e2c] text-[#2dd4bf]";
}

function F1StructuredMemoView({
  payload,
}: {
  payload: F1StructuredMemoPayload;
}) {
  const entries = payload.entries ?? [];
  const sections = payload.sections ?? [];
  const limitations = payload.limitations ?? [];
  const citations = payload.citations ?? [];
  const sites = useMemo(() => groupMemoSites(entries), [entries]);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [siteFilter, setSiteFilter] = useState<MemoSiteFilter>(null);
  const [selectedLocationId, setSelectedLocationId] = useState(
    sites[0]?.locationId ?? ""
  );
  const [selectedYear, setSelectedYear] = useState(
    defaultMemoEntry(sites[0])?.year ?? ""
  );

  useEffect(() => {
    setSelectedSectionIndex(0);
    setQuery("");
    setSiteFilter(null);
    setSelectedLocationId(sites[0]?.locationId ?? "");
  }, [payload.registry_id]);

  const visibleSites = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sites.filter((site) => {
      if (siteFilter === "flagged" && site.flaggedCount === 0) return false;
      if (siteFilter === "material" && site.materialCount === 0) return false;
      if (
        siteFilter === "false" &&
        (site.flaggedCount > 0 || site.materialCount > 0)
      ) {
        return false;
      }
      if (!normalized) return true;
      const searchable = site.entries.flatMap((entry) => [
        entry.location_id,
        entry.location_name,
        entry.location_display,
        entry.year,
        entry.scope_determination,
        entry.entry_text,
      ]);
      return searchable.some((value) => value.toLowerCase().includes(normalized));
    });
  }, [query, siteFilter, sites]);

  useEffect(() => {
    setSelectedLocationId((current) =>
      visibleSites.some((site) => site.locationId === current)
        ? current
        : visibleSites[0]?.locationId ?? ""
    );
  }, [visibleSites]);

  const selectedSite =
    visibleSites.find((site) => site.locationId === selectedLocationId) ??
    visibleSites[0];

  useEffect(() => {
    setSelectedYear(defaultMemoEntry(selectedSite)?.year ?? "");
  }, [selectedSite?.locationId]);

  const selectedEntry =
    selectedSite?.entries.find((entry) => entry.year === selectedYear) ??
    defaultMemoEntry(selectedSite);
  const selectedSection = sections[selectedSectionIndex] ?? sections[0];

  return (
    <>
      <section className={`${PANEL} overflow-hidden`}>
        <div className="p-5">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-[#2dd4bf]">
                <IconFileCheck size={17} />
                <span className="text-[10px] font-medium uppercase tracking-[0.16em]">
                  Final compliance memo
                </span>
              </div>
              <span className="rounded-md border border-[#2a3a5c] bg-[#111a2e] px-2 py-1 font-mono text-[10px] text-[#8b96ad]">
                {payload.output_form}
              </span>
            </div>
            {payload.headline && (
              <h2 className="max-w-[1050px] text-[17px] font-medium leading-relaxed text-[#e9eef7]">
                {payload.headline}
              </h2>
            )}
          </div>
        </div>

        {payload.portfolio_summary && (
          <div className="border-t border-[#1c2740] p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(420px,0.9fr)_minmax(0,1.4fr)]">
              <div className="grid grid-cols-2 gap-2">
                <Kpi
                  label="Entries"
                  value={payload.portfolio_summary.n_entries}
                  tone="neutral"
                />
                <Kpi
                  label="Sites"
                  value={payload.portfolio_summary.n_sites}
                  tone="neutral"
                />
                <Kpi
                  label="Flagged"
                  value={payload.portfolio_summary.n_flagged}
                  tone="danger"
                />
                <Kpi
                  label="Material"
                  value={payload.portfolio_summary.n_material}
                  tone="warning"
                />
              </div>
              {payload.portfolio_summary.narrative && (
                <div className={`${CARD} flex min-w-0 flex-col justify-center p-4`}>
                  <div className="mb-2 flex items-center gap-2">
                    <IconBook2 size={15} className="text-[#8b96ad]" />
                    <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8b96ad]">
                      Portfolio summary
                    </h3>
                  </div>
                  <p className="text-[12.5px] leading-[1.75] text-[#aeb8cb]">
                    {payload.portfolio_summary.narrative}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {sections.length > 0 && (
        <section className={`${PANEL} mt-4 overflow-hidden`}>
          <div className="cockpit-track flex gap-1 overflow-x-auto border-b border-[#1c2740] p-3">
            {sections.map((section, index) => (
              <button
                key={`${section.heading}-${index}`}
                type="button"
                onClick={() => setSelectedSectionIndex(index)}
                className={`whitespace-nowrap rounded-lg border px-3 py-2 text-[11px] transition-colors ${
                  index === selectedSectionIndex
                    ? "border-[#2dd4bf]/45 bg-[#0f2e2c] text-[#2dd4bf]"
                    : "border-[#1c2740] bg-[#111a2e] text-[#8b96ad] hover:border-[#2a3a5c]"
                }`}
              >
                {section.heading}
              </button>
            ))}
          </div>
          {selectedSection && (
            <div className="p-5">
              <div className="mb-2 text-[14px] font-medium text-[#e9eef7]">
                {selectedSection.heading}
              </div>
              <p className="max-w-[1250px] whitespace-pre-line text-[12.5px] leading-[1.8] text-[#aeb8cb]">
                {selectedSection.body}
              </p>
            </div>
          )}
        </section>
      )}

      {entries.length > 0 ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(300px,0.7fr)_minmax(0,1.5fr)]">
          <section className={`${PANEL} flex min-h-0 flex-col`}>
            <div className="border-b border-[#1c2740] p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <IconMapPin size={16} className="text-[#8b96ad]" />
                  <h2 className="text-sm font-medium text-[#e9eef7]">Sites</h2>
                </div>
                <span className="font-mono text-xs text-[#5c6780]">{MASK}</span>
                <div className="ml-auto flex flex-wrap justify-end gap-1.5">
                  <button
                    type="button"
                    aria-pressed={siteFilter === "flagged"}
                    onClick={() =>
                      setSiteFilter((current) =>
                        current === "flagged" ? null : "flagged"
                      )
                    }
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
                      siteFilter === "flagged"
                        ? "border-[#d97a6c]/50 bg-[#2d1818] text-[#d97a6c]"
                        : "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad] hover:border-[#d97a6c]/40 hover:text-[#d97a6c]"
                    }`}
                  >
                    <IconFilter size={11} /> Flagged
                  </button>
                  <button
                    type="button"
                    aria-pressed={siteFilter === "material"}
                    onClick={() =>
                      setSiteFilter((current) =>
                        current === "material" ? null : "material"
                      )
                    }
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
                      siteFilter === "material"
                        ? "border-[#d9a95c]/50 bg-[#2a2013] text-[#d9a95c]"
                        : "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad] hover:border-[#d9a95c]/40 hover:text-[#d9a95c]"
                    }`}
                  >
                    <IconFilter size={11} /> Material
                  </button>
                  <button
                    type="button"
                    aria-pressed={siteFilter === "false"}
                    onClick={() =>
                      setSiteFilter((current) =>
                        current === "false" ? null : "false"
                      )
                    }
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
                      siteFilter === "false"
                        ? "border-[#2dd4bf]/45 bg-[#0f2e2c] text-[#2dd4bf]"
                        : "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad] hover:border-[#2dd4bf]/35 hover:text-[#2dd4bf]"
                    }`}
                    title="Sites with no flagged or material entries"
                  >
                    <IconFilter size={11} /> False
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-[#1c2740] bg-[#111a2e] px-3 py-2">
                <IconSearch size={14} className="flex-shrink-0 text-[#5c6780]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search final memo fields…"
                  className="min-w-0 flex-1 bg-transparent text-[12px] text-[#e9eef7] outline-none placeholder:text-[#5c6780]"
                />
              </label>
            </div>

            <div className="cockpit-track max-h-[680px] overflow-y-auto p-2">
              {visibleSites.length === 0 && (
                <div className="px-3 py-10 text-center text-[12px] text-[#5c6780]">
                  No memo entries match the active filters.
                </div>
              )}
              {visibleSites.map((site) => {
                const selected = site.locationId === selectedSite?.locationId;
                return (
                  <button
                    key={site.locationId}
                    type="button"
                    onClick={() => setSelectedLocationId(site.locationId)}
                    className={`mb-1 block w-full rounded-lg border-l-2 px-3 py-3 text-left transition-all duration-200 ${
                      selected
                        ? "border-l-[#2dd4bf] bg-[#15203a] shadow-[inset_0_0_0_1px_rgba(45,212,191,0.14)]"
                        : "border-l-transparent hover:translate-x-0.5 hover:bg-[#111a2e]"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-medium text-[#e9eef7]">
                          {site.identity.location_name}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-[#5c6780]">
                          {site.identity.location_id}
                        </div>
                      </div>
                      <IconChevronRight
                        size={14}
                        className={selected ? "text-[#2dd4bf]" : "text-[#5c6780]"}
                      />
                    </div>
                    {site.identity.location_display && (
                      <div className="mt-1.5 truncate text-[10.5px] text-[#8b96ad]">
                        {site.identity.location_display}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {site.entries.map((entry) => (
                        <span
                          key={entry.year}
                          className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${memoSignalClass(entry)}`}
                        >
                          {entry.year}
                          {entry.discrepancy_flag
                            ? " · flagged"
                            : entry.material
                              ? " · material"
                              : " · unflagged"}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedSite && selectedEntry ? (
            <section className={`${PANEL} min-w-0`}>
              <div className="border-b border-[#1c2740] p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium text-[#e9eef7]">
                      {selectedSite.identity.location_name}
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] text-[#5c6780]">
                      {selectedSite.identity.location_id}
                    </div>
                    {selectedSite.identity.location_display && (
                      <div className="mt-1 text-[10.5px] text-[#8b96ad]">
                        {selectedSite.identity.location_display}
                      </div>
                    )}
                  </div>
                  <div className="ml-auto flex flex-wrap justify-end gap-2">
                    {selectedSite.entries.map((entry) => (
                      <button
                        key={entry.year}
                        type="button"
                        onClick={() => setSelectedYear(entry.year)}
                        className={`rounded-lg border px-3 py-1.5 font-mono text-[10.5px] transition-colors ${
                          entry.year === selectedEntry.year
                            ? memoSignalClass(entry)
                            : "border-[#1c2740] text-[#8b96ad] hover:border-[#2a3a5c] hover:bg-[#111a2e]"
                        }`}
                      >
                        {entry.year}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="cockpit-track max-h-[680px] space-y-4 overflow-y-auto p-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <LiteralField
                    label="Discrepancy flag"
                    value={String(selectedEntry.discrepancy_flag)}
                    tone={selectedEntry.discrepancy_flag ? "danger" : "success"}
                  />
                  <LiteralField
                    label="Material"
                    value={String(selectedEntry.material)}
                    tone={selectedEntry.material ? "warning" : "success"}
                  />
                  <LiteralField label="Method A" value={String(selectedEntry.method_a)} />
                  <LiteralField label="Method B" value={String(selectedEntry.method_b)} />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <LiteralField
                    label="Absolute delta"
                    value={String(selectedEntry.abs_delta)}
                    tone={selectedEntry.discrepancy_flag ? "danger" : undefined}
                  />
                  <LiteralField
                    label="Percentage difference"
                    value={formatMaskedPercent(selectedEntry.pct_diff)}
                    tone={selectedEntry.discrepancy_flag ? "danger" : undefined}
                  />
                </div>

                <div className={CARD}>
                  <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
                    <IconFileCheck size={15} className="text-[#2dd4bf]" />
                    <h3 className="text-[12px] font-medium text-[#e9eef7]">
                      Scope determination
                    </h3>
                  </div>
                  <p className="p-4 text-[12.5px] leading-[1.75] text-[#c4cddd]">
                    {selectedEntry.scope_determination}
                  </p>
                </div>

                <div className={CARD}>
                  <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
                    <IconBook2 size={15} className="text-[#8b96ad]" />
                    <h3 className="text-[12px] font-medium text-[#e9eef7]">
                      Entry text
                    </h3>
                  </div>
                  <p className="p-4 text-[12.5px] leading-[1.75] text-[#aeb8cb]">
                    {selectedEntry.entry_text}
                  </p>
                </div>

                {selectedEntry.citations.length > 0 && (
                  <div className={CARD}>
                    <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
                      <IconQuote size={15} className="text-[#8b96ad]" />
                      <h3 className="text-[12px] font-medium text-[#e9eef7]">
                        Entry citations
                      </h3>
                      <span className="font-mono text-[10px] text-[#5c6780]">
                        {selectedEntry.citations.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-4">
                      {selectedEntry.citations.map((citation, index) => (
                        <span
                          key={`${citation}-${index}`}
                          className="rounded-md border border-[#2a3a5c] bg-[#111a2e] px-2 py-1 font-mono text-[10px] text-[#8b96ad]"
                        >
                          {citation}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className={`${PANEL} flex min-h-[220px] items-center justify-center p-8`}>
              <p className="text-center text-sm text-[#5c6780]">
                No memo entry is available for the active filters.
              </p>
            </section>
          )}
        </div>
      ) : (
        <section className={`${PANEL} mt-4 p-8 text-center text-sm text-[#5c6780]`}>
          F1 payload contains no memo entries.
        </section>
      )}

      <EvidencePanels limitations={limitations} citations={citations} />
    </>
  );
}

function F1YesNoAlertView({
  payload,
}: {
  payload: F1YesNoAlertPayload;
}) {
  const alerts = payload.site_alerts ?? [];
  const limitations = payload.limitations ?? [];
  const citations = payload.citations ?? [];
  const sites = useMemo(() => groupBySite(alerts), [alerts]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedLocationId, setSelectedLocationId] = useState(
    sites[0]?.locationId ?? ""
  );
  const [selectedRuleId, setSelectedRuleId] = useState(
    sites[0]?.alerts[0]?.rule_id ?? ""
  );

  useEffect(() => {
    setQuery("");
    setStatusFilter("all");
    setSelectedLocationId(sites[0]?.locationId ?? "");
  }, [payload.registry_id]);

  const visibleSites = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sites.filter((site) => {
      if (!site.alerts.some((alert) => matchesStatus(alert, statusFilter))) {
        return false;
      }
      if (!normalized) return true;
      const searchable = site.alerts.flatMap((alert) => [
        alert.location_id,
        alert.location_name,
        alert.location_display,
        alert.rule_id,
        alert.rule_label,
        alert.status,
        alert.headline,
      ]);
      return searchable.some((value) => value.toLowerCase().includes(normalized));
    });
  }, [query, sites, statusFilter]);

  useEffect(() => {
    setSelectedLocationId((current) =>
      visibleSites.some((site) => site.locationId === current)
        ? current
        : visibleSites[0]?.locationId ?? ""
    );
  }, [visibleSites]);

  const selectedSite =
    visibleSites.find((site) => site.locationId === selectedLocationId) ??
    visibleSites[0];

  useEffect(() => {
    setSelectedRuleId(selectedSite?.alerts[0]?.rule_id ?? "");
  }, [selectedSite?.locationId]);

  const selectedAlert =
    selectedSite?.alerts.find((alert) => alert.rule_id === selectedRuleId) ??
    selectedSite?.alerts[0];

  return (
    <>
      <section className={`${PANEL} overflow-hidden`}>
        <div className="p-5">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-[#2dd4bf]">
                <IconFileCheck size={17} />
                <span className="text-[10px] font-medium uppercase tracking-[0.16em]">
                  Final deliverable
                </span>
              </div>
              <span className="rounded-md border border-[#2a3a5c] bg-[#111a2e] px-2 py-1 font-mono text-[10px] text-[#8b96ad]">
                {payload.output_form}
              </span>
            </div>
            {payload.headline && (
              <h2 className="max-w-[1050px] text-[17px] font-medium leading-relaxed text-[#e9eef7]">
                {payload.headline}
              </h2>
            )}
          </div>
        </div>

        {payload.portfolio_summary && (
          <div className="border-t border-[#1c2740] p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(420px,0.9fr)_minmax(0,1.4fr)]">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
                <Kpi
                  label="Sites"
                  value={payload.portfolio_summary.n_sites}
                  tone="neutral"
                />
                <Kpi
                  label="Obligated results"
                  value={payload.portfolio_summary.n_obligated}
                  tone="danger"
                />
                <Kpi
                  label="Near-breach results"
                  value={payload.portfolio_summary.n_near_breach}
                  tone="warning"
                />
                <Kpi
                  label="Compliant results"
                  value={payload.portfolio_summary.n_compliant}
                  tone="success"
                />
              </div>
              {payload.portfolio_summary.narrative && (
                <div className={`${CARD} flex min-w-0 flex-col justify-center p-4`}>
                  <div className="mb-2 flex items-center gap-2">
                    <IconBook2 size={15} className="text-[#8b96ad]" />
                    <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8b96ad]">
                      Portfolio summary
                    </h3>
                  </div>
                  <p className="text-[12.5px] leading-[1.75] text-[#aeb8cb]">
                    {payload.portfolio_summary.narrative}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {alerts.length > 0 ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(300px,0.7fr)_minmax(0,1.5fr)]">
          <section className={`${PANEL} flex min-h-0 flex-col`}>
            <div className="border-b border-[#1c2740] p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <IconMapPin size={16} className="text-[#8b96ad]" />
                  <h2 className="text-sm font-medium text-[#e9eef7]">Sites</h2>
                </div>
                <span className="font-mono text-xs text-[#5c6780]">{MASK}</span>
                <div className="ml-auto flex flex-wrap justify-end gap-1">
                  {(["all", "obligated", "near_breach", "compliant"] as const).map(
                    (filter) => (
                      <button
                        key={filter}
                        type="button"
                        aria-pressed={statusFilter === filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9.5px] transition-colors ${
                          statusFilter === filter
                            ? filter === "obligated"
                              ? "border-[#d97a6c]/50 bg-[#2d1818] text-[#d97a6c]"
                              : filter === "near_breach"
                                ? "border-[#d9a95c]/50 bg-[#2a2013] text-[#d9a95c]"
                                : filter === "compliant"
                                  ? "border-[#2dd4bf]/40 bg-[#0f2e2c] text-[#2dd4bf]"
                                  : "border-[#2a3a5c] bg-[#15203a] text-[#e9eef7]"
                            : "border-[#1c2740] bg-[#111a2e] text-[#8b96ad] hover:border-[#2a3a5c]"
                        }`}
                      >
                        {filter !== "all" && <IconFilter size={10} />}
                        {filter === "near_breach"
                          ? "Near breach"
                          : filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    )
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-[#1c2740] bg-[#111a2e] px-3 py-2">
                <IconSearch size={14} className="flex-shrink-0 text-[#5c6780]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search final artifact fields…"
                  className="min-w-0 flex-1 bg-transparent text-[12px] text-[#e9eef7] outline-none placeholder:text-[#5c6780]"
                />
              </label>
            </div>

            <div className="cockpit-track max-h-[650px] overflow-y-auto p-2">
              {visibleSites.length === 0 && (
                <div className="px-3 py-10 text-center text-[12px] text-[#5c6780]">
                  No site alerts match the active filters.
                </div>
              )}
              {visibleSites.map((site) => {
                const selected = site.locationId === selectedSite?.locationId;
                return (
                  <button
                    key={site.locationId}
                    type="button"
                    onClick={() => setSelectedLocationId(site.locationId)}
                    className={`mb-1 block w-full rounded-lg border-l-2 px-3 py-3 text-left transition-all duration-200 ${
                      selected
                        ? "border-l-[#2dd4bf] bg-[#15203a] shadow-[inset_0_0_0_1px_rgba(45,212,191,0.14)]"
                        : "border-l-transparent hover:translate-x-0.5 hover:bg-[#111a2e]"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-medium text-[#e9eef7]">
                          {site.identity.location_name}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-[#5c6780]">
                          {site.identity.location_id}
                        </div>
                      </div>
                      <IconChevronRight
                        size={14}
                        className={selected ? "text-[#2dd4bf]" : "text-[#5c6780]"}
                      />
                    </div>
                    {site.identity.location_display && (
                      <div className="mt-1.5 truncate text-[10.5px] text-[#8b96ad]">
                        {site.identity.location_display}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {site.alerts.map((alert) => (
                        <span
                          key={alert.rule_id}
                          title={alert.rule_label}
                          className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${statusClass(alert.status)}`}
                        >
                          {alert.rule_id} · {alert.status}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedSite && selectedAlert ? (
            <section className={`${PANEL} min-w-0`}>
              <div className="border-b border-[#1c2740] p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium text-[#e9eef7]">
                      {selectedSite.identity.location_name}
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] text-[#5c6780]">
                      {selectedSite.identity.location_id}
                    </div>
                    {selectedSite.identity.location_display && (
                      <div className="mt-1 text-[10.5px] text-[#8b96ad]">
                        {selectedSite.identity.location_display}
                      </div>
                    )}
                  </div>
                  <div className="ml-auto flex flex-wrap justify-end gap-2">
                    {selectedSite.alerts.map((alert) => (
                      <button
                        key={alert.rule_id}
                        type="button"
                        onClick={() => setSelectedRuleId(alert.rule_id)}
                        className={`rounded-lg border px-3 py-1.5 text-left transition-colors ${
                          alert.rule_id === selectedAlert.rule_id
                            ? statusClass(alert.status)
                            : "border-[#1c2740] text-[#8b96ad] hover:border-[#2a3a5c] hover:bg-[#111a2e]"
                        }`}
                      >
                        <span className="block font-mono text-[10px]">{alert.rule_id}</span>
                        <span className="mt-0.5 block max-w-[230px] truncate text-[10.5px]">
                          {alert.rule_label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="cockpit-track max-h-[650px] space-y-4 overflow-y-auto p-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <LiteralField
                    label="Status"
                    value={selectedAlert.status}
                    status={selectedAlert.status}
                  />
                  <LiteralField
                    label="Alert"
                    value={String(selectedAlert.alert)}
                    tone={selectedAlert.alert ? "danger" : "success"}
                  />
                  <LiteralField
                    label="Near breach"
                    value={String(selectedAlert.near_breach)}
                    tone={selectedAlert.near_breach ? "warning" : undefined}
                  />
                  <LiteralField label="Gap" value={String(selectedAlert.gap)} />
                </div>

                <div className={CARD}>
                  <div className="flex flex-wrap items-start gap-3 border-b border-[#1c2740] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <IconBell
                        size={15}
                        className={selectedAlert.alert ? "text-[#d97a6c]" : "text-[#2dd4bf]"}
                      />
                      <h3 className="text-[12px] font-medium text-[#e9eef7]">
                        Final alert
                      </h3>
                    </div>
                    <span className="ml-auto font-mono text-[10px] text-[#5c6780]">
                      {selectedAlert.rule_id}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="mb-2 text-[11px] text-[#8b96ad]">
                      {selectedAlert.rule_label}
                    </div>
                    <p className="text-[13px] leading-[1.75] text-[#c4cddd]">
                      {selectedAlert.headline}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className={`${PANEL} flex min-h-[220px] items-center justify-center p-8`}>
              <p className="text-center text-sm text-[#5c6780]">
                No site alert is available for the active filters.
              </p>
            </section>
          )}
        </div>
      ) : (
        <section className={`${PANEL} mt-4 p-8 text-center text-sm text-[#5c6780]`}>
          F1 payload contains no site alerts.
        </section>
      )}

      <EvidencePanels limitations={limitations} citations={citations} />
    </>
  );
}

function F1NumericView({
  payload,
}: {
  payload: F1NumericPayload;
}) {
  const divisions = payload.division_results ?? [];
  const limitations = payload.limitations ?? [];
  const citations = payload.citations ?? [];
  const ps = payload.portfolio_summary;

  return (
    <>
      <section className={`${PANEL} overflow-hidden`}>
        <div className="p-5">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-[#2dd4bf]">
                <IconFileCheck size={17} />
                <span className="text-[10px] font-medium uppercase tracking-[0.16em]">
                  Final measurement deliverable
                </span>
              </div>
              <span className="rounded-md border border-[#2a3a5c] bg-[#111a2e] px-2 py-1 font-mono text-[10px] text-[#8b96ad]">
                {payload.output_form}
              </span>
            </div>
            {payload.headline && (
              <h2 className="max-w-[1050px] text-[17px] font-medium leading-relaxed text-[#e9eef7]">
                {payload.headline}
              </h2>
            )}
          </div>
        </div>

        {ps && (
          <div className="border-t border-[#1c2740] p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(420px,0.9fr)_minmax(0,1.4fr)]">
              <div className="grid grid-cols-2 gap-2">
                <Kpi
                  label="Portfolio total (t)"
                  value={isPublicNumber(ps.portfolio_total_t) ? Math.round(ps.portfolio_total_t) : MASK}
                  tone="neutral"
                />
                <Kpi label="Divisions" value={ps.division_count} tone="neutral" />
                <Kpi label="Adequate" value={ps.n_adequate} tone="success" />
                <Kpi label="Thin" value={ps.n_thin} tone="danger" />
              </div>
              {ps.narrative && (
                <div className={`${CARD} flex min-w-0 flex-col justify-center p-4`}>
                  <div className="mb-2 flex items-center gap-2">
                    <IconBook2 size={15} className="text-[#8b96ad]" />
                    <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8b96ad]">
                      Portfolio summary
                    </h3>
                  </div>
                  <p className="text-[12.5px] leading-[1.75] text-[#aeb8cb]">
                    {ps.narrative}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {payload.readiness_assessment && (
        <section className={`${PANEL} mt-4 overflow-hidden`}>
          <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
            <IconFileCheck size={15} className="text-[#2dd4bf]" />
            <h2 className="text-sm font-medium text-[#e9eef7]">
              FY2027 readiness assessment
            </h2>
          </div>
          <p className="p-4 text-[12.5px] leading-[1.75] text-[#c4cddd]">
            {payload.readiness_assessment}
          </p>
        </section>
      )}

      {divisions.length > 0 ? (
        <section className={`${PANEL} mt-4 overflow-hidden`}>
          <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
            <h2 className="text-sm font-medium text-[#e9eef7]">
              Divisional measurement results
            </h2>
            <span className="font-mono text-xs text-[#5c6780]">{MASK}</span>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {divisions.map((division) => {
              const adequate = division.data_volume_status === "adequate";
              return (
                <div key={division.division} className={`${CARD} min-w-0 p-4`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[#e9eef7]">
                      {division.division}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 font-mono text-[10px] ${
                        adequate
                          ? "border-[#2dd4bf]/35 bg-[#0f2e2c] text-[#2dd4bf]"
                          : "border-[#d97a6c]/45 bg-[#2d1818] text-[#d97a6c]"
                      }`}
                    >
                      {division.data_volume_status}
                    </span>
                  </div>
                  <div className="mb-2 font-mono text-[18px] font-semibold text-[#e9eef7]">
                    {formatMaskedNumber(division.subtotal_t, {
                      maximumFractionDigits: 1,
                    })}{" "}
                    <span className="text-[10px] font-normal text-[#5c6780]">t CO₂e</span>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {division.years.map((year) => (
                      <span
                        key={year}
                        className="rounded border border-[#1c2740] bg-[#111a2e] px-1.5 py-0.5 font-mono text-[9px] text-[#8b96ad]"
                      >
                        {year}
                      </span>
                    ))}
                    <span className="rounded border border-[#1c2740] bg-[#111a2e] px-1.5 py-0.5 font-mono text-[9px] text-[#8b96ad]">
                      {division.n_rows} rows
                    </span>
                  </div>
                  {division.provenance_note && (
                    <p className="mb-2 text-[11px] leading-[1.6] text-[#8b96ad]">
                      {division.provenance_note}
                    </p>
                  )}
                  {division.entry_text && (
                    <p className="text-[11.5px] leading-[1.65] text-[#c4cddd]">
                      {division.entry_text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className={`${PANEL} mt-4 p-8 text-center text-sm text-[#5c6780]`}>
          F1 payload contains no division results.
        </section>
      )}

      <EvidencePanels limitations={limitations} citations={citations} />
    </>
  );
}

export default function F1ArtifactView({
  payload,
}: {
  payload: F1Payload;
}) {
  if (payload.output_form === "structured_memo") {
    return <F1StructuredMemoView payload={payload} />;
  }
  if (payload.output_form === "numeric_measurement") {
    return <F1NumericView payload={payload} />;
  }
  return <F1YesNoAlertView payload={payload} />;
}
