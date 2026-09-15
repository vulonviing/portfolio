import { useEffect, useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconBook2,
  IconChevronRight,
  IconFilter,
  IconMapPin,
  IconSearch,
} from "@tabler/icons-react";
import { MASK, isPublicNumber, type MaskedNumber } from "../../lib/maskedValues";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

export interface MethodInterpretationRow {
  location_id: string;
  location_name: string;
  year: string;
  method_figure: MaskedNumber;
  method_column: string;
  method_label: string;
  method_a: MaskedNumber;
  method_b: MaskedNumber;
  abs_delta: MaskedNumber;
  pct_diff: MaskedNumber;
  discrepancy_flag: boolean;
  article_grounding: string;
  interpretation: string;
  defensibility: string;
  carried_caveats: string[];
  country: string;
  country_code: string;
  country_name: string;
  cdp_region: string;
  city: string;
  address: string;
  zip_code: string;
  latitude: string;
  longitude: string;
}

export interface MethodInterpretationPayload {
  registry_id?: string;
  rows?: MethodInterpretationRow[];
}

interface SiteGroup {
  locationId: string;
  identity: MethodInterpretationRow;
  rows: MethodInterpretationRow[];
  flaggedCount: number;
  sourceIndex: number;
}

type SiteFilter = "flagged" | "clear" | null;
type MetricTone = "danger" | "warning" | "success";

const METRIC_TONE_CLASS: Record<MetricTone, string> = {
  danger: "border-[#d97a6c]/45 bg-[#2d1818] text-[#d97a6c]",
  warning: "border-[#d9a95c]/40 bg-[#2a2013] text-[#d9a95c]",
  success: "border-[#2dd4bf]/35 bg-[#0f2e2c] text-[#2dd4bf]",
};

function signalClass(flagged: boolean): string {
  return flagged
    ? "border-[#d97a6c]/45 bg-[#2d1818] text-[#d97a6c]"
    : "border-[#2dd4bf]/35 bg-[#0f2e2c] text-[#2dd4bf]";
}

