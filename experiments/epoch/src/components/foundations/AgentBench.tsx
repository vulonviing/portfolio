/**
 * AgentBench — a literal bench holding the Stage-2 output-agent pool.
 * TS1 (topology selection) reaches down and lights up the subset it binds
 * for the chosen topology; the rest stay on the bench, unlit. Illustrates
 * "the topology system picks the agent off the bench" rather than an
 * agent's internal step-by-step anatomy.
 */
import { AGENT_BENCH_CAPTION, AGENT_BENCH_TILES } from "./content";

const TEAL = "#2dd4bf";
const RACK_STROKE = "#2a3a5c";
const DIM_TILE = "#111a2e";
const DIM_STROKE = "#2a3a5c";
const DIM_TEXT = "#5c6780";

export default function AgentBench() {
  const tileW = 30;
  const tileH = 22;
  const gap = 6;
  const startX = 13;
  const beamY = 70;
  const lift = 8;

  const centers = AGENT_BENCH_TILES.map((_, i) => startX + tileW / 2 + i * (tileW + gap));
  const ts1X = 190;
  const ts1Y = 6;
  const ts1W = 40;
  const ts1H = 20;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#1c2740] bg-[#0a101d] py-4">
        <svg viewBox="0 0 380 118" width="100%" style={{ maxWidth: 620, display: "block", margin: "0 auto" }}>
          {/* TS1 → selected tiles */}
          {AGENT_BENCH_TILES.map((tile, i) =>
            tile.selected ? (
              <line
                key={`arrow-${tile.code}`}
                x1={ts1X}
                y1={ts1Y + ts1H}
                x2={centers[i]}
                y2={beamY - tileH - lift}
                stroke={TEAL}
                strokeWidth={1.2}
              />
            ) : null
          )}

          {/* TS1 node */}
          <rect x={ts1X - ts1W / 2} y={ts1Y} width={ts1W} height={ts1H} rx={6} fill="#0f2e2c" stroke={TEAL} strokeWidth={1.4} />
          <text x={ts1X} y={ts1Y + ts1H / 2 + 4} textAnchor="middle" fill={TEAL} fontSize={10} fontWeight={600} fontFamily="ui-monospace, monospace">
            TS1
          </text>

          {/* bench: beam + legs */}
          <rect x={3} y={beamY} width={374} height={6} fill={RACK_STROKE} />
          <rect x={10} y={beamY + 6} width={8} height={34} fill={RACK_STROKE} />
          <rect x={362} y={beamY + 6} width={8} height={34} fill={RACK_STROKE} />

          {/* tiles */}
          {AGENT_BENCH_TILES.map((tile, i) => {
            const cx = centers[i];
            const y = tile.selected ? beamY - tileH - lift : beamY - tileH;
            return (
              <g key={tile.code}>
                <rect
                  x={cx - tileW / 2}
                  y={y}
                  width={tileW}
                  height={tileH}
                  rx={5}
                  fill={tile.selected ? "#0f2e2c" : DIM_TILE}
                  stroke={tile.selected ? TEAL : DIM_STROKE}
                  strokeWidth={tile.selected ? 1.4 : 1.1}
                />
                <text
                  x={cx}
                  y={y + tileH / 2 + 3.5}
                  textAnchor="middle"
                  fill={tile.selected ? TEAL : DIM_TEXT}
                  fontSize={8.5}
                  fontWeight={tile.selected ? 600 : 400}
                  fontFamily="ui-monospace, monospace"
                >
                  {tile.code}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="max-w-[80ch] text-[11.5px] leading-relaxed text-[#5c6780]">{AGENT_BENCH_CAPTION}</p>
    </div>
  );
}
