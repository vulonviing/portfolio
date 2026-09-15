/**
 * StepThroughDemo — the one interactive piece on FoundationsPage: replays
 * the UC4 document chain one node at a time using the same idle → running →
 * gate → done states PipelineGraph uses for a live run. Purely local state —
 * does not touch RunContext or the backend, so it works with no run active.
 */
import { useEffect, useRef, useState } from "react";
import {
  IconBolt,
  IconCheck,
  IconChevronRight,
  IconCircle,
  IconLoader2,
  IconPlayerPlay,
  IconRefresh,
  IconUserCheck,
} from "@tabler/icons-react";
import { UC4_DEMO_CHAIN } from "./content";

type NodeState = "idle" | "running" | "gate" | "done";

const STATE_STYLES: Record<NodeState, string> = {
  idle: "border-[#1c2740] bg-[#111a2e] text-[#8b96ad]",
  running: "border-[#2dd4bf]/70 bg-[#0f2e2c] text-[#2dd4bf]",
  gate: "border-[#d9a95c] bg-[#2a2013] text-[#d9a95c]",
  done: "border-[#2dd4bf]/50 bg-[#0f2e2c]/60 text-[#2dd4bf]",
};

const GATE_STYLES: Record<NodeState, string> = {
  idle: "border-[#1c2740] text-[#5c6780]",
  running: "border-[#d9a95c] bg-[#2a2013] text-[#d9a95c]",
  gate: "border-[#d9a95c] bg-[#2a2013] text-[#d9a95c]",
  done: "border-[#2dd4bf]/60 bg-[#0f2e2c]/70 text-[#2dd4bf]",
};

const RUNNING_MS = 850;

function stateFor(index: number, cursor: number, activeRunning: boolean): NodeState {
  if (index < cursor) return "done";
  if (index > cursor) return "idle";
  return activeRunning ? "running" : "done";
}

export default function StepThroughDemo() {
  // cursor = index of the node currently being decided; -1 = not started.
  const [cursor, setCursor] = useState(-1);
  const [running, setRunning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = UC4_DEMO_CHAIN.length;
  const finished = cursor >= total - 1 && !running;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const advance = () => {
    setCursor((prev) => {
      const next = prev + 1;
      if (next >= total) return prev;
      return next;
    });
    setRunning(true);
    timerRef.current = setTimeout(() => setRunning(false), RUNNING_MS);
  };

  const handlePlay = () => {
    if (finished) return;
    setPlaying(true);
    advance();
  };

  useEffect(() => {
    if (!playing || running) return;
    if (cursor >= total - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(advance, 260);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, running, cursor]);

  const handleReset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlaying(false);
    setRunning(false);
    setCursor(-1);
  };

  const activeNode = cursor >= 0 ? UC4_DEMO_CHAIN[cursor] : null;
  const activeState: NodeState = activeNode ? (running ? "running" : activeNode.kind === "gate" ? "gate" : "done") : "idle";

  return (
    <div className="rounded-xl border border-[#1c2740] bg-[#0d1424] p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={handlePlay}
          disabled={playing || finished}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: "#2dd4bf", color: "#052220" }}
        >
          <IconPlayerPlay size={13} />
          {cursor < 0 ? "Play" : "Continue"}
        </button>
        <button
          onClick={handleReset}
          disabled={cursor < 0}
          className="flex items-center gap-1.5 rounded-lg border border-[#1c2740] px-3 py-1.5 text-xs text-[#8b96ad] transition-colors hover:text-[#e9eef7] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconRefresh size={13} />
          Reset
        </button>
        <span className="ml-auto text-[11px] text-[#5c6780]">
          {cursor < 0 ? "Not started" : finished ? "Chain complete" : `Step ${cursor + 1} / ${total}`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {UC4_DEMO_CHAIN.map((node, i) => {
          const state = stateFor(i, cursor, running && i === cursor);
          const isGate = node.kind === "gate";
          return (
            <div key={node.key} className="flex items-center gap-1.5">
              {isGate ? (
                <span
                  title={node.name}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed px-3 py-1.5 text-[11px] transition-colors ${GATE_STYLES[state]}`}
                >
                  {state === "done" ? <IconCheck size={12} /> : <IconUserCheck size={12} />}
                  {node.label}
                </span>
              ) : (
                <span
                  title={node.name}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors ${STATE_STYLES[state]}`}
                >
                  {state === "running" ? (
                    <IconLoader2 size={12} className="animate-spin" />
                  ) : state === "done" ? (
                    <IconCheck size={12} />
                  ) : (
                    <IconCircle size={9} />
                  )}
                  {node.label}
                </span>
              )}
              {i < total - 1 && <IconChevronRight size={12} className="flex-none text-[#2a3a5c]" />}
            </div>
          );
        })}
      </div>

      <div className="mt-4 min-h-[40px] rounded-lg border border-[#1c2740] bg-[#111a2e]/65 px-3.5 py-2.5">
        {activeNode ? (
          <div className="flex items-center gap-2 text-[12px] text-[#c3cbdd]">
            {activeNode.kind === "gate" ? (
              <IconBolt size={13} className="flex-none text-[#d9a95c]" />
            ) : (
              <span className="rounded border border-[#2a3a5c] px-1.5 py-0.5 font-mono text-[10px] text-[#8b96ad]">
                {activeState === "running" ? "computing" : "done"}
              </span>
            )}
            <span className="font-medium text-[#e9eef7]">{activeNode.label}</span>
            <span className="text-[#8b96ad]">— {activeNode.name}</span>
          </div>
        ) : (
          <p className="text-[12px] text-[#5c6780]">
            Press Play to step through the UC4 document chain, one node at a time.
          </p>
        )}
      </div>
    </div>
  );
}
