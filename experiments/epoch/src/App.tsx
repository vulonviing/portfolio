import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import Sidebar from "./layout/Sidebar";
import MainPanel from "./layout/MainPanel";
import RegistryPage from "./pages/RegistryPage";
import FoundationsPage from "./pages/FoundationsPage";
import ApprovalPage from "./pages/ApprovalPage";
import OverviewPage from "./pages/OverviewPage";
import R1Page from "./pages/agents/R1Page";
import DA1Page from "./pages/agents/DA1Page";
import R2Page from "./pages/agents/R2Page";
import D1Page from "./pages/agents/D1Page";
import D2Page from "./pages/agents/D2Page";
import CP1Page from "./pages/agents/CP1Page";
import TopologyPage from "./pages/TopologyPage";
import D3Page from "./pages/agents/D3Page";
import RD1Page from "./pages/agents/RD1Page";
import RD2Page from "./pages/agents/RD2Page";
import RC11Page from "./pages/agents/RC11Page";
import RC12Page from "./pages/agents/RC12Page";
import RM11Page from "./pages/agents/RM11Page";
import RM12Page from "./pages/agents/RM12Page";
import RD3Page from "./pages/agents/RD3Page";
import EX1Page from "./pages/agents/EX1Page";
import EX2Page from "./pages/agents/EX2Page";
import Stage2Page from "./pages/Stage2Page";
import Stage2NodePage from "./pages/Stage2NodePage";
import { RunProvider, useRun } from "./context/RunContext";
import { DEFAULT_USECASE_SLUG, SLUG_TO_USECASE } from "./lib/routes";

function ViewerShell() {
  const { usecase = "" } = useParams<{ usecase: string }>();
  const { setSelectedUsecase } = useRun();
  const usecaseKey = SLUG_TO_USECASE[usecase];

  useEffect(() => {
    if (usecaseKey) setSelectedUsecase(usecaseKey);
  }, [setSelectedUsecase, usecaseKey]);

  if (!usecaseKey) return <Navigate to={`/${DEFAULT_USECASE_SLUG}/registry`} replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 font-sans">
      <Sidebar />
      <MainPanel>
        <Routes>
          <Route index element={<Navigate to="registry" replace />} />
          <Route path="registry" element={<RegistryPage />} />
          <Route path="foundations" element={<FoundationsPage />} />
          <Route path="approvals/catalog" element={<ApprovalPage approvalKey="catalog" />} />
          <Route path="approvals/scope" element={<ApprovalPage approvalKey="scope" />} />
          <Route path="approvals/profile" element={<ApprovalPage approvalKey="profile" />} />
          <Route path="approvals/topology" element={<ApprovalPage approvalKey="topology" />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="r1" element={<R1Page />} />
          <Route path="da1" element={<DA1Page />} />
          <Route path="r2" element={<R2Page />} />
          <Route path="d1" element={<D1Page />} />
          <Route path="d2" element={<D2Page />} />
          <Route path="cp1" element={<CP1Page />} />
          <Route path="ts1" element={<TopologyPage />} />
          <Route path="d3" element={<D3Page />} />
          <Route path="rd1" element={<RD1Page />} />
          <Route path="rd2" element={<RD2Page />} />
          <Route path="rc1-1" element={<RC11Page />} />
          <Route path="rc1-2" element={<RC12Page />} />
          <Route path="rm1-1" element={<RM11Page />} />
          <Route path="rm1-2" element={<RM12Page />} />
          <Route path="rd3" element={<RD3Page />} />
          <Route path="ex1" element={<EX1Page />} />
          <Route path="ex2" element={<EX2Page />} />
          <Route path="stage2" element={<Stage2Page />} />
          <Route path="stage2/:agentKey" element={<Stage2NodePage />} />
          <Route path="*" element={<Navigate to="registry" replace />} />
        </Routes>
      </MainPanel>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <RunProvider>
        <Routes>
          <Route path="/" element={<Navigate to={`/${DEFAULT_USECASE_SLUG}/registry`} replace />} />
          <Route path="/:usecase/*" element={<ViewerShell />} />
          <Route path="*" element={<Navigate to={`/${DEFAULT_USECASE_SLUG}/registry`} replace />} />
        </Routes>
      </RunProvider>
    </BrowserRouter>
  );
}
