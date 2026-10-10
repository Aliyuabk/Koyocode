import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
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
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href="/admin"
          className="text-sm font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400"
        >
          ← Admin
        </Link>

        <h1 className="mt-4 text-3xl font-black tracking-tight dark:text-[#f1f5f9]">
          {course.title}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-[#94a3b8]">
          {lessons?.length ?? 0} lessons · {course.category}
        </p>

        <div className="mt-8">
          <ExamSettingsForm courseId={course.id} initial={settings ?? null} />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
          <p className="border-b border-slate-100 px-5 py-4 text-sm font-extrabold dark:border-[#1f2a44] dark:text-[#f1f5f9]">
            Lessons
          </p>
          <ul>
            {(lessons ?? []).map((l, i) => (
              <li
                key={l.id}
                className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-0 dark:border-[#1f2a44]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-xs font-black text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm font-bold dark:text-[#cbd5e1]">
                  {l.title}
                </span>
                <span className="text-xs text-slate-500 dark:text-[#94a3b8]">
                  {l.youtube_id ? "🎬" : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}