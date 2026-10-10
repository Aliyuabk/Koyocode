"use client";

import { useState } from "react";

export default function CopyLinkButton({
  url,
  className = "",
}: {
  url?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const link =
      url ?? (typeof window !== "undefined" ? window.location.href : "");

    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Fallback for older browsers / non-secure contexts
      const el = document.createElement("textarea");
      el.value = link;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
      } catch {}
      document.body.removeChild(el);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ||
        "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
      }
    >
      {copied ? (
        <>
          <span className="text-emerald-600 dark:text-emerald-400">✓</span>
          Copied!
        </>
      ) : (
        <>🔗 Copy verification link</>
      )}
    </button>
  );
}