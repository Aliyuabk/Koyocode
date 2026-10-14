"use client";

export type LessonStep =
  | "watched"
  | "read"
  | "tried"
  | "answered"
  | "complete";

export default function LessonCompletionChecklist({
  steps,
}: {
  steps: Record<LessonStep, boolean>;
}) {
  const items: { key: LessonStep; label: string; optional?: boolean }[] = [
    { key: "watched", label: "Watched the video", optional: true },
    { key: "read", label: "Read the concepts" },
    { key: "tried", label: "Tried the code", optional: true },
    { key: "answered", label: "Answered the quick check", optional: true },
  ];

  const allDone = items
    .filter((i) => !i.optional)
    .every((i) => steps[i.key]) &&
    // Require at least 2 of the optional ones
    items.filter((i) => i.optional && steps[i.key]).length >= 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
      <h3 className="text-sm font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
        Lesson checklist
      </h3>

      <ul className="mt-4 space-y-2">
        {items.map((item) => {
          const done = steps[item.key];
          return (
            <li
              key={item.key}
              className={`flex items-center gap-3 text-sm ${
                done
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-slate-600 dark:text-[#94a3b8]"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  done
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-400 dark:bg-[#1b2742] dark:text-[#64748b]"
                }`}
              >
                {done ? "✓" : "○"}
              </span>
              <span className={done ? "line-through opacity-70" : ""}>
                {item.label}
              </span>
              {item.optional && !done && (
                <span className="text-xs text-slate-400 dark:text-[#64748b]">
                  (optional)
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}