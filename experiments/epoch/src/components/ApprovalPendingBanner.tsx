import { Link } from "react-router-dom";
import { IconUserCheck } from "@tabler/icons-react";
import { approvalForGateId } from "../lib/approvalGates";
import { useRun } from "../context/RunContext";
import { routeForUsecase } from "../lib/routes";

export default function ApprovalPendingBanner({ gateId }: { gateId: string }) {
  const { selectedUsecase } = useRun();
  const approval = approvalForGateId(gateId);
  if (!approval) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#d9a95c]/40 bg-[#2a2013]/45 px-4 py-3 text-sm text-[#bba475]">
      <IconUserCheck size={16} className="text-[#d9a95c]" />
      <span className="min-w-0 flex-1">
        This output is waiting for a human decision on its dedicated approval page.
      </span>
      <Link
        to={routeForUsecase(selectedUsecase, approval.route ?? approval.agentPath)}
        className="rounded-lg border border-[#d9a95c]/40 bg-[#2a2013] px-3 py-1.5 text-xs font-medium text-[#d9a95c] transition-colors hover:bg-[#3a2b18]"
      >
        Open {approval.route ? approval.label : approval.agentKey}
      </Link>
    </div>
  );
}
