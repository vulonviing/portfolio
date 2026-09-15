import { Link } from "react-router-dom";
import { useRun } from "../context/RunContext";
import { routeForUsecase } from "../lib/routes";

interface Props {
  agentLabel: string;
  path: string;
  artifactId?: string;
}

export default function ProvenanceLink({ agentLabel, path, artifactId }: Props) {
  const { selectedUsecase } = useRun();
  return (
    <Link
      to={routeForUsecase(selectedUsecase, path)}
      className="epoch-badge bg-gray-800 text-gray-400 border border-gray-700 hover:text-teal hover:border-teal/40 transition-colors"
      title={artifactId ? `artifact_id: ${artifactId}` : undefined}
    >
      ↑ {agentLabel}
    </Link>
  );
}
