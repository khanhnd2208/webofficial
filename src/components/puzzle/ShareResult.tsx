'use client';

import { useState } from 'react';

interface ShareResultProps {
  shareText: string;
}

export function ShareResult({ shareText }: ShareResultProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4 space-y-3">
      <pre className="text-sm whitespace-pre-wrap font-mono text-foreground/90">{shareText}</pre>
      <button
        type="button"
        onClick={handleCopy}
        className="w-full py-2 rounded-full bg-accent text-background font-bold uppercase tracking-wider text-sm hover:opacity-90 active:scale-95"
      >
        {copied ? 'Đã copy!' : 'Copy kết quả'}
      </button>
    </div>
  );
}
