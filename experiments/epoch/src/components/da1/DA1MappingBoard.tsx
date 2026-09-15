/**
 * DA1MappingBoard — connector-board UI for the DA1 catalog mapping gate.
 *
 * Layout:
 *   [Field boxes | column]  [SVG connector overlay]  [Catalog palette | column]  [Detail panel]
 *
 * Interaction:
 *   • Drag a catalog chip → drop on a field box to assign / remap.
 *   • Per-field fallback buttons (approve DA1 suggestion / exclude / clear).
 * The published viewer always renders this board read-only.
 */
import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type {
  CatalogTarget,
  CatalogShape,
  DA1HumanDecision,
  FieldMapping,
} from "../../api/types";
import CatalogPalette, { CatalogChip, catalogGroups } from "./CatalogPalette";
import FieldDetailPanel from "./FieldDetailPanel";
import {
  toOverlayRect,
  rightMid,
  leftMid,
  cubicPath,
  stubPath,
} from "./connectorLines";

// ── Field state ───────────────────────────────────────────────────────────────

type PersistedDecision = "approved" | "remapped" | "excluded" | "unresolved";
type Decision = PersistedDecision | "pending";

interface FieldState {
  decision: Decision;
  target: CatalogTarget | null;
  reviewedAt?: string;
}

function initState(
  fields: FieldMapping[],
  humanDecisions: DA1HumanDecision[],
): Record<string, FieldState> {
  const decisionsById = new Map(
    humanDecisions.map((decision) => [decision.field_id, decision]),
  );
  const out: Record<string, FieldState> = {};
  for (const f of (fields ?? [])) {
    const humanDecision = decisionsById.get(f.field_id);
    out[f.field_id] = {
      decision: humanDecision?.decision ?? "pending",
      target: humanDecision?.catalog_target ?? null,
      reviewedAt: humanDecision?.reviewed_at,
    };
  }
  return out;
}

// ── Priority styling ──────────────────────────────────────────────────────────

const PRIORITY_BADGE: Record<string, string> = {
  core:     "bg-teal/15 text-teal border-teal/40",
  related:  "bg-gray-700/50 text-gray-300 border-gray-600",
  optional: "bg-gray-800 text-gray-500 border-gray-700",
};

const DECISION_CHIP: Record<Decision, string> = {
  approved:   "bg-teal/10 text-teal border-teal/30",
  remapped:   "bg-blue-900/30 text-blue-300 border-blue-700/50",
  excluded:   "bg-red-900/20 text-red-400 border-red-700/40",
  unresolved: "bg-yellow-900/20 text-yellow-400 border-yellow-700/40",
  pending:    "bg-amber-900/20 text-amber-300 border-amber-700/40",
};

const DECISION_LABEL: Record<Decision, string> = {
  approved:   "✓ approved",
  remapped:   "↔ remapped",
  excluded:   "✕ excluded",
  unresolved: "? unresolved",
  pending:    "• pending human review",
};

// ── Field box (droppable) ─────────────────────────────────────────────────────

interface FieldBoxProps {
  field: FieldMapping;
  state: FieldState;
  isSelected: boolean;
  onClick: () => void;
  boxRef: (el: HTMLElement | null) => void;
  onApprove: () => void;
  onExclude: () => void;
  onClear: () => void;
  readOnly: boolean;
}

