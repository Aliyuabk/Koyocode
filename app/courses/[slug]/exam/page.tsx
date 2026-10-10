import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExamRunner from "@/components/ExamRunner";
import { createClient } from "@/lib/supabase/server";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/courses/${slug}/exam`);

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();
  if (!enrollment) redirect(`/courses/${slug}`);

  // Exam enabled?
  const { data: settings } = await supabase
    .from("course_exam_settings")
    .select("*")
    .eq("course_id", course.id)
    .maybeSingle();

  if (!settings || !settings.is_enabled) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 text-center sm:px-8">
          <p className="text-5xl">🕒</p>
          <h1 className="mt-4 text-2xl font-black dark:text-[#f1f5f9]">
            Exam not available
          </h1>
          <p className="mt-3 text-slate-600 dark:text-[#94a3b8]">
            The final exam has not been enabled for this course yet.
          </p>
          <Link
            href={`/courses/${slug}`}
            className="mt-6 inline-flex rounded-full bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800 dark:bg-blue-600"
          >
            Back to course →
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  // All lessons completed?
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", course.id)
    .eq("is_published", true);

  const totalLessons = lessons?.length ?? 0;
  const { data: progress } = await supabase
    .from("progress")
    .select("completed")
    .eq("user_id", user.id)
    .in("lesson_id", lessons?.map((l) => l.id) ?? []);

  const completedCount = progress?.filter((p) => p.completed).length ?? 0;

  if (totalLessons > 0 && completedCount < totalLessons) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 text-center sm:px-8">
          <p className="text-5xl">🔒</p>
          <h1 className="mt-4 text-2xl font-black dark:text-[#f1f5f9]">
            Exam locked
          </h1>
          <p className="mt-3 text-slate-600 dark:text-[#94a3b8]">
            Complete all {totalLessons} lessons to unlock the exam. You&apos;ve
            completed {completedCount}.
          </p>
          <div className="mx-auto mt-6 h-3 max-w-sm overflow-hidden rounded-full bg-slate-100 dark:bg-[#0e1526]">
            <div
              className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
              style={{ width: `${(completedCount / totalLessons) * 100}%` }}
            />
          </div>
          <Link
            href={`/courses/${slug}`}
            className="mt-6 inline-flex rounded-full bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800 dark:bg-blue-600"
          >
            Back to course →
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  // Previous attempt?
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("score, passed, completed_at")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8">
        <Link
          href={`/courses/${slug}`}
          className="text-sm font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400"
        >
          ← Back to course
        </Link>

        <div className="mt-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
            Final exam
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight dark:text-[#f1f5f9]">
            {course.title} — Final Exam
          </h1>
          <p className="mt-2 text-slate-600 dark:text-[#94a3b8]">
            {settings.question_count} questions · Passing score{" "}
            {settings.passing_score}%
          </p>

          {attempt?.passed && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              ✓ You passed with {attempt.score}% on{" "}
              {new Date(attempt.completed_at).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="mt-8">
          <ExamRunner
            courseId={course.id}
            courseSlug={slug}
            passingScore={settings.passing_score}
            previousAttempt={attempt ?? null}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}