import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconArrowLeft, IconArrowRight, IconX } from "@tabler/icons-react";

export type SidebarMode = "pipeline" | "stage2";

interface SidebarTourProps {
  mode: SidebarMode;
  setMode: (mode: SidebarMode) => void;
}

interface TourStep {
  id: string;
  mode: SidebarMode;
  target: string;
  title: string;
  body: string;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const STORAGE_KEY = "epoch:onboarding:v1";

const STEPS: TourStep[] = [
  {
    id: "usecase",
    mode: "pipeline",
    target: '[data-tour="usecase"]',
    title: "Choose a use case",
    body: "Switch between UC1–UC4 here. Each selection opens that use case's published registry entry and complete example run.",
  },
  {
    id: "starting-points",
    mode: "pipeline",
    target: '[data-tour="starting-points"]',
    title: "Orient yourself first",
    body: "Foundations explains EPOCH's agents, gates, memory, and topology vocabulary. Registry shows the request that starts the pipeline.",
  },
  {
    id: "stage-switch",
    mode: "pipeline",
    target: '[data-tour="stage-switch"]',
    title: "Two stages, two jobs",
    body: "Stage 1 establishes the approved scope and evidence. Stage 2 shows the selected topology and the resulting output chain.",
  },
  {
    id: "stage1-overview",
    mode: "pipeline",
    target: '[data-tour="stage1-overview"]',
    title: "See Stage 1 at a glance",
    body: "The overview presents the complete setup flow. Use it before opening individual artifacts when you want the big picture.",
  },
  {
    id: "stage1-agents",
    mode: "pipeline",
    target: '[data-tour="stage1-agents"]',
    title: "Open every agent artifact",
    body: "Each row opens one agent's published page. Approval entries mark the human decisions that lock the pipeline's evidence boundary.",
  },
  {
    id: "stage2-handoff",
    mode: "pipeline",
    target: '[data-tour="stage2-handoff"]',
    title: "Continue after TS1",
    body: "TS1 selects the output topology. Use this handoff after the final Stage 1 artifact to move into the selected Stage 2 flow.",
  },
  {
    id: "stage2-content",
    mode: "stage2",
    target: '[data-tour="stage2-content"]',
    title: "Inspect the result chain",
    body: "Stage 2 overview shows the chosen execution shape. The agent pages below contain the interpretations, reconciliation, and final deliverable.",
  },
];

function completedBefore(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "complete";
  } catch {
    return false;
  }
}

function rememberCompletion(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "complete");
  } catch {
    // The guide still works when storage is unavailable; it will reopen next visit.
  }
}

export default function SidebarTour({ mode, setMode }: SidebarTourProps) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const originalMode = useRef<SidebarMode>(mode);
  const dialogRef = useRef<HTMLDivElement>(null);
  const initialCheckDone = useRef(false);
  const step = STEPS[stepIndex];

  const start = useCallback(() => {
    originalMode.current = mode;
    setStepIndex(0);
    setOpen(true);
  }, [mode]);

  const close = useCallback(() => {
    rememberCompletion();
    setOpen(false);
    setRect(null);
    setMode(originalMode.current);
  }, [setMode]);

  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;
    if (!completedBefore()) start();
  }, [start]);

  useEffect(() => {
    if (!open) return;
    setMode(step.mode);
  }, [open, setMode, step.mode]);

  useLayoutEffect(() => {
    if (!open) return;

    let animationFrame = 0;
    let settleTimer = 0;

    const measure = (scrollTarget = false) => {
      const target = document.querySelector<HTMLElement>(step.target);
      if (!target) {
        setRect(null);
        return;
      }
      if (scrollTarget) target.scrollIntoView({ block: "center", inline: "nearest" });
      animationFrame = window.requestAnimationFrame(() => {
        const targetRect = target.getBoundingClientRect();
        const padding = 6;
        const top = Math.max(8, targetRect.top - padding);
        const bottom = Math.min(window.innerHeight - 8, targetRect.bottom + padding);
        setRect({
          top,
          left: Math.max(8, targetRect.left - padding),
          width: Math.min(window.innerWidth - 16, targetRect.width + padding * 2),
          height: Math.max(28, bottom - top),
        });
      });
    };

    settleTimer = window.setTimeout(() => measure(true), 70);
    const remeasure = () => measure(false);
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, true);
    return () => {
      window.clearTimeout(settleTimer);
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, true);
    };
  }, [open, step.target, step.mode]);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft" && stepIndex > 0) setStepIndex((value) => value - 1);
      if (event.key === "ArrowRight") {
        if (stepIndex < STEPS.length - 1) setStepIndex((value) => value + 1);
        else close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open, stepIndex]);

  if (!open) return null;

  const cardWidth = Math.min(360, window.innerWidth - 32);
  const cardLeft = rect
    ? Math.min(window.innerWidth - cardWidth - 16, rect.left + rect.width + 18)
    : Math.min(224, window.innerWidth - cardWidth - 16);
  const cardTop = rect
    ? Math.max(16, Math.min(window.innerHeight - 330, rect.top))
    : Math.max(16, (window.innerHeight - 300) / 2);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[80] cursor-default" aria-hidden="true" />
      {rect && (
        <div
          className="pointer-events-none fixed z-[90] rounded-xl border-2 border-[#2dd4bf] shadow-[0_0_0_9999px_rgba(2,6,16,0.78),0_0_30px_rgba(45,212,191,0.32)] transition-all duration-200 motion-reduce:transition-none"
          style={rect}
          aria-hidden="true"
        />
      )}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="epoch-tour-title"
        tabIndex={-1}
        className="fixed z-[100] rounded-2xl border border-[#2dd4bf]/45 bg-[#0d1424] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.58)] outline-none"
        style={{ width: cardWidth, left: Math.max(16, cardLeft), top: cardTop }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2dd4bf]">
              EPOCH guide · {stepIndex + 1}/{STEPS.length}
            </div>
            <h2 id="epoch-tour-title" className="mt-2 text-[17px] font-semibold text-[#e9eef7]">
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1.5 text-[#5c6780] transition-colors hover:bg-[#111a2e] hover:text-[#e9eef7]"
            aria-label="Skip guide"
          >
            <IconX size={17} />
          </button>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-[#aeb8cb]">{step.body}</p>

        <div className="mt-5 flex gap-1.5" aria-hidden="true">
          {STEPS.map((item, index) => (
            <span
              key={item.id}
              className={`h-1 flex-1 rounded-full ${index <= stepIndex ? "bg-[#2dd4bf]" : "bg-[#1c2740]"}`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={close}
            className="mr-auto text-[11px] text-[#69758e] transition-colors hover:text-[#e9eef7]"
          >
            Skip guide
          </button>
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex((value) => value - 1)}
              className="flex items-center gap-1 rounded-lg border border-[#1c2740] px-3 py-2 text-xs text-[#8b96ad] transition-colors hover:bg-[#111a2e] hover:text-[#e9eef7]"
            >
              <IconArrowLeft size={14} /> Back
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (stepIndex === STEPS.length - 1) close();
              else setStepIndex((value) => value + 1);
            }}
            className="flex items-center gap-1 rounded-lg bg-[#2dd4bf] px-3.5 py-2 text-xs font-semibold text-[#052220] transition-colors hover:bg-[#5ee0cf]"
          >
            {stepIndex === STEPS.length - 1 ? "Finish" : "Next"}
            {stepIndex < STEPS.length - 1 && <IconArrowRight size={14} />}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
