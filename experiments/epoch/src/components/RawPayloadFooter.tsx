/**
 * RawPayloadFooter — collapsed-by-default raw JSON footer shown at the bottom
 * of every agent page. Slim summary row (code icon, line/size count) with
 * Copy / Download / Expand JSON actions; expanding reveals the full
 * pretty-printed payload.
 */
import { useMemo, useState } from "react";
import { IconCode, IconCopy, IconCheck, IconDownload, IconChevronDown } from "@tabler/icons-react";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";

interface Props {
  payload: unknown;
  filename?: string;
  /** Optional muted chip next to the line/size count — for disclosing an
   * otherwise-easy-to-miss fact about the payload (e.g. an empty array). */
  note?: string;
}

export default function RawPayloadFooter({ payload, filename = "payload.json", note }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => JSON.stringify(payload, null, 2), [payload]);
  const lines = text.split("\n").length;
  const kb = new Blob([text]).size / 1024;

  const handleCopy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }, () => {});
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actionClass =
    "flex items-center gap-1.5 rounded-lg border border-[#1c2740] px-2.5 py-1.5 text-[11px] text-[#2dd4bf] hover:bg-[#0f2e2c] hover:border-[#2dd4bf]/40 hover:shadow-[0_0_0_1px_rgba(45,212,191,0.2)] transition-all";

  return (
    <div className={`${PANEL} mt-4`}>
      <div className="flex flex-wrap items-center gap-3 p-3">
        <IconCode size={15} className="text-[#5c6780]" />
        <span className="text-sm text-[#8b96ad]">Raw payload</span>
        <span className="font-mono text-[11px] text-[#5c6780]">
          {lines} lines · {kb.toFixed(1)} KB
        </span>
        {note && (
          <span className="rounded-full border border-[#1c2740] px-2.5 py-0.5 text-[11px] text-[#5c6780]">
            {note}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button className={actionClass} onClick={handleCopy}>
            {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
            Copy
          </button>
          <button className={actionClass} onClick={handleDownload}>
            <IconDownload size={13} />
            Download
          </button>
          <button className={actionClass} onClick={() => setExpanded((v) => !v)}>
            <IconChevronDown size={13} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Collapse" : "Expand JSON"}
          </button>
        </div>
      </div>
      {expanded && (
        <pre className="cockpit-track overflow-x-auto border-t border-[#1c2740] p-3 text-[11px] font-mono leading-relaxed text-[#8b96ad]" style={{ maxHeight: "420px", overflowY: "auto" }}>
          {text}
        </pre>
      )}
    </div>
  );
}
