/**
 * TopologyShapes — Direct / Debate / Coalition as three small inline SVGs.
 * Written fresh (not reusing components/TopologyDiagram.tsx, which needs a
 * live TopologySpec from the API and uses an older gray/teal palette) — this
 * page has no run and must stay static.
 */
import { TOPOLOGY_SUMMARIES, type TopologySpecSummary } from "./content";

const TEAL = "#2dd4bf";
const NODE_FILL = "#111a2e";
const NODE_STROKE = "#2a3a5c";
const LINE = "#2a3a5c";

function DirectSvg() {
  const nodes = [16, 76, 136];
  return (
    <svg viewBox="0 0 200 60" width="100%" style={{ maxWidth: 220 }}>
      {nodes.slice(0, -1).map((x, i) => (
        <line key={i} x1={x + 44} y1={30} x2={nodes[i + 1]} y2={30} stroke={TEAL} strokeWidth={1.5} />
      ))}
      {nodes.map((x, i) => (
        <rect key={i} x={x} y={12} width={44} height={36} rx={8} fill={NODE_FILL} stroke={TEAL} strokeWidth={1.3} />
      ))}
      {nodes.map((x, i) => (
        <text key={i} x={x + 22} y={34} textAnchor="middle" fill={TEAL} fontSize={10} fontFamily="Inter, sans-serif">
          {i + 1}
        </text>
      ))}
    </svg>
  );
}

function DebateSvg() {
  return (
    <svg viewBox="0 0 200 90" width="100%" style={{ maxWidth: 220 }}>
      <line x1={40} y1={40} x2={40} y2={62} stroke={NODE_STROKE} strokeWidth={1.3} strokeDasharray="3 3" />
      <line x1={40} y1={62} x2={100} y2={72} stroke={NODE_STROKE} strokeWidth={1.3} strokeDasharray="3 3" />
      <line x1={160} y1={40} x2={160} y2={62} stroke={NODE_STROKE} strokeWidth={1.3} strokeDasharray="3 3" />
      <line x1={160} y1={62} x2={100} y2={72} stroke={NODE_STROKE} strokeWidth={1.3} strokeDasharray="3 3" />
      <line x1={40} y1={22} x2={160} y2={22} stroke={LINE} strokeWidth={1} strokeDasharray="2 4" />
      <rect x={18} y={4} width={44} height={36} rx={8} fill={NODE_FILL} stroke={TEAL} strokeWidth={1.3} />
      <rect x={138} y={4} width={44} height={36} rx={8} fill={NODE_FILL} stroke={TEAL} strokeWidth={1.3} />
      <rect x={78} y={62} width={44} height={26} rx={8} fill="#0f2e2c" stroke={TEAL} strokeWidth={1.3} />
      <text x={40} y={26} textAnchor="middle" fill={TEAL} fontSize={9} fontFamily="Inter, sans-serif">A</text>
      <text x={160} y={26} textAnchor="middle" fill={TEAL} fontSize={9} fontFamily="Inter, sans-serif">B</text>
      <text x={100} y={79} textAnchor="middle" fill={TEAL} fontSize={8} fontFamily="Inter, sans-serif">merge</text>
    </svg>
  );
}

const DOMAIN_ACCENT = "#9b8cf2";

