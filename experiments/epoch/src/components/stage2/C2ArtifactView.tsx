/**
 * C2ArtifactView — Coalition Synthesis Coordinator (Coalition, UC3).
 *
 * C2 is the first agent to see every division's C1 data-volume report
 * together. This view shows the consolidated group total against D3's
 * independent cross-check, which divisions (if any) have thin data, and the
 * FY2027 readiness assessment.
 */
import {
  IconAlertTriangle,
  IconGitMerge,
  IconScale,
  IconShieldCheck,
} from "@tabler/icons-react";
import { MASK, formatMaskedNumber, type MaskedNumber } from "../../lib/maskedValues";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

export interface C2Payload {
  registry_id?: string;
  portfolio_total_t?: MaskedNumber;
  deterministic_portfolio_total_t?: MaskedNumber;
  thin_data_divisions?: string[];
  data_volume_coverage_note?: string;
  readiness_assessment?: string;
  carried_caveats?: string[];
}

function formatTons(value: MaskedNumber | undefined): string {
  return `${formatMaskedNumber(value, { maximumFractionDigits: 1 })} t`;
}

export default function C2ArtifactView({ payload }: { payload: C2Payload }) {
  const portfolioTotal = payload.portfolio_total_t;
  const detTotal = payload.deterministic_portfolio_total_t;
  const thinData = payload.thin_data_divisions ?? [];
  const caveats = payload.carried_caveats ?? [];
  const delta =
    typeof portfolioTotal === "number" && typeof detTotal === "number"
      ? Math.abs(portfolioTotal - detTotal)
      : undefined;
  const comparisonAvailable = typeof delta === "number";
  const matches = comparisonAvailable && delta < 0.01;

  return (
    <div className="space-y-4">
      <section className={`${PANEL} flex flex-wrap items-center gap-3 p-4`}>
        <div className="flex items-center gap-2">
          <IconGitMerge size={17} className="text-[#2dd4bf]" />
          <h2 className="text-sm font-medium text-[#e9eef7]">Coalition consolidation</h2>
        </div>
        {thinData.length > 0 ? (
          <span className="rounded-full border border-[#d97a6c]/45 bg-[#2d1818] px-2.5 py-1 font-mono text-[10px] text-[#d97a6c]">
            {MASK} thin-data
          </span>
        ) : (
          <span className="rounded-full border border-[#2dd4bf]/40 bg-[#0f2e2c] px-2.5 py-1 font-mono text-[10px] text-[#2dd4bf]">
            all divisions adequate
          </span>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={`${CARD} p-4`}>
          <div className="flex items-center gap-2 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
            <IconScale size={13} />
            Consolidated portfolio total
          </div>
          <div className="mt-1.5 font-mono text-[22px] font-semibold text-[#e9eef7]">
            {formatTons(portfolioTotal)}
            <span className="ml-1.5 text-[12px] font-normal text-[#5c6780]">CO₂e</span>
          </div>
          <div className="mt-2 text-[10.5px] text-[#8b96ad]">
            Summed by C2 from every division's reported sub-total.
          </div>
        </div>

        <div className={`${CARD} p-4 ${comparisonAvailable ? (matches ? "border-[#2dd4bf]/25" : "border-[#d9a95c]/30") : ""}`}>
          <div className="flex items-center gap-2 text-[9.5px] uppercase tracking-wide text-[#5c6780]">
            <IconShieldCheck size={13} />
            D3 deterministic cross-check
          </div>
          <div className="mt-1.5 font-mono text-[22px] font-semibold text-[#e9eef7]">
            {formatTons(detTotal)}
            <span className="ml-1.5 text-[12px] font-normal text-[#5c6780]">CO₂e</span>
          </div>
          <div
            className={`mt-2 text-[10.5px] ${comparisonAvailable ? (matches ? "text-[#2dd4bf]" : "text-[#d9a95c]") : "text-[#5c6780]"}`}
          >
            {!comparisonAvailable
              ? "Comparison masked in the public snapshot."
              : matches
              ? "Matches the consolidated total."
              : `Diverges by ${formatTons(delta)} from the consolidated total.`}
          </div>
        </div>
      </div>

      {thinData.length > 0 && (
        <div className={`${CARD} border-[#d97a6c]/35`}>
          <div className="flex items-center gap-2 border-b border-[#d97a6c]/25 px-4 py-2.5">
            <IconAlertTriangle size={14} className="text-[#d97a6c]" />
            <h3 className="text-[12px] font-medium text-[#e9eef7]">Thin-data divisions</h3>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {thinData.map((division) => (
              <span
                key={division}
                className="rounded-md border border-[#d97a6c]/40 bg-[#2d1818] px-2.5 py-1 font-mono text-[11px] text-[#d97a6c]"
              >
                {division}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={CARD}>
        <div className="border-b border-[#1c2740] px-4 py-2.5 text-[12px] font-medium text-[#e9eef7]">
          Data-volume coverage
        </div>
        <p className="p-4 text-[12.5px] leading-relaxed text-[#c4cddd]">
          {payload.data_volume_coverage_note || "—"}
        </p>
      </div>

      <div className={`${CARD} border-[#2dd4bf]/20 bg-[#0f2e2c]/30`}>
        <div className="border-b border-[#2dd4bf]/20 px-4 py-2.5 text-[12px] font-medium text-[#e9eef7]">
          FY2027 readiness assessment
        </div>
        <p className="p-4 text-[13px] leading-[1.8] text-[#c4cddd]">
          {payload.readiness_assessment || "—"}
        </p>
      </div>

      {caveats.length > 0 && (
        <div className={`${CARD} border-[#d9a95c]/25`}>
          <div className="flex items-center gap-2 border-b border-[#d9a95c]/20 px-4 py-2.5">
            <IconAlertTriangle size={14} className="text-[#d9a95c]" />
            <h3 className="text-[12px] font-medium text-[#e9eef7]">Portfolio-level caveats</h3>
          </div>
          <ul className="space-y-2 p-4">
            {caveats.map((item, index) => (
              <li
                key={index}
                className="rounded-lg border border-[#d9a95c]/20 bg-[#2a2013]/35 p-3 text-[11.5px] leading-relaxed text-[#aeb8cb]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
