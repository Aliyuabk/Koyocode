import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ExamSettingsForm from "@/components/admin/ExamSettingsForm";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!course) notFound();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, youtube_id, sort_order")
    .eq("course_id", course.id)
    .order("sort_order");

  const { data: settings } = await supabase
    .from("course_exam_settings")
    .select("passing_score, question_count, is_enabled")
    .eq("course_id", course.id)
    .maybeSingle();

  return (
    <div>
      {/* BREADCRUMB */}
      <Link
        href="/admin/courses"
        className="text-sm font-bold text-purple-700 transition hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
      >
        ← All courses
      </Link>

      {/* HEADER */}
      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-[#f1f5f9]">
            {course.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
            {lessons?.length ?? 0} lessons · {course.category} ·{" "}
            {course.is_published ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Published
              </span>
            ) : (
              <span className="font-bold text-amber-600 dark:text-amber-400">
                Draft
              </span>
            )}
          </p>
        </div>

        <Link
          href={`/courses/${course.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:bg-[#1b2742]"
        >
          View public page ↗
        </Link>
      </header>

      {/* EXAM SETTINGS */}
      <section className="mt-8">
        <ExamSettingsForm courseId={course.id} initial={settings ?? null} />
      </section>

      {/* LESSONS LIST */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-[#1f2a44]">
          <p className="text-sm font-extrabold text-slate-900 dark:text-[#f1f5f9]">
            Lessons
          </p>
          <span className="text-xs font-bold text-slate-500 dark:text-[#94a3b8]">
            {lessons?.length ?? 0}
          </span>
        </div>

        {!lessons || lessons.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-3xl">📚</p>
            <p className="mt-2 text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
              No lessons yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#94a3b8]">
              Add lessons via SQL import or the lessons admin page.
            </p>
          </div>
        ) : (
          <ul>
            {lessons.map((l, i) => (
              <li
                key={l.id}
                className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-0 hover:bg-slate-50 dark:border-[#1f2a44] dark:hover:bg-[#1b2742]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-xs font-black text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-[#cbd5e1]">
                  {l.title}
                </span>
                <span
                  className="shrink-0 text-xs text-slate-500 dark:text-[#94a3b8]"
                  title={l.youtube_id ? "Has video" : "No video"}
                >
                  {l.youtube_id ? "🎬" : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}