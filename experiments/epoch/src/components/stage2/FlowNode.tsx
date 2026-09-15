/**
 * FlowNode — one agent card in the Stage 2 flow canvas. Two variants (standard
 * card / dense row) switched by the rank's node count, not by hand — see
 * FlowCanvas. Four states: done (real artifact exists), pending (in this
 * topology's chain, no artifact yet), "n/a" (agent exists in the library but
 * isn't part of this topology), plus `hub` as a structural modifier (the
 * consolidation node at a fan-in) that combines with done/pending.
 */
import { IconCheck, IconLoader2, IconPointFilled, IconUserCheck } from "@tabler/icons-react";

export type FlowNodeState = "available" | "approved" | "pending" | "running" | "review";

export interface FlowNodeConfig {
  key: string;
  code: string;
  role: string;
  metrics: string[];
  status: string;
  state: FlowNodeState;
  hub?: boolean;
}

const STATE_BORDER: Record<FlowNodeState, string> = {
  available: "border-[#2dd4bf]/45",
  approved: "border-[#2dd4bf]/70",
  pending: "border-[#1c2740]",
  running: "border-[#5b8def]/60",
  review: "border-[#d9a95c]/60",
};

export default function FlowNode({
  node,
  dense = false,
  onClick,
}: {
  node: FlowNodeConfig;
  dense?: boolean;
  onClick?: () => void;
}) {
  const { code, role, metrics, status, state, hub } = node;
  const clickable = !!onClick;
  const Wrapper = clickable ? "button" : "div";

  const hubGlow = hub
    ? { background: "linear-gradient(180deg, rgba(45,212,191,0.08), transparent 70%)" }
    : undefined;

  if (dense) {
    return (
      <Wrapper
        onClick={clickable ? onClick : undefined}
        className={`group flex w-full items-center gap-2.5 rounded-lg border ${STATE_BORDER[state]} px-2.5 py-1.5 text-left transition-all duration-200 ${
          state === "pending" ? "opacity-70" : "opacity-95 hover:opacity-100"
        } ${clickable ? "hover:border-[#2dd4bf] hover:translate-x-0.5 hover:bg-[#15203a] cursor-pointer" : ""}`}
        style={{ backgroundColor: "#111a2e", ...hubGlow }}
      >
        <span className="w-[42px] flex-shrink-0 font-mono text-[11px] font-semibold text-[#2dd4bf]">
          {code}
        </span>
        <span className="truncate text-[11.5px] text-[#8b96ad]">{role}</span>
        <span className="ml-auto flex-shrink-0">
          {state === "available" || state === "approved" ? (
            <IconCheck size={13} className="text-[#2dd4bf]" />
          ) : state === "running" ? (
            <IconLoader2 size={13} className="animate-spin text-[#5b8def]" />
          ) : state === "review" ? (
            <IconUserCheck size={13} className="text-[#d9a95c]" />
          ) : state === "pending" ? (
            <IconPointFilled size={8} className="text-[#5c6780]" />
          ) : null}
        </span>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      onClick={clickable ? onClick : undefined}
      className={`group flex w-full flex-col gap-1 rounded-[10px] border ${STATE_BORDER[state]} px-3 py-2.5 text-left transition-all duration-200 ${
        state === "pending" ? "opacity-70" : ""
      } ${clickable ? "hover:border-[#2dd4bf] hover:-translate-y-0.5 hover:shadow-[0_6px_22px_rgba(45,212,191,0.12)] cursor-pointer" : ""}`}
      style={{ backgroundColor: "#111a2e", ...hubGlow }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-[#2dd4bf]">{code}</span>
        {(state === "available" || state === "approved") && <IconCheck size={13} className="text-[#2dd4bf]" />}
        {state === "running" && <IconLoader2 size={13} className="animate-spin text-[#5b8def]" />}
        {state === "review" && <IconUserCheck size={13} className="text-[#d9a95c]" />}
      </div>
      <div className="text-[12px] font-medium text-[#e9eef7]">{role}</div>
      {metrics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {metrics.map((metric) => (
            <span key={metric} className="rounded border border-[#263452] px-1.5 py-0.5 font-mono text-[9px] text-[#8b96ad]">
              {metric}
            </span>
          ))}
        </div>
      )}
      <div className="text-[10px] text-[#8b96ad]">{status}</div>
    </Wrapper>
  );
}
