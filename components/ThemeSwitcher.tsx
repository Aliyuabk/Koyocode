"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme, type ThemeMode, type Accent } from "./ThemeProvider";

const modes: { key: ThemeMode; label: string; icon: string }[] = [
  { key: "light",  label: "Light",  icon: "☀️" },
  { key: "dark",   label: "Dark",   icon: "🌙" },
  { key: "system", label: "System", icon: "💻" },
];

const accents: { key: Accent; label: string; swatch: string }[] = [
  { key: "blue",    label: "Blue",    swatch: "#2563eb" },
  { key: "emerald", label: "Emerald", swatch: "#059669" },
  { key: "purple",  label: "Purple",  swatch: "#7c3aed" },
  { key: "rose",    label: "Rose",    swatch: "#e11d48" },
  { key: "amber",   label: "Amber",   swatch: "#d97706" },
];

export default function ThemeSwitcher() {
  const { mode, accent, setMode, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const modeIcon = mode === "dark" ? "🌙" : mode === "light" ? "☀️" : "💻";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        aria-label="Theme settings"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600 dark:hover:bg-slate-700"
      >
        <span>{modeIcon}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-blue-900/10 animate-slide-down dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Appearance
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-bold transition ${
                  mode === m.key
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <span className="text-lg">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <p className="mt-5 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Accent colour
          </p>
          <div className="mt-2 flex gap-2">
            {accents.map((a) => (
              <button
                key={a.key}
                onClick={() => setAccent(a.key)}
                aria-label={a.label}
                title={a.label}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-110 ${
                  accent === a.key
                    ? "ring-2 ring-slate-900 ring-offset-2 ring-offset-white dark:ring-slate-100 dark:ring-offset-slate-900"
                    : ""
                }`}
                style={{ backgroundColor: a.swatch }}
              >
                {accent === a.key && (
                  <span className="text-white drop-shadow">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Preference is saved on this device.
          </div>
        </div>
      )}
    </div>
  );
}