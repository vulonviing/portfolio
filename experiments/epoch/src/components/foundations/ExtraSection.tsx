/**
 * ExtraSection — a muted, unnumbered variant of Section.tsx for backup
 * material that lives outside the main numbered walkthrough (Agent types,
 * Shelves, Isolated memory). Same anchor-id/title/lead/children contract;
 * the numbered teal badge is replaced by a dim icon, and the whole block
 * sits in a lighter panel so it reads as secondary.
 */
import type { ReactNode } from "react";
import type { IconProps } from "@tabler/icons-react";
import Reveal from "./Reveal";

export default function ExtraSection({
  id,
  icon: Icon,
  title,
  lead,
  children,
}: {
  id: string;
  icon: (props: IconProps) => ReactNode;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16 rounded-xl border border-[#1c2740]/60 bg-[#0a101d]/40 p-5">
      <Reveal>
        <div className="mb-4 flex items-baseline gap-3">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-[#2a3a5c] bg-[#111a2e] text-[#5c6780]">
            <Icon size={13} />
          </span>
          <h2 className="text-[15px] font-medium text-[#c3cbdd]">{title}</h2>
        </div>
        {lead && (
          <p className="mb-5 max-w-[80ch] text-sm leading-relaxed text-[#5c6780]">{lead}</p>
        )}
        {children}
      </Reveal>
    </section>
  );
}
