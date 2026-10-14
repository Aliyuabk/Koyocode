"use client";

import { useState, useEffect } from "react";
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
  const [visible, setVisible] = useState(false);

  // Show the floating button only after scrolling past the hero
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
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
    <>
      {/* FLOATING OPEN BUTTON (mobile only) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open lesson list"
        aria-expanded={open}
        className={`fixed z-50 flex items-center gap-2 rounded-full bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-2xl shadow-blue-700/40 transition-all duration-200 hover:bg-blue-800 lg:hidden dark:bg-blue-600 dark:hover:bg-blue-500 ${
          open || !visible
            ? "pointer-events-none scale-90 opacity-0"
            : "scale-100 opacity-100"
        }`}
        style={{
          bottom: "max(1.25rem, env(safe-area-inset-bottom))",
          right: "max(1.25rem, env(safe-area-inset-right))",
        }}
      >
        <svg
          width="18"
          height="18"
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
        Lessons
      </button>

      {/* BACKDROP + BOTTOM SHEET */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Bottom sheet */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lesson list"
          className={`absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-[#131c33] ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* Drag handle */}
          <div className="flex shrink-0 justify-center pt-3">
            <span className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-[#263048]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-[#1f2a44]">
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black text-slate-900 dark:text-[#f1f5f9]">
                {courseTitle}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-[#94a3b8]">
                {completedCount} of {lessons.length} completed · {courseProgress}%
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-[#94a3b8] dark:hover:bg-[#1b2742] dark:hover:text-[#f1f5f9]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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
                    className="flex items-center gap-3 px-5 py-4 transition active:bg-blue-100 dark:active:bg-[#1b2742]"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
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
                      <span className="shrink-0 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                        Now
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>

          {/* Footer */}
          <div className="shrink-0 border-t border-slate-100 px-5 py-3 dark:border-[#1f2a44]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition active:bg-slate-100 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}