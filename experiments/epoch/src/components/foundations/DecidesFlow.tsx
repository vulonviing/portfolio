/**
 * DecidesFlow — the two-stage shape of the whole pipeline, as one small
 * illustration: Evidence (built and human-approved) flows into Deliverable
 * (the topology's finished, reviewed output). Self-contained, like
 * HumanGate.tsx — no content.ts dependency.
 */
import type { ReactNode } from "react";
import { IconReport, IconShieldCheck } from "@tabler/icons-react";

const TEAL = "#2dd4bf";

function Node({ icon, label, caption }: { icon: ReactNode; label: string; caption: string }) {
  return (
    <div className="flex w-[190px] flex-col items-center gap-2.5 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#2dd4bf]/35 bg-[#0f2e2c] text-[#2dd4bf]">
        {icon}
      </span>
      <span className="text-[13px] font-medium text-[#e9eef7]">{label}</span>
      <p className="text-[12px] leading-relaxed text-[#8b96ad]">{caption}</p>
    </div>
  );
}

export default function DecidesFlow() {
  return (
    <div className="flex items-center justify-center gap-4 rounded-xl border border-[#1c2740] bg-[#0a101d] px-6 py-8 sm:gap-8">
      <Node icon={<IconShieldCheck size={26} />} label="Evidence" caption="Reviewed and approved by a human." />
      <svg width="64" height="24" viewBox="0 0 64 24" className="flex-none">
        <line x1={4} y1={12} x2={54} y2={12} stroke={TEAL} strokeWidth={1.6} />
        <path d="M 54 6 L 62 12 L 54 18" fill="none" stroke={TEAL} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <Node icon={<IconReport size={26} />} label="Deliverable" caption="The final, reviewed output." />
    </div>
  );
}
