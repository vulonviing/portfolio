/**
 * AuditTrail — plain-language, illustration-led cards for a stakeholder
 * audience: every run is kept, every result traces back, and independent
 * reviews check the work. No raw technical strings (paths, hashes, field
 * names) in the visible copy — see AuditFact's predecessor in content.ts
 * history for the technical version, kept out of the main flow on purpose.
 */
import { AUDIT_CARDS, type AuditCard } from "./content";

const TEAL = "#2dd4bf";
const AMBER = "#d97a6c";

// "Every run is kept" — a stack of dated record cards, sealed by a padlock.
function KeptIllustration() {
  return (
    <svg viewBox="0 0 120 64" width="100%" style={{ maxWidth: 160 }}>
      <rect x={22} y={10} width={54} height={16} rx={3} fill="#111a2e" stroke="#2a3a5c" strokeWidth={1.1} />
      <rect x={30} y={20} width={54} height={16} rx={3} fill="#111a2e" stroke="#2a3a5c" strokeWidth={1.1} />
      <rect x={38} y={30} width={54} height={16} rx={3} fill="#0f2e2c" stroke={TEAL} strokeWidth={1.3} />
      <g stroke={TEAL} strokeWidth={1.4} fill="none">
        <path d="M 61 50 v -3 a 4 4 0 0 1 8 0 v 3" />
        <rect x={59.5} y={50} width={11} height={9} rx={1.5} fill="#0a101d" />
      </g>
    </svg>
  );
}

// "Every result is traceable" — three linked nodes, a chain from source to result.
function TraceableIllustration() {
  return (
    <svg viewBox="0 0 120 64" width="100%" style={{ maxWidth: 160 }}>
      <line x1={20} y1={32} x2={54} y2={32} stroke={TEAL} strokeWidth={1.4} />
      <line x1={66} y1={32} x2={100} y2={32} stroke={TEAL} strokeWidth={1.4} />
      <circle cx={20} cy={32} r={9} fill="#111a2e" stroke="#2a3a5c" strokeWidth={1.2} />
      <circle cx={60} cy={32} r={9} fill="#0f2e2c" stroke={TEAL} strokeWidth={1.4} />
      <circle cx={100} cy={32} r={9} fill="#111a2e" stroke="#2a3a5c" strokeWidth={1.2} />
    </svg>
  );
}

// "Independently checked" — a checklist with a review count badge.
function ReviewedIllustration() {
  return (
    <svg viewBox="0 0 120 64" width="100%" style={{ maxWidth: 160 }}>
      <rect x={28} y={8} width={50} height={48} rx={5} fill="#111a2e" stroke="#2a3a5c" strokeWidth={1.2} />
      {[18, 30, 42].map((y) => (
        <g key={y}>
          <path d={`M 36 ${y} l 3 3 l 6 -6`} stroke={TEAL} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <line x1={50} y1={y} x2={70} y2={y} stroke="#2a3a5c" strokeWidth={1.4} />
        </g>
      ))}
      <circle cx={84} cy={48} r={11} fill="#2a1613" stroke={AMBER} strokeWidth={1.4} />
      <text x={84} y={52} textAnchor="middle" fill={AMBER} fontSize={11} fontWeight={700} fontFamily="Inter, sans-serif">
        9
      </text>
    </svg>
  );
}

const ILLUSTRATION: Record<AuditCard["id"], () => JSX.Element> = {
  kept: KeptIllustration,
  traceable: TraceableIllustration,
  reviewed: ReviewedIllustration,
};

function Card({ card }: { card: AuditCard }) {
  const Illustration = ILLUSTRATION[card.id];
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-[#1c2740] bg-[#0d1424] p-5 text-center">
      <div className="flex h-16 w-full items-center justify-center">
        <Illustration />
      </div>
      <div className="text-[13px] font-medium text-[#e9eef7]">{card.title}</div>
      <p className="text-[12px] leading-relaxed text-[#8b96ad]">{card.sentence}</p>
    </div>
  );
}

export default function AuditTrail() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {AUDIT_CARDS.map((card) => (
        <Card key={card.id} card={card} />
      ))}
    </div>
  );
}
