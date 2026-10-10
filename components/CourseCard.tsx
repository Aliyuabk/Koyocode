import Link from "next/link";
import type { Course } from "@/lib/types";

export default function CourseCard({ course }: { course: Course }) {
  const isComingSoon = course.tag === "Coming soon";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 dark:border-[#1f2a44] dark:bg-[#131c33] dark:hover:border-blue-700">
      {/* HEADER STRIP */}
      <div className="relative border-b border-slate-100 bg-slate-50 p-5 dark:border-[#1f2a44] dark:bg-[#0e1526]">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black ${
              course.color ?? "bg-blue-100 text-blue-700"
            } dark:bg-[#1b2742] dark:text-blue-300`}
          >
            {course.icon}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              course.tag === "Coming soon"
                ? "bg-slate-200 text-slate-600 dark:bg-[#1b2742] dark:text-[#94a3b8]"
                : course.tag === "Popular"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
            }`}
          >
            {course.tag}
          </span>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
          {course.category}
        </p>
        <h3 className="mt-2 text-lg font-extrabold leading-snug text-slate-900 dark:text-[#f1f5f9]">
          {course.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-[#94a3b8]">
          {course.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500 dark:border-[#1f2a44] dark:text-[#94a3b8]">
          <span>◷ {course.duration ?? "TBD"}</span>
          <span>▤ {course.lessons_count || "Planned"} lessons</span>
          <span>◆ {course.level}</span>
        </div>

        <Link
          href={isComingSoon ? "#" : `/courses/${course.slug}`}
          aria-disabled={isComingSoon}
          className={`mt-5 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold transition ${
            isComingSoon
              ? "cursor-not-allowed border-slate-200 text-slate-400 dark:border-[#1f2a44] dark:text-[#64748b]"
              : "border-blue-100 text-blue-700 group-hover:bg-blue-700 group-hover:text-white dark:border-[#1f2a44] dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white"
          }`}
        >
          {isComingSoon ? "Coming soon" : "Explore course"}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}