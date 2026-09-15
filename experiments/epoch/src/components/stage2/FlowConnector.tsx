/**
 * FlowConnector — one SVG per connector column between two ranks. Handles
 * straight (1→1), fan-in (N→1) and fan-out (1→N) generically from the two
 * node counts — the same math for 2 nodes or 8, per the flow-canvas grammar.
 */
import type { CSSProperties } from "react";

function targetY(index: number, count: number): number {
  return ((index + 0.5) / count) * 100;
}

export default function FlowConnector({
  fromCount,
  toCount,
  active,
  dashStart = 0,
}: {
  fromCount: number;
  toCount: number;
  active: boolean;
  dashStart?: number;
}) {
  const n = Math.max(fromCount, toCount);
  const paths: { d: string; delay: number }[] = [];

  for (let i = 0; i < n; i++) {
    const fromY = targetY(Math.min(i, fromCount - 1), fromCount);
    const toY = targetY(Math.min(i, toCount - 1), toCount);
    paths.push({
      d: `M0 ${fromY} C 20 ${fromY} 20 ${toY} 40 ${toY}`,
      delay: dashStart + i * 0.3,
    });
  }

  return (
    <svg
      viewBox="0 0 40 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      style={{ color: active ? "#2dd4bf" : "#38445e" }}
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
          className={active ? "ts1-flow-dash" : ""}
          opacity={active ? 0.85 : 0.4}
          style={{ "--dash-delay": `${p.delay}s` } as CSSProperties}
        />
      ))}
    </svg>
  );
}
