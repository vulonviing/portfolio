import { Fragment, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconGitCompare } from "@tabler/icons-react";
import {
  MASK,
  compareMaskedDescending,
  formatMaskedNumber,
  formatMaskedPercent,
  isPublicNumber,
  subtractMasked,
} from "../../../lib/maskedValues";
import type {
  ConsolidationPayload,
  ConsolidationRow,
  D3Payload,
  DualMethodPayload,
  DualMethodRow,
  Granularity,
  ThresholdPayload,
  ThresholdRow,
} from "./types";
import { resolveGranularity } from "./types";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const RED = "#d97a6c";
const AMBER = "#d9a95c";
const TEAL = "#2dd4bf";

type CellState =
  | "exact"
  | "within"
  | "flagged"
  | "zvz"
  | "obligated"
  | "near"
  | "compliant"
  | "computed"
  | "none";

interface MatrixCell {
  state: CellState;
  title: string;
}

interface ActiveMatrixCell {
  key: string;
  title: string;
  element: HTMLButtonElement;
}

interface PopoverPosition {
  left: number;
  top?: number;
  bottom?: number;
}

interface LegendEntry {
  state: CellState;
  label: string;
}

function entitySort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function Section({
  title,
  count,
  note,
  children,
}: {
  title: string;
  count: number | string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${PANEL} mb-4`}>
      <div className="flex flex-wrap items-center gap-3 border-b border-[#1c2740] p-4 pb-3">
        <IconGitCompare size={16} className="text-[#8b96ad]" />
        <h2 className="text-sm font-medium text-[#e9eef7]">{title}</h2>
        <span className="font-mono text-xs text-[#5c6780]">{count}</span>
        {note && <span className="ml-auto font-mono text-[10.5px] text-[#5c6780]">{note}</span>}
      </div>
      {children}
    </section>
  );
}

function EmptyBody({ children }: { children: ReactNode }) {
  return <div className="px-4 py-8 text-center text-[12px] text-[#5c6780]">{children}</div>;
}

function matrixStyle(state: CellState): CSSProperties {
  if (state === "exact") return { backgroundColor: "rgba(45,212,191,0.34)" };
  if (state === "within") {
    return { backgroundColor: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.45)" };
  }
  if (state === "flagged" || state === "obligated") {
    return { backgroundColor: "rgba(217,122,108,0.55)" };
  }
  if (state === "near") {
    return { backgroundColor: "rgba(217,169,92,0.4)", border: "1px solid rgba(217,169,92,0.7)" };
  }
  if (state === "compliant" || state === "computed") {
    return { backgroundColor: "rgba(45,212,191,0.24)", border: "1px solid rgba(45,212,191,0.35)" };
  }
  if (state === "zvz") return { backgroundColor: "transparent", border: "1px dashed #2f3c58" };
  return { backgroundColor: "#0e1526", border: "1px solid #1c2740" };
}

function matrixPopoverPosition(element: HTMLElement): PopoverPosition {
  const rect = element.getBoundingClientRect();
  const halfWidth = 168;
  const margin = 8;
  const left = Math.min(
    window.innerWidth - halfWidth - margin,
    Math.max(halfWidth + margin, rect.left + rect.width / 2)
  );

  if (rect.bottom + 64 > window.innerHeight) {
    return { left, bottom: window.innerHeight - rect.top + margin };
  }
  return { left, top: rect.bottom + margin };
}

function DimensionMatrix({
  entityLabel,
  dimensionLabel,
  entities,
  dimensions,
  dimensionDisplay = (value) => value,
  cellFor,
  legend,
}: {
  entityLabel: string;
  dimensionLabel: string;
  entities: string[];
  dimensions: string[];
  dimensionDisplay?: (value: string) => string;
  cellFor: (entity: string, dimension: string) => MatrixCell;
  legend: LegendEntry[];
}) {
  const [hoveredCell, setHoveredCell] = useState<ActiveMatrixCell | null>(null);
  const [pinnedCell, setPinnedCell] = useState<ActiveMatrixCell | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null);
  const activeCell = pinnedCell ?? hoveredCell;

  useEffect(() => {
    if (!activeCell) return;
    const updatePosition = () => setPopoverPosition(matrixPopoverPosition(activeCell.element));
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [activeCell]);

  useEffect(() => {
    const dismiss = () => {
      setPinnedCell(null);
      setHoveredCell(null);
      setPopoverPosition(null);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  return (
    <Section
      title={`${entityLabel} × ${dimensionLabel}`}
      count={MASK}
      note={`columns are ${entityLabel.toLowerCase()}`}
    >
      {entities.length === 0 || dimensions.length === 0 ? (
        <EmptyBody>No result rows are available to build this matrix.</EmptyBody>
      ) : (
        <div className="p-4">
          <div className="cockpit-track overflow-x-auto overflow-y-hidden pb-2">
            <div
              className="grid gap-[3px]"
              style={{
                gridTemplateColumns: `minmax(90px,auto) repeat(${entities.length}, minmax(34px,1fr))`,
                minWidth: Math.max(720, 110 + entities.length * 38),
              }}
            >
              <div />
              {entities.map((entity) => (
                <div key={entity} className="truncate text-center font-mono text-[8.5px] text-[#5c6780]">
                  {entity}
                </div>
              ))}
              {dimensions.map((dimension) => (
                <Fragment key={dimension}>
                  <div className="flex items-center pr-2 text-[10px] text-[#5c6780]">
                    {dimensionDisplay(dimension)}
                  </div>
                  {entities.map((entity) => {
                    const cell = cellFor(entity, dimension);
                    const cellKey = `${entity}-${dimension}`;
                    const isPinned = pinnedCell?.key === cellKey;
                    return (
                      <button
                        key={cellKey}
                        type="button"
                        aria-label={cell.title}
                        aria-pressed={isPinned}
                        className={`block h-[19px] w-full cursor-pointer appearance-none rounded-[3px] border-0 p-0 transition-[filter,box-shadow] duration-150 hover:brightness-125 hover:shadow-[inset_0_0_0_1px_#8b96ad] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_#8b96ad] ${
                          isPinned ? "brightness-125 shadow-[inset_0_0_0_1px_#8b96ad]" : ""
                        }`}
                        style={matrixStyle(cell.state)}
                        onMouseEnter={(event) => {
                          if (pinnedCell) return;
                          const next = { key: cellKey, title: cell.title, element: event.currentTarget };
                          setHoveredCell(next);
                          setPopoverPosition(matrixPopoverPosition(event.currentTarget));
                        }}
                        onMouseLeave={() => {
                          setHoveredCell((current) => (current?.key === cellKey ? null : current));
                        }}
                        onFocus={(event) => {
                          if (pinnedCell) return;
                          const next = { key: cellKey, title: cell.title, element: event.currentTarget };
                          setHoveredCell(next);
                          setPopoverPosition(matrixPopoverPosition(event.currentTarget));
                        }}
                        onBlur={() => {
                          setHoveredCell((current) => (current?.key === cellKey ? null : current));
                        }}
                        onPointerDown={(event) => {
                          if (event.button === 0) event.stopPropagation();
                        }}
                        onClick={(event) => {
                          const next = { key: cellKey, title: cell.title, element: event.currentTarget };
                          setPinnedCell(next);
                          setHoveredCell(null);
                          setPopoverPosition(matrixPopoverPosition(event.currentTarget));
                        }}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[#1c2740] pt-3 text-[11px] text-[#8b96ad]">
            {legend.map((entry) => (
              <span key={`${entry.state}-${entry.label}`} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-[2px]" style={matrixStyle(entry.state)} />
                {entry.label}
              </span>
            ))}
          </div>
          {activeCell &&
            popoverPosition &&
            createPortal(
              <div
                role="tooltip"
                className="pointer-events-none fixed z-50 max-w-[320px] -translate-x-1/2 rounded-md border border-[#2f3c58] bg-[#101827] px-2.5 py-1.5 text-center text-[11px] text-[#e9eef7] shadow-xl"
                style={popoverPosition}
              >
                {activeCell.title}
              </div>,
              document.body
            )}
        </div>
      )}
    </Section>
  );
}

function dualState(row: DualMethodRow | undefined): CellState {
  if (!row) return "none";
  if (isPublicNumber(row.method_a) && isPublicNumber(row.method_b) && row.method_a === 0 && row.method_b === 0) return "zvz";
  if (row.discrepancy_flag) return "flagged";
  if (isPublicNumber(row.pct_diff) && Math.abs(row.pct_diff) < 1e-9) return "exact";
  return "within";
}

const DUAL_STATE_LABEL: Record<CellState, string> = {
  exact: "exact",
  within: "within tolerance",
  flagged: "flagged",
  zvz: "zero-vs-zero",
  obligated: "obligated",
  near: "near breach",
  compliant: "compliant",
  computed: "computed",
  none: "—",
};

function DualTable({ rows, granularity }: { rows: DualMethodRow[]; granularity: Granularity }) {
  if (rows.length === 0) return <EmptyBody>No D3 result rows were produced.</EmptyBody>;
  return (
    <div className="cockpit-track overflow-auto" style={{ maxHeight: 420 }}>
      <table className="w-full min-w-[980px] table-fixed text-[12px]">
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "16%" }} />
        </colgroup>
        <thead className="sticky top-0" style={{ backgroundColor: "#0d1424" }}>
          <tr className="text-center text-[10px] uppercase tracking-wide text-[#5c6780]">
            <th className="px-3 py-2 font-medium">Site</th>
            <th className="px-3 py-2 font-medium">{granularity.label}</th>
            <th className="px-3 py-2 font-medium">Method A</th>
            <th className="px-3 py-2 font-medium">Method B</th>
            <th className="px-3 py-2 font-medium">Δ t CO₂e</th>
            <th className="px-3 py-2 font-medium">Diff %</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const state = dualState(row);
            const delta = subtractMasked(row.method_b, row.method_a);
            return (
              <tr
                key={`${row.location_id}-${row.year}`}
                className="border-t border-[#111a2e] transition-colors hover:bg-[#15203a]"
              >
                <td className="px-3 py-2 text-center">
                  <div className="font-mono text-[11px] text-[#8b96ad]">{row.location_id}</div>
                  <div className="text-[11px] text-[#5c6780]">{row.location_name}</div>
                </td>
                <td className="px-3 py-2 text-center font-mono text-[#8b96ad]">{row.year}</td>
                <td className="px-3 py-2 text-center font-mono text-[#e9eef7]">
                  {formatMaskedNumber(row.method_a, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2 text-center font-mono text-[#e9eef7]">
                  {formatMaskedNumber(row.method_b, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2 text-center font-mono text-[#8b96ad]">
                  {isPublicNumber(delta) && delta >= 0 ? "+" : ""}
                  {formatMaskedNumber(delta, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td
                  className="px-3 py-2 text-center font-mono"
                  style={{ color: state === "flagged" ? RED : state === "zvz" ? "#5c6780" : TEAL }}
                >
                  {formatMaskedPercent(row.pct_diff)}
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className="rounded-full border px-2 py-0.5 text-[10.5px]"
                    style={{
                      borderColor: state === "flagged" ? `${RED}66` : state === "zvz" ? "#2f3c58" : `${TEAL}66`,
                      color: state === "flagged" ? RED : state === "zvz" ? "#8b96ad" : TEAL,
                    }}
                  >
                    {DUAL_STATE_LABEL[state]}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DualMethodView({
  payload,
  declaredGrain,
}: {
  payload: DualMethodPayload;
  declaredGrain?: string | null;
}) {
  const sorted = useMemo(
    () => [...payload.rows].sort((a, b) => compareMaskedDescending(a.pct_diff, b.pct_diff)),
    [payload.rows]
  );
  const flagged = useMemo(() => sorted.filter((row) => row.discrepancy_flag), [sorted]);
  const entities = useMemo(
    () => Array.from(new Set(payload.rows.map((row) => row.location_id))).sort(entitySort),
    [payload.rows]
  );
  const periods = useMemo(
    () => Array.from(new Set(payload.rows.map((row) => row.year))).filter(Boolean).sort(entitySort),
    [payload.rows]
  );
  const byKey = useMemo(
    () => new Map(payload.rows.map((row) => [`${row.location_id}|${row.year}`, row])),
    [payload.rows]
  );
  const granularity = resolveGranularity(declaredGrain, periods);
  const counts = payload.rows.reduce<Record<CellState, number>>(
    (acc, row) => {
      acc[dualState(row)] += 1;
      return acc;
    },
    { exact: 0, within: 0, flagged: 0, zvz: 0, obligated: 0, near: 0, compliant: 0, computed: 0, none: 0 }
  );
  const noData = entities.length * periods.length - payload.rows.length;

  return (
    <>
      <Section
        title="All results"
        count={MASK}
        note={`worst difference first · site × ${granularity.label}`}
      >
        <DualTable rows={sorted} granularity={granularity} />
      </Section>
      <Section title="Flagged entries" count={MASK} note={`tolerance ${formatMaskedPercent(payload.tolerance)}`}>
        {flagged.length > 0 ? (
          <DualTable rows={flagged} granularity={granularity} />
        ) : (
          <EmptyBody>No entries exceed the D3 tolerance.</EmptyBody>
        )}
      </Section>
      <DimensionMatrix
        entityLabel="Site"
        dimensionLabel={granularity.label}
        entities={entities}
        dimensions={periods}
        cellFor={(site, period) => {
          const row = byKey.get(`${site}|${period}`);
          return {
            state: dualState(row),
            title: row
              ? `${row.location_name} · ${period} · ${formatMaskedPercent(row.pct_diff)}`
              : `${site} · ${period} · no data`,
          };
        }}
        legend={[
          { state: "exact", label: `exact ${MASK}` },
          { state: "within", label: `within tolerance ${MASK}` },
          { state: "flagged", label: `flagged ${MASK}` },
          { state: "zvz", label: `zero-vs-zero ${MASK}` },
          { state: "none", label: `no data ${MASK}` },
        ]}
      />
    </>
  );
}

const STATUS_META: Record<string, { color: string; label: string; rank: number }> = {
  obligated: { color: RED, label: "obligated", rank: 0 },
  near_breach: { color: AMBER, label: "near breach", rank: 1 },
  compliant: { color: TEAL, label: "compliant", rank: 2 },
};

function thresholdSort(a: ThresholdRow, b: ThresholdRow): number {
  const rankA = STATUS_META[a.status]?.rank ?? 3;
  const rankB = STATUS_META[b.status]?.rank ?? 3;
  return rankA === rankB ? compareMaskedDescending(a.gap, b.gap) : rankA - rankB;
}

function ThresholdTable({ rows }: { rows: ThresholdRow[] }) {
  if (rows.length === 0) return <EmptyBody>No D3 result rows were produced.</EmptyBody>;
  return (
    <div className="cockpit-track overflow-auto" style={{ maxHeight: 520 }}>
      <table className="w-full min-w-[1000px] table-fixed text-[12px]">
        <colgroup>
          <col style={{ width: "25%" }} />
          <col style={{ width: "32%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "9%" }} />
        </colgroup>
        <thead className="sticky top-0" style={{ backgroundColor: "#0d1424" }}>
          <tr className="text-center text-[10px] uppercase tracking-wide text-[#5c6780]">
            <th className="px-3 py-2 font-medium">Site</th>
            <th className="px-3 py-2 font-medium">Rule</th>
            <th className="px-3 py-2 font-medium">Threshold</th>
            <th className="px-3 py-2 font-medium">3yr avg</th>
            <th className="px-3 py-2 font-medium">Gap</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const meta = STATUS_META[row.status] ?? { color: "#8b96ad", label: row.status, rank: 3 };
            return (
              <tr
                key={`${row.location_id}-${row.rule_id}`}
                className="border-t border-[#111a2e] transition-colors hover:bg-[#15203a]"
              >
                <td className="px-3 py-2 text-center">
                  <div className="font-mono text-[11px] text-[#8b96ad]">{row.location_id}</div>
                  <div className="text-[11px] text-[#5c6780]">{row.location_name}</div>
                </td>
                <td className="px-3 py-2 text-center text-[#8b96ad]">{row.rule_label}</td>
                <td className="px-3 py-2 text-center font-mono text-[#8b96ad]">
                  {formatMaskedNumber(row.threshold)}
                </td>
                <td className="px-3 py-2 text-center font-mono text-[#e9eef7]">
                  {formatMaskedNumber(row.avg_3yr, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-3 py-2 text-center font-mono" style={{ color: isPublicNumber(row.gap) && row.gap >= 0 ? RED : TEAL }}>
                  {isPublicNumber(row.gap) && row.gap >= 0 ? "+" : ""}
                  {formatMaskedNumber(row.gap, { maximumFractionDigits: 0 })}
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className="rounded-full border px-2 py-0.5 text-[10.5px]"
                    style={{ borderColor: `${meta.color}66`, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function thresholdCellState(row: ThresholdRow | undefined): CellState {
  if (!row) return "none";
  if (row.status === "obligated") return "obligated";
  if (row.status === "near_breach") return "near";
  return "compliant";
}

function ThresholdView({ payload }: { payload: ThresholdPayload }) {
  const sorted = useMemo(() => [...payload.rows].sort(thresholdSort), [payload.rows]);
  const flagged = useMemo(
    () => sorted.filter((row) => row.status === "obligated" || row.status === "near_breach"),
    [sorted]
  );
  const sites = useMemo(
    () => Array.from(new Set(payload.rows.map((row) => row.location_id))).sort(entitySort),
    [payload.rows]
  );
  const rules = useMemo(
    () => Array.from(new Set(payload.rows.map((row) => row.rule_id))).sort(entitySort),
    [payload.rows]
  );
  const ruleLabels = useMemo(
    () => new Map(payload.rows.map((row) => [row.rule_id, row.rule_label])),
    [payload.rows]
  );
  const byKey = useMemo(
    () => new Map(payload.rows.map((row) => [`${row.location_id}|${row.rule_id}`, row])),
    [payload.rows]
  );
  const noData = sites.length * rules.length - payload.rows.length;

  return (
    <>
      <Section title="All results" count={MASK} note={`column ${payload.column}`}>
        <ThresholdTable rows={sorted} />
      </Section>
      <Section title="Flagged entries" count={MASK} note="obligated + near breach">
        {flagged.length > 0 ? (
          <ThresholdTable rows={flagged} />
        ) : (
          <EmptyBody>No obligated or near-breach entries were produced.</EmptyBody>
        )}
      </Section>
      <DimensionMatrix
        entityLabel="Site"
        dimensionLabel="rule"
        entities={sites}
        dimensions={rules}
        dimensionDisplay={(rule) => ruleLabels.get(rule) ?? rule}
        cellFor={(site, rule) => {
          const row = byKey.get(`${site}|${rule}`);
          return {
            state: thresholdCellState(row),
            title: row
              ? `${row.location_name} · ${row.rule_label} · ${STATUS_META[row.status]?.label ?? row.status}`
              : `${site} · ${rule} · no data`,
          };
        }}
        legend={[
          { state: "obligated", label: `obligated ${payload.n_obligated}` },
          { state: "near", label: `near breach ${payload.n_near_breach}` },
          { state: "compliant", label: `compliant ${payload.n_compliant}` },
          { state: "none", label: `no data ${MASK}` },
        ]}
      />
    </>
  );
}

function ConsolidationTable({ rows }: { rows: ConsolidationRow[] }) {
  if (rows.length === 0) return <EmptyBody>No D3 result rows were produced.</EmptyBody>;
  return (
    <div className="cockpit-track overflow-auto" style={{ maxHeight: 520 }}>
      <table className="w-full min-w-[720px] table-fixed text-[12px]">
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "20%" }} />
        </colgroup>
        <thead className="sticky top-0" style={{ backgroundColor: "#0d1424" }}>
          <tr className="text-center text-[10px] uppercase tracking-wide text-[#5c6780]">
            <th className="px-3 py-2 font-medium">Division</th>
            <th className="px-3 py-2 font-medium">Period</th>
            <th className="px-3 py-2 font-medium">Subtotal</th>
            <th className="px-3 py-2 font-medium">Sites</th>
            <th className="px-3 py-2 font-medium">Source rows</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.division}-${row.year}`}
              className="border-t border-[#111a2e] transition-colors hover:bg-[#15203a]"
            >
              <td className="px-3 py-2 text-center font-mono text-[#e9eef7]">{row.division}</td>
              <td className="px-3 py-2 text-center font-mono text-[#8b96ad]">{row.year}</td>
              <td className="px-3 py-2 text-center font-mono text-[#e9eef7]">
                {formatMaskedNumber(row.subtotal_t, { maximumFractionDigits: 1 })}
              </td>
              <td className="px-3 py-2 text-center font-mono text-[#8b96ad]">{row.n_sites}</td>
              <td className="px-3 py-2 text-center font-mono text-[#8b96ad]">{row.n_rows}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConsolidationView({
  payload,
  declaredGrain,
}: {
  payload: ConsolidationPayload;
  declaredGrain?: string | null;
}) {
  const sorted = useMemo(
    () =>
      [...payload.rows].sort(
        (a, b) => entitySort(a.division, b.division) || entitySort(a.year, b.year)
      ),
    [payload.rows]
  );
  const divisions = useMemo(
    () => Array.from(new Set(payload.rows.map((row) => row.division))).sort(entitySort),
    [payload.rows]
  );
  const periods = useMemo(
    () => Array.from(new Set(payload.rows.map((row) => row.year))).filter(Boolean).sort(entitySort),
    [payload.rows]
  );
  const byKey = useMemo(
    () => new Map(payload.rows.map((row) => [`${row.division}|${row.year}`, row])),
    [payload.rows]
  );
  const granularity = resolveGranularity(declaredGrain, periods);
  const noData = divisions.length * periods.length - payload.rows.length;

  return (
    <>
      <Section
        title="All results"
        count={MASK}
        note={`${payload.measure_column} grouped by ${payload.group_by_column}`}
      >
        <ConsolidationTable rows={sorted} />
      </Section>
      <Section title="Flagged entries" count={MASK}>
        <EmptyBody>This consolidation computation does not classify rows as flagged.</EmptyBody>
      </Section>
      <DimensionMatrix
        entityLabel="Division"
        dimensionLabel={granularity.label}
        entities={divisions}
        dimensions={periods}
        cellFor={(division, period) => {
          const row = byKey.get(`${division}|${period}`);
          return {
            state: row ? "computed" : "none",
            title: row
              ? `${division} · ${period} · ${formatMaskedNumber(row.subtotal_t)} · ${MASK} sites · ${MASK} rows`
              : `${division} · ${period} · no data`,
          };
        }}
        legend={[
          { state: "computed", label: `computed ${MASK}` },
          { state: "none", label: `no data ${MASK}` },
        ]}
      />
    </>
  );
}

export default function D3Results({
  payload,
  declaredGrain,
}: {
  payload: D3Payload;
  declaredGrain?: string | null;
}) {
  switch (payload.kind) {
    case "dual_method":
      return <DualMethodView payload={payload} declaredGrain={declaredGrain} />;
    case "threshold":
      return <ThresholdView payload={payload} />;
    case "consolidation":
      return <ConsolidationView payload={payload} declaredGrain={declaredGrain} />;
  }
}
