/**
 * IsolatedMemoryDiagram — a sealed memory packet with four downstream agents
 * arranged in a row underneath it, each looking only up at the packet. A
 * solid wall with a drawn padlock sits between every neighboring pair —
 * blocked, not just "unseen".
 */
import { IconArchive, IconMailOpened } from "@tabler/icons-react";
import { ISOLATED_MEMORY_CROSSES, ISOLATED_MEMORY_STAYS_BEHIND } from "./content";

const TEAL = "#2dd4bf";
const BLOCK = "#d97a6c";
const AGENTS = ["CP1", "TS1", "P4/P5/P6", "F2"];

function Padlock({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g stroke={BLOCK} strokeWidth={1.3} fill="none">
      <path d={`M ${cx - 4} ${cy - 3} v -3 a 4 4 0 0 1 8 0 v 3`} />
      <rect x={cx - 5.5} y={cy - 3} width={11} height={9} rx={1.5} fill="#2a1613" />
    </g>
  );
}

function PacketDiagram() {
  const packetX = 150;
  const packetY = 12;
  const packetW = 150;
  const packetH = 32;
  const agentY = 90;
  const agentW = 62;
  const agentH = 26;
  const gap = 12;
  const totalW = AGENTS.length * agentW + (AGENTS.length - 1) * gap;
  const startX = packetX - totalW / 2;
  const centers = AGENTS.map((_, i) => startX + agentW / 2 + i * (agentW + gap));

  return (
    <svg viewBox="0 0 300 130" width="100%" style={{ maxWidth: 640, display: "block", margin: "0 auto" }}>
      {/* arrows: each agent looks only up at the packet */}
      {centers.map((cx, i) => (
        <line
          key={`arrow-${i}`}
          x1={cx}
          y1={agentY}
          x2={packetX}
          y2={packetY + packetH}
          stroke={TEAL}
          strokeWidth={1.2}
        />
      ))}
      {/* solid wall + padlock: blocked between neighbors, not just unseen */}
      {centers.slice(0, -1).map((cx, i) => {
        const midX = (cx + centers[i + 1]) / 2;
        return (
          <g key={`wall-${i}`}>
            <line x1={midX} y1={agentY - 3} x2={midX} y2={agentY + agentH + 3} stroke={BLOCK} strokeWidth={2} />
            <Padlock cx={midX} cy={agentY + agentH / 2} />
          </g>
        );
      })}

      {/* sealed packet */}
      <rect
        x={packetX - packetW / 2}
        y={packetY}
        width={packetW}
        height={packetH}
        rx={9}
        fill="#0f2e2c"
        stroke={TEAL}
        strokeWidth={1.5}
      />
      <text x={packetX} y={packetY + packetH / 2 + 4} textAnchor="middle" fill={TEAL} fontSize={11} fontWeight={600} fontFamily="Inter, sans-serif">
        isolated memory
      </text>

      {/* agent nodes */}
      {AGENTS.map((label, i) => (
        <g key={label}>
          <rect
            x={centers[i] - agentW / 2}
            y={agentY}
            width={agentW}
            height={agentH}
            rx={6}
            fill="#111a2e"
            stroke="#2a3a5c"
            strokeWidth={1.3}
          />
          <text x={centers[i]} y={agentY + agentH / 2 + 4} textAnchor="middle" fill="#c3cbdd" fontSize={9.5} fontFamily="ui-monospace, monospace">
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function IsolatedMemoryDiagram() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#1c2740] bg-[#0a101d] py-4">
        <PacketDiagram />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col items-center gap-2.5 rounded-xl border border-[#2dd4bf]/30 bg-[#0f2e2c]/40 p-5 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2dd4bf]/35 bg-[#0a101d] text-[#2dd4bf]">
            <IconMailOpened size={20} />
          </span>
          <span className="text-[12.5px] font-medium text-[#2dd4bf]">Crosses the boundary</span>
          <p className="text-[12px] leading-relaxed text-[#c3cbdd]">{ISOLATED_MEMORY_CROSSES}</p>
        </div>
        <div className="flex flex-col items-center gap-2.5 rounded-xl border border-[#1c2740] bg-[#0d1424] p-5 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2a3a5c] bg-[#111a2e] text-[#5c6780]">
            <IconArchive size={20} />
          </span>
          <span className="text-[12.5px] font-medium text-[#8b96ad]">Stays behind</span>
          <p className="text-[12px] leading-relaxed text-[#8b96ad]">{ISOLATED_MEMORY_STAYS_BEHIND}</p>
        </div>
      </div>
      <p className="max-w-[80ch] text-[11.5px] leading-relaxed text-[#5c6780]">
        Once approved, this is the only version of the truth every later step works from — nothing
        earlier or unapproved can override it.
      </p>
    </div>
  );
}
