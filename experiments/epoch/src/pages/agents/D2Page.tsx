/**
 * D2Page — "Quality preflight" detail screen.
 *
 * The page renders only D2's artifact envelope and compact verdict payload.
 * It does not enrich claim IDs from R2 or derive routing prose from summary.
 */
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconGauge,
  IconRoute,
  IconClipboardCheck,
  IconCheck,
  IconFileText,
} from "@tabler/icons-react";
import ArtifactBar from "../../components/ArtifactBar";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import StageLoading from "../../components/StageLoading";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { useAgentStageState } from "../../lib/useAgentStageState";
import {
  formatMaskedNumber,
  isPublicNumber,
  type MaskedNumber,
} from "../../lib/maskedValues";

type Verdict = "pass" | "warning" | "partial" | "insufficient";
type Severity = "info" | "low" | "medium" | "high" | "critical";
type RoutingRecommendation =
  | "normal"
  | "increase_assurance"
  | "restrict_claims"
  | "stop";

interface BlockedClaim {
  claim_id: string;
  reason: string;
  missing_evidence: string[];
}

interface D2Payload {
  verdict: Verdict;
  routing_recommendation: RoutingRecommendation;
  evidence_completeness: MaskedNumber;
  max_severity: Severity;
  summary: string;
  assessable_claims: string[];
  blocked_claims: BlockedClaim[];
}

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";

const VERDICT_COLOR: Record<string, string> = {
  pass: "#2dd4bf",
  warning: "#d9a95c",
  partial: "#d98f5f",
  insufficient: "#d97a6c",
};

const SEVERITY_STYLE: Record<string, string> = {
  info: "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad]",
  low: "border-[#2dd4bf]/30 bg-[#0f2e2c] text-[#2dd4bf]",
  medium: "border-[#d9a95c]/40 bg-[#2a2013] text-[#d9a95c]",
  high: "border-[#d97a6c]/40 bg-[#2a1613] text-[#d97a6c]",
  critical: "border-[#ef5f67]/50 bg-[#301417] text-[#ef5f67]",
};

const ROUTING_STYLE: Record<string, string> = {
  normal: "border-[#2dd4bf]/40 bg-[#0f2e2c] text-[#2dd4bf]",
  increase_assurance: "border-[#d9a95c]/40 bg-[#2a2013] text-[#d9a95c]",
  restrict_claims: "border-[#d98f5f]/40 bg-[#2a1b16] text-[#d98f5f]",
  stop: "border-[#d97a6c]/40 bg-[#2a1613] text-[#d97a6c]",
};

function verdictColor(value: string): string {
  return VERDICT_COLOR[value] ?? "#8b96ad";
}

function severityStyle(value: string): string {
  return (
    SEVERITY_STYLE[value] ??
    "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad]"
  );
}

function routingStyle(value: string): string {
  return (
    ROUTING_STYLE[value] ??
    "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad]"
  );
}

function highlightClaimRefs(text: string) {
  const parts = text.split(/(R2F-\d+)/g);
  return parts.map((part, index) =>
    /^R2F-\d+$/.test(part) ? (
      <span key={index} className="font-mono text-[#2dd4bf]">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export default function D2Page() {
  const { envelope } = useAgentEnvelope("d2");
  const stageState = useAgentStageState("d2");
  const p = envelope?.payload as D2Payload | undefined;
  const isComputing = stageState === "running" || stageState === "pending";
  const totalClaims =
    (p?.assessable_claims.length ?? 0) + (p?.blocked_claims.length ?? 0);
  const color = p ? verdictColor(p.verdict) : "#8b96ad";

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[1400px] flex-1 p-6">
        <div className="mb-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">D2</span>{" "}
            <span className="text-[#e9eef7]">— Quality preflight</span>
          </h1>
          {envelope?.registry_id && (
            <span className="font-mono text-xs text-[#5c6780]">
              {envelope.registry_id}
            </span>
          )}
        </div>
        <p className="mb-5 max-w-[92ch] text-sm text-[#8b96ad]">
          Evaluates whether the loaded evidence can support the approved claims and
          reports the downstream routing recommendation.
        </p>

        {isComputing ? (
          <StageLoading agentLabel="D2" agentName="Quality Preflight" />
        ) : (
          <>
            <ArtifactBar envelope={envelope} agent="D2" />

            {p && (
              <>
                <div className={`${PANEL} mb-3.5 flex flex-wrap items-center gap-3 p-4`}>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.verdict === "pass" ? (
                      <IconCircleCheck size={20} style={{ color }} />
                    ) : (
                      <IconAlertTriangle size={20} style={{ color }} />
                    )}
                    <span
                      className="text-[17px] font-semibold uppercase tracking-wide"
                      style={{ color }}
                    >
                      {p.verdict}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${severityStyle(
                        p.max_severity,
                      )}`}
                    >
                      max severity {p.max_severity}
                    </span>
                  </div>
                  <div
                    className={`ml-auto rounded-lg border px-3 py-2 ${routingStyle(
                      p.routing_recommendation,
                    )}`}
                  >
                    <div className="flex items-center gap-2 text-[12px]">
                      <IconRoute size={15} />
                      <span>Routing recommendation</span>
                      <span className="font-mono font-medium">
                        {p.routing_recommendation}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-3.5 grid gap-3.5 md:grid-cols-2">
                  <div className={`${PANEL} p-5`}>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#5c6780]">
                      <IconClipboardCheck size={15} />
                      Claims reported
                    </div>
                    <div className="mt-3 font-mono text-[32px] leading-none text-[#e9eef7]">
                      {totalClaims}
                    </div>
                    <p className="mt-2 text-[11.5px] text-[#5c6780]">
                      All claims assessed by D2 in this artifact.
                    </p>
                  </div>

                  <div className={`${PANEL} border-[#2dd4bf]/30 p-5`}>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#2dd4bf]">
                      <IconCheck size={15} />
                      Assessable claims
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <span className="font-mono text-[32px] leading-none text-[#2dd4bf]">
                        {p.assessable_claims.length}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${
                          p.blocked_claims.length > 0
                            ? "border-[#d97a6c]/40 text-[#d97a6c]"
                            : "border-[#2a3a5c] text-[#8b96ad]"
                        }`}
                      >
                        {p.blocked_claims.length} blocked
                      </span>
                    </div>
                    <p className="mt-2 text-[11.5px] text-[#5c6780]">
                      Claims supported by the loaded evidence.
                    </p>
                  </div>
                </div>

                <div className={`${PANEL} mb-3.5 p-4`}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wide text-[#5c6780]">
                      Claim IDs
                    </span>
                    <span className="font-mono text-[10.5px] text-[#5c6780]">
                      {totalClaims} total
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {p.assessable_claims.map((claimId) => (
                      <span
                        key={claimId}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#2dd4bf]/30 bg-[#0f2e2c] px-2.5 py-1 font-mono text-[10.5px] text-[#2dd4bf]"
                      >
                        <IconCheck size={11} />
                        {claimId}
                      </span>
                    ))}
                    {p.blocked_claims.map((claim) => (
                      <span
                        key={claim.claim_id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#d97a6c]/35 bg-[#2a1613]/60 px-2.5 py-1 font-mono text-[10.5px] text-[#d97a6c]"
                      >
                        <IconAlertTriangle size={11} />
                        {claim.claim_id}
                      </span>
                    ))}
                    {totalClaims === 0 && (
                      <span className="text-[11.5px] text-[#5c6780]">
                        No claims reported.
                      </span>
                    )}
                  </div>

                  {p.blocked_claims.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-[#1c2740] pt-4">
                      {p.blocked_claims.map((claim) => (
                        <div
                          key={claim.claim_id}
                          className="rounded-lg border border-[#d97a6c]/35 bg-[#2a1613]/60 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <IconAlertTriangle
                              size={13}
                              className="text-[#d97a6c]"
                            />
                            <span className="font-mono text-[11px] font-semibold text-[#d97a6c]">
                              {claim.claim_id}
                            </span>
                            <span className="text-[10.5px] text-[#d97a6c]">
                              blocked
                            </span>
                          </div>
                          <p className="mt-2 text-[11.5px] leading-relaxed text-[#8b96ad]">
                            {claim.reason}
                          </p>
                          {claim.missing_evidence.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {claim.missing_evidence.map((item) => (
                                <span
                                  key={item}
                                  className="rounded border border-[#d97a6c]/30 px-2 py-0.5 font-mono text-[10px] text-[#d97a6c]"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-3.5 lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.8fr)]">
                  <div className={`${PANEL} p-5`}>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#5c6780]">
                      <IconGauge size={15} />
                      Evidence completeness
                    </div>
                    <div
                      className="mt-4 font-mono text-[32px] font-semibold leading-none"
                      style={{ color }}
                    >
                      {formatMaskedNumber(p.evidence_completeness, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="mt-5 h-[10px] w-full overflow-hidden rounded-full bg-[#111a2e]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: isPublicNumber(p.evidence_completeness)
                            ? `${Math.round(p.evidence_completeness * 100)}%`
                            : "0%",
                          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10.5px] text-[#5c6780]">
                      <span>0.00</span>
                      <span>1.00</span>
                    </div>
                  </div>

                  <div className={PANEL}>
                    <div className="flex items-center gap-3 border-b border-[#1c2740] p-4 pb-3">
                      <IconFileText size={16} className="text-[#8b96ad]" />
                      <h2 className="text-sm font-medium text-[#e9eef7]">
                        Evidence assessment
                      </h2>
                    </div>
                    <div className="p-5">
                      <p className="text-[12.5px] leading-relaxed text-[#8b96ad]">
                        {highlightClaimRefs(p.summary)}
                      </p>
                    </div>
                  </div>
                </div>

                <RawPayloadFooter payload={p} filename="d2-payload.json" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
