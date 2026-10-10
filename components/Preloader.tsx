"use client";

import { useEffect, useState } from "react";

export default function Preloader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const delay = reducedMotion ? 200 : 900;
    const t = window.setTimeout(() => setLoading(false), delay);
    return () => window.clearTimeout(t);
  }, []);

  if (!loading) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white animate-fade-in dark:bg-slate-950"
      aria-label="Loading KoyoCode"
      role="status"
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-3xl font-black text-white shadow-lg shadow-blue-700/30 dark:bg-blue-600"
        style={{
          animation: "loader-bounce 0.9s cubic-bezier(0.28, 0.84, 0.42, 1) infinite",
        }}
      >
        K
      </span>
    </div>
  );
}