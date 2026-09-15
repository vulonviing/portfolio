/**
 * Pipeline flow — serpentine (boustrophedon) overview of all 8 steps + 4 human
 * gates. Fills the main-area width with no horizontal scrolling: rows of 3
 * slots alternate direction, bridged by short vertical connectors.
 * Node states are driven by RunContext.stageState for live cockpit feedback.
 * Clickable stage cards navigate to the corresponding agent page.
 */
import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconLoader2,
  IconBolt,
  IconCheck,
  IconChevronRight,
  IconUserCheck,
  IconCircle,
} from "@tabler/icons-react";
import { useRun } from "../context/RunContext";
import {
  approvalAfterStage,
  approvalVisualState,
  type ApprovalGateDefinition,
} from "../lib/approvalGates";
import { stepsFor, type PipelineFamily, type PipelineStep } from "../lib/pipeline";
import { routeForUsecase } from "../lib/routes";

const STATE_STYLES: Record<string, string> = {
  idle:    "border-[#1c2740] bg-[#111a2e] text-[#8b96ad]",
  pending: "border-[#1c2740] bg-[#111a2e] text-[#8b96ad]",
  running: "border-[#2dd4bf]/70 bg-[#0f2e2c] text-[#2dd4bf]",
  gate:    "border-[#d9a95c] bg-[#2a2013] text-[#d9a95c]",
  done:    "border-[#2dd4bf]/50 bg-[#0f2e2c]/60 text-[#2dd4bf]",
};

type FlowItem =
  | { kind: "stage"; step: PipelineStep }
  | { kind: "gate"; approval: ApprovalGateDefinition }
  | { kind: "empty" };