// One mini Debate cluster (two independent readers → a per-domain reconciler),
// repeated three times — Coalition is illustrated as three Debates that each
// resolve their own domain before a single synthesis merges the three.
function MiniDebateCluster({ cx, label }: { cx: number; label: string }) {
  const readerY = 24;
  const readerSize = 22;
  const leftX = cx - 34;
  const rightX = cx + 12;
  const reconcilerY = 58;
  const reconcilerW = 40;
  const reconcilerH = 16;

  return (
    <g>
      <text x={cx} y={12} textAnchor="middle" fill={DOMAIN_ACCENT} fontSize={9} fontFamily="Inter, sans-serif">
        {label}
      </text>
      {/* independence marker between the two readers */}
      <line
        x1={leftX + readerSize}
        y1={readerY + readerSize / 2}
        x2={rightX}
        y2={readerY + readerSize / 2}
        stroke={NODE_STROKE}
        strokeWidth={1.1}
        strokeDasharray="2 3"
      />
      {/* readers drop into the domain's own reconciler */}
      <line
        x1={leftX + readerSize / 2}
        y1={readerY + readerSize}
        x2={cx}
        y2={reconcilerY}
        stroke={DOMAIN_ACCENT}
        strokeWidth={1.1}
      />
      <line
        x1={rightX + readerSize / 2}
        y1={readerY + readerSize}
        x2={cx}
        y2={reconcilerY}
        stroke={DOMAIN_ACCENT}
        strokeWidth={1.1}
      />
      <rect x={leftX} y={readerY} width={readerSize} height={readerSize} rx={5} fill={NODE_FILL} stroke={DOMAIN_ACCENT} strokeWidth={1.2} />
      <rect x={rightX} y={readerY} width={readerSize} height={readerSize} rx={5} fill={NODE_FILL} stroke={DOMAIN_ACCENT} strokeWidth={1.2} />
      <rect
        x={cx - reconcilerW / 2}
        y={reconcilerY}
        width={reconcilerW}
        height={reconcilerH}
        rx={6}
        fill="#1a1730"
        stroke={DOMAIN_ACCENT}
        strokeWidth={1.2}
      />
    </g>
  );
}

function CoalitionSvg() {
  const columns = [
    { cx: 52, label: "energy" },
    { cx: 150, label: "water" },
    { cx: 248, label: "waste" },
  ];
  const reconcilerBottomY = 74;
  const synthY = 110;
  const synthW = 56;
  const synthH = 22;
  const synthCx = 150;

  return (
    <svg viewBox="0 0 300 148" width="100%" style={{ maxWidth: 280 }}>
      {columns.map((col) => (
        <line
          key={`link-${col.cx}`}
          x1={col.cx}
          y1={reconcilerBottomY}
          x2={synthCx}
          y2={synthY}
          stroke={TEAL}
          strokeWidth={1.3}
        />
      ))}
      {columns.map((col) => (
        <MiniDebateCluster key={col.label} cx={col.cx} label={col.label} />
      ))}
      <rect
        x={synthCx - synthW / 2}
        y={synthY}
        width={synthW}
        height={synthH}
        rx={7}
        fill="#0f2e2c"
        stroke={TEAL}
        strokeWidth={1.4}
      />
      <text x={synthCx} y={synthY + 14} textAnchor="middle" fill={TEAL} fontSize={9} fontFamily="Inter, sans-serif">
        synth
      </text>
    </svg>
  );
}

const SVG_BY_ID: Record<TopologySpecSummary["id"], () => JSX.Element> = {
  Direct: DirectSvg,
  Debate: DebateSvg,
  Coalition: CoalitionSvg,
};

function TopologyCard({ spec }: { spec: TopologySpecSummary }) {
  const Svg = SVG_BY_ID[spec.id];
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#1c2740] bg-[#0d1424] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#e9eef7]">{spec.id}</span>
        <span className="rounded-full border border-[#1c2740] bg-[#111a2e] px-2 py-0.5 text-[10px] text-[#8b96ad]">
          {spec.shape}
        </span>
      </div>
      <div className="flex justify-center rounded-lg border border-[#1c2740] bg-[#0a101d] py-4">
        <Svg />
      </div>
      <p className="text-[12px] leading-relaxed text-[#8b96ad]">{spec.distinguishing}</p>
    </div>
  );
}

export default function TopologyShapes() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {TOPOLOGY_SUMMARIES.map((spec) => (
        <TopologyCard key={spec.id} spec={spec} />
      ))}
    </div>
  );
}
