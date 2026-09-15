/**
 * StatusDot — compact colored indicator for a pipeline stage in the sidebar nav.
 *
 * States driven by RunContext stage tracking:
 *   idle    → dim gray
 *   pending → dim gray (queued but not yet started)
 *   running → teal pulsing
 *   gate    → yellow pulsing (waiting for human input)
 *   done    → solid teal
 *   error   → red (run failed)
 */
import { useRun } from "../context/RunContext";

interface Props {
  step: string;   // lowercase agent key, e.g. "r1", "da1"
}

export default function StatusDot({ step }: Props) {
  const { stageState, run } = useRun();
  const state = stageState(step);

  // Run failed — show red on any stage that was running or is now frozen.
  if (run?.status === "failed" && (state === "running" || state === "pending")) {
    return <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />;
  }

  switch (state) {
    case "running":
      return <span className="w-2 h-2 rounded-full bg-teal inline-block animate-pulse" />;
    case "gate":
      return <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block animate-pulse" />;
    case "done":
      return <span className="w-2 h-2 rounded-full bg-teal inline-block" />;
    default:
      return <span className="w-2 h-2 rounded-full bg-gray-700 inline-block" />;
  }
}
