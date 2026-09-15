/**
 * FoundationsPage — the presentation primer. Explains the concepts a run
 * assumes (topology, agent, audit trail, human gates, step-by-step
 * execution) before the audience sees a live pipeline. Agent types, Shelves,
 * and Isolated memory are backup detail — kept below, in the unnumbered
 * "Extra" area, out of the main numbered walkthrough.
 *
 * Static by design: no useRun(), no API calls. It must render fully with no
 * backend reachable and no use case selected, so it can open first.
 */
import {
  IconBook2,
  IconBoxMultiple,
  IconDatabase,
  IconGitBranch,
  IconLock,
  IconRoute,
  IconShieldCheck,
  IconUserCheck,
} from "@tabler/icons-react";
import AgentBench from "../components/foundations/AgentBench";
import AgentTypeCards from "../components/foundations/AgentTypeCards";
import AuditTrail from "../components/foundations/AuditTrail";
import DecidesFlow from "../components/foundations/DecidesFlow";
import ExtraSection from "../components/foundations/ExtraSection";
import HumanGate from "../components/foundations/HumanGate";
import IsolatedMemoryDiagram from "../components/foundations/IsolatedMemoryDiagram";
import Section from "../components/foundations/Section";
import ShelfDiagram from "../components/foundations/ShelfDiagram";
import StepThroughDemo from "../components/foundations/StepThroughDemo";
import TopologyShapes from "../components/foundations/TopologyShapes";
import { GATE_RULE, PI_FORMULA } from "../components/foundations/content";

const MAIN_RAIL_ITEMS = [
  { id: "decides", label: "What EPOCH decides", icon: IconRoute },
  { id: "topologies", label: "Topologies", icon: IconGitBranch },
  { id: "agent", label: "Agent bench", icon: IconBoxMultiple },
  { id: "audit", label: "Audit awareness", icon: IconShieldCheck },
  { id: "gates", label: "Human gates", icon: IconUserCheck },
  { id: "steps", label: "Step by step", icon: IconBook2 },
];

const EXTRA_RAIL_ITEMS = [
  { id: "types", label: "Agent types", icon: IconGitBranch },
  { id: "shelves", label: "Shelves", icon: IconDatabase },
  { id: "memory", label: "Isolated memory", icon: IconLock },
];

export default function FoundationsPage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-[1400px] px-6 pt-6">
        <div className="mb-1 flex items-baseline gap-3">
          <h1 className="text-[19px] font-medium text-[#e9eef7]">Foundations</h1>
        </div>
        <p className="mb-2 max-w-[80ch] text-sm leading-relaxed text-[#8b96ad]">
          Before a run: the vocabulary every stage in this viewer assumes.
        </p>
        <p className="mb-4 inline-block rounded-lg border border-[#1c2740] bg-[#111a2e] px-3 py-1.5 font-mono text-[12px] text-[#2dd4bf]">
          {PI_FORMULA}
        </p>
      </div>

      {/* Section rail — horizontal, sticky under the header */}
      <nav
        className="sticky top-0 z-10 flex flex-wrap items-center gap-1.5 border-b border-[#1c2740] px-6 py-2.5"
        style={{ backgroundColor: "#0a101d" }}
      >
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-1.5">
          {MAIN_RAIL_ITEMS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex items-center gap-1.5 rounded-full border border-[#1c2740] px-2.5 py-1 text-[11px] text-[#8b96ad] transition-colors hover:border-[#2a3a5c] hover:bg-[#111a2e] hover:text-[#e9eef7]"
            >
              <Icon size={12} className="flex-none" />
              <span className="whitespace-nowrap">{label}</span>
            </a>
          ))}
          <span className="ml-1 flex-none text-[10px] uppercase tracking-[0.1em] text-[#3a4a6c]">Extra</span>
          {EXTRA_RAIL_ITEMS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex items-center gap-1.5 rounded-full border border-[#1c2740]/60 px-2.5 py-1 text-[11px] text-[#5c6780] transition-colors hover:border-[#2a3a5c] hover:bg-[#111a2e] hover:text-[#8b96ad]"
            >
              <Icon size={12} className="flex-none" />
              <span className="whitespace-nowrap">{label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="mx-auto w-full max-w-[1400px] px-6 pb-10">
        <Section
          id="decides"
          number="1"
          title="What EPOCH decides"
          lead="Stage 1 builds and approves the evidence; Stage 2 runs the topology that produces the deliverable."
        >
          <DecidesFlow />
        </Section>

        <Section
          id="topologies"
          number="2"
          title="Topologies"
          lead="How the agents talk to each other — three shapes, not three agent counts."
        >
          <TopologyShapes />
        </Section>

        <Section
          id="agent"
          number="3"
          title="Agent bench"
          lead="Every agent exists to run one audit-aware procedure that produces the output the case expects — the topology system decides which agents get the job."
        >
          <AgentBench />
        </Section>

        <Section
          id="audit"
          number="4"
          title="Audit awareness"
          lead="What a run leaves on disk, how a value traces back, and who checks it independently."
        >
          <AuditTrail />
        </Section>

        <Section id="gates" number="5" title="Human gates" lead={GATE_RULE}>
          <div className="rounded-xl border border-[#d9a95c]/30 bg-[#2a2013]/25 p-4">
            <HumanGate />
          </div>
        </Section>

        <Section
          id="steps"
          number="6"
          title="Step by step"
          lead="A replay of the UC4 document chain, driven by a local clock instead of the backend."
        >
          <StepThroughDemo />
        </Section>

        {/* Extra — backup detail, outside the main numbered walkthrough */}
        <div className="my-10 flex items-center gap-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#3a4a6c]">Extra</span>
          <div className="h-px flex-1 bg-[#1c2740]" />
        </div>

        <div className="space-y-6">
          <ExtraSection
            id="types"
            icon={IconGitBranch}
            title="Agent types"
            lead="Every agent is exactly one of three types — the type sets what validation its output gets."
          >
            <AgentTypeCards />
          </ExtraSection>

          <ExtraSection
            id="shelves"
            icon={IconDatabase}
            title="Shelves"
            lead="Outputs live on the agent that produced them — a downstream agent references, never reaches in."
          >
            <ShelfDiagram />
          </ExtraSection>

          <ExtraSection
            id="memory"
            icon={IconLock}
            title="Isolated memory"
            lead="Two human approvals seal a single packet — every downstream agent sees the output, never each other."
          >
            <IsolatedMemoryDiagram />
          </ExtraSection>
        </div>
      </div>
    </div>
  );
}