function groupSites(rows: MethodInterpretationRow[]): SiteGroup[] {
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

function defaultRow(site: SiteGroup | undefined): MethodInterpretationRow | undefined {
  return site?.rows.find((row) => row.discrepancy_flag) ?? site?.rows[0];
}

export default function MethodInterpreterArtifactView({
  agentCode,
  payload,
}: {
  agentCode: "P2" | "P3";
  payload: MethodInterpretationPayload;
}) {
  const rows = payload.rows ?? [];
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
    setSelectedLocationId(sites[0]?.locationId ?? "");
  }, [payload.registry_id]);

  const filterCounts = useMemo(
    () => ({
      flagged: sites.filter((site) => site.flaggedCount > 0).length,
      clear: sites.filter((site) => site.flaggedCount === 0).length,
    }),
    [sites]
  );

  const visibleSites = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sites.filter((site) => {
      if (siteFilter === "flagged" && site.flaggedCount === 0) return false;
      if (siteFilter === "clear" && site.flaggedCount > 0) return false;
      if (!normalized) return true;

      const row = site.identity;
      const searchable = [
        row.location_id,
        row.location_name,
        row.country,
        row.country_code,
        row.country_name,
        row.cdp_region,
        row.city,
        row.address,
        ...site.rows.flatMap((periodRow) => [
          periodRow.year,
          periodRow.method_column,
          periodRow.method_label,
          periodRow.article_grounding,
        ]),
      ];
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
  const methodComparisonTone: MetricTone | undefined = selectedRow
    ? selectedRow.discrepancy_flag
      ? "danger"
      : isPublicNumber(selectedRow.method_a) &&
          isPublicNumber(selectedRow.method_b) &&
          selectedRow.method_a !== selectedRow.method_b
        ? "warning"
        : "success"
    : undefined;

  if (rows.length === 0) {
    return (
      <div className={`${PANEL} p-8 text-center text-sm text-[#5c6780]`}>
        {agentCode} payload contains no method-interpretation rows.
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.7fr)_minmax(0,1.55fr)]">
      <section className={`${PANEL} flex min-h-0 flex-col`}>
        <div className="border-b border-[#1c2740] p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <IconMapPin size={16} className="text-[#8b96ad]" />
              <h2 className="text-sm font-medium text-[#e9eef7]">Sites</h2>
            </div>
            <div className="ml-auto flex flex-wrap justify-end gap-1.5">
              <FilterButton
                active={siteFilter === "flagged"}
                count={MASK}
                label="Flagged"
                tone="danger"
                onClick={() =>
                  setSiteFilter((current) =>
                    current === "flagged" ? null : "flagged"
                  )
                }
              />
              <FilterButton
                active={siteFilter === "clear"}
                count={MASK}
                label="Clear"
                tone="success"
                onClick={() =>
                  setSiteFilter((current) =>
                    current === "clear" ? null : "clear"
                  )
                }
              />
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-[#1c2740] bg-[#111a2e] px-3 py-2">
            <IconSearch size={14} className="flex-shrink-0 text-[#5c6780]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search artifact fields…"
              className="min-w-0 flex-1 bg-transparent text-[12px] text-[#e9eef7] outline-none placeholder:text-[#5c6780]"
            />
          </label>
        </div>

        <div className="cockpit-track max-h-[650px] overflow-y-auto p-2">
          {visibleSites.length === 0 && (
            <div className="px-3 py-10 text-center text-[12px] text-[#5c6780]">
              No artifact rows match the active filters.
            </div>
          )}

          {visibleSites.map((site) => {
            const selected = site.locationId === selectedSite?.locationId;
            const row = site.identity;
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
                      {row.location_name}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-[#5c6780]">
                      {row.location_id}
                    </div>
                  </div>
                  <IconChevronRight
                    size={14}
                    className={selected ? "text-[#2dd4bf]" : "text-[#5c6780]"}
                  />
                </div>

                {(row.city || row.country_name) && (
                  <div className="mt-1.5 truncate text-[10.5px] text-[#8b96ad]">
                    {[row.city, row.country_name].filter(Boolean).join(" · ")}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {site.rows.map((periodRow) => (
                    <span
                      key={periodRow.year}
                      className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${signalClass(
                        periodRow.discrepancy_flag
                      )}`}
                    >
                      {periodRow.year} ·{" "}
                      {periodRow.discrepancy_flag ? "flagged" : "clear"}
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
              <div>
                <div className="text-[15px] font-medium text-[#e9eef7]">
                  {selectedSite.identity.location_name}
                </div>
                <div className="mt-1 font-mono text-[10.5px] text-[#5c6780]">
                  {selectedSite.identity.location_id}
                </div>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                {selectedSite.rows.map((row) => (
                  <button
                    key={row.year}
                    type="button"
                    onClick={() => setSelectedYear(row.year)}
                    className={`rounded-lg border px-3 py-1.5 text-left transition-colors ${
                      row.year === selectedRow.year
                        ? signalClass(row.discrepancy_flag)
                        : "border-[#1c2740] text-[#8b96ad] hover:border-[#2a3a5c] hover:bg-[#111a2e]"
                    }`}
                  >
                    <span className="block font-mono text-[10.5px]">{row.year}</span>
                    <span className="mt-0.5 block text-[9.5px]">
                      {row.discrepancy_flag ? "flagged" : "clear"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="cockpit-track max-h-[650px] space-y-4 overflow-y-auto p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <LiteralField
                label="status"
                value={selectedRow.discrepancy_flag ? "discrepancy" : "clear"}
                signal={selectedRow.discrepancy_flag}
              />
              <LiteralField label="method figure" value={String(selectedRow.method_figure)} mono />
              <LiteralField label="period" value={selectedRow.year} mono />
            </div>

            <div className={CARD}>
              <SectionTitle title="Responsible method" />
              <div className="flex flex-wrap items-center gap-3 p-4">
                <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-[#c4cddd]">
                  {selectedRow.method_label}
                </p>
                <div className="ml-auto inline-flex max-w-full rounded-md border border-[#2a3a5c] bg-[#0d1424] px-2 py-1 font-mono text-[10.5px] text-[#8b96ad]">
                  {selectedRow.method_column}
                </div>
              </div>
            </div>

            <div className={CARD}>
              <div className="border-b border-[#1c2740] px-4 py-3">
                <h3 className="text-[12px] font-medium text-[#e9eef7]">
                  Comparison context
                </h3>
                <p className="mt-1 text-[10.5px] text-[#5c6780]">
                  Values carried in {agentCode} JSON; no reconciliation is performed here.
                </p>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <LiteralField
                  label="method A"
                  value={String(selectedRow.method_a)}
                  mono
                  nested
                  tone={methodComparisonTone}
                />
                <LiteralField
                  label="method B"
                  value={String(selectedRow.method_b)}
                  mono
                  nested
                  tone={methodComparisonTone}
                />
                <LiteralField label="absolute delta" value={String(selectedRow.abs_delta)} mono nested />
                <LiteralField label="pct diff" value={String(selectedRow.pct_diff)} mono nested />
              </div>
            </div>

            <div className={CARD}>
              <SectionTitle title="Article grounding" />
              <p className="p-4 font-mono text-[11.5px] leading-relaxed text-[#aeb8cb]">
                {selectedRow.article_grounding}
              </p>
            </div>

            <div className={CARD}>
              <SectionTitle title="Interpretation" />
              <p className="p-4 text-[12.5px] leading-[1.75] text-[#c4cddd]">
                {selectedRow.interpretation}
              </p>
            </div>

            <div className={`${CARD} border-[#2dd4bf]/20`}>
              <SectionTitle title="Defensibility" />
              <p className="p-4 text-[12.5px] leading-[1.75] text-[#c4cddd]">
                {selectedRow.defensibility}
              </p>
            </div>

            {selectedRow.carried_caveats.length > 0 && (
              <div className={`${CARD} border-[#d9a95c]/25`}>
                <div className="flex items-center gap-2 border-b border-[#d9a95c]/20 px-4 py-3">
                  <IconAlertTriangle size={15} className="text-[#d9a95c]" />
                  <h3 className="text-[12px] font-medium text-[#e9eef7]">
                    Row-level carried caveats
                  </h3>
                </div>
                <ul className="space-y-2 p-4">
                  {selectedRow.carried_caveats.map((item, index) => (
                    <li
                      key={index}
                      className="rounded-lg border border-[#d9a95c]/20 bg-[#2a2013]/35 p-3 text-[11.5px] leading-relaxed text-[#aeb8cb]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Geography row={selectedRow} />
          </div>
        </section>
      ) : (
        <section className={`${PANEL} flex min-h-[220px] items-center justify-center p-8`}>
          <p className="text-center text-sm text-[#5c6780]">
            No site is available for the active filters.
          </p>
        </section>
      )}
    </div>
  );
}

function FilterButton({
  active,
  count,
  label,
  tone,
  onClick,
}: {
  active: boolean;
  count: number | string;
  label: string;
  tone: "danger" | "success";
  onClick: () => void;
}) {
  const activeClass =
    tone === "danger"
      ? "border-[#d97a6c]/50 bg-[#2d1818] text-[#d97a6c]"
      : "border-[#2dd4bf]/40 bg-[#0f2e2c] text-[#2dd4bf]";
  const hoverClass =
    tone === "danger"
      ? "hover:border-[#d97a6c]/40 hover:text-[#d97a6c]"
      : "hover:border-[#2dd4bf]/35 hover:text-[#2dd4bf]";

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] transition-colors ${
        active
          ? activeClass
          : `border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad] ${hoverClass}`
      }`}
    >
      <IconFilter size={12} />
      {label}
      <span className="font-mono">{count}</span>
    </button>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
      <IconBook2 size={15} className="text-[#2dd4bf]" />
      <h3 className="text-[12px] font-medium text-[#e9eef7]">{title}</h3>
    </div>
  );
}

function LiteralField({
  label,
  value,
  signal,
  mono = false,
  nested = false,
  tone,
}: {
  label: string;
  value: string;
  signal?: boolean;
  mono?: boolean;
  nested?: boolean;
  tone?: MetricTone;
}) {
  const surfaceClass = tone
    ? METRIC_TONE_CLASS[tone]
    : nested
      ? "border-[#1c2740] bg-[#0d1424]"
      : "border-[#1c2740] bg-[#111a2e]";

  return (
    <div className={`min-w-0 overflow-hidden rounded-lg border ${surfaceClass}`}>
      <div className="px-3 pt-2.5 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
        {label}
      </div>
      <div className="px-3 pb-3 pt-1.5">
        {signal !== undefined ? (
          <span className={`inline-flex max-w-full rounded-md border px-2 py-1 text-[12px] ${signalClass(signal)}`}>
            {value}
          </span>
        ) : (
          <span className={`break-words text-[12px] ${tone ? "" : "text-[#e9eef7]"} ${mono ? "font-mono" : ""}`}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

function Geography({ row }: { row: MethodInterpretationRow }) {
  const fields = [
    ["country", row.country],
    ["country code", row.country_code],
    ["country name", row.country_name],
    ["CDP region", row.cdp_region],
    ["city", row.city],
    ["address", row.address],
    ["ZIP code", row.zip_code],
    ["latitude", row.latitude],
    ["longitude", row.longitude],
  ].filter(([, value]) => value);

  if (fields.length === 0) return null;
  return (
    <div className={CARD}>
      <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
        <IconMapPin size={15} className="text-[#8b96ad]" />
        <h3 className="text-[12px] font-medium text-[#e9eef7]">Artifact geography</h3>
      </div>
      <dl className="grid gap-x-5 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[9.5px] uppercase tracking-wide text-[#5c6780]">{label}</dt>
            <dd className="mt-1 break-words text-[11.5px] text-[#aeb8cb]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
