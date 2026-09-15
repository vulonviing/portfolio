/**
 * HumanGatePill — the one non-agent element in the flow canvas: F1's human
 * approval gate. Amber only, dashed, so it's never mistaken for a node.
 */
import { IconUserCheck } from "@tabler/icons-react";

export type HumanGateState = "queued" | "active" | "approved";

export default function HumanGatePill({ state }: { state: HumanGateState }) {
  const approved = state === "approved";
  return (
    <div
      className={`flex items-center justify-center gap-1.5 rounded-full border border-dashed px-3 py-2 text-center transition-opacity ${
        approved ? "border-[#2dd4bf]/50" : state === "active" ? "border-[#d9a95c]/70" : "border-[#d9a95c]/35"
      }`}
    >
      <IconUserCheck size={13} className={approved ? "text-[#2dd4bf]" : "text-[#d9a95c]"} />
      <span className={`text-[11px] ${approved ? "text-[#2dd4bf]" : "text-[#d9a95c]"}`}>
        {approved ? "Approved" : state === "active" ? "Review active" : "Approval queued"}
      </span>
    </div>
  );
}
