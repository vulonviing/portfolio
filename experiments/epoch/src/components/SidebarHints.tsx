import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconX } from "@tabler/icons-react";
import type { SidebarMode } from "./SidebarTour";

interface SidebarHintsProps {
  mode: SidebarMode;
  onDismissAll: () => void;
}

interface Hint {
  id: string;
  target: string;
  text: string;
}

interface PositionedHint extends Hint {
  top: number;
  left: number;
}

const SHARED_HINTS: Hint[] = [
  { id: "usecase", target: '[data-tour="usecase"]', text: "Switch between the five published use-case runs." },
  { id: "starting-points", target: '[data-tour="starting-points"]', text: "Foundations explains the model; Registry shows the request that starts the run." },
  { id: "stage-switch", target: '[data-tour="stage-switch"]', text: "Move between scope and evidence setup (Stage 1) and the output chain (Stage 2)." },
];

const MODE_HINTS: Record<SidebarMode, Hint[]> = {
  pipeline: [
    { id: "stage1-overview", target: '[data-tour="stage1-overview"]', text: "See the complete Stage 1 flow before opening individual artifacts." },
    { id: "stage1-agents", target: '[data-tour="stage1-agents"]', text: "Open each agent artifact and the human approvals that lock the evidence boundary." },
    { id: "stage2-handoff", target: '[data-tour="stage2-handoff"]', text: "After TS1 and the final Stage 1 artifact, continue into the selected topology." },
  ],
  stage2: [
    { id: "stage2-content", target: '[data-tour="stage2-content"]', text: "Start with the topology overview, then open its output agents and final deliverable." },
  ],
};

export default function SidebarHints({ mode, onDismissAll }: SidebarHintsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [positions, setPositions] = useState<PositionedHint[]>([]);
  const hints = [...SHARED_HINTS, ...MODE_HINTS[mode]].filter((hint) => !dismissed.has(hint.id));

  useEffect(() => {
    if (hints.length === 0) onDismissAll();
  }, [hints.length, onDismissAll]);

  useLayoutEffect(() => {
    let animationFrame = 0;
    const measure = () => {
      animationFrame = window.requestAnimationFrame(() => {
        const visible = hints.flatMap((hint) => {
          const target = document.querySelector<HTMLElement>(hint.target);
          if (!target) return [];
          const rect = target.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) return [];
          return [{
            ...hint,
            top: Math.max(8, rect.top),
            left: Math.max(8, Math.min(window.innerWidth - 244, rect.right + 12)),
          }];
        });
        visible.sort((left, right) => left.top - right.top);
        const cardStep = 82;
        let cursor = 8;
        const stacked = visible.map((hint) => {
          const positioned = { ...hint, top: Math.max(hint.top, cursor) };
          cursor = positioned.top + cardStep;
          return positioned;
        });
        const overflow = Math.max(0, cursor - cardStep + 74 - (window.innerHeight - 8));
        setPositions(stacked.map((hint) => ({ ...hint, top: Math.max(8, hint.top - overflow) })));
      });
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [mode, dismissed]);

  if (hints.length === 0) return null;

  return createPortal(
    <div aria-label="Sidebar guide notes">
      {positions.map((hint) => (
        <button
          type="button"
          key={hint.id}
          onClick={() => setDismissed((current) => new Set(current).add(hint.id))}
          className="fixed z-[70] flex w-[236px] items-start gap-2 rounded-xl border border-[#2dd4bf]/45 bg-[#0d1424] px-3 py-2.5 text-left shadow-[0_12px_36px_rgba(0,0,0,0.42)] transition-all hover:border-[#2dd4bf] hover:bg-[#111a2e] motion-reduce:transition-none"
          style={{ top: hint.top, left: hint.left }}
          aria-label={`${hint.text} Dismiss note`}
        >
          <span className="mt-1 h-2 w-2 flex-none rounded-full bg-[#2dd4bf] shadow-[0_0_10px_rgba(45,212,191,0.7)]" />
          <span className="flex-1 text-[11.5px] leading-relaxed text-[#c3cbdd]">{hint.text}</span>
          <IconX size={13} className="mt-0.5 flex-none text-[#5c6780]" />
        </button>
      ))}
    </div>,
    document.body,
  );
}
