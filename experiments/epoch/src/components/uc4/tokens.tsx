/**
 * uc4/tokens.tsx — the small shared vocabulary every UC4 page draws on.
 *
 * Deliberately not a Badge/MetricCard/DataTable kit: the codebase's page-local
 * PANEL/CARD + style-map convention stays. What is shared here is the
 * *meaning* of tokens (via lib/uc4Legend.ts), not page layout.
 */
import { useState } from "react";
import { IconChevronDown, IconInfoCircle } from "@tabler/icons-react";
import type { LegendEntry } from "../../lib/uc4Legend";
import { TONE_CLASS, legend } from "../../lib/uc4Legend";

// ── StatusChip — a single token rendered with its tone + a title tooltip ──────

export function StatusChip({
  dict,
  token,
}: {
  dict: Record<string, LegendEntry>;
  token: string | undefined | null;
}) {
  const entry = legend(dict, token);
  return (
    <span
      title={entry.meaning}
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${TONE_CLASS[entry.tone]}`}
    >
      {entry.label || "—"}
    </span>
  );
}

// ── StandardChip — E1..E5, one fixed hue each so a standard reads the same

// color on every page. ──────────────────────────────────────────────────────

const STANDARD_HUES: Record<string, string> = {
  E1: "border-[#2dd4bf]/40 bg-[#0f2e2c] text-[#2dd4bf]", // climate
  E2: "border-[#5b8def]/40 bg-[#101a2e] text-[#5b8def]", // pollution
  E3: "border-[#9b8cf2]/40 bg-[#1a1730] text-[#9b8cf2]", // water & marine
  E4: "border-[#d9a95c]/40 bg-[#2a2013] text-[#d9a95c]", // biodiversity
  E5: "border-[#d97a6c]/40 bg-[#2a1613] text-[#d97a6c]", // circular economy
};

export function StandardChip({ standard }: { standard: string | undefined | null }) {
  if (!standard) return <span className="text-[#5c6780]">—</span>;
  const cls = STANDARD_HUES[standard] ?? "border-[#2a3a5c] bg-[#111a2e] text-[#8b96ad]";
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${cls}`}
    >
      {standard}
    </span>
  );
}

// ── highlightDrRefs — inline highlighter for DR ids / paragraph / section

// refs inside prose fields (change_description, rationale, siemens_impact,
// persona_divergence, executive_summary, ...). Modeled on D2Page.tsx's
// highlightClaimRefs. ────────────────────────────────────────────────────────

const DR_REF_PATTERN =
  /(\bE[1-5]-\d+[a-z]?\b|\bESRS E[1-5]\b|\bAR\s?\d+\b|\bparas?\.?\s?\d+(?:[-–]\d+)?(?:\([a-z]\))?\b|\b\d\.\d(?:\.\d)?\b)/g;

export function highlightDrRefs(text: string) {
  const parts = text.split(DR_REF_PATTERN);
  return parts.map((part, index) =>
    part && DR_REF_PATTERN.test(part) ? (
      <span key={index} className="font-mono text-[#2dd4bf]">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

// ── LegendStrip — the visual counterpart of the CLI's _render_legend table:

// a collapsible row of "label — meaning" pairs. ───────────────────────────────

export function LegendStrip({
  dict,
  title,
}: {
  dict: Record<string, LegendEntry>;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const entries = Object.values(dict);
  return (
    <div className="mt-4 rounded-xl border border-[#1c2740] bg-[#0d1424]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 p-3 text-left"
      >
        <IconInfoCircle size={14} className="text-[#5c6780]" />
        <span className="text-[12.5px] text-[#8b96ad]">{title}</span>
        <IconChevronDown
          size={13}
          className={`ml-auto text-[#5c6780] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="grid gap-x-6 gap-y-1.5 border-t border-[#1c2740] p-3 sm:grid-cols-2">
          {entries.map((entry) => (
            <div key={entry.label} className="flex items-baseline gap-2 text-[11.5px]">
              <span
                className={`inline-flex flex-shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] ${TONE_CLASS[entry.tone]}`}
              >
                {entry.label}
              </span>
              <span className="text-[#5c6780]">{entry.meaning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
