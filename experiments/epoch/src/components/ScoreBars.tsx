/**
 * Horizontal score bars for topology_scores: {Direct, Debate, Coalition} → int (sum 100).
 */
interface Props {
  scores: Record<string, number>;
  selected: string;
}

const COLORS: Record<string, string> = {
  Direct: "#009999",
  Debate: "#f59e0b",
  Coalition: "#a78bfa",
};

export default function ScoreBars({ scores, selected }: Props) {
  return (
    <div className="space-y-2">
      {Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .map(([topology, score]) => (
          <div key={topology} className="flex items-center gap-3">
            <div className="w-20 text-xs text-right font-mono text-gray-400 flex-shrink-0">
              {topology}
              {topology === selected && (
                <span className="ml-1 text-teal">✓</span>
              )}
            </div>
            <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${score}%`,
                  backgroundColor: COLORS[topology] ?? "#6b7280",
                  opacity: topology === selected ? 1 : 0.4,
                }}
              />
            </div>
            <div className="w-10 text-xs text-right font-mono text-gray-500">{score}%</div>
          </div>
        ))}
    </div>
  );
}
