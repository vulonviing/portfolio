/**
 * CatalogPalette — the right section of the DA1 mapping board.
 *
 * Renders two side-by-side columns per kind band (source domains, entity
 * grains, time grains, measures, filters):
 *
 *   [Chosen]           [Data catalog]
 *   ────────────────   ──────────────────────────
 *   Source domains:
 *     <assigned>         <unassigned>
 *   Entity grains:
 *     <assigned>         <unassigned>
 *   …
 *
 * Assigned chips appear in the Chosen column ordered by the vertical index
 * of the field that assigned them, so connector lines run parallel and never
 * cross. Unassigned chips stay in the Catalog column. The search box filters
 * both columns.
 *
 * Chips are @dnd-kit Draggable (dropped onto field boxes = assign; dropped on
 * the exclude zone = exclude). No within-cluster reorder in this iteration.
 *
 * Mirrors the CLI helper _all_catalog_targets (regulation_cli.py:2055).
 */
import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { CatalogShape, CatalogTarget, FieldMapping } from "../../api/types";

// ── helpers ───────────────────────────────────────────────────────────────────

const KIND_LABELS: Record<string, string> = {
  source_domain: "Source domains",
  entity_grain:  "Entity grains",
  time_grain:    "Time grains",
  measure:       "Measures",
  filter:        "Filters",
};

export const KIND_ORDER = [
  "source_domain",
  "entity_grain",
  "time_grain",
  "measure",
  "filter",
] as const;

export type Kind = (typeof KIND_ORDER)[number];

const KIND_COLORS: Record<Kind, string> = {
  source_domain: "bg-purple-900/30 border-purple-700/50 text-purple-300",
  entity_grain:  "bg-blue-900/30 border-blue-700/50 text-blue-300",
  time_grain:    "bg-indigo-900/30 border-indigo-700/50 text-indigo-300",
  measure:       "bg-teal/10 border-teal/30 text-teal",
  filter:        "bg-orange-900/30 border-orange-700/50 text-orange-300",
};

/**
 * Build the full catalog as {kind → CatalogTarget[]} using the same logic as
 * the CLI helper _all_catalog_targets.  Exported so callers (DA1MappingBoard)
 * can iterate all targets for ref registration.
 *
 * measures and selectable_filters in catalog_snapshot are nested dicts
 * {group: {name: metadata}} — use Object.keys(group) to get names.
 */
export function catalogGroups(catalog: CatalogShape): Record<Kind, CatalogTarget[]> {
  const sourceDomains: CatalogTarget[] = Object.keys(
    catalog?.source_domains ?? {},
  ).map((name) => ({ kind: "source_domain", name }));

  const grains = catalog?.allowed_grains ?? { entity_grain: [], time_grain: [] };
  const entity: CatalogTarget[] = (grains.entity_grain ?? []).map(
    (name) => ({ kind: "entity_grain", name }),
  );
  const time: CatalogTarget[] = (grains.time_grain ?? []).map(
    (name) => ({ kind: "time_grain", name }),
  );
  const measures: CatalogTarget[] = Object.values(catalog?.measures ?? {})
    .flatMap((g) =>
      g && typeof g === "object" && !Array.isArray(g) ? Object.keys(g as object) : [],
    )
    .map((name) => ({ kind: "measure", name }));
  const filters: CatalogTarget[] = Object.values(catalog?.selectable_filters ?? {})
    .flatMap((g) =>
      g && typeof g === "object" && !Array.isArray(g) ? Object.keys(g as object) : [],
    )
    .map((name) => ({ kind: "filter", name }));

  return {
    source_domain: sourceDomains,
    entity_grain:  entity,
    time_grain:    time,
    measure:       measures,
    filter:        filters,
  };
}

// ── Draggable chip ─────────────────────────────────────────────────────────────

interface ChipProps {
  target: CatalogTarget;
  /** Ref callback so the board can locate the chip for connector lines */
  chipRef?: (el: HTMLElement | null) => void;
  /** Highlight ring — chip is currently the active assignment of some field */
  isActive?: boolean;
  readOnly?: boolean;
}

export function CatalogChip({ target, chipRef, isActive, readOnly }: ChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `chip-${target.kind}-${target.name}`,
      data: { target },
      disabled: readOnly,
    });

  const color =
    KIND_COLORS[target.kind as Kind] ?? "bg-gray-800 border-gray-700 text-gray-300";

  return (
    <span
      ref={(el) => {
        setNodeRef(el);
        chipRef?.(el);
      }}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={[
        "inline-flex max-w-full min-w-0 items-center gap-1 px-2 py-0.5 rounded-full border text-xs",
        readOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        "select-none transition-opacity",
        color,
        isDragging ? "opacity-40 scale-95" : "",
        isActive   ? "ring-1 ring-teal/60 ring-offset-1 ring-offset-gray-900" : "",
      ].join(" ")}
    >
      <span className="font-mono opacity-60 text-[10px]">{target.kind[0]}</span>
      <span className="min-w-0 truncate" title={target.name}>{target.name}</span>
    </span>
  );
}

// ── CatalogPalette ────────────────────────────────────────────────────────────

interface Props {
  catalog: CatalogShape;
  /**
   * field_id → assigned catalog target.  Used to split each kind band into
   * Chosen (assigned) and Catalog (unassigned) cells.
   */
  assignments: Record<string, CatalogTarget | null>;
  /**
   * The original field list (in display order).  Used to sort the Chosen cell
   * by field index so connector lines run parallel without crossing.
   */
  fields: FieldMapping[];
  /** Ref callbacks keyed by "kind:name" so the board can find chip DOM elements */
  chipRefs: Record<string, (el: HTMLElement | null) => void>;
  readOnly?: boolean;
}

