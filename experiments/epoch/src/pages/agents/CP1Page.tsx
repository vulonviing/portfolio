/**
 * CP1Page — "Case profile" detail screen.
 *
 * CP1 is a profiler, not a findings agent: its payload specifies the case —
 * deliverable shape, assurance level, and (uniquely) which upstream stage
 * produced each decision. This screen makes the profile auditable: every
 * value visible together with its real provenance.
 */
import {
  IconTarget,
  IconAdjustmentsHorizontal,
  IconAlertTriangle,
} from "@tabler/icons-react";
import ArtifactBar from "../../components/ArtifactBar";
import ApprovalPendingBanner from "../../components/ApprovalPendingBanner";
import RawPayloadFooter from "../../components/RawPayloadFooter";
import StageLoading from "../../components/StageLoading";
import { useAgentEnvelope } from "../../lib/useAgentEnvelope";
import { useAgentStageState } from "../../lib/useAgentStageState";
import { useRun } from "../../context/RunContext";

// ── CP1 payload shape ────────────────────────────────────────────────────────

interface OutputProfile {
  output_type: string;
  form: string;
  description: string;
}

interface CP1Payload {
  assurance_artifact: string;
  assurance_level: string;
  dual_method_required: boolean;
  cluster_count: number;
  cross_functional_need: boolean;
  risk_level: string;
  deadline_proximity_days: number | null;
  task_type: string;
  uncertainty: string;
  output_profile: OutputProfile;
  signal_sources: Record<string, string[]>;
  limitations: string[];
}

// ── Shared style tokens (scoped to this page) ───────────────────────────────

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

const SOURCE_STYLE: Record<string, string> = {
  registry: "border-[#d9a95c]/40 bg-[#2a2013] text-[#d9a95c]",
  r2: "border-[#2dd4bf]/40 bg-[#0f2e2c] text-[#2dd4bf]",
  da1: "border-[#8aa0d8]/40 bg-[#1a2036] text-[#8aa0d8]",
  // Document family (UC4) signal sources.
  rd3: "border-[#5b8def]/40 bg-[#101a2e] text-[#5b8def]",
  human_review: "border-[#d97a6c]/40 bg-[#2a1613] text-[#d97a6c]",
};
const sourceStyle = (s: string) => SOURCE_STYLE[s] ?? "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad]";

