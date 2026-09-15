/**
 * Section — shared frame for each FoundationsPage concept block: an anchor
 * id (for the section rail), a numbered header, a lead paragraph, and content.
 */
import type { ReactNode } from "react";
import Reveal from "./Reveal";

export default function Section({
  id,
  number,
  title,
  lead,
  children,
}: {
  id: string;
  number: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16 pt-10 first:pt-6">
      <Reveal>
        <div className="mb-4 flex items-baseline gap-3">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-[#2dd4bf]/35 bg-[#0f2e2c] font-mono text-[11px] font-semibold text-[#2dd4bf]">
            {number}
          </span>
          <h2 className="text-[16px] font-medium text-[#e9eef7]">{title}</h2>
        </div>
        {lead && (
          <p className="mb-5 max-w-[80ch] text-sm leading-relaxed text-[#8b96ad]">{lead}</p>
        )}
        {children}
      </Reveal>
    </section>
  );
}
