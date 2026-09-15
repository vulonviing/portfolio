/**
 * ArtifactBar — thin single-row artifact metadata bar shown at the top of every
 * agent page. Drop-in replacement for EnvelopeHeader with a denser, single-line
 * layout containing artifact/sha256/run/input metadata. Approval state belongs
 * exclusively to the dedicated approval pages.
 *
 * input_refs handling is generic across every agent:
 *   - R1 is the only agent whose input_refs values are plain strings
 *     (its "input" is the registry itself, not an upstream artifact) —
 *     e.g. { registry_sha256: "<hash>" }. Shown as a copyable item, display =
 *     the key name.
 *   - Every other agent's input_refs values are { artifact_id, payload_sha256 }
 *     objects pointing to an upstream agent's shelf. Shown as a link to that
 *     agent's page (when recognized) + a copy action for the artifact_id.
 */
import { Link } from "react-router-dom";
import CopyButton from "./CopyButton";
import { useRun } from "../context/RunContext";
import { stepByArtifactKey } from "../lib/pipeline";
import type { ShelfEnvelope } from "../api/types";
import { routeForUsecase } from "../lib/routes";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";

interface MetaItem {
  key: string;
  label: string;
  display: string;
  copyValue: string;
  path?: string;
  title?: string;
}

function buildInputItems(inputRefs: Record<string, unknown>): MetaItem[] {
  return Object.entries(inputRefs).map(([key, ref]) => {
    if (ref && typeof ref === "object" && "artifact_id" in ref) {
      // input_refs keys are the upstream agent's active-set artifact key
      // (e.g. "rc1_2", "rm1_2"), not always its printed label (e.g. "RC1.2") —
      // resolve through the pipeline registry so both the label and the link
      // are correct for every family, not just an uppercased guess.
      const step = stepByArtifactKey(key);
      const agentLabel = step?.label ?? key.toUpperCase();
      const artifactId = String((ref as { artifact_id: unknown }).artifact_id);
      return {
        key,
        label: agentLabel,
        display: artifactId,
        copyValue: artifactId,
        path: step?.path,
      };
    }
    return {
      key,
      label: "inputs",
      display: key.toUpperCase(),
      copyValue: String(ref),
      title: String(ref),
    };
  });
}

interface Props {
  envelope: ShelfEnvelope | null | undefined;
  /** Agent code (e.g. "R1", "RC1.1", "EX1") — when given and selectable,
   * mounts a per-agent model override picker in this bar. */
  agent?: string;
}

export default function ArtifactBar({ envelope, agent }: Props) {
  const { runProvenance, selectedUsecase } = useRun();

  if (!envelope) {
    return (
      <div className={`${PANEL} mb-4 flex items-center justify-between gap-4 p-5 text-sm text-[#5c6780]`}>
        <span>No published artifact is available for this agent.</span>
      </div>
    );
  }

  const items: MetaItem[] = [
    { key: "artifact", label: "artifact", display: envelope.artifact_id, copyValue: envelope.artifact_id },
    ...(envelope.payload_sha256
      ? [{
          key: "sha256",
          label: "sha256",
          display: `${envelope.payload_sha256.substring(0, 16)}…`,
          copyValue: envelope.payload_sha256,
        }]
      : []),
    ...(envelope.run_id ? [{ key: "run", label: "run", display: envelope.run_id, copyValue: envelope.run_id }] : []),
    ...(envelope.created_at
      ? [{
          key: "date",
          label: "date",
          display: `${new Date(envelope.created_at).toLocaleString(undefined, {
            timeZone: "UTC",
            dateStyle: "medium",
            timeStyle: "short",
          })} UTC`,
          copyValue: envelope.created_at,
        }]
      : []),
    ...(envelope.llm_provenance?.model
      ? [{ key: "model", label: "model", display: envelope.llm_provenance.model, copyValue: envelope.llm_provenance.model }]
      : []),
    ...buildInputItems((envelope.input_refs as Record<string, unknown>) ?? {}),
  ];

  const fromDifferentRun =
    !!runProvenance?.dominant_run_id &&
    !!envelope.run_id &&
    envelope.run_id !== runProvenance.dominant_run_id;

  return (
    <div className={`${PANEL} flex flex-nowrap items-center justify-between gap-x-4 px-3.5 py-2 mb-4 overflow-x-auto`}>
      <div className="flex flex-shrink-0 flex-nowrap items-center gap-x-3">
        {fromDifferentRun && (
          <span
            className="flex-shrink-0 whitespace-nowrap rounded-md border border-[#d9a95c]/40 bg-[#2a2013]/50 px-2 py-0.5 text-[10px] text-[#d9a95c]"
            title={`This agent's artifact is from a different run (${envelope.run_id}) than the rest of the displayed pipeline (${runProvenance!.dominant_run_id})`}
          >
            ⚠ different run
          </span>
        )}
        {items.map((item) => {
          const inner = (
            <>
              <span className="text-[10px] font-mono text-[#5c6780]">{item.label}</span>
              <span className="text-[10px] font-mono text-[#8b96ad] group-hover:text-[#e9eef7] transition-colors">
                {item.display}
              </span>
              <CopyButton value={item.copyValue} />
            </>
          );
          const className =
            "group flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-1.5 py-0.5 border border-transparent hover:border-[#1c2740] hover:bg-[#111a2e] transition-colors";
          return item.path ? (
            <Link key={item.key} to={routeForUsecase(selectedUsecase, item.path)} className={className} title={item.title}>
              {inner}
            </Link>
          ) : (
            <div key={item.key} className={className} title={item.title}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
