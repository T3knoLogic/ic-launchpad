import { useState } from "react";

type CopyButtonProps = {
  text: string;
  label?: string;
  className?: string;
};

export function CopyButton({ text, label = "Copy", className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      setCopied(false);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`text-sm font-mono px-2 py-1 rounded border border-ic-border hover:border-ic-green/50 hover:bg-ic-green/10 transition ${className}`}
      title="Copy to clipboard"
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}
