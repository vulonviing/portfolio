/** Static viewer navigation for one published example per use case. */
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { IconBook2, IconCheck, IconDatabase, IconLayoutDashboard, IconPointFilled, IconTopologyStar, IconUserCheck } from "@tabler/icons-react";
import { fetchUsecases } from "../api/client";
import StatusDot from "../components/StatusDot";
import { useRun } from "../context/RunContext";
import { approvalAfterStage, approvalVisualState } from "../lib/approvalGates";
import { useActiveSet } from "../lib/useActiveSet";
import { EX2_STEP, stepsFor } from "../lib/pipeline";
import { routeForUsecase } from "../lib/routes";
import { flatStage2Agents, useStage2Binding } from "../lib/useStage2Binding";

export default function Sidebar() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"pipeline" | "stage2">("pipeline");
  const { data: usecases } = useQuery({ queryKey: ["usecases"], queryFn: fetchUsecases });
  const { selectedUsecase, setSelectedUsecase, stageState, family, runProvenance } = useRun();
  const { data: activeSet } = useActiveSet(selectedUsecase);
  const topologyId = (activeSet?.agents.ts?.payload as { selected_topology_id?: string } | undefined)?.selected_topology_id;
  const { binding } = useStage2Binding(topologyId, family);
  const stage2Agents = flatStage2Agents(binding);
  const scoped = (path: string) => routeForUsecase(selectedUsecase, path);
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? "border border-[#2dd4bf]/30 bg-[#0f2e2c]/50 text-[#2dd4bf]" : "text-[#8b96ad] hover:bg-[#15203a] hover:text-[#e9eef7]"}`;

  const selectUsecase = (key: string) => {
    setSelectedUsecase(key);
    navigate(routeForUsecase(key, "/registry"));
  };

  return (
    <aside className="flex h-full w-[200px] flex-shrink-0 flex-col overflow-hidden border-r border-[#1c2740] bg-[#0a101d]">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f2e2c]"><IconTopologyStar size={17} color="#2dd4bf" /></div>
        <div><div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e9eef7]">EPOCH</div><div className="text-[11px] text-[#5c6780]">Published viewer</div></div>
      </div>

      <div className="px-3 pt-1">
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-[#5c6780]">Use case</label>
        <select className="w-full rounded-lg border border-[#1c2740] bg-[#111a2e] px-2.5 py-2 text-xs text-[#e9eef7]" value={selectedUsecase ?? ""} onChange={(event) => selectUsecase(event.target.value)}>
          {usecases?.map((usecase) => <option key={usecase.key} value={usecase.key}>UC{usecase.key}: {usecase.id.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="space-y-2 px-3 pt-3">
        <NavLink to={scoped("/foundations")} className={navClass}><IconBook2 size={15} />Foundations</NavLink>
        <NavLink to={scoped("/registry")} className={navClass}><IconDatabase size={15} />Registry</NavLink>
      </div>

      <div className="px-3 pt-3">
        <div className="flex rounded-lg border border-[#1c2740] bg-[#0d1424] p-0.5">
          {(["pipeline", "stage2"] as const).map((item) => <button key={item} onClick={() => setMode(item)} className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium ${mode === item ? "bg-[#0f2e2c] text-[#2dd4bf]" : "text-[#5c6780]"}`}>{item === "pipeline" ? "Stage 1" : "Stage 2"}</button>)}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {mode === "pipeline" ? <>
          <NavLink to={scoped("/overview")} className={navClass}><IconLayoutDashboard size={15} />Stage 1 overview</NavLink>
          <div className="my-2 border-t border-[#1c2740]" />
          {stepsFor(family).map((step) => {
            const approval = approvalAfterStage(family, step.key);
            const approvalState = approval ? approvalVisualState(approval, null, stageState(step.key), undefined) : null;
            return <div key={step.key}>
              <NavLink to={scoped(step.path)} className={navClass}><StatusDot step={step.key} /><span className="rounded border border-[#2a3a5c] px-1.5 py-0.5 font-mono text-[10px] font-semibold">{step.label}</span><span className="truncate">{step.name}</span></NavLink>
              {approval?.route && approvalState && <NavLink to={scoped(approval.route)} className="mx-3 my-1 flex items-center gap-1.5 border-l-2 border-[#2dd4bf]/60 px-3 py-1 text-[11px] text-[#2dd4bf]">{approvalState === "approved" ? <IconCheck size={12} /> : <IconUserCheck size={12} />}{approval.label}</NavLink>}
            </div>;
          })}
        </> : <>
          <NavLink to={scoped("/stage2")} end className={navClass}><IconTopologyStar size={15} />Stage 2 overview</NavLink>
          <div className="my-2 border-t border-[#1c2740]" />
          <NavLink to={scoped(EX2_STEP.path)} className={navClass}><StatusDot step={EX2_STEP.key} /><span className="rounded border border-[#2a3a5c] px-1.5 py-0.5 font-mono text-[10px] font-semibold">{EX2_STEP.label}</span>{EX2_STEP.name}</NavLink>
          <div className="my-2 border-t border-[#1c2740]" />
          {stage2Agents.map((agent) => {
            const key = agent.agent_id.toLowerCase();
            return <NavLink key={key} to={scoped(`/stage2/${key}`)} className={navClass}>{activeSet?.agents[key] ? <IconCheck size={13} className="text-[#2dd4bf]" /> : <IconPointFilled size={8} className="text-[#5c6780]" />}<span className="rounded border border-[#2a3a5c] px-1.5 py-0.5 font-mono text-[10px] font-semibold">{agent.agent_id}</span><span className="truncate">{agent.role}</span></NavLink>;
          })}
        </>}
      </nav>

      <div className="border-t border-[#1c2740] px-4 py-3 text-xs text-[#8b96ad]">
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#2dd4bf]" /><span>Published example</span></div>
        {runProvenance?.run_dir && <div className="mt-0.5 truncate font-mono text-[#5c6780]">{runProvenance.run_dir}</div>}
      </div>
    </aside>
  );
}