function FieldBox({
  field,
  state,
  isSelected,
  onClick,
  boxRef,
  onApprove,
  onExclude,
  onClear,
  readOnly,
}: FieldBoxProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `field-${field.field_id}` });
  const hasTarget = !!state.target;
  const recommendation = field.catalog_targets?.[0] ?? null;

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        boxRef(el);
      }}
      onClick={onClick}
      className={[
        "relative rounded-xl border-2 p-3 cursor-pointer transition-all duration-150",
        isSelected
          ? "border-teal bg-teal/5 shadow-md shadow-teal/10"
          : "border-gray-700 bg-gray-900 hover:border-gray-600",
        isOver && !readOnly ? "border-teal/60 bg-teal/8 scale-[1.01]" : "",
        state.decision === "excluded" ? "opacity-50" : "",
      ].join(" ")}
    >
      {/* Field identity */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] text-gray-500">{field.field_id}</div>
          <div className="text-sm font-semibold text-gray-100 leading-tight break-words">{field.field_name}</div>
        </div>
        <span
          className={`flex-shrink-0 px-2 py-0.5 rounded-full border text-[10px] capitalize ${
            PRIORITY_BADGE[field.priority] ?? PRIORITY_BADGE.optional
          }`}
        >
          {field.priority}
        </span>
      </div>

      {/* Current target chip */}
      {hasTarget && state.decision !== "excluded" && (
        <div className="text-[10px] font-mono text-teal/80 truncate mb-1.5">
          {state.target!.kind}:{state.target!.name}
        </div>
      )}
      {!hasTarget && recommendation && (
        <div className="mb-1.5 truncate font-mono text-[10px] text-gray-500">
          DA1 suggests {recommendation.kind}:{recommendation.name}
        </div>
      )}

      {/* Decision state + inline controls */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`px-1.5 py-0.5 rounded border text-[10px] ${DECISION_CHIP[state.decision]}`}>
          {DECISION_LABEL[state.decision]}
        </span>
        {!readOnly && (
          <>
            {recommendation && state.decision !== "approved" && (
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(); }}
                className="text-[10px] px-1.5 py-0.5 rounded border border-teal/30 text-teal hover:bg-teal/10"
                title="Approve DA1's original suggestion"
              >
                ✓ approve
              </button>
            )}
            {state.decision !== "excluded" && (
              <button
                onClick={(e) => { e.stopPropagation(); onExclude(); }}
                className="text-[10px] px-1.5 py-0.5 rounded border border-red-700/40 text-red-400 hover:bg-red-900/20"
                title="Exclude this field"
              >
                ✕ exclude
              </button>
            )}
            {state.decision !== "unresolved" && (
              <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="text-[10px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-500 hover:bg-gray-800"
                title="Mark as unresolved"
              >
                unresolved
              </button>
            )}
          </>
        )}
      </div>

      {isOver && !readOnly && (
        <div className="absolute inset-0 rounded-xl border-2 border-dashed border-teal/50 pointer-events-none" />
      )}
    </div>
  );
}

// ── SVG connector overlay ─────────────────────────────────────────────────────

interface ConnectionPath {
  fieldId: string;
  decision: Decision;
  path: string;
}

interface OverlayProps {
  paths: ConnectionPath[];
}

function ConnectorOverlay({ paths }: OverlayProps) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      width="100%"
      height="100%"
    >
      <defs>
        <marker
          id="arrow-teal"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" className="fill-teal/60" />
        </marker>
        <marker
          id="arrow-blue"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#93c5fd" fillOpacity="0.6" />
        </marker>
      </defs>
      {paths.map(({ fieldId, decision, path }) => {
        if (decision === "excluded") {
          return (
            <path
              key={fieldId}
              d={path}
              fill="none"
              stroke="#f87171"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.5"
            />
          );
        }
        if (decision === "unresolved") return null;
        const isRemap = decision === "remapped";
        return (
          <path
            key={fieldId}
            d={path}
            fill="none"
            stroke={isRemap ? "#93c5fd" : "#009999"}
            strokeWidth={isRemap ? 1.5 : 2}
            strokeOpacity={isRemap ? 0.6 : 0.7}
            markerEnd={isRemap ? "url(#arrow-blue)" : "url(#arrow-teal)"}
          />
        );
      })}
    </svg>
  );
}

// ── Main board ────────────────────────────────────────────────────────────────

interface Props {
  fields: FieldMapping[];
  catalog: CatalogShape;
  humanDecisions?: DA1HumanDecision[];
  readOnly?: boolean;
}

export default function DA1MappingBoard({
  fields,
  catalog,
  humanDecisions = [],
  readOnly = true,
}: Props) {
  const [decisions, setDecisions] = useState<Record<string, FieldState>>(
    () => initState(fields, humanDecisions),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    fields[0]?.field_id ?? null,
  );
  const [activeDrag, setActiveDrag] = useState<CatalogTarget | null>(null);
  const [paths, setPaths] = useState<ConnectionPath[]>([]);

  // Refs for connector lines
  const overlayRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipRefs = useRef<Record<string, HTMLElement | null>>({});

  // ── Decision helpers ───────────────────────────────────────────────────────

  const setDecision = useCallback(
    (fieldId: string, decision: Decision, target: CatalogTarget | null) => {
      setDecisions((prev) => ({ ...prev, [fieldId]: { decision, target } }));
    },
    [],
  );

  const fieldById = (id: string) => fields.find((f) => f.field_id === id);

  const handleApprove = (fieldId: string) => {
    const field = fieldById(fieldId);
    const orig = field?.catalog_targets?.[0] ?? null;
    setDecision(fieldId, orig ? "approved" : "unresolved", orig);
  };

  const handleExclude = (fieldId: string) =>
    setDecision(fieldId, "excluded", null);

  const handleClear = (fieldId: string) =>
    setDecision(fieldId, "unresolved", null);

  const assignTarget = (fieldId: string, target: CatalogTarget) => {
    const field = fieldById(fieldId);
    const orig = field?.catalog_targets?.[0];
    const isOriginal =
      orig && orig.kind === target.kind && orig.name === target.name;
    setDecision(
      fieldId,
      isOriginal ? "approved" : "remapped",
      isOriginal ? orig : target,
    );
  };

  // ── DnD handlers ──────────────────────────────────────────────────────────

  const onDragStart = (event: DragStartEvent) => {
    setActiveDrag((event.active.data.current as { target: CatalogTarget }).target);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const overId = event.over?.id as string | undefined;
    if (!overId) return;
    const target = (event.active.data.current as { target: CatalogTarget }).target;
    if (overId.startsWith("field-")) {
      const fieldId = overId.slice("field-".length);
      assignTarget(fieldId, target);
      setSelectedId(fieldId);
    }
  };

  // ── Connector line recompute ───────────────────────────────────────────────

  const recomputePaths = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const newPaths: ConnectionPath[] = [];
    for (const field of fields) {
      const fid = field.field_id;
      const state = decisions[fid];
      const boxEl = boxRefs.current[fid];
      if (!boxEl) continue;

      if (state.decision === "excluded") {
        const boxR = toOverlayRect(boxEl, overlay);
        newPaths.push({
          fieldId: fid,
          decision: "excluded",
          path: stubPath(rightMid(boxR)),
        });
        continue;
      }

      if (!state.target) continue;
      const chipKey = `${state.target.kind}:${state.target.name}`;
      const chipEl = chipRefs.current[chipKey];
      if (!chipEl) continue;

      const boxR = toOverlayRect(boxEl, overlay);
      const chipR = toOverlayRect(chipEl, overlay);
      newPaths.push({
        fieldId: fid,
        decision: state.decision,
        path: cubicPath(rightMid(boxR), leftMid(chipR)),
      });
    }
    setPaths(newPaths);
  }, [fields, decisions]);

  useLayoutEffect(() => {
    recomputePaths();
  }, [recomputePaths]);

  useEffect(() => {
    const ro = new ResizeObserver(recomputePaths);
    if (overlayRef.current) ro.observe(overlayRef.current);
    window.addEventListener("scroll", recomputePaths, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", recomputePaths, true);
    };
  }, [recomputePaths]);

  // ── Assignments map for catalog palette highlighting ───────────────────────

  const assignments: Record<string, CatalogTarget | null> = {};
  for (const [fid, s] of Object.entries(decisions)) {
    if (s.target) assignments[fid] = s.target;
  }

  // ── Build chipRef registration ─────────────────────────────────────────────
  // Register a ref for every possible chip (field targets + all catalog entries)
  // so recomputePaths can find chips in either the Chosen or Catalog column.

  const chipRefHandlers: Record<string, (el: HTMLElement | null) => void> = {};
  const allCatalogTargets = Object.values(catalogGroups(catalog)).flat();
  const fieldTargets: CatalogTarget[] = [];
  for (const f of fields) {
    fieldTargets.push(...(f.catalog_targets ?? []), ...(f.alternative_targets ?? []));
  }
  for (const t of [...allCatalogTargets, ...fieldTargets]) {
    const key = `${t.kind}:${t.name}`;
    if (!chipRefHandlers[key]) {
      chipRefHandlers[key] = (el) => { chipRefs.current[key] = el; };
    }
  }

  // ── Selected field ─────────────────────────────────────────────────────────

  const selectedField = fields.find((f) => f.field_id === selectedId) ?? null;
  const selectedState = selectedId ? decisions[selectedId] : null;

  const board = (
    <div className="relative flex min-w-[68.5rem] gap-0" style={{ minHeight: "28rem" }}>
      {/* ── Left: field boxes ── */}
      <div className="z-10 w-[19rem] flex-shrink-0 space-y-2 pr-2">
        <div className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">
          Regulation fields
        </div>
        {fields.map((f) => (
          <FieldBox
            key={f.field_id}
            field={f}
            state={decisions[f.field_id]}
            isSelected={selectedId === f.field_id}
            onClick={() => setSelectedId(f.field_id)}
            boxRef={(el) => { boxRefs.current[f.field_id] = el; }}
            onApprove={() => handleApprove(f.field_id)}
            onExclude={() => handleExclude(f.field_id)}
            onClear={() => handleClear(f.field_id)}
            readOnly={readOnly}
          />
        ))}
      </div>

      {/* ── SVG connector overlay (positioned between columns) ── */}
      <div
        ref={overlayRef}
        className="relative z-0 w-14 flex-shrink-0"
      >
        <ConnectorOverlay paths={paths} />
      </div>

      {/* ── Right: Chosen + Catalog palette (two-band grid inside) ── */}
      <div className="z-10 flex min-w-96 flex-[5_1_0%] flex-col overflow-hidden pl-1">
        <div className="flex-1 overflow-hidden">
          <CatalogPalette
            catalog={catalog}
            assignments={assignments}
            fields={fields}
            chipRefs={chipRefHandlers}
            readOnly={readOnly}
          />
        </div>
      </div>

      {/* ── Detail panel ── */}
      <div className="min-w-[22rem] flex-[3_1_0%] border-l border-gray-800/50 pl-3">
        <div className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">
          Field detail
        </div>
        <FieldDetailPanel
          field={selectedField}
          assignedTarget={selectedState?.target ?? null}
          decision={selectedState?.decision}
          reviewedAt={selectedState?.reviewedAt}
          onPickAlternative={
            readOnly || !selectedId
              ? undefined
              : (t) => assignTarget(selectedId, t)
          }
          readOnly={readOnly}
        />
      </div>
    </div>
  );

  // DndContext must always wrap — useDroppable/useDraggable are called
  // unconditionally by FieldBox/CatalogChip.  readOnly simply disables
  // the drag handlers so no state changes occur.
  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={readOnly ? undefined : onDragStart}
      onDragEnd={readOnly ? undefined : onDragEnd}
    >
      <div className="epoch-card overflow-x-auto !p-3 sm:!p-4 xl:!p-5">
        {board}

      </div>

      {/* Drag overlay: floating preview chip */}
      <DragOverlay>
        {activeDrag && (
          <CatalogChip target={activeDrag} isActive={false} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
