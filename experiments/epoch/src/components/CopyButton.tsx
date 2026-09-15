/**
 * CopyButton — small hover-reveal copy-to-clipboard icon with a brief
 * "copied" check-mark confirmation. Used inside ArtifactBar / RawPayloadFooter
 * metadata items (parent must have the `group` class for hover-reveal to work).
 */
import { useState } from "react";
import { IconCopy, IconCheck } from "@tabler/icons-react";

export default function CopyButton({ value, size = 11 }: { value: string; size?: number }) {
  const [copied, setCopied] = useState(false);
  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      () => {},
    );
  };
  return (
    <button
      onClick={onCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-[#5c6780] hover:text-[#2dd4bf]"
      title="Copy"
    >
      {copied ? <IconCheck size={size} className="text-[#2dd4bf]" /> : <IconCopy size={size} />}
    </button>
  );
}
