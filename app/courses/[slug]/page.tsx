import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import EnrollButton from "@/components/EnrollButton";
import { createClient } from "@/lib/supabase/server";
import { getCourseBySlug, getLessonsByCourse } from "@/lib/queries";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const lessons = await getLessonsByCourse(course.id);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Enrollment check
  let enrolled = false;
  if (user) {
    const { data } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();
    enrolled = !!data;
  }

  // Progress map
  let progressMap: Record<
    string,
    { watched_percent: number; completed: boolean }
  > = {};
  if (enrolled && user) {
    const lessonIds = lessons.map((l) => l.id);
    const { data: rows } = await supabase
      .from("progress")
      .select("lesson_id, watched_percent, completed")
      .eq("user_id", user.id)
      .in("lesson_id", lessonIds);

    progressMap = Object.fromEntries(
      (rows ?? []).map((r) => [
        r.lesson_id,
        { watched_percent: r.watched_percent, completed: r.completed },
      ])
    );
  }

  const totalLessons = lessons.length;
  const completedCount = lessons.filter(
    (l) => progressMap[l.id]?.completed
  ).length;
  const courseProgress = totalLessons
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;
  const allDone = totalLessons > 0 && completedCount === totalLessons;

  // Exam enabled?
  const { data: examSettings } = await supabase
    .from("course_exam_settings")
    .select("passing_score, question_count, is_enabled")
    .eq("course_id", course.id)
    .maybeSingle();

  const examEnabled = examSettings?.is_enabled ?? false;

  // Previous attempt (if any)
  let previousAttempt: { score: number; passed: boolean } | null = null;
  if (user && examEnabled) {
    const { data: attempt } = await supabase
      .from("exam_attempts")
      .select("score, passed")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();
    previousAttempt = attempt ?? null;
  }

  const totalMinutes = lessons.reduce((s, l) => s + l.duration_minutes, 0);

  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* ==================== HERO ==================== */}
        <section className="border-b border-slate-200 bg-blue-50 dark:border-[#1f2a44] dark:bg-[#10182b]">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
            <Reveal>
              <Link
                href="/courses"
                className="text-sm font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← All courses
              </Link>

              <div className="mt-6 grid gap-10 lg:grid-cols-3 lg:items-start">
                {/* LEFT */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black ${
                        course.color ?? "bg-blue-100 text-blue-700"
                      } dark:bg-[#1b2742] dark:text-blue-300`}
                    >
                      {course.icon}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {course.category}
                      </span>
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-[#1b2742] dark:text-[#cbd5e1]">
                        {course.level}
                      </span>
                      {course.tag && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {course.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-[#f1f5f9]">
                    {course.title}
                  </h1>

                  <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-[#94a3b8]">
                    {course.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600 dark:text-[#94a3b8]">
                    <span>▤ {totalLessons} lessons</span>
                    <span>
                      ◷ {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                      total
                    </span>
                    <span>◆ {course.level}</span>
                    <span>Koyi cikin Hausa da Turanci</span>
                  </div>
                </div>

                {/* RIGHT — enroll / progress card */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-blue-900/5 dark:border-[#1f2a44] dark:bg-[#131c33]">
                    {enrolled ? (
                      <>
                        <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                          Your progress
                        </p>
                        <p className="mt-3 text-4xl font-black text-slate-900 dark:text-[#f1f5f9]">
                          {courseProgress}%
                        </p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-[#0e1526]">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-1000 dark:bg-blue-500"
                            style={{ width: `${courseProgress}%` }}
                          />
                        </div>
                        <p className="mt-3 text-sm text-slate-600 dark:text-[#94a3b8]">
                          {completedCount} of {totalLessons} lessons completed
                        </p>

                        {lessons.length > 0 && (
                          <Link
                            href={`/courses/${course.slug}/lessons/${lessons[0].slug}`}
                            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-4 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                          >
                            {courseProgress === 0
                              ? "Start first lesson"
                              : "Continue learning"}{" "}
                            →
                          </Link>
                        )}

                        {examEnabled && (
                          <Link
                            href={`/courses/${course.slug}/exam`}
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3.5 font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                          >
                            {allDone
                              ? previousAttempt?.passed
                                ? `✓ Exam passed (${previousAttempt.score}%)`
                                : "🎯 Take final exam"
                              : "🔒 Final exam"}
                          </Link>
                        )}

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <span>✓</span> You are enrolled
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                          Free course
                        </p>
                        <p className="mt-3 text-4xl font-black text-slate-900 dark:text-[#f1f5f9]">
                          100% Free
                        </p>
                        <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
                          Enroll to unlock all lessons, track progress, take the
                          final exam, and earn a certificate.
                        </p>

                        <div className="mt-6">
                          <EnrollButton
                            courseId={course.id}
                            slug={course.slug}
                            isLoggedIn={!!user}
                          />
                        </div>

                        <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-[#94a3b8]">
                          <li className="flex items-center gap-2">
                            <span className="text-blue-700 dark:text-blue-400">
                              ✓
                            </span>{" "}
                            Full lifetime access
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-blue-700 dark:text-blue-400">
                              ✓
                            </span>{" "}
                            Learn in Hausa + English
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-blue-700 dark:text-blue-400">
                              ✓
                            </span>{" "}
                            Verifiable certificate
                          </li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ==================== LESSONS ==================== */}
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <Reveal>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-[#f1f5f9]">
              Course content
            </h2>
            <p className="mt-2 text-slate-600 dark:text-[#94a3b8]">
              {totalLessons} lessons · {Math.floor(totalMinutes / 60)}h{" "}
              {totalMinutes % 60}m
            </p>
          </Reveal>

          {lessons.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center dark:border-[#1f2a44] dark:bg-[#10182b]">
              <p className="text-4xl">📚</p>
              <p className="mt-3 font-bold text-slate-900 dark:text-[#f1f5f9]">
                Lessons are coming soon.
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
                Enroll now and you will be notified when content is ready.
              </p>
            </div>
          ) : (
            <ol className="mt-8 space-y-3">
              {lessons.map((lesson, idx) => {
                const p = progressMap[lesson.id];
                const isDone = p?.completed ?? false;
                const canAccess = enrolled;

                const inner = (
                  <div
                    className={`group flex items-center gap-4 rounded-2xl border p-4 transition ${
                      canAccess
                        ? "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 dark:border-[#1f2a44] dark:bg-[#131c33] dark:hover:border-blue-700"
                        : "border-slate-200 bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526]"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                        isDone
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : canAccess
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          : "bg-slate-200 text-slate-500 dark:bg-[#1b2742] dark:text-[#64748b]"
                      }`}
                    >
                      {isDone ? "✓" : String(idx + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate font-bold ${
                          canAccess
                            ? "text-slate-900 dark:text-[#f1f5f9]"
                            : "text-slate-500 dark:text-[#64748b]"
                        }`}
                      >
                        {lesson.title}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-[#94a3b8]">
                        {lesson.duration_minutes} min
                        {p && !isDone && ` · ${p.watched_percent}% watched`}
                        {isDone && " · Completed"}
                      </p>
                    </div>

                    {canAccess ? (
                      <span className="shrink-0 text-blue-700 transition group-hover:translate-x-0.5 dark:text-blue-400">
                        →
                      </span>
                    ) : (
                      <span className="shrink-0 text-slate-400 dark:text-[#64748b]">
                        🔒
                      </span>
                    )}
                  </div>
                );

                return (
                  <li key={lesson.id}>
                    {canAccess ? (
                      <Link
                        href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className="cursor-not-allowed">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          {!enrolled && lessons.length > 0 && (
            <Reveal>
              <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center dark:border-[#1f2a44] dark:bg-[#10182b]">
                <p className="text-3xl">🔓</p>
                <p className="mt-3 text-lg font-black text-slate-900 dark:text-[#f1f5f9]">
                  Enroll to unlock all {lessons.length} lessons.
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
                  Free forever. No credit card required.
                </p>
                <div className="mx-auto mt-6 max-w-xs">
                  <EnrollButton
                    courseId={course.id}
                    slug={course.slug}
                    isLoggedIn={!!user}
                  />
                </div>
              </div>
            </Reveal>
          )}
        </section>

        {/* ==================== FINAL EXAM CTA ==================== */}
        {enrolled && examEnabled && (
          <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl bg-blue-700 p-10 text-white sm:p-14">
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[40px] border-white/10" />
                <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />

                <div className="relative max-w-2xl">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-blue-200">
                    Final step
                  </p>
                  <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                    {previousAttempt?.passed
                      ? "You already passed the final exam."
                      : allDone
                      ? "You're ready for the final exam."
                      : "Finish all lessons to unlock the exam."}
                  </h2>
                  <p className="mt-4 leading-7 text-blue-100">
                    {previousAttempt?.passed
                      ? `You scored ${previousAttempt.score}%. Your certificate is ready to view.`
                      : allDone
                      ? `The exam has ${examSettings?.question_count ?? 10} questions. You need ${examSettings?.passing_score ?? 70}% to pass.`
                      : `${completedCount} of ${totalLessons} lessons done. Complete them all to unlock the exam.`}
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href={`/courses/${course.slug}/exam`}
                      className="inline-flex rounded-full bg-white px-7 py-3.5 font-extrabold text-blue-800 transition hover:-translate-y-0.5 hover:bg-blue-50"
                    >
                      {previousAttempt?.passed
                        ? "View exam result →"
                        : allDone
                        ? "Start final exam →"
                        : "View progress →"}
                    </Link>

                    {previousAttempt?.passed && (
                      <Link
                        href={`/courses/${course.slug}/certificate`}
                        className="inline-flex rounded-full border border-white/30 px-7 py-3.5 font-extrabold text-white transition hover:bg-white/10"
                      >
                        🏆 View certificate
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}