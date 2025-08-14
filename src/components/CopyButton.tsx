"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function onCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }
  return (
    <button onClick={onCopy} className="h-8 px-3 text-xs rounded-md border border-black/10 dark:border-white/10">
      {copied ? "Скопировано" : "Copy"}
    </button>
  );
}





