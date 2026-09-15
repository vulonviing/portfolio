import { useEffect, useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconBook2,
  IconChevronDown,
  IconChevronRight,
  IconFilter,
  IconGitMerge,
  IconMapPin,
  IconQuote,
  IconSearch,
} from "@tabler/icons-react";
import { MASK, formatMaskedPercent, type MaskedNumber } from "../../lib/maskedValues";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

export interface S1ReconciledRow {
  location_id: string;
  location_name: string;
  year: string;
  method_a: MaskedNumber;
  method_b: MaskedNumber;
  method_a_label: string;
  method_b_label: string;
  method_a_grounding: string;
  method_b_grounding: string;
  abs_delta: MaskedNumber;
  pct_diff: MaskedNumber;
  discrepancy_flag: boolean;
  materiality_verdict: string;
  delta_interpretation: string;
  reconciled_conclusion: string;
  citations: string[];
  carried_caveats: string[];
  country_name: string;
  cdp_region: string;
  city: string;
}

export interface S1Payload {
  registry_id?: string;
  rows?: S1ReconciledRow[];
  carried_caveats?: string[];
}

interface SiteGroup {
  locationId: string;
  identity: S1ReconciledRow;
  rows: S1ReconciledRow[];
  flaggedCount: number;
  sourceIndex: number;
}

type SiteFilter = "flagged" | "false" | null;

function groupSites(rows: S1ReconciledRow[]): SiteGroup[] {
  const groups = new Map<string, SiteGroup>();
  for (const [sourceIndex, row] of rows.entries()) {
    const existing = groups.get(row.location_id);
    if (existing) {
      existing.rows.push(row);
      if (row.discrepancy_flag) existing.flaggedCount += 1;
    } else {
      groups.set(row.location_id, {
        locationId: row.location_id,
        identity: row,
        rows: [row],
        flaggedCount: row.discrepancy_flag ? 1 : 0,
        sourceIndex,
      });
    }
  }
  return [...groups.values()].sort(
    (left, right) =>
      Number(right.flaggedCount > 0) - Number(left.flaggedCount > 0) ||
      left.sourceIndex - right.sourceIndex
  );
}

function defaultRow(site: SiteGroup | undefined): S1ReconciledRow | undefined {
  return site?.rows.find((row) => row.discrepancy_flag) ?? site?.rows[0];
}

function signalClass(flagged: boolean): string {
  return flagged
    ? "border-[#d97a6c]/45 bg-[#2d1818] text-[#d97a6c]"
    : "border-[#2dd4bf]/35 bg-[#0f2e2c] text-[#2dd4bf]";
}

function SignalField({
  label,
  value,
  flagged = false,
  mono = true,
}: {
  label: string;
  value: string;
  flagged?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={`${CARD} min-w-0 overflow-hidden`}>
      <div className="px-3 pt-2.5 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
        {label}
      </div>
      <div
        className={`break-words px-3 pb-3 pt-1.5 text-[12px] ${
          mono ? "font-mono" : ""
        } ${flagged ? "text-[#d97a6c]" : "text-[#e9eef7]"}`}
      >
        {value}
      </div>
    </div>
  );
}

function MethodCard({
  title,
  value,
  label,
  grounding,
  accent,
}: {
  title: string;
  value: MaskedNumber;
  label: string;
  grounding: string;
  accent: "a" | "b";
}) {
  const accentClass = accent === "a" ? "text-[#2dd4bf]" : "text-[#78a9ff]";
  const borderClass =
    accent === "a" ? "border-[#2dd4bf]/25" : "border-[#78a9ff]/25";
  return (
    <div className={`${CARD} ${borderClass} min-w-0 overflow-hidden`}>
      <div className="border-b border-[#1c2740] px-4 py-3">
        <div className={`text-[10px] font-medium uppercase tracking-[0.14em] ${accentClass}`}>
          {title}
        </div>
        <div className="mt-2 font-mono text-[21px] font-semibold text-[#e9eef7]">
          {String(value)}
        </div>
        <div className="mt-1 text-[10.5px] leading-relaxed text-[#8b96ad]">
          {label}
        </div>
      </div>
      <div className="p-4">
        <div className="mb-1.5 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
          Grounding
        </div>
        <p className="text-[11.5px] leading-[1.7] text-[#aeb8cb]">{grounding}</p>
      </div>
    </div>
  );
}

function ConvergenceMark({ flagged }: { flagged: boolean }) {
  return (
    <div className="hidden min-w-[90px] items-center justify-center lg:flex">
      <div className="relative flex w-full items-center justify-center">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-[#2dd4bf]/45 via-[#2a3a5c] to-[#78a9ff]/45" />
        <div
          className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border bg-[#0d1424] ${
            flagged
              ? "border-[#d97a6c]/55 text-[#d97a6c]"
              : "border-[#2dd4bf]/45 text-[#2dd4bf]"
          }`}
        >
          <IconGitMerge size={19} />
          <span
            className={`absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full ${
              flagged ? "bg-[#d97a6c]" : "bg-[#2dd4bf]"
            }`}
          />
        </div>
        <span className="absolute top-[58px] font-mono text-[9px] text-[#5c6780]">
          S1
        </span>
      </div>
    </div>
  );
}

function GlobalCaveats({ items }: { items: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;

  return (
    <section className={`${PANEL} mt-4 overflow-hidden`}>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center gap-2 p-4 text-left transition-colors hover:bg-[#111a2e]/55"
      >
        <IconAlertTriangle size={15} className="text-[#d9a95c]" />
        <h2 className="text-sm font-medium text-[#e9eef7]">
          Chain-level carried caveats
        </h2>
        <span className="font-mono text-xs text-[#5c6780]">{items.length}</span>
        <IconChevronDown
          size={15}
          className={`ml-auto text-[#8b96ad] transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {expanded && (
        <ul className="cockpit-track max-h-[520px] space-y-2 overflow-y-auto border-t border-[#1c2740] p-4">
          {items.map((item, index) => (
            <li
              key={index}
              className="rounded-lg border border-[#d9a95c]/20 bg-[#2a2013]/25 p-3 text-[11.5px] leading-relaxed text-[#aeb8cb]"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function S1ArtifactView({ payload }: { payload: S1Payload }) {
  const rows = payload.rows ?? [];
  const chainCaveats = payload.carried_caveats ?? [];
  const sites = useMemo(() => groupSites(rows), [rows]);
  const [query, setQuery] = useState("");
  const [siteFilter, setSiteFilter] = useState<SiteFilter>(null);
  const [selectedLocationId, setSelectedLocationId] = useState(
    sites[0]?.locationId ?? ""
  );
  const [selectedYear, setSelectedYear] = useState(
    defaultRow(sites[0])?.year ?? ""
  );

  useEffect(() => {
    setQuery("");
    setSiteFilter(null);
    setSelectedLocationId(sites[0]?.locationId ?? "");
  }, [payload.registry_id]);

  const filterCounts = useMemo(
    () => ({
      flagged: sites.filter((site) => site.flaggedCount > 0).length,
      false: sites.filter((site) => site.flaggedCount === 0).length,
    }),
    [sites]
  );

  const visibleSites = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sites.filter((site) => {
      if (siteFilter === "flagged" && site.flaggedCount === 0) return false;
      if (siteFilter === "false" && site.flaggedCount > 0) return false;
      if (!normalized) return true;
      const searchable = site.rows.flatMap((row) => [
        row.location_id,
        row.location_name,
        row.year,
        row.country_name,
        row.cdp_region,
        row.city,
        row.method_a_label,
        row.method_b_label,
        row.method_a_grounding,
        row.method_b_grounding,
        row.materiality_verdict,
        row.delta_interpretation,
        row.reconciled_conclusion,
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
    setSelectedYear(defaultRow(selectedSite)?.year ?? "");
  }, [selectedSite?.locationId]);

  const selectedRow =
    selectedSite?.rows.find((row) => row.year === selectedYear) ??
    defaultRow(selectedSite);

  if (rows.length === 0) {
    return (
      <>
        <section className={`${PANEL} p-8 text-center text-sm text-[#5c6780]`}>
          S1 payload contains no reconciled rows.
        </section>
        <GlobalCaveats items={chainCaveats} />
      </>
    );
  }

  return (
    <>
      <section className={`${PANEL} mb-4 flex flex-wrap items-center gap-3 p-4`}>
        <div className="flex items-center gap-2">
          <IconGitMerge size={17} className="text-[#2dd4bf]" />
          <h2 className="text-sm font-medium text-[#e9eef7]">
            Reconciliation output
          </h2>
        </div>
        <span className="rounded-full border border-[#1c2740] px-2.5 py-1 font-mono text-[10px] text-[#8b96ad]">
          {MASK} entries
        </span>
        <span className="rounded-full border border-[#1c2740] px-2.5 py-1 font-mono text-[10px] text-[#8b96ad]">
          {MASK} sites
        </span>
        <span className="rounded-full border border-[#1c2740] px-2.5 py-1 font-mono text-[10px] text-[#8b96ad]">
          {chainCaveats.length} chain caveats
        </span>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.68fr)_minmax(0,1.55fr)]">
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
                  <span className="font-mono">{MASK}</span>
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
                >
                  <IconFilter size={11} /> False
                  <span className="font-mono">{MASK}</span>
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-[#1c2740] bg-[#111a2e] px-3 py-2">
              <IconSearch size={14} className="flex-shrink-0 text-[#5c6780]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reconciliation fields…"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-[#e9eef7] outline-none placeholder:text-[#5c6780]"
              />
            </label>
          </div>

          <div className="cockpit-track max-h-[760px] overflow-y-auto p-2">
            {visibleSites.length === 0 && (
              <div className="px-3 py-10 text-center text-[12px] text-[#5c6780]">
                No reconciled rows match the active filters.
              </div>
            )}
            {visibleSites.map((site) => {
              const selected = site.locationId === selectedSite?.locationId;
              const geo = [
                site.identity.country_name,
                site.identity.cdp_region,
                site.identity.city,
              ]
                .filter(Boolean)
                .join(" · ");
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
                  {geo && (
                    <div className="mt-1.5 truncate text-[10.5px] text-[#8b96ad]">
                      {geo}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {site.rows.map((row) => (
                      <span
                        key={row.year}
                        className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${signalClass(row.discrepancy_flag)}`}
                      >
                        {row.year} · {String(row.discrepancy_flag)}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {selectedSite && selectedRow ? (
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
                  <div className="mt-1 text-[10.5px] text-[#8b96ad]">
                    {[
                      selectedSite.identity.country_name,
                      selectedSite.identity.cdp_region,
                      selectedSite.identity.city,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <div className="ml-auto flex flex-wrap justify-end gap-2">
                  {selectedSite.rows.map((row) => (
                    <button
                      key={row.year}
                      type="button"
                      onClick={() => setSelectedYear(row.year)}
                      className={`rounded-lg border px-3 py-1.5 font-mono text-[10.5px] transition-colors ${
                        row.year === selectedRow.year
                          ? signalClass(row.discrepancy_flag)
                          : "border-[#1c2740] text-[#8b96ad] hover:border-[#2a3a5c] hover:bg-[#111a2e]"
                      }`}
                    >
                      {row.year}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="cockpit-track max-h-[760px] space-y-4 overflow-y-auto p-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <SignalField
                  label="Discrepancy flag"
                  value={String(selectedRow.discrepancy_flag)}
                  flagged={selectedRow.discrepancy_flag}
                />
                <SignalField
                  label="Absolute delta"
                  value={String(selectedRow.abs_delta)}
                  flagged={selectedRow.discrepancy_flag}
                />
                <SignalField
                  label="Percentage difference"
                  value={formatMaskedPercent(selectedRow.pct_diff)}
                  flagged={selectedRow.discrepancy_flag}
                />
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_90px_minmax(0,1fr)]">
                <MethodCard
                  title="Method A"
                  value={selectedRow.method_a}
                  label={selectedRow.method_a_label}
                  grounding={selectedRow.method_a_grounding}
                  accent="a"
                />
                <ConvergenceMark flagged={selectedRow.discrepancy_flag} />
                <MethodCard
                  title="Method B"
                  value={selectedRow.method_b}
                  label={selectedRow.method_b_label}
                  grounding={selectedRow.method_b_grounding}
                  accent="b"
                />
              </div>

              <div className={`${CARD} border-[#d9a95c]/25`}>
                <div className="flex items-center gap-2 border-b border-[#d9a95c]/20 px-4 py-3">
                  <IconBook2 size={15} className="text-[#d9a95c]" />
                  <h3 className="text-[12px] font-medium text-[#e9eef7]">
                    Materiality verdict
                  </h3>
                </div>
                <p className="p-4 text-[12.5px] leading-[1.75] text-[#aeb8cb]">
                  {selectedRow.materiality_verdict}
                </p>
              </div>

              <div className={CARD}>
                <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
                  <IconGitMerge size={15} className="text-[#8b96ad]" />
                  <h3 className="text-[12px] font-medium text-[#e9eef7]">
                    Delta interpretation
                  </h3>
                </div>
                <p className="p-4 text-[12.5px] leading-[1.75] text-[#aeb8cb]">
                  {selectedRow.delta_interpretation}
                </p>
              </div>

              <div className={`${CARD} border-[#2dd4bf]/25 bg-[#0f2e2c]/35`}>
                <div className="flex items-center gap-2 border-b border-[#2dd4bf]/20 px-4 py-3">
                  <IconGitMerge size={15} className="text-[#2dd4bf]" />
                  <h3 className="text-[12px] font-medium text-[#e9eef7]">
                    Reconciled conclusion
                  </h3>
                </div>
                <p className="p-4 text-[13px] leading-[1.8] text-[#c4cddd]">
                  {selectedRow.reconciled_conclusion}
                </p>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                {selectedRow.citations.length > 0 && (
                  <div className={CARD}>
                    <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
                      <IconQuote size={15} className="text-[#8b96ad]" />
                      <h3 className="text-[12px] font-medium text-[#e9eef7]">
                        Citations
                      </h3>
                      <span className="font-mono text-[10px] text-[#5c6780]">
                        {selectedRow.citations.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-4">
                      {selectedRow.citations.map((citation, index) => (
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

                {selectedRow.carried_caveats.length > 0 && (
                  <div className={`${CARD} border-[#d9a95c]/20`}>
                    <div className="flex items-center gap-2 border-b border-[#d9a95c]/20 px-4 py-3">
                      <IconAlertTriangle size={15} className="text-[#d9a95c]" />
                      <h3 className="text-[12px] font-medium text-[#e9eef7]">
                        Row-level caveats
                      </h3>
                      <span className="font-mono text-[10px] text-[#5c6780]">
                        {selectedRow.carried_caveats.length}
                      </span>
                    </div>
                    <ul className="space-y-2 p-4">
                      {selectedRow.carried_caveats.map((caveat, index) => (
                        <li
                          key={index}
                          className="text-[11.5px] leading-relaxed text-[#aeb8cb]"
                        >
                          {caveat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className={`${PANEL} flex min-h-[240px] items-center justify-center p-8`}>
            <p className="text-center text-sm text-[#5c6780]">
              No reconciliation row is available for the active filters.
            </p>
          </section>
        )}
      </div>

      <GlobalCaveats items={chainCaveats} />
    </>
  );
}
