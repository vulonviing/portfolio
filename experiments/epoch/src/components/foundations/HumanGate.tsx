/**
 * HumanGate — intermediate steps pass straight through; only the fully
 * assembled output reaches a gate where a human decides approve or reject.
 */
const TEAL = "#2dd4bf";
const AMBER = "#d9a95c";
const RED = "#d97a6c";
const NODE_STROKE = "#2a3a5c";

function Person({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g stroke={AMBER} strokeWidth={1.6} fill="none" strokeLinecap="round">
      <circle cx={cx} cy={cy - 9} r={5} fill="#2a2013" />
      <path d={`M ${cx - 8} ${cy + 12} Q ${cx} ${cy - 2} ${cx + 8} ${cy + 12}`} fill="#2a2013" />
    </g>
  );
}

export default function HumanGate() {
  return (
    <svg viewBox="0 0 320 108" width="100%" style={{ maxWidth: 560, display: "block", margin: "0 auto" }}>
      {/* intermediate steps: no gate, straight through */}
      <line x1={10} y1={30} x2={62} y2={30} stroke={TEAL} strokeWidth={1.4} />
      <rect x={12} y={16} width={28} height={28} rx={6} fill="#111a2e" stroke={NODE_STROKE} strokeWidth={1.2} />
      <text x={26} y={33} textAnchor="middle" fill="#8b96ad" fontSize={8} fontFamily="ui-monospace, monospace">P1</text>
      <line x1={40} y1={30} x2={80} y2={30} stroke={TEAL} strokeWidth={1.4} />
      <rect x={82} y={16} width={28} height={28} rx={6} fill="#111a2e" stroke={NODE_STROKE} strokeWidth={1.2} />
      <text x={96} y={33} textAnchor="middle" fill="#8b96ad" fontSize={8} fontFamily="ui-monospace, monospace">F1</text>
      <text x={61} y={12} textAnchor="middle" fill="#5c6780" fontSize={7.5} fontFamily="Inter, sans-serif">runs automatically</text>

      {/* assembled output → gate */}
      <line x1={110} y1={30} x2={150} y2={30} stroke={TEAL} strokeWidth={1.4} />

      {/* gate with a human figure standing at it */}
      <line x1={150} y1={8} x2={150} y2={52} stroke={NODE_STROKE} strokeWidth={2} strokeDasharray="4 3" />
      <Person cx={150} cy={30} />

      {/* approve branch */}
      <path d="M 156 22 C 190 8, 230 8, 260 20" fill="none" stroke={TEAL} strokeWidth={1.4} />
      <rect x={262} y={8} width={50} height={22} rx={6} fill="#0f2e2c" stroke={TEAL} strokeWidth={1.3} />
      <text x={287} y={22} textAnchor="middle" fill={TEAL} fontSize={9.5} fontWeight={600} fontFamily="Inter, sans-serif">Approve</text>

      {/* reject branch, looping back to the chain */}
      <path d="M 156 40 C 190 56, 225 56, 258 58" fill="none" stroke={RED} strokeWidth={1.4} markerEnd="url(#gate-reject-arrow)" />
      <rect x={262} y={58} width={50} height={22} rx={6} fill="#2a1613" stroke={RED} strokeWidth={1.3} />
      <text x={287} y={72} textAnchor="middle" fill={RED} fontSize={9.5} fontWeight={600} fontFamily="Inter, sans-serif">Reject</text>
      <path d="M 262 76 C 190 94, 120 86, 96 46" fill="none" stroke={RED} strokeWidth={1} strokeDasharray="3 3" markerEnd="url(#gate-reject-arrow)" />
      <text x={180} y={94} textAnchor="middle" fill={RED} fontSize={7.5} fontFamily="Inter, sans-serif">back to the chain</text>

      <defs>
        <marker id="gate-reject-arrow" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L6,2.5 z" fill={RED} />
        </marker>
      </defs>
    </svg>
  );
}
