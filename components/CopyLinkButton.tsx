"use client";

export default function CopyLinkButton() {
  return (
    <button
      type="button"
      onClick={() => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert("Verification link copied to clipboard");
      }}
      className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
    >
      🔗 Copy verification link
    </button>
  );
}