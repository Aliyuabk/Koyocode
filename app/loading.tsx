"use client";

import { useEffect, useState } from "react";

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      setProgress(100);
      const t = window.setTimeout(() => setLoading(false), 250);
      return () => window.clearTimeout(t);
    }

    let value = 0;
    const interval = window.setInterval(() => {
      value = Math.min(value + Math.ceil(Math.random() * 13), 100);
      setProgress(value);

      if (value >= 100) {
        window.clearInterval(interval);
        window.setTimeout(() => setLoading(false), 450);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, []);

  if (!loading) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white animate-fade-in"
      aria-label="Loading KoyoCode"
      role="status"
    >
      <div className="relative h-28 w-28 overflow-hidden">
        <span className="absolute inset-0 flex items-center justify-center text-8xl font-black text-blue-100">
          K
        </span>
        <span
          className="absolute inset-0 flex items-center justify-center text-8xl font-black text-blue-700 transition-[clip-path] duration-200"
          style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }}
        >
          K
        </span>
      </div>

    </div>
  );
}