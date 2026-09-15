/**
 * ExternalCommentaryView — shared body for EX1Page/EX2Page.
 *
 * EX1/EX2 are advisory-only role agents (AGENTS.md hard rule): their output
 * never feeds any downstream agent and never changes the isolated memory.
 * This view exists purely to show the human, at the gate that follows, one
 * more source-grounded, Siemens-external perspective. It is not a decision
 * and carries no approve/reject affordance.
 */
import { IconExternalLink, IconInfoCircle } from "@tabler/icons-react";
import ArtifactBar from "../ArtifactBar";
import RawPayloadFooter from "../RawPayloadFooter";
import StageLoading from "../StageLoading";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { useAgentStageState } from "../../lib/useAgentStageState";
import type { CommentaryBullet, ExternalCommentary } from "../../api/types";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

const STANCE_STYLE: Record<CommentaryBullet["stance"], { label: string; className: string }> = {
  supports: { label: "supports", className: "border-[#2dd4bf]/40 bg-[#0f2e2c] text-[#2dd4bf]" },
  challenges: { label: "challenges", className: "border-[#ef5f67]/40 bg-[#2a1416] text-[#ef5f67]" },
  adds_context: { label: "adds context", className: "border-[#5b8def]/40 bg-[#101d33] text-[#5b8def]" },
  flags_gap: { label: "flags a gap", className: "border-[#d9a95c]/40 bg-[#2a2013] text-[#d9a95c]" },
};

const RELEVANCE_LABEL: Record<CommentaryBullet["relevance"], string> = {
  high: "high relevance",
  medium: "medium relevance",
  low: "low relevance",
};

function StanceChip({ stance }: { stance: CommentaryBullet["stance"] }) {
  const s = STANCE_STYLE[stance];
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

function GroundingChip({ grounding }: { grounding: CommentaryBullet["grounding"] }) {
  const verified = grounding === "web_verified";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] ${
        verified
          ? "border-[#2dd4bf]/30 text-[#2dd4bf]"
          : "border-[#5c6780]/40 text-[#5c6780]"
      }`}
      title={
        verified
          ? "EX found and cites a specific page at an allowed institution."
          : "EX could not confirm this via search this run — background, not fact."
      }
    >
      {verified ? "web verified" : "model knowledge"}
    </span>
  );
}

function BulletCard({ bullet }: { bullet: CommentaryBullet }) {
  return (
    <div className={`${CARD} p-3.5`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <StanceChip stance={bullet.stance} />
        <GroundingChip grounding={bullet.grounding} />
        <span className="text-[10.5px] text-[#5c6780]">{RELEVANCE_LABEL[bullet.relevance]}</span>
      </div>
      <p className="text-[13px] leading-relaxed text-[#e9eef7]">{bullet.point}</p>
      {bullet.sources.length > 0 && (
        <div className="mt-2.5 space-y-1 border-t border-[#1c2740] pt-2">
          {bullet.sources.map((source, i) => (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-[#8b96ad] hover:text-[#2dd4bf]"
            >
              <IconExternalLink size={12} className="flex-shrink-0" />
              <span className="font-medium">{source.institution}</span>
              <span className="truncate text-[#5c6780]">— {source.title}</span>
              {source.published && <span className="flex-shrink-0 text-[#3a4560]">({source.published})</span>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ExternalCommentaryBullets — the banner + bullet list + institutions summary,
 * with no dependency on useAgentEnvelope/ArtifactBar/RawPayloadFooter. Reused
 * by ApprovalPage to render EX1's/EX2's commentary embedded directly inside a
 * gate payload (`payload.ex1` / `payload.ex2`), alongside the main gate below.
 */
export function ExternalCommentaryBullets({ commentary }: { commentary: ExternalCommentary }) {
  return (
    <div>
      <div className={`${PANEL} mb-4 flex items-start gap-2.5 p-3.5 border-[#d9a95c]/30`}>
        <IconInfoCircle size={15} className="mt-0.5 flex-shrink-0 text-[#d9a95c]" />
        <p className="text-[12px] leading-relaxed text-[#8b96ad]">
          This commentary is <span className="text-[#e9eef7]">not binding</span>. It does not
          change the approved regulatory or data boundary, and no downstream agent consumes it
          — it exists only to inform this decision.
        </p>
      </div>

      <div className="mb-4 space-y-2.5">
        {commentary.bullets.map((bullet, i) => (
          <BulletCard key={i} bullet={bullet} />
        ))}
      </div>

      <div className={`${CARD} p-3.5 text-[11.5px] text-[#8b96ad]`}>
        <span className="text-[#5c6780]">Institutions consulted: </span>
        {commentary.institutions_consulted.length > 0 ? commentary.institutions_consulted.join(", ") : "none"}
        {commentary.search_notes.length > 0 && (
          <ul className="mt-1.5 list-inside list-disc space-y-0.5">
            {commentary.search_notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface Props {
  agentKey: "ex1" | "ex2";
  agentLabel: "EX1" | "EX2";
  title: string;
  description: string;
}

export default function ExternalCommentaryView({ agentKey, agentLabel, title, description }: Props) {
  const { envelope } = useAgentEnvelope(agentKey);
  const stageState = useAgentStageState(agentKey);
  const p = envelope?.payload as ExternalCommentary | undefined;
  // EX1/EX2 are the last agent to run before their gate blocks, so the SSE
  // "running" state persists for the entire gate wait — no later stage_started
  // event ever flips it to "done" (see RunContext.tsx stage_started handling).
  // Trust a shelf envelope that has actually arrived over a stale live state.
  const isComputing = !envelope && (stageState === "running" || stageState === "pending");

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1000px] flex-1 p-6">
        <div className="mb-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">{agentLabel}</span>{" "}
            <span className="text-[#e9eef7]">— {title}</span>
          </h1>
          {envelope?.registry_id && (
            <span className="font-mono text-xs text-[#5c6780]">{envelope.registry_id}</span>
          )}
        </div>
        <p className="mb-5 max-w-[92ch] text-sm text-[#8b96ad]">{description}</p>

        {isComputing ? (
          <StageLoading agentLabel={agentLabel} agentName="External Perspective" />
        ) : (
          <>
            <ArtifactBar envelope={envelope} agent={agentLabel} />

            {p && (
              <>
                <ExternalCommentaryBullets commentary={p} />
                <RawPayloadFooter payload={p} filename={`${agentKey}-payload.json`} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
