import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LessonConcepts from "@/components/LessonConcepts";
import LessonVideo from "@/components/LessonVideo";
import LessonChallenge from "@/components/LessonChallenge";
import QuickCheck from "@/components/QuickCheck";
import MobileLessonSidebar from "@/components/MobileLessonSidebar";
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

  const { data: allProgress } = await supabase
    .from("progress")
    .select("lesson_id, completed")
    .eq("user_id", user.id)
    .in(
      "lesson_id",
      lessons.map((l) => l.id)
    );

  const progressMap: Record<string, boolean> = Object.fromEntries(
    (allProgress ?? []).map((p) => [p.lesson_id, p.completed])
  );

  const currentIndex = lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < lessons.length - 1
      ? lessons[currentIndex + 1]
      : null;

  const completedCount = lessons.filter((l) => progressMap[l.id]).length;
  const courseProgress = lessons.length
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;

  const thisCompleted = progressMap[lesson.id] ?? false;
  const concepts = lesson.concepts ?? [];

  // Quick check has enough data to render?
  const hasQuickCheck =
    lesson.quick_check_question &&
    Array.isArray(lesson.quick_check_options) &&
    lesson.quick_check_options.length >= 2 &&
    typeof lesson.quick_check_correct_index === "number";

  // Exercise has enough data to render?
  const hasExercise =
    lesson.exercise_type !== "none" &&
    lesson.exercise_prompt &&
    lesson.exercise_starter &&
    lesson.exercise_solution;

  const lessonsForSidebar = lessons.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    duration_minutes: l.duration_minutes,
    completed: progressMap[l.id] ?? false,
  }));

  return (
    <>
      <Navbar />

      <MobileLessonSidebar
        courseSlug={course.slug}
        courseTitle={course.title}
        lessons={lessonsForSidebar}
        currentLessonId={lesson.id}
        completedCount={completedCount}
        courseProgress={courseProgress}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        {/* BREADCRUMB */}
        <Link
          href={`/courses/${course.slug}`}
          className="text-sm font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-400"
        >
          ← {course.title}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          {/* ==================== LEFT: MAIN ==================== */}
          <div className="space-y-6 lg:col-span-2">
            {/* HEADER */}
            <header className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-[#1f2a44] dark:bg-[#131c33]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  Lesson {currentIndex + 1} of {lessons.length}
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
            </header>

            {/* VIDEO */}
            {lesson.youtube_id && (
              <LessonVideo
                youtubeId={lesson.youtube_id}
                title={lesson.title}
              />
            )}

            {/* CONCEPTS (with EN/HA TTS) */}
            {concepts.length > 0 && <LessonConcepts concepts={concepts} />}

            {/* CODE CHALLENGE — Phase 3 */}
            {hasExercise && (
              <LessonChallenge
                type={
                  lesson.exercise_type === "javascript" ? "javascript" : "html"
                }
                prompt={lesson.exercise_prompt!}
                starter={lesson.exercise_starter!}
                solution={lesson.exercise_solution!}
                hint={lesson.exercise_hint}
              />
            )}

            {/* QUICK CHECK — Phase 4 */}
            {hasQuickCheck && (
              <QuickCheck
                question={lesson.quick_check_question!}
                options={lesson.quick_check_options!}
                correctIndex={lesson.quick_check_correct_index!}
                explanation={lesson.quick_check_explanation}
              />
            )}

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
                    🔒 Complete this lesson to continue
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

          {/* ==================== RIGHT: SIDEBAR ==================== */}
          <aside className="hidden lg:col-span-1 lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1f2a44] dark:bg-[#131c33]">
                <div className="flex items-end justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    Course progress
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
                  {completedCount} of {lessons.length} lessons completed
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
                <p className="border-b border-slate-100 px-5 py-4 text-sm font-extrabold text-slate-900 dark:border-[#1f2a44] dark:text-[#f1f5f9]">
                  All lessons
                </p>
                <ol className="max-h-[500px] overflow-y-auto">
                  {lessons.map((l, i) => {
                    const done = progressMap[l.id] ?? false;
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
                              done
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : isCurrent
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500 dark:bg-[#1b2742] dark:text-[#64748b]"
                            }`}
                          >
                            {done ? "✓" : String(i + 1).padStart(2, "0")}
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