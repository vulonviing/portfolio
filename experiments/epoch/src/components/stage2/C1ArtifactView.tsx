/**
 * C1ArtifactView — Divisional Attestor (Coalition, UC3).
 *
 * One card per division. Each division's data-volume report was produced by
 * an isolated LLM call that saw only that division's D3 rows — no division's
 * card here was ever visible to another division's call. The division set
 * is whatever C1 found in D3's payload, not a fixed count.
 */
import { IconAlertTriangle, IconBuildingFactory2, IconCheck, IconX } from "@tabler/icons-react";
import { MASK, formatMaskedNumber, type MaskedNumber } from "../../lib/maskedValues";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";
const CARD = "rounded-lg border border-[#1c2740] bg-[#111a2e]";

export interface DivisionAttestation {
  division: string;
  subtotal_t: MaskedNumber;
  years: string[];
  n_rows: MaskedNumber;
  data_volume_status: "adequate" | "thin";
  narrative: string;
  provenance_note: string;
  carried_caveats: string[];
}

export interface C1Payload {
  registry_id?: string;
  rows?: DivisionAttestation[];
}

function StatusChip({ status }: { status: DivisionAttestation["data_volume_status"] }) {
  const adequate = status === "adequate";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-medium ${
        adequate
          ? "border-[#2dd4bf]/40 bg-[#0f2e2c] text-[#2dd4bf]"
          : "border-[#d97a6c]/45 bg-[#2d1818] text-[#d97a6c]"
      }`}
    >
      {adequate ? <IconCheck size={12} /> : <IconX size={12} />}
      {status}
    </span>
  );
}

function DivisionCard({ row }: { row: DivisionAttestation }) {
  return (
    <section className={`${PANEL} min-w-0`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1c2740] p-4">
        <div className="flex items-center gap-2.5">
          <IconBuildingFactory2 size={17} className="text-[#8b96ad]" />
          <div>
            <div className="text-[15px] font-medium text-[#e9eef7]">{row.division}</div>
            <div className="mt-0.5 text-[10.5px] text-[#5c6780]">
              {row.years.join(", ") || "no years"} · {row.n_rows} row(s)
            </div>
          </div>
        </div>
        <StatusChip status={row.data_volume_status} />
      </div>

      <div className="space-y-4 p-4">
        <div className={`${CARD} p-4`}>
          <div className="text-[9.5px] uppercase tracking-wide text-[#5c6780]">
            Reported sub-total
          </div>
          <div className="mt-1.5 font-mono text-[22px] font-semibold text-[#e9eef7]">
            {formatMaskedNumber(row.subtotal_t, { maximumFractionDigits: 1 })}
            <span className="ml-1.5 text-[12px] font-normal text-[#5c6780]">t CO₂e</span>
          </div>
        </div>

        <div className={CARD}>
          <div className="border-b border-[#1c2740] px-4 py-2.5 text-[12px] font-medium text-[#e9eef7]">
            Narrative
          </div>
          <p className="p-4 text-[12.5px] leading-relaxed text-[#c4cddd]">{row.narrative}</p>
        </div>

        <div className={CARD}>
          <div className="border-b border-[#1c2740] px-4 py-2.5 text-[12px] font-medium text-[#e9eef7]">
            Provenance note
          </div>
          <p className="p-4 text-[12.5px] leading-relaxed text-[#c4cddd]">{row.provenance_note}</p>
        </div>

        {row.carried_caveats.length > 0 && (
          <div className={`${CARD} border-[#d9a95c]/25`}>
            <div className="flex items-center gap-2 border-b border-[#d9a95c]/20 px-4 py-2.5">
              <IconAlertTriangle size={14} className="text-[#d9a95c]" />
              <h3 className="text-[12px] font-medium text-[#e9eef7]">Caveats</h3>
            </div>
            <ul className="space-y-2 p-4">
              {row.carried_caveats.map((item, index) => (
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
    </section>
  );
}

export default function C1ArtifactView({ payload }: { payload: C1Payload }) {
  const rows = payload.rows ?? [];

  if (rows.length === 0) {
    return (
      <div className={`${PANEL} p-8 text-center text-sm text-[#5c6780]`}>
        C1 payload contains no division data-volume reports.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className={`${PANEL} flex flex-wrap items-center gap-3 p-4`}>
        <div className="flex items-center gap-2">
          <IconBuildingFactory2 size={17} className="text-[#2dd4bf]" />
          <h2 className="text-sm font-medium text-[#e9eef7]">Divisional data-volume reports</h2>
        </div>
        <span className="rounded-full border border-[#1c2740] px-2.5 py-1 font-mono text-[10px] text-[#8b96ad]">
          {MASK} divisions
        </span>
        <span className="ml-auto text-[11px] text-[#5c6780]">
          Each division was assessed by an independent call — no division saw another's data.
        </span>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((row) => (
          <DivisionCard key={row.division} row={row} />
        ))}
      </div>
    </div>
  );
}