function buildFlow(family: PipelineFamily): FlowItem[] {
  const flow: FlowItem[] = [];
  for (const step of stepsFor(family)) {
    flow.push({ kind: "stage", step });
    const approval = approvalAfterStage(family, step.key);
    if (approval) flow.push({ kind: "gate", approval });
  }
  return flow;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// Both families currently produce 12 flow items (8 stages + 4 gates for
// tabular; 9 stages + 3 gates for document) → 4 rows of 3. If a future
// family's item count is not a multiple of 3, the last row is padded with
// "empty" placeholders rather than assuming an exact fit.
function buildRows(flow: FlowItem[]): FlowItem[][] {
  const rows = chunk(flow, 3);
  const last = rows[rows.length - 1];
  while (last && last.length < 3) last.push({ kind: "empty" });
  return rows;
}

const GRID_COLS = "minmax(0,1fr) 24px minmax(0,1fr) 24px minmax(0,1fr)";

function StageStatusIcon({ state }: { state: string }) {
  switch (state) {
    case "running":
      return <IconLoader2 size={12} className="animate-spin" />;
    case "gate":
      return <IconBolt size={12} />;
    case "done":
      return <IconCheck size={12} />;
    default:
      return <IconCircle size={10} />;
  }
}

const STATE_SUBLABEL: Record<string, string> = {
  idle:    "No artifact",
  pending: "Queued",
  running: "Computing…",
  gate:    "Awaiting decision",
  done:    "Artifact ready",
};

function dashDelay(step: number): CSSProperties {
  return { "--dash-delay": `${step * 0.25}s` } as CSSProperties;
}

export default function PipelineGraph() {
  const navigate = useNavigate();
  const { stageState, run, approvalOutcomes, family, selectedUsecase } = useRun();

  const ROWS = useMemo(() => buildRows(buildFlow(family)), [family]);

  // Each row's own outgoing drop side (null on the last row, which has no
  // outgoing connector). Physical column role is fixed regardless of row
  // parity: physical[0] is always col1, physical[2] is always col5 — only
  // the *content* order flips under RTL. A cell's vertical connectors are
  // therefore driven by comparing ITS OWN row's dropSide (outgoing, below
  // the cell) against the PREVIOUS row's dropSide (incoming, above the
  // cell) at that same fixed column — not by which physical slot index it
  // happens to occupy this row.
  const dropSides: Array<"left" | "right" | null> = ROWS.map((_, i) =>
    i === ROWS.length - 1 ? null : i % 2 === 1 ? "left" : "right"
  );

  // Global counter so the traveling dash appears to run continuously through
  // the whole serpentine path, in true flow order.
  let dashStep = 0;

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      {ROWS.map((row, rowIdx) => {
        const [a, b, c] = row;
        const isRtl = rowIdx % 2 === 1;
        const dropSide = dropSides[rowIdx];
        const incomingSide = rowIdx > 0 ? dropSides[rowIdx - 1] : null;

        // Connector delays assigned in true flow order (a→b, then b→c).
        const connAB = dashStep++;
        const connBC = dashStep++;

        // Physical left-to-right slot order, and the connector between each
        // pair of physical slots (col1–col3, then col3–col5).
        const physical = isRtl ? [c, b, a] : [a, b, c];
        const conn1 = isRtl ? connBC : connAB; // between col1 and col3
        const conn2 = isRtl ? connAB : connBC; // between col3 and col5

        const dropDelay = dropSide ? dashStep++ : 0;

        // col1 (physical[0]) and col5 (physical[2]) each independently
        // stretch to meet an outgoing connector below them and/or an
        // incoming connector above them — the middle column never connects.
        const stretchTop0 = incomingSide === "left";
        const stretchBottom0 = dropSide === "left";
        const stretchTop2 = incomingSide === "right";
        const stretchBottom2 = dropSide === "right";

        return (
          <div key={`row-${rowIdx}`}>
            <div className="grid items-center" style={{ gridTemplateColumns: GRID_COLS }}>
              <FlowNode
                item={physical[0]}
                stageState={stageState}
                run={run}
                approvalOutcomes={approvalOutcomes}
                navigate={(path) => navigate(routeForUsecase(selectedUsecase, path))}
                leftDelay={null}
                rightDelay={conn1}
                isRtl={isRtl}
                stretchTop={stretchTop0}
                stretchBottom={stretchBottom0}
              />
              <div className={`cockpit-hconn${isRtl ? " rtl" : ""}`} style={dashDelay(conn1)} />
              <FlowNode
                item={physical[1]}
                stageState={stageState}
                run={run}
                approvalOutcomes={approvalOutcomes}
                navigate={(path) => navigate(routeForUsecase(selectedUsecase, path))}
                leftDelay={conn1}
                rightDelay={conn2}
                isRtl={isRtl}
              />
              <div className={`cockpit-hconn${isRtl ? " rtl" : ""}`} style={dashDelay(conn2)} />
              <FlowNode
                item={physical[2]}
                stageState={stageState}
                run={run}
                approvalOutcomes={approvalOutcomes}
                navigate={(path) => navigate(routeForUsecase(selectedUsecase, path))}
                leftDelay={conn2}
                rightDelay={null}
                isRtl={isRtl}
                stretchTop={stretchTop2}
                stretchBottom={stretchBottom2}
              />
            </div>

            {dropSide && (
              <div className="grid" style={{ gridTemplateColumns: GRID_COLS }}>
                <div className={dropSide === "left" ? "col-start-1" : "col-start-5"}>
                  <div className="cockpit-vconn mx-auto" style={dashDelay(dropDelay)} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Wraps a cell in a full-row-height column so its vertical connector(s)
// read as one unbroken line instead of stopping at the cell's own natural
// size. Each edge independently gets a solid `.cockpit-vfill` segment when
// connected, or a plain spacer when not — both are `flex-1`, so unconnected
// or symmetrically-connected content still centers exactly as before; only
// an asymmetric single-edge connection visibly pulls the fill line to that
// edge. Renders children unwrapped when neither edge connects (the common
// case: most cells touch no vertical connector at all).
function StretchWrap({
  stretchTop,
  stretchBottom,
  children,
}: {
  stretchTop: boolean;
  stretchBottom: boolean;
  children: ReactNode;
}) {
  if (!stretchTop && !stretchBottom) return <>{children}</>;
  return (
    <div className="flex h-full w-full flex-col items-center self-stretch">
      <div className={stretchTop ? "cockpit-vfill flex-1" : "flex-1"} />
      {children}
      <div className={stretchBottom ? "cockpit-vfill flex-1" : "flex-1"} />
    </div>
  );
}

function FlowNode({
  item,
  stageState,
  run,
  approvalOutcomes,
  navigate,
  leftDelay,
  rightDelay,
  isRtl,
  stretchTop = false,
  stretchBottom = false,
}: {
  item: FlowItem;
  stageState: (key: string) => string;
  run: ReturnType<typeof useRun>["run"];
  approvalOutcomes: ReturnType<typeof useRun>["approvalOutcomes"];
  navigate: (path: string) => void;
  leftDelay: number | null;
  rightDelay: number | null;
  isRtl: boolean;
  stretchTop?: boolean;
  stretchBottom?: boolean;
}) {
  if (item.kind === "empty") {
    return <div />;
  }

  if (item.kind === "gate") {
    const gateState = approvalVisualState(
      item.approval,
      run,
      stageState(item.approval.afterStage),
      approvalOutcomes[item.approval.key],
    );
    const rtlClass = isRtl ? " rtl" : "";
    const pillRow = (
      <div className="flex w-full items-center">
        <div
          className={leftDelay !== null ? `cockpit-hconn flex-1${rtlClass}` : "flex-1"}
          style={leftDelay !== null ? dashDelay(leftDelay) : undefined}
        />
        <button
          onClick={item.approval.route ? () => navigate(item.approval.route!) : undefined}
          title={item.approval.route ? undefined : `${item.approval.label} — see ${item.approval.agentKey}`}
          className={`cockpit-gate-pill flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed px-3.5 py-1.5 text-xs transition-colors ${
            item.approval.route ? "" : "cursor-default"
          } ${
            gateState === "approved"
              ? "border-[#2dd4bf]/60 bg-[#0f2e2c]/70 text-[#2dd4bf]"
              : gateState === "active"
                ? "border-[#d9a95c] bg-[#2a2013] text-[#d9a95c]"
                : gateState === "rejected"
                  ? "border-red-600/70 bg-red-950/25 text-red-300"
                  : `border-[#1c2740] text-[#5c6780] ${item.approval.route ? "hover:border-[#2a3a5c] hover:text-[#8b96ad]" : ""}`
          }`}
        >
          {gateState === "approved" ? (
            <IconCheck size={13} />
          ) : (
            <IconUserCheck size={13} />
          )}
          <span>{item.approval.label}</span>
        </button>
        <div
          className={rightDelay !== null ? `cockpit-hconn flex-1${rtlClass}` : "flex-1"}
          style={rightDelay !== null ? dashDelay(rightDelay) : undefined}
        />
      </div>
    );

    return (
      <StretchWrap stretchTop={stretchTop} stretchBottom={stretchBottom}>
        {pillRow}
      </StretchWrap>
    );
  }

  const step = item.step;
  const state = stageState(step.key);

  return (
    <StretchWrap stretchTop={stretchTop} stretchBottom={stretchBottom}>
      <button
        className={`cockpit-stage-card group relative flex w-full flex-col gap-1.5 rounded-[10px] border px-4 py-3 text-left ${
          STATE_STYLES[state] ?? STATE_STYLES.idle
        }`}
        onClick={() => navigate(step.path)}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="cockpit-stage-tag font-mono text-[11px] font-semibold tracking-wide text-[#8b96ad]">
            {step.label}
          </span>
          <IconChevronRight size={14} className="cockpit-stage-chevron flex-shrink-0 text-[#8b96ad]" />
        </div>
        <div className="truncate text-sm font-medium text-[#e9eef7]">{step.name}</div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#5c6780]">
          <StageStatusIcon state={state} />
          <span>{STATE_SUBLABEL[state] ?? ""}</span>
        </div>
      </button>
    </StretchWrap>
  );
}
