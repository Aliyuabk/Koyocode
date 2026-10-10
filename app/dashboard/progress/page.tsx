import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("progress")
    .select(
      `id, watched_percent, completed, updated_at,
       lesson:lessons ( title, slug, course:courses ( title, slug, icon, color ) )`
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-14 sm:px-8 animate-fade-up">
        <Link
          href="/dashboard"
          className="text-sm font-bold text-blue-700 hover:text-blue-900"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-black tracking-tight">
          Your progress
        </h1>
        <p className="mt-2 text-slate-600">
          Every lesson you&apos;ve started, in one place.
        </p>

        {(!rows || rows.length === 0) && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
            <p className="text-4xl">📈</p>
            <p className="mt-3 font-bold">Nothing here yet.</p>
            <Link
              href="/#courses"
              className="mt-4 inline-flex rounded-full bg-blue-700 px-6 py-3 font-bold text-white"
            >
              Start a course →
            </Link>
          </div>
        )}

        <ul className="mt-8 space-y-3">
          {(rows ?? []).map((r) => {
            const lesson = Array.isArray(r.lesson) ? r.lesson[0] : r.lesson;
            const course = lesson?.course
              ? Array.isArray(lesson.course) ? lesson.course[0] : lesson.course
              : null;
            return (
              <li
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-lg hover:shadow-blue-900/5"
              >
                <div className="flex items-center gap-4">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black ${course?.color ?? "bg-blue-100 text-blue-700"}`}>
                    {course?.icon ?? "📘"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{lesson?.title}</p>
                    <p className="truncate text-sm text-slate-500">{course?.title}</p>
                  </div>
                  <span className={`text-sm font-bold ${r.completed ? "text-emerald-600" : "text-blue-700"}`}>
                    {r.completed ? "✓ Done" : `${r.watched_percent}%`}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${r.completed ? "bg-emerald-500" : "bg-blue-600"}`}
                    style={{ width: `${r.watched_percent}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}