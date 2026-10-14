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
    <div ref={containerRef} className="relative">
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-label={open ? "Close lesson list" : "Open lesson list"}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-[#1f2a44] dark:bg-[#131c33] dark:text-[#cbd5e1] dark:hover:border-blue-600 dark:hover:bg-[#1b2742]"
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
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        <span className="hidden xs:inline">Lessons</span>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
          {completedCount}/{lessons.length}
        </span>
      </button>

      {/* DROPDOWN PANEL */}
      {open && (
        <div
          role="dialog"
          aria-label="Lesson list"
          className="absolute right-0 z-50 mt-2 flex max-h-[70vh] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/20 animate-drawer-in dark:border-[#1f2a44] dark:bg-[#131c33]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-[#1f2a44]">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-900 dark:text-[#f1f5f9]">
                {courseTitle}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-[#94a3b8]">
                {completedCount} of {lessons.length} · {courseProgress}%
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-[#94a3b8] dark:hover:bg-[#1b2742]"
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
          <div className="h-1 w-full shrink-0 bg-slate-100 dark:bg-[#0e1526]">
            <div
              className="h-full bg-blue-600 transition-all duration-500 dark:bg-blue-500"
              style={{ width: `${courseProgress}%` }}
            />
          </div>

          {/* Lesson list */}
          <ol className="flex-1 overflow-y-auto overscroll-contain">
            {lessons.map((l, i) => {
              const isCurrent = l.id === currentLessonId;
              return (
                <li
                  key={l.id}
                  className={`border-b border-slate-100 last:border-0 dark:border-[#1f2a44] ${
                    isCurrent ? "bg-blue-50 dark:bg-[#16233d]" : ""
                  }`}
                >
                  <Link
                    href={`/courses/${courseSlug}/lessons/${l.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-blue-50 dark:hover:bg-[#1b2742]"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
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
                      <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                        Now
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}