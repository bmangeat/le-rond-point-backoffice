"use client";

import { useState } from "react";

export default function CopyableLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponible (http non sécurisé) — l'input reste sélectionnable
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="input flex-1 font-mono text-xs"
      />
      <button
        type="button"
        onClick={copy}
        className="btn-ghost shrink-0 py-2.5 text-xs"
      >
        {copied ? "Copié ✓" : "Copier"}
      </button>
    </div>
  );
}
