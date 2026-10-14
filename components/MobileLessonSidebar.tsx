"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type SidebarLesson = {
  id: string;
  slug: string;
  title: string;
  duration_minutes: number;
  completed: boolean;
};

export default function MobileLessonSidebar({
  courseSlug,
  courseTitle,
  lessons,
  currentLessonId,
  completedCount,
  courseProgress,
}: {
  courseSlug: string;
  courseTitle: string;
  lessons: SidebarLesson[];
  currentLessonId: string;
  completedCount: number;
  courseProgress: number;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative lg:hidden" ref={containerRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close lesson list" : "Open lesson list"}
        aria-expanded={open}
        className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:border-blue-600 dark:hover:bg-[#1b2742]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span>Lessons</span>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
          {completedCount}/{lessons.length}
        </span>
      </button>

      {/* DROPDOWN PANEL */}
      {open && (
        <>
          {/* Mobile-only dim backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[70] animate-backdrop bg-black/60 backdrop-blur-sm lg:hidden"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Lesson list"
            className="absolute right-0 top-full z-[80] mt-2 w-[calc(100vw-2.5rem)] max-w-sm animate-drawer-down overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/20 dark:border-[#1f2a44] dark:bg-[#131c33] lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-[#1f2a44]">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-900 dark:text-[#f1f5f9]">
                  {courseTitle}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-[#94a3b8]">
                  {completedCount} of {lessons.length} completed ·{" "}
                  {courseProgress}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-[#94a3b8] dark:hover:bg-[#1b2742]"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-slate-100 dark:bg-[#0e1526]">
              <div
                className="h-full bg-blue-600 transition-all duration-500 dark:bg-blue-500"
                style={{ width: `${courseProgress}%` }}
              />
            </div>

            {/* Lesson list */}
            <ol className="max-h-[60vh] overflow-y-auto overscroll-contain">
              {lessons.map((l, i) => {
                const isCurrent = l.id === currentLessonId;
                return (
                  <li
                    key={l.id}
                    className={`animate-list-item border-b border-slate-100 last:border-0 dark:border-[#1f2a44] ${
                      isCurrent ? "bg-blue-50 dark:bg-[#16233d]" : ""
                    }`}
                    style={{ animationDelay: `${i * 0.02}s` }}
                  >
                    <Link
                      href={`/courses/${courseSlug}/lessons/${l.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-blue-50 active:bg-blue-100 dark:hover:bg-[#1b2742] dark:active:bg-[#1b2742]"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                          l.completed
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : isCurrent
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500 dark:bg-[#1b2742] dark:text-[#64748b]"
                        }`}
                      >
                        {l.completed ? "✓" : String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-bold ${
                            isCurrent
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-slate-800 dark:text-[#e2e8f0]"
                          }`}
                        >
                          {l.title}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-[#94a3b8]">
                          {l.duration_minutes} min
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                          Now
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}