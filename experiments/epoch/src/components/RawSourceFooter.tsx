/**
 * RawSourceFooter — collapsed source-file access matching the raw JSON footer
 * used on agent pages, without serializing source text as JSON.
 */
import { useMemo, useState } from "react";
import {
  IconCheck,
  IconChevronDown,
  IconCode,
  IconCopy,
  IconDownload,
} from "@tabler/icons-react";

const PANEL = "rounded-xl border border-[#1c2740] bg-[#0d1424]";

interface Props {
  source: string;
  filename: string;
  label: string;
  language: string;
  description?: string;
  mediaType?: string;
}

export default function RawSourceFooter({
  source,
  filename,
  label,
  language,
  description,
  mediaType = "text/plain;charset=utf-8",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const metrics = useMemo(
    () => ({
      lines: source.length === 0 ? 0 : source.split("\n").length - (source.endsWith("\n") ? 1 : 0),
      kb: new Blob([source]).size / 1024,
    }),
    [source],
  );

  const handleCopy = () => {
    navigator.clipboard?.writeText(source).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      () => {},
    );
  };

  const handleDownload = () => {
    const blob = new Blob([source], { type: mediaType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const actionClass =
    "flex items-center gap-1.5 rounded-lg border border-[#1c2740] px-2.5 py-1.5 text-[11px] text-[#2dd4bf] transition-all hover:border-[#2dd4bf]/40 hover:bg-[#0f2e2c] hover:shadow-[0_0_0_1px_rgba(45,212,191,0.2)]";

  return (
    <div className={PANEL}>
      <div className="flex flex-wrap items-center gap-3 p-3">
        <IconCode size={15} className="text-[#5c6780]" />
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-sm text-[#8b96ad]">{label}</span>
            <span className="font-mono text-[11px] text-[#5c6780]">
              {filename} · {metrics.lines} lines · {metrics.kb.toFixed(1)} KB
            </span>
          </div>
          {description && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-[#5c6780]">
              {description}
            </p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className={actionClass} onClick={handleCopy}>
            {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
            Copy
          </button>
          <button className={actionClass} onClick={handleDownload}>
            <IconDownload size={13} />
            Download
          </button>
          <button
            className={actionClass}
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            <IconChevronDown
              size={13}
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
            {expanded ? "Collapse" : `Expand ${language}`}
          </button>
        </div>
      </div>
      {expanded && (
        <pre
          className="cockpit-track overflow-x-auto border-t border-[#1c2740] p-3 font-mono text-[11px] leading-relaxed text-[#8b96ad]"
          style={{ maxHeight: "520px", overflowY: "auto" }}
        >
          {source}
        </pre>
      )}
    </div>
  );
}
