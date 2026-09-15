/**
 * AgentTypeCards — LLM / Deterministic / Hybrid, led by a large icon
 * illustration and one plain sentence, matching the Agent bench / Audit
 * awareness treatment. Full technical definitions live in AGENTS.md's
 * "Agent Type Classification" table — this is the stakeholder-facing gloss.
 */
import type { ReactNode } from "react";
import { IconBrain, IconCode, IconGitMerge } from "@tabler/icons-react";
import { AGENT_TYPE_CARDS, type AgentTypeCard } from "./content";

const TYPE_ICON: Record<AgentTypeCard["id"], ReactNode> = {
  llm: <IconBrain size={26} />,
  deterministic: <IconCode size={26} />,
  hybrid: <IconGitMerge size={26} />,
};

const TYPE_TONE: Record<AgentTypeCard["id"], string> = {
  llm: "border-[#2dd4bf]/35 bg-[#0f2e2c] text-[#2dd4bf]",
  deterministic: "border-[#5b8def]/35 bg-[#101a2e] text-[#5b8def]",
  hybrid: "border-[#d9a95c]/35 bg-[#2a2013] text-[#d9a95c]",
};

function TypeCard({ card }: { card: AgentTypeCard }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-[#1c2740] bg-[#0d1424] p-5 text-center">
      <span
        className={`flex h-16 w-16 flex-none items-center justify-center rounded-full border ${TYPE_TONE[card.id]}`}
      >
        {TYPE_ICON[card.id]}
      </span>
      <span className="text-[13.5px] font-medium text-[#e9eef7]">{card.title}</span>
      <p className="text-[12.5px] leading-relaxed text-[#8b96ad]">{card.description}</p>
      <div className="mt-1 flex flex-wrap justify-center gap-1.5">
        {card.examples.map((ex) => (
          <span
            key={ex}
            className="rounded border border-[#2a3a5c] bg-[#111a2e] px-1.5 py-0.5 font-mono text-[10px] text-[#5c6780]"
          >
            {ex}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AgentTypeCards() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {AGENT_TYPE_CARDS.map((card) => (
        <TypeCard key={card.id} card={card} />
      ))}
    </div>
  );
}
