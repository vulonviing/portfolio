/**
 * StageLoading — shown on an agent page while that stage is computing.
 *
 * Replaces stale artifacts so the user never sees an old contract during a
 * refresh. Mimics the CLI's "clearing and recomputing" feel.
 */
interface Props {
  agentLabel: string;   // e.g. "R1", "DA1"
  agentName: string;    // e.g. "Regulation Discovery"
}

export default function StageLoading({ agentLabel, agentName }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 select-none">
      {/* Pulsing glyph */}
      <div className="relative flex items-center justify-center">
        {/* Outer ring */}
        <div className="absolute w-20 h-20 rounded-full border-2 border-teal/20 animate-ping" />
        <div className="absolute w-20 h-20 rounded-full border border-teal/30 animate-pulse" />
        {/* Inner agent badge */}
        <div className="w-14 h-14 rounded-full bg-teal/10 border border-teal/40 flex items-center justify-center">
          <span className="font-mono text-teal font-bold text-sm">{agentLabel}</span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <div className="text-gray-300 font-medium">
          Running {agentLabel} · {agentName}
        </div>
        <div className="text-gray-600 text-sm mt-1 animate-pulse">
          Computing…
        </div>
      </div>

      {/* Animated bar */}
      <div className="w-64 h-0.5 bg-gray-800 rounded overflow-hidden">
        <div
          className="h-full bg-teal/60 rounded"
          style={{
            width: "40%",
            animation: "stage-sweep 1.6s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes stage-sweep {
          0%   { transform: translateX(-160px); }
          100% { transform: translateX(420px); }
        }
      `}</style>
    </div>
  );
}
