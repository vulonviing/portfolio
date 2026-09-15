import { useEffect, useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconBook2,
  IconChevronRight,
  IconFilter,
  IconMapPin,
  IconSearch,
} from "@tabler/icons-react";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

export interface P1Row {
  location_id: string;
  location_name: string;
  rule_id: string;
  rule_label: string;
  status: string;
  near_breach: boolean;
  gap: number;
  threshold?: number;
  interpretation: string;
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

export interface P1Payload {
  registry_id?: string;
  rows?: P1Row[];
  carried_caveats?: string[];
}

interface SiteGroup {
  locationId: string;
  identity: P1Row;
  rows: P1Row[];
  obligatedCount: number;
  sourceIndex: number;
}

type StatusFilter = "obligated" | "near_breach" | "compliant" | null;

const STATUS_CLASS: Record<string, string> = {
  obligated: "border-[#d97a6c]/45 bg-[#2d1818] text-[#d97a6c]",
  near_breach: "border-[#d9a95c]/40 bg-[#2a2013] text-[#d9a95c]",
  compliant: "border-[#2dd4bf]/35 bg-[#0f2e2c] text-[#2dd4bf]",
};

function statusClass(status: string): string {
  return STATUS_CLASS[status] ?? "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad]";
}

function groupSites(rows: P1Row[]): SiteGroup[] {
  const groups = new Map<string, SiteGroup>();
  for (const [sourceIndex, row] of rows.entries()) {
    const existing = groups.get(row.location_id);
    if (existing) {
      existing.rows.push(row);
      if (row.status === "obligated") existing.obligatedCount += 1;
    } else {
      groups.set(row.location_id, {
        locationId: row.location_id,
        identity: row,
        rows: [row],
        obligatedCount: row.status === "obligated" ? 1 : 0,
        sourceIndex,
      });
    }
  }
  return [...groups.values()].sort(
    (left, right) =>
      right.obligatedCount - left.obligatedCount ||
      left.sourceIndex - right.sourceIndex
  );
}

export default function P1ArtifactView({ payload }: { payload: P1Payload }) {
  const rows = payload.rows ?? [];
  const chainCaveats = payload.carried_caveats ?? [];
  const sites = useMemo(() => groupSites(rows), [rows]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  const [selectedLocationId, setSelectedLocationId] = useState(
    sites[0]?.locationId ?? ""
  );
  const [selectedRuleId, setSelectedRuleId] = useState(
    sites[0]?.rows[0]?.rule_id ?? ""
  );

  useEffect(() => {
    setSelectedLocationId(sites[0]?.locationId ?? "");
  }, [payload.registry_id]);

  const filterCounts = useMemo(
    () => ({
      obligated: sites.filter((site) => site.obligatedCount > 0).length,
      near_breach: sites.filter((site) =>
        site.rows.some((row) => row.near_breach)
      ).length,
      compliant: sites.filter((site) =>
        site.rows.some((row) => row.status === "compliant")
      ).length,
    }),
    [sites]
  );

  const visibleSites = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sites.filter((site) => {
      if (statusFilter === "obligated" && site.obligatedCount === 0) return false;
      if (
        statusFilter === "near_breach" &&
        !site.rows.some((row) => row.near_breach)
      ) {
        return false;
      }
      if (
        statusFilter === "compliant" &&
        !site.rows.some((row) => row.status === "compliant")
      ) {
        return false;
      }
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
        ...site.rows.flatMap((ruleRow) => [
          ruleRow.rule_id,
          ruleRow.rule_label,
          ruleRow.status,
        ]),
      ];
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
    setSelectedRuleId(selectedSite?.rows[0]?.rule_id ?? "");
  }, [selectedSite?.locationId]);

  const selectedRow =
    selectedSite?.rows.find((row) => row.rule_id === selectedRuleId) ??
    selectedSite?.rows[0];

  if (rows.length === 0) {
    return (
      <>
        <div className={`${PANEL} p-8 text-center text-sm text-[#5c6780]`}>
          P1 payload contains no interpretation rows.
        </div>
        <ChainCaveats items={chainCaveats} />
      </>
    );
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(290px,0.68fr)_minmax(0,1.55fr)]">
        <section className={`${PANEL} flex min-h-0 flex-col`}>
          <div className="border-b border-[#1c2740] p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <IconMapPin size={16} className="text-[#8b96ad]" />
                <h2 className="text-sm font-medium text-[#e9eef7]">Sites</h2>
              </div>
              <div className="ml-auto flex flex-wrap justify-end gap-1.5">
                <button
                  type="button"
                  aria-pressed={statusFilter === "obligated"}
                  onClick={() =>
                    setStatusFilter((current) =>
                      current === "obligated" ? null : "obligated"
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] transition-colors ${
                    statusFilter === "obligated"
                      ? "border-[#d97a6c]/50 bg-[#2d1818] text-[#d97a6c]"
                      : "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad] hover:border-[#d97a6c]/40 hover:text-[#d97a6c]"
                  }`}
                >
                  <IconFilter size={12} />
                  Obligated
                  <span className="font-mono">{filterCounts.obligated}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={statusFilter === "near_breach"}
                  onClick={() =>
                    setStatusFilter((current) =>
                      current === "near_breach" ? null : "near_breach"
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] transition-colors ${
                    statusFilter === "near_breach"
                      ? "border-[#d9a95c]/50 bg-[#2a2013] text-[#d9a95c]"
                      : "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad] hover:border-[#d9a95c]/40 hover:text-[#d9a95c]"
                  }`}
                >
                  <IconFilter size={12} />
                  Near breach
                  <span className="font-mono">{filterCounts.near_breach}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={statusFilter === "compliant"}
                  onClick={() =>
                    setStatusFilter((current) =>
                      current === "compliant" ? null : "compliant"
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] transition-colors ${
                    statusFilter === "compliant"
                      ? "border-[#2dd4bf]/45 bg-[#0f2e2c] text-[#2dd4bf]"
                      : "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad] hover:border-[#2dd4bf]/35 hover:text-[#2dd4bf]"
                  }`}
                >
                  <IconFilter size={12} />
                  Compliant
                  <span className="font-mono">{filterCounts.compliant}</span>
                </button>
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
                    {site.rows.map((ruleRow) => (
                      <span
                        key={ruleRow.rule_id}
                        title={ruleRow.rule_label}
                        className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${statusClass(ruleRow.status)}`}
                      >
                        {ruleRow.rule_id} · {ruleRow.status}
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
                      key={row.rule_id}
                      onClick={() => setSelectedRuleId(row.rule_id)}
                      className={`rounded-lg border px-3 py-1.5 text-left transition-colors ${
                        row.rule_id === selectedRow.rule_id
                          ? statusClass(row.status)
                          : "border-[#1c2740] text-[#8b96ad] hover:border-[#2a3a5c] hover:bg-[#111a2e]"
                      }`}
                    >
                      <span className="block font-mono text-[10px]">{row.rule_id}</span>
                      <span className="mt-0.5 block max-w-[230px] truncate text-[10.5px]">
                        {row.rule_label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="cockpit-track max-h-[650px] space-y-4 overflow-y-auto p-4">
              <div
                className={`grid gap-2 ${
                  selectedRow.threshold !== undefined
                    ? "sm:grid-cols-4"
                    : "sm:grid-cols-3"
                }`}
              >
                <LiteralField label="status" value={selectedRow.status} status={selectedRow.status} />
                <LiteralField label="near breach" value={String(selectedRow.near_breach)} />
                <LiteralField label="gap" value={String(selectedRow.gap)} mono />
                {selectedRow.threshold !== undefined && (
                  <LiteralField
                    label="threshold"
                    value={String(selectedRow.threshold)}
                    mono
                  />
                )}
              </div>

              <div className={CARD}>
                <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
                  <IconBook2 size={15} className="text-[#2dd4bf]" />
                  <h3 className="text-[12px] font-medium text-[#e9eef7]">
                    Interpretation
                  </h3>
                </div>
                <p className="p-4 text-[12.5px] leading-[1.75] text-[#c4cddd]">
                  {selectedRow.interpretation}
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

      <ChainCaveats items={chainCaveats} />
    </>
  );
}

function LiteralField({
  label,
  value,
  status,
  mono = false,
}: {
  label: string;
  value: string;
  status?: string;
  mono?: boolean;
}) {
  return (
    <div className={`${CARD} min-w-0 overflow-hidden`}>
      <div className="px-3 pt-2.5 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
        {label}
      </div>
      <div className="px-3 pb-3 pt-1.5">
        {status ? (
          <span
            className={`inline-flex max-w-full rounded-md border px-2 py-1 text-[12px] ${statusClass(status)} ${
              mono ? "font-mono" : ""
            }`}
          >
            {value}
          </span>
        ) : (
          <span className={`text-[12px] text-[#e9eef7] ${mono ? "font-mono" : ""}`}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

function Geography({ row }: { row: P1Row }) {
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

function ChainCaveats({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className={`${PANEL} mt-4`}>
      <div className="flex items-center gap-2 border-b border-[#1c2740] px-4 py-3">
        <IconAlertTriangle size={15} className="text-[#d9a95c]" />
        <h2 className="text-sm font-medium text-[#e9eef7]">
          Chain-level caveats carried to F1
        </h2>
      </div>
      <ul className="grid gap-2 p-4 lg:grid-cols-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="rounded-lg border border-[#d9a95c]/20 bg-[#2a2013]/30 p-3 text-[11.5px] leading-relaxed text-[#aeb8cb]"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
