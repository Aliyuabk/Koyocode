import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProVideoPlayer from "@/components/ProVideoPlayer";
import YouTubeSubscribe from "@/components/YouTubeSubscribe";
import { createClient } from "@/lib/supabase/server";
import {
  getCourseBySlug,
  getLessonBySlug,
  getLessonsByCourse,
} from "@/lib/queries";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;

  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const lessons = await getLessonsByCourse(course.id);
  const lesson = await getLessonBySlug(course.id, lessonSlug);
  if (!lesson) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/courses/${slug}/lessons/${lessonSlug}`);
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (!enrollment) redirect(`/courses/${slug}`);

  const { data: progress } = await supabase
    .from("progress")
    .select("watched_percent, completed")
    .eq("user_id", user.id)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  const initialPercent = progress?.watched_percent ?? 0;

  const { data: questions } = await supabase
    .from("lesson_questions")
    .select("*")
    .eq("lesson_id", lesson.id)
    .order("trigger_at");

  const currentIndex = lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < lessons.length - 1
      ? lessons[currentIndex + 1]
      : null;

  const lessonIds = lessons.map((l) => l.id);
  const { data: allProgress } = await supabase
    .from("progress")
    .select("lesson_id, completed, watched_percent")
    .eq("user_id", user.id)
    .in("lesson_id", lessonIds);

  const progressMap: Record<
    string,
    { completed: boolean; watched_percent: number }
  > = Object.fromEntries(
    (allProgress ?? []).map((p) => [
      p.lesson_id,
      { completed: p.completed, watched_percent: p.watched_percent },
    ])
  );

  const totalLessons = lessons.length;
  const completedCount = lessons.filter(
    (l) => progressMap[l.id]?.completed
  ).length;
  const courseProgress = totalLessons
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  const thisCompleted = progressMap[lesson.id]?.completed ?? false;

  const chapters = lesson.chapters ?? [];
  const resources = lesson.resources ?? [];

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-[#94a3b8]">
          <Link
            href={`/courses/${course.slug}`}
            className="font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← {course.title}
          </Link>
          <span>/</span>
          <span className="truncate">{lesson.title}</span>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {lesson.youtube_id ? (
              <ProVideoPlayer
                lessonId={lesson.id}
                youtubeId={lesson.youtube_id}
                title={lesson.title}
                transcript={lesson.transcript}
                resources={resources}
                chapters={chapters}
                questions={questions ?? []}
                initialPercent={initialPercent}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-center dark:border-[#1f2a44] dark:bg-[#10182b]">
                <div>
                  <p className="text-4xl">🎬</p>
                  <p className="mt-3 font-bold text-slate-900 dark:text-[#f1f5f9]">
                    Video coming soon
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-[#94a3b8]">
                    Admin has not added a video for this lesson yet.
                  </p>
                </div>
              </div>
            )}

            {/* LESSON META */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  Lesson {currentIndex + 1} of {totalLessons}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-[#1b2742] dark:text-[#94a3b8]">
                  {lesson.duration_minutes} min
                </span>
                {thisCompleted && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    ✓ Completed
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-[#f1f5f9]">
                {lesson.title}
              </h1>

              {lesson.description && (
                <p className="mt-3 leading-7 text-slate-600 dark:text-[#94a3b8]">
                  {lesson.description}
                </p>
              )}

              {lesson.notes && (
                <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-[#1f2a44] dark:bg-[#10182b]">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    Notes
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-[#cbd5e1]">
                    {lesson.notes}
                  </p>
                </div>
              )}

              {lesson.starter_code && (
                <div className="mt-6">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    Starter code
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-5 font-mono text-sm leading-7 text-slate-100">
                    <code>{lesson.starter_code}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* YOUTUBE SUBSCRIBE */}
            <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
                    Found this helpful?
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
                    Subscribe on YouTube for more lessons
                  </p>
                </div>
                <YouTubeSubscribe variant="compact" />
              </div>
            </div>

            {/* PREV / NEXT */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {prevLesson ? (
                <Link
                  href={`/courses/${course.slug}/lessons/${prevLesson.slug}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 dark:border-[#1f2a44] dark:bg-[#131c33] dark:text-[#cbd5e1] dark:hover:border-blue-600 dark:hover:bg-[#1b2742]"
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}

              {nextLesson ? (
                thisCompleted ? (
                  <Link
                    href={`/courses/${course.slug}/lessons/${nextLesson.slug}`}
                    className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Next lesson →
                  </Link>
                ) : (
                  <span className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-bold text-slate-400 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#64748b]">
                    🔒 Watch 95% to unlock
                  </span>
                )
              ) : (
                <Link
                  href={`/courses/${course.slug}`}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  ✓ Finish course
                </Link>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1f2a44] dark:bg-[#131c33]">
                <div className="flex items-end justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    Your progress
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-[#f1f5f9]">
                    {courseProgress}%
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-[#0e1526]">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-1000 dark:bg-blue-500"
                    style={{ width: `${courseProgress}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-[#94a3b8]">
                  {completedCount} of {totalLessons} lessons completed
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
                <p className="border-b border-slate-100 px-5 py-4 text-sm font-extrabold text-slate-900 dark:border-[#1f2a44] dark:text-[#f1f5f9]">
                  Course content
                </p>
                <ol className="max-h-[600px] overflow-y-auto">
                  {lessons.map((l, i) => {
                    const p = progressMap[l.id];
                    const isDone = p?.completed ?? false;
                    const isCurrent = l.id === lesson.id;

                    return (
                      <li
                        key={l.id}
                        className={`border-b border-slate-100 last:border-0 dark:border-[#1f2a44] ${
                          isCurrent ? "bg-blue-50 dark:bg-[#16233d]" : ""
                        }`}
                      >
                        <Link
                          href={`/courses/${course.slug}/lessons/${l.slug}`}
                          className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-blue-50 dark:hover:bg-[#1b2742]"
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                              isDone
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : isCurrent
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500 dark:bg-[#1b2742] dark:text-[#64748b]"
                            }`}
                          >
                            {isDone ? "✓" : String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-sm font-bold ${
                                isCurrent
                                  ? "text-blue-700 dark:text-blue-300"
                                  : "text-slate-700 dark:text-[#cbd5e1]"
                              }`}
                            >
                              {l.title}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-[#94a3b8]">
                              {l.duration_minutes} min
                              {p && !isDone && ` · ${p.watched_percent}%`}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}