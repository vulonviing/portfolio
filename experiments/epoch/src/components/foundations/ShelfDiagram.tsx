/**
 * ShelfDiagram — an actual bookshelf: two agent bays in one rack. Each bay's
 * top board holds the current active.json "book"; lower boards hold dimmed
 * archive/ books. A teal input_refs arrow runs from RC1.2's active book to
 * RD3's bay — the provenance chain drawn as "RD3 points at a book on RC1.2's
 * shelf", not a folder path.
 */
import { SHELF_ARCHIVE_EXAMPLE, SHELF_PATH_EXAMPLE, SHELF_RULES } from "./content";

const RACK_STROKE = "#2a3a5c";
const TEAL = "#2dd4bf";
const ARCHIVE_FILL = "#1c2740";
const ARCHIVE_STROKE = "#3a4a6c";

// A bay: uprights + boards, one active book on the top shelf, dimmed archive
// books underneath.
function Bay({ x, w, agent, archiveCount }: { x: number; w: number; agent: string; archiveCount: number }) {
  const top = 40;
  const bottom = 140;
  const boardYs = [top, 76, 108, bottom];
  const bookH = 30;

  return (
    <g>
      {/* uprights */}
      <line x1={x} y1={top} x2={x} y2={bottom} stroke={RACK_STROKE} strokeWidth={2} />
      <line x1={x + w} y1={top} x2={x + w} y2={bottom} stroke={RACK_STROKE} strokeWidth={2} />
      {/* boards */}
      {boardYs.map((y) => (
        <line key={y} x1={x - 4} y1={y} x2={x + w + 4} y2={y} stroke={RACK_STROKE} strokeWidth={3} />
      ))}
      {/* active.json — one upright book on the top shelf */}
      <rect
        x={x + w / 2 - 11}
        y={boardYs[0] - bookH}
        width={22}
        height={bookH}
        rx={2}
        fill="#0f2e2c"
        stroke={TEAL}
        strokeWidth={1.4}
      />
      <text
        x={x + w / 2}
        y={boardYs[0] - bookH / 2 + 3}
        textAnchor="middle"
        fill={TEAL}
        fontSize={7}
        fontWeight={600}
        fontFamily="Inter, sans-serif"
        transform={`rotate(-90 ${x + w / 2} ${boardYs[0] - bookH / 2 + 3})`}
      >
        active
      </text>
      {/* archive/ — dimmed books on the lower shelves */}
      {Array.from({ length: archiveCount }).map((_, row) => {
        const shelfTop = boardYs[row + 1];
        const bookCount = 3 - (row % 2);
        const spacing = (w - 8) / bookCount;
        return Array.from({ length: bookCount }).map((__, i) => (
          <rect
            key={`${row}-${i}`}
            x={x + 4 + i * spacing}
            y={shelfTop - 22}
            width={spacing - 3}
            height={22}
            rx={1.5}
            fill={ARCHIVE_FILL}
            stroke={ARCHIVE_STROKE}
            strokeWidth={1}
          />
        ));
      })}
      {/* bay label plate */}
      <rect x={x + w / 2 - 22} y={bottom + 8} width={44} height={16} rx={4} fill="#111a2e" stroke={RACK_STROKE} strokeWidth={1} />
      <text x={x + w / 2} y={bottom + 19} textAnchor="middle" fill="#8b96ad" fontSize={9} fontWeight={600} fontFamily="ui-monospace, monospace">
        {agent}
      </text>
    </g>
  );
}

export default function ShelfDiagram() {
  const bayW = 110;
  const leftX = 20;
  const rightX = 210;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#1c2740] bg-[#0a101d] py-4">
        <svg viewBox="0 0 340 180" width="100%" style={{ maxWidth: 460, display: "block", margin: "0 auto" }}>
          {/* input_refs arrow: RC1.2's active book → RD3's bay, through the gap between bays */}
          <line
            x1={leftX + bayW + 6}
            y1={25}
            x2={rightX - 6}
            y2={25}
            stroke={TEAL}
            strokeWidth={1.4}
            markerEnd="url(#shelf-arrow)"
          />
          <text x={(leftX + bayW + rightX) / 2} y={16} textAnchor="middle" fill={TEAL} fontSize={8.5} fontFamily="Inter, sans-serif">
            input_refs
          </text>
          <defs>
            <marker id="shelf-arrow" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
              <path d="M0,0 L0,5 L6,2.5 z" fill={TEAL} />
            </marker>
          </defs>

          <Bay x={leftX} w={bayW} agent="RC1.2" archiveCount={2} />
          <Bay x={rightX} w={bayW} agent="RD3" archiveCount={2} />
        </svg>
      </div>

      <p className="max-w-[80ch] text-[11.5px] leading-relaxed text-[#5c6780]">
        RD3 consumes RC1.2's rows, so RD3's stored record declares{" "}
        <span className="font-mono text-[#8b96ad]">input_refs</span> pointing at RC1.2's{" "}
        <span className="font-mono text-[#8b96ad]">artifact_id</span> and{" "}
        <span className="font-mono text-[#8b96ad]">payload_sha256</span> — a reference, never a copy.
      </p>
      <p className="font-mono text-[10.5px] text-[#5c6780]">
        {SHELF_PATH_EXAMPLE} &nbsp;·&nbsp; {SHELF_ARCHIVE_EXAMPLE}
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        {SHELF_RULES.map((rule) => (
          <div key={rule} className="rounded-lg border border-[#1c2740] bg-[#111a2e]/65 p-3 text-[11.5px] leading-relaxed text-[#8b96ad]">
            {rule}
          </div>
        ))}
      </div>
    </div>
  );
}