function SourceChip({ source }: { source: string }) {
  return (
    <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${sourceStyle(source)}`}>
      {source}
    </span>
  );
}

/** Generic value-based coloring: false=muted, medium/high=amber/red, else=teal. */
function valueColor(value: unknown): string {
  if (value === false) return "text-[#5c6780]";
  if (value === "medium") return "text-[#d9a95c]";
  if (value === "high") return "text-[#d97a6c]";
  return "text-[#2dd4bf]";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CP1Page() {
  const { envelope } = useAgentEnvelope("cp1");
  const stageState = useAgentStageState("cp1");
  const { run } = useRun();
  const p = envelope?.payload as CP1Payload | undefined;

  const isCP1Gate = run?.status === "waiting_gate" && run.current_gate?.gate_id === "cp1";
  const isComputing = stageState === "running" || stageState === "pending";
  const signalKeys = p
    ? Array.from(
        new Set([
          ...Object.keys(p.signal_sources).filter(
            (key) => key !== "output_profile",
          ),
          ...("deadline_proximity_days" in p &&
          !("deadline_proximity_days" in p.signal_sources)
            ? ["deadline_proximity_days"]
            : []),
        ]),
      )
    : [];
  const signalSources = p
    ? Array.from(new Set(Object.values(p.signal_sources).flat()))
    : [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 max-w-[1400px] mx-auto w-full flex-1">
        <div className="mb-2 flex items-baseline gap-3 flex-wrap">
          <h1 className="text-[19px] font-medium">
            <span className="font-mono text-[#2dd4bf]">CP1</span>{" "}
            <span className="text-[#e9eef7]">— Case profile</span>
          </h1>
          {envelope?.registry_id && (
            <span className="font-mono text-xs text-[#5c6780]">
              {envelope.registry_id}
            </span>
          )}
        </div>
        <p className="mb-5 max-w-[92ch] text-sm text-[#8b96ad]">
          Profiles the case: what the deliverable must be, how much assurance it demands, and which
          upstream signal produced each decision. Everything downstream is dimensioned from this profile.
        </p>

        {isCP1Gate && run?.current_gate && (
          <ApprovalPendingBanner gateId={run.current_gate.gate_id} />
        )}

        {isComputing && !isCP1Gate ? (
          <StageLoading agentLabel="CP1" agentName="Case Profile" />
        ) : (
          <>
            <ArtifactBar envelope={envelope} agent="CP1" />

            {p && (
              <>
                <div className={`${PANEL} mb-4 p-4`}>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <IconTarget size={16} className="text-[#8b96ad]" />
                    <h2 className="text-sm font-medium text-[#e9eef7]">
                      Case output profile
                    </h2>
                  </div>

                  <div className="grid gap-3.5 md:grid-cols-[minmax(250px,0.7fr)_minmax(0,1.3fr)]">
                    <div className="flex min-h-[168px] flex-col rounded-xl border border-[#2dd4bf]/30 bg-[#0f2e2c]/70 p-5">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-[#5c6780]">
                        Output type
                      </div>
                      <div className="mt-2 break-words font-mono text-[27px] font-semibold leading-tight text-[#2dd4bf]">
                        {p.output_profile.output_type}
                      </div>

                      <div className="mt-5 text-[10px] uppercase tracking-[0.14em] text-[#5c6780]">
                        Form
                      </div>
                      <div className="mt-1 break-words font-mono text-[14px] text-[#e9eef7]">
                        {p.output_profile.form}
                      </div>

                      <div className="mt-auto flex flex-wrap gap-1 pt-4">
                        {(p.signal_sources.output_profile ?? []).map((source) => (
                          <SourceChip key={source} source={source} />
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#1c2740] bg-[#111a2e] p-5">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-[#5c6780]">
                        Profile description
                      </div>
                      <p className="mt-3 text-[12.5px] leading-6 text-[#8b96ad]">
                        {p.output_profile.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${PANEL} mb-4 p-4`}>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <IconAdjustmentsHorizontal size={16} className="text-[#8b96ad]" />
                    <h2 className="text-sm font-medium text-[#e9eef7]">
                      Profile signals
                    </h2>
                    <span className="font-mono text-xs text-[#5c6780]">
                      {signalKeys.length}
                    </span>
                    <div className="ml-auto flex items-center gap-2 text-[11px] text-[#5c6780]">
                      <span>derived from</span>
                      {signalSources.map((source) => (
                        <SourceChip key={source} source={source} />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    {signalKeys.map((key) => {
                      const value = (p as unknown as Record<string, unknown>)[key];
                      const isNull = value === null || value === undefined;
                      const sources = p.signal_sources[key] ?? [];
                      return (
                        <div
                          key={key}
                          className={`${CARD} p-3 ${
                            isNull ? "border-dashed border-[#d9a95c]/50" : ""
                          }`}
                        >
                          <div
                            className={`truncate text-[10px] uppercase tracking-wide ${
                              isNull ? "text-[#d9a95c]" : "text-[#5c6780]"
                            }`}
                          >
                            {key.replace(/_/g, " ")}
                          </div>
                          <div className={`mt-1 font-mono text-[13px] ${isNull ? "text-[#d9a95c]" : valueColor(value)}`}>
                            {isNull ? "null" : String(value)}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {sources.map((source) => (
                              <SourceChip key={source} source={source} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={PANEL}>
                  <div className="flex items-center gap-3 border-b border-[#1c2740] p-4 pb-3">
                    <IconAlertTriangle size={16} className="text-[#d9a95c]" />
                    <h2 className="text-sm font-medium text-[#e9eef7]">
                      Limitations
                    </h2>
                    <span className="font-mono text-xs text-[#5c6780]">
                      {p.limitations.length}
                    </span>
                  </div>
                  <div className="space-y-2 p-3">
                    {p.limitations.map((limitation, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2.5 rounded-lg border border-[#1c2740] bg-[#111a2e] p-3"
                      >
                        <IconAlertTriangle
                          size={14}
                          className="mt-0.5 flex-shrink-0 text-[#d9a95c]"
                        />
                        <p className="text-[11.5px] leading-relaxed text-[#8b96ad]">
                          {limitation}
                        </p>
                      </div>
                    ))}
                    {p.limitations.length === 0 && (
                      <div className="rounded-lg border border-dashed border-[#2a3a5c] px-3 py-5 text-center text-[11.5px] text-[#5c6780]">
                        No limitations reported.
                      </div>
                    )}
                  </div>
                </div>

                <RawPayloadFooter payload={p} filename="cp1-payload.json" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
