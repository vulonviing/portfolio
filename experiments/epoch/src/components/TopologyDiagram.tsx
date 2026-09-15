/**
 * SVG topology diagram — renders the fixed node/flow for Direct, Debate, or Coalition.
 * No third-party diagram library — topologies are simple (1–3 nodes).
 */
import type { TopologySpec } from "../api/types";

const NODE_H = 56;
const NODE_W = 140;
const GAP = 80;
const RESULT_W = 110;
const RESULT_H = 44;

const TEAL = "#009999";
const GRAY = "#374151";
const RESULT_FILL = "#065f46";

interface NodeBox {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub: string;
}

function buildLayout(spec: TopologySpec): { nodes: NodeBox[]; width: number; height: number } {
  const { slots, interaction_pattern } = spec;
  const isDirect = spec.id === "Direct";
  const isParallel = slots.length > 1;

  if (isDirect) {
    const node: NodeBox = {
      x: 20,
      y: 20,
      w: NODE_W,
      h: NODE_H,
      label: slots[0]?.role ?? "Analyst",
      sub: slots[0]?.role_description?.substring(0, 40) ?? "",
    };
    return { nodes: [node], width: NODE_W + 40, height: NODE_H + 40 };
  }

  if (spec.id === "Debate") {
    // analyst_a and analyst_b in parallel, then reconciler
    const leftNode: NodeBox = { x: 20, y: 20, w: NODE_W, h: NODE_H, label: "Analyst A", sub: "Independent interpretation" };
    const rightNode: NodeBox = { x: 20 + NODE_W + GAP, y: 20, w: NODE_W, h: NODE_H, label: "Analyst B", sub: "Independent interpretation" };
    const totalW = 20 + NODE_W + GAP + NODE_W + 20;
    const centerX = totalW / 2 - NODE_W / 2;
    const reconcilerNode: NodeBox = {
      x: centerX,
      y: NODE_H + 60,
      w: NODE_W,
      h: NODE_H,
      label: "Reconciler",
      sub: "Merges both views",
    };
    return { nodes: [leftNode, rightNode, reconcilerNode], width: totalW, height: NODE_H * 2 + 80 };
  }

  if (spec.id === "Coalition") {
    const specA: NodeBox = { x: 20, y: 20, w: NODE_W, h: NODE_H, label: "Specialist A", sub: "Domain perspective A" };
    const specB: NodeBox = { x: 20 + NODE_W + GAP, y: 20, w: NODE_W, h: NODE_H, label: "Specialist B", sub: "Domain perspective B" };
    const totalW = 20 + NODE_W + GAP + NODE_W + 20;
    const centerX = totalW / 2 - NODE_W / 2;
    const synthNode: NodeBox = {
      x: centerX,
      y: NODE_H + 60,
      w: NODE_W,
      h: NODE_H,
      label: "Synthesis",
      sub: "Multi-owner merge",
    };
    return { nodes: [specA, specB, synthNode], width: totalW, height: NODE_H * 2 + 80 };
  }

  return { nodes: [], width: 200, height: 100 };
}

interface Props {
  spec: TopologySpec;
}

export default function TopologyDiagram({ spec }: Props) {
  const { nodes, width, height } = buildLayout(spec);
  const totalHeight = height + 80; // + result node area

  // Result node is always at the bottom centre
  const resultX = width / 2 - RESULT_W / 2;
  const resultY = height + 8;

  // Arrow helpers: node bottom-centre → result top-centre
  const arrowFrom = (n: NodeBox) => ({
    x1: n.x + n.w / 2,
    y1: n.y + n.h,
    x2: resultX + RESULT_W / 2,
    y2: resultY,
  });

  const isDirect = spec.id === "Direct";

  return (
    <svg
      viewBox={`0 0 ${width} ${totalHeight}`}
      width="100%"
      style={{ maxWidth: width, display: "block" }}
      aria-label={`${spec.id} topology diagram`}
    >
      {/* Arrows from agent nodes → result */}
      {nodes.map((n, i) => {
        const a = arrowFrom(n);
        return (
          <line
            key={i}
            x1={a.x1}
            y1={a.y1}
            x2={a.x2}
            y2={a.y2}
            stroke={TEAL}
            strokeWidth={1.5}
            strokeDasharray={isDirect ? "none" : "4 3"}
            markerEnd="url(#arr)"
          />
        );
      })}

      {/* For Debate/Coalition: dashed between parallel nodes to show they are independent */}
      {nodes.length === 3 && (
        <line
          x1={nodes[0].x + nodes[0].w / 2}
          y1={nodes[0].y + nodes[0].h / 2}
          x2={nodes[1].x + nodes[1].w / 2}
          y2={nodes[1].y + nodes[1].h / 2}
          stroke={GRAY}
          strokeWidth={1}
          strokeDasharray="2 4"
        />
      )}

      {/* Agent nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <rect
            x={n.x}
            y={n.y}
            width={n.w}
            height={n.h}
            rx={10}
            fill="#1f2937"
            stroke={TEAL}
            strokeWidth={1.5}
          />
          <text
            x={n.x + n.w / 2}
            y={n.y + 20}
            textAnchor="middle"
            fill={TEAL}
            fontSize={12}
            fontWeight="600"
            fontFamily="Inter, sans-serif"
          >
            {n.label}
          </text>
          <text
            x={n.x + n.w / 2}
            y={n.y + 36}
            textAnchor="middle"
            fill="#6b7280"
            fontSize={9}
            fontFamily="Inter, sans-serif"
          >
            {n.sub.substring(0, 28)}{n.sub.length > 28 ? "…" : ""}
          </text>
        </g>
      ))}

      {/* Result node */}
      <rect
        x={resultX}
        y={resultY}
        width={RESULT_W}
        height={RESULT_H}
        rx={8}
        fill={RESULT_FILL}
        stroke="#10b981"
        strokeWidth={1.5}
      />
      <text
        x={resultX + RESULT_W / 2}
        y={resultY + 16}
        textAnchor="middle"
        fill="#6ee7b7"
        fontSize={11}
        fontWeight="600"
        fontFamily="Inter, sans-serif"
      >
        Result
      </text>
      <text
        x={resultX + RESULT_W / 2}
        y={resultY + 30}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={9}
        fontFamily="Inter, sans-serif"
      >
        {spec.interaction_pattern.substring(0, 32)}
      </text>

      {/* Arrow marker */}
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={TEAL} />
        </marker>
      </defs>
    </svg>
  );
}
