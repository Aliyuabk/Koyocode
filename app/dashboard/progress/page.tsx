import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getUserStats } from "@/lib/course-stats";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stats = await getUserStats(user.id);

  const inProgress = stats.courses.filter((c) => !c.allDone);
  const completed = stats.courses.filter((c) => c.allDone);

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14 animate-fade-up">
        <Link
          href="/dashboard"
          className="text-sm font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to dashboard
        </Link>

        <header className="mt-4">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
            My progress
          </h1>
          <p className="mt-2 text-slate-600 dark:text-[#94a3b8]">
            All your enrolled courses, tracked from start to certificate.
          </p>
        </header>

        {/* STATS */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Courses", value: stats.totalCourses, icon: "📚", tone: "blue" },
            { label: "Lessons completed", value: stats.totalLessonsCompleted, icon: "✅", tone: "emerald" },
            { label: "Day streak", value: stats.streak, icon: "🔥", tone: "amber" },
            { label: "Overall", value: `${stats.overallPercent}%`, icon: "📈", tone: "purple" },
          ].map((s) => {
            const toneClasses = {
              blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
              emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
              amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
              purple: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
            }[s.tone];
            return (
              <div
                key={s.label}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1f2a44] dark:bg-[#131c33]"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                    {s.label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-[#f1f5f9]">
                    {s.value}
                  </p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${toneClasses}`}>
                  {s.icon}
                </span>
              </div>
            );
          })}
        </section>

        {/* EMPTY STATE */}
        {stats.courses.length === 0 && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center dark:border-[#1f2a44] dark:bg-[#10182b]">
            <p className="text-4xl">📈</p>
            <p className="mt-3 font-bold text-slate-900 dark:text-[#f1f5f9]">
              Nothing here yet.
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
              Enroll in a course to start tracking progress.
            </p>
            <Link
              href="/#courses"
              className="mt-5 inline-flex rounded-full bg-blue-700 px-6 py-3 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 dark:bg-blue-600"
            >
              Browse courses →
            </Link>
          </div>
        )}

        {/* IN PROGRESS */}
        {inProgress.length > 0 && (
          <section className="mt-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#f1f5f9]">
                  In progress
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
                  {inProgress.length}{" "}
                  {inProgress.length === 1 ? "course" : "courses"} you&apos;re
                  working on
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-3">
              {inProgress.map((c) => (
                <li
                  key={c.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 dark:border-[#1f2a44] dark:bg-[#131c33] dark:hover:border-blue-700"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black ${
                        c.color ?? "bg-blue-100 text-blue-700"
                      } dark:bg-[#1b2742] dark:text-blue-300`}
                    >
                      {c.icon ?? "📘"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900 dark:text-[#f1f5f9]">
                        {c.title}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-[#94a3b8]">
                        {c.category ?? "Course"} · {c.completedLessons} of{" "}
                        {c.totalLessons} lessons · {c.percent}%
                      </p>

                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#0e1526]">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-700 dark:bg-blue-500"
                          style={{ width: `${c.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 pl-16">
                    {c.nextLessonSlug ? (
                      <Link
                        href={`/courses/${c.slug}/lessons/${c.nextLessonSlug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                      >
                        {c.percent === 0 ? "Start course" : "Continue"} →
                      </Link>
                    ) : (
                      <Link
                        href={`/courses/${c.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                      >
                        View course →
                      </Link>
                    )}
                    <Link
                      href={`/courses/${c.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:bg-[#1b2742]"
                    >
                      View course
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* COMPLETED */}
        {completed.length > 0 && (
          <section className="mt-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#f1f5f9]">
                  Completed
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
                  {completed.length}{" "}
                  {completed.length === 1 ? "course" : "courses"} finished —
                  great work 🎉
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-3">
              {completed.map((c) => (
                <li
                  key={c.id}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-900/5 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:hover:border-emerald-800"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black ${
                        c.color ?? "bg-blue-100 text-blue-700"
                      } dark:bg-[#1b2742] dark:text-blue-300`}
                    >
                      {c.icon ?? "📘"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-bold text-slate-900 dark:text-[#f1f5f9]">
                          {c.title}
                        </p>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          ✓ Completed
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-[#94a3b8]">
                        {c.category ?? "Course"} · {c.totalLessons} lessons
                      </p>

                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white dark:bg-[#0e1526]">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 pl-16">
                    {c.certificateEnabled && (
                      <Link
                        href={`/courses/${c.slug}/certificate`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
                      >
                        🏆 View certificate
                      </Link>
                    )}
                    <Link
                      href={`/courses/${c.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:bg-[#1b2742]"
                    >
                      Review course
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}