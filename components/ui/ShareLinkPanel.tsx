"use client";

import { useEffect, useState } from "react";

export function ShareLinkPanel({
  path,
  compact = false,
}: {
  path: string;
  compact?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section
      className={`flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex flex-col gap-0.5">
        <h2
          className={`font-semibold text-emerald-900 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          Public link is on
        </h2>
        {!compact && (
          <p className="text-xs text-emerald-800/80">
            Anyone with this link can read this. Turn off sharing in edit mode
            to disable the link.
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </section>
  );
}
