/**
 * FlowCanvas — the shared Stage-2 template. Ranks grow horizontally (few, 2-4
 * columns); parallel agents within a rank grow vertically (the axis that
 * scales). Adding a rank is adding two grid columns; nothing about agent
 * count or names is baked into the layout.
 */
import { Fragment, type ReactNode } from "react";
import FlowConnector from "./FlowConnector";
import FlowNode, { type FlowNodeConfig } from "./FlowNode";

export interface FlowRank {
  caption: string;
  nodes: FlowNodeConfig[];
}

export default function FlowCanvas({
  ranks,
  onSelectNode,
  gateSlot,
}: {
  ranks: FlowRank[];
  onSelectNode?: (key: string) => void;
  /** Optional extra rank rendered after the last real rank (the human gate). */
  gateSlot?: ReactNode;
}) {
  let dashCursor = 0;
  const columns = ranks
    .map(() => "minmax(150px,1fr)")
    .join(" 46px ")
    .concat(gateSlot ? " 46px minmax(140px,0.9fr)" : "");

  return (
    <div className="cockpit-track overflow-x-auto">
      <div className="grid items-stretch gap-0" style={{ gridTemplateColumns: columns, minWidth: "fit-content" }}>
        {ranks.map((rank, ri) => {
          const dense = rank.nodes.length >= 5;
          const nextCount = ri < ranks.length - 1 ? ranks[ri + 1].nodes.length : gateSlot ? 1 : null;
          const delayStart = dashCursor;
          if (nextCount !== null) dashCursor += Math.max(rank.nodes.length, nextCount) * 0.3;

          return (
            <Fragment key={ri}>
              <div className="flex flex-col px-2">
                <div className="mb-2 text-[9.5px] font-medium uppercase tracking-wide text-[#5c6780]">
                  {rank.caption}
                </div>
                <div className={`flex flex-1 flex-col justify-center ${dense ? "gap-1.5" : "gap-2"}`}>
                  {rank.nodes.map((node) => (
                    <FlowNode
                      key={node.key}
                      node={node}
                      dense={dense}
                      onClick={onSelectNode ? () => onSelectNode(node.key) : undefined}
                    />
                  ))}
                </div>
              </div>
              {nextCount !== null && (
                <div className="self-stretch" style={{ minHeight: 80 }}>
                  <FlowConnector
                    fromCount={rank.nodes.length}
                    toCount={nextCount}
                    active={rank.nodes.some((n) => n.state !== "pending")}
                    dashStart={delayStart}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
        {gateSlot && (
          <div className="flex flex-col px-2">
            <div className="mb-2 text-[9.5px] font-medium uppercase tracking-wide text-[#5c6780]">GATE</div>
            <div className="flex flex-1 flex-col justify-center">{gateSlot}</div>
          </div>
        )}
      </div>
    </div>
  );
}
