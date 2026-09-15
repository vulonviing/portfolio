/** Collapsible JSON viewer — monospace, teal syntax highlights. Hidden by default. */
import { useState } from "react";

interface Props {
  value: unknown;
  maxLines?: number;
}

export default function JsonBlock({ value, maxLines = 30 }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const text = JSON.stringify(value, null, 2);
  const lines = text.split("\n");
  const needsToggle = lines.length > maxLines;
  const display = !needsToggle || expanded ? text : lines.slice(0, maxLines).join("\n") + "\n…";

  if (!revealed) {
    return (
      <button
        className="text-xs text-teal hover:underline"
        onClick={() => setRevealed(true)}
      >
        Show raw payload ({lines.length} lines)
      </button>
    );
  }

  return (
    <div className="relative">
      <pre className="text-xs font-mono text-gray-400 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
        {display}
      </pre>
      <div className="mt-1 flex items-center gap-3 text-xs">
        {needsToggle && (
          <button className="text-teal hover:underline" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show less" : `Show all (${lines.length} lines)`}
          </button>
        )}
        <button className="text-gray-500 hover:underline" onClick={() => setRevealed(false)}>
          Hide
        </button>
      </div>
    </div>
  );
}