export default function CatalogPalette({
  catalog,
  assignments,
  fields,
  chipRefs,
  readOnly,
}: Props) {
  const [query, setQuery] = useState("");
  const groups = catalogGroups(catalog);

  // Invert: "kind:name" → index of the field that assigned it.
  // Used to sort the Chosen column vertically-parallel with the field boxes.
  const chipFieldIndex: Record<string, number> = {};
  for (const [fieldId, target] of Object.entries(assignments)) {
    if (target) {
      const idx = fields.findIndex((f) => f.field_id === fieldId);
      chipFieldIndex[`${target.kind}:${target.name}`] = idx >= 0 ? idx : 999;
    }
  }

  // Set of all currently-chosen "kind:name" keys
  const chosenKeys = new Set(
    Object.values(assignments)
      .filter(Boolean)
      .map((t) => `${t!.kind}:${t!.name}`),
  );

  const lq = query.toLowerCase();

  /** Chips for a kind that belong to the Chosen column, sorted by field index. */
  function chosenOf(kind: Kind): CatalogTarget[] {
    return (groups[kind] ?? [])
      .filter(
        (t) =>
          chosenKeys.has(`${kind}:${t.name}`) &&
          (!lq || t.name.toLowerCase().includes(lq)),
      )
      .sort(
        (a, b) =>
          (chipFieldIndex[`${kind}:${a.name}`] ?? 999) -
          (chipFieldIndex[`${kind}:${b.name}`] ?? 999),
      );
  }

  /** Chips for a kind that belong to the Catalog column (unassigned). */
  function catalogOf(kind: Kind): CatalogTarget[] {
    return (groups[kind] ?? []).filter(
      (t) =>
        !chosenKeys.has(`${kind}:${t.name}`) &&
        (!lq || t.name.toLowerCase().includes(lq)),
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="flex-shrink-0 mb-2">
        <input
          type="text"
          placeholder="Search catalog…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-teal/50"
        />
      </div>

      {/* Column headers */}
      <div className="flex-shrink-0 flex gap-2 mb-2 border-b border-gray-800/60 pb-1.5">
        <div className="w-40 flex-shrink-0 text-[10px] uppercase tracking-widest text-gray-500">
          Decision
        </div>
        <div className="flex-1 text-[10px] uppercase tracking-widest text-gray-500">
          {readOnly ? "Data catalog (view only)" : "Data catalog"}
        </div>
      </div>

      {/* Scrollable band list */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {KIND_ORDER.map((kind) => {
          const chosen  = chosenOf(kind);
          const catalog = catalogOf(kind);
          if (chosen.length === 0 && catalog.length === 0) return null;

          return (
            <div key={kind}>
              {/* Kind label — spans both columns */}
              <div className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">
                {KIND_LABELS[kind]}
              </div>
              {/* Two cells side-by-side */}
              <div className="flex gap-2">
                {/* Chosen cell */}
                <div className="flex min-h-[1.25rem] w-40 min-w-0 flex-shrink-0 flex-wrap content-start gap-1">
                  {chosen.map((t) => {
                    const key = `${t.kind}:${t.name}`;
                    if (readOnly) {
                      const color =
                        KIND_COLORS[t.kind as Kind] ??
                        "bg-gray-800 border-gray-700 text-gray-300";
                      return (
                        <span
                          key={key}
                          ref={chipRefs[key]}
                          className={[
                            "inline-flex max-w-full min-w-0 items-center gap-1 px-2 py-0.5 rounded-full border text-xs",
                            color,
                            "ring-1 ring-teal/60",
                          ].join(" ")}
                        >
                          <span className="font-mono opacity-60 text-[10px]">
                            {t.kind[0]}
                          </span>
                          <span className="min-w-0 truncate" title={t.name}>{t.name}</span>
                        </span>
                      );
                    }
                    return (
                      <CatalogChip
                        key={key}
                        target={t}
                        isActive
                        chipRef={chipRefs[key]}
                      />
                    );
                  })}
                  {chosen.length === 0 && (
                    <span className="text-[10px] text-gray-700 italic">—</span>
                  )}
                </div>

                {/* Catalog cell */}
                <div className="flex min-h-[1.25rem] min-w-0 flex-1 flex-wrap content-start gap-1">
                  {catalog.map((t) => {
                    const key = `${t.kind}:${t.name}`;
                    if (readOnly) {
                      const color =
                        KIND_COLORS[t.kind as Kind] ??
                        "bg-gray-800 border-gray-700 text-gray-300";
                      return (
                        <span
                          key={key}
                          ref={chipRefs[key]}
                          className={[
                            "inline-flex max-w-full min-w-0 items-center gap-1 px-2 py-0.5 rounded-full border text-xs opacity-50",
                            color,
                          ].join(" ")}
                        >
                          <span className="font-mono opacity-60 text-[10px]">
                            {t.kind[0]}
                          </span>
                          <span className="min-w-0 truncate" title={t.name}>{t.name}</span>
                        </span>
                      );
                    }
                    return (
                      <CatalogChip
                        key={key}
                        target={t}
                        chipRef={chipRefs[key]}
                      />
                    );
                  })}
                  {catalog.length === 0 && (
                    <span className="text-[10px] text-gray-700 italic">—</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
