import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/ui/Avatar";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role, created_at")
    .eq("id", user.id)
    .single();

  const { data: progressRows } = await supabase
    .from("progress")
    .select(
      `id, completed, watched_percent, updated_at,
       lesson:lessons ( id, title, slug, course:courses ( id, title, slug, icon, color, category ) )`
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("sort_order")
    .limit(4);

  const { count: certCount } = await supabase
    .from("certificates")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const totalLessons = progressRows?.length ?? 0;
  const completedLessons =
    progressRows?.filter((p) => p.completed).length ?? 0;
  const inProgressLessons = totalLessons - completedLessons;
  const avgProgress = totalLessons
    ? Math.round(
        progressRows!.reduce((s, p) => s + p.watched_percent, 0) / totalLessons
      )
    : 0;

  const days = new Set(
    progressRows?.map((p) =>
      new Date(p.updated_at).toISOString().slice(0, 10)
    ) ?? []
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toISOString().slice(0, 10))) streak++;
    else if (i > 0) break;
  }

  const fullName = profile?.full_name?.trim() || "Learner";
  const firstName = fullName.split(" ")[0];
  const role = profile?.role ?? "student";

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const recentActivity = progressRows?.slice(0, 5) ?? [];

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        {/* PROFILE HERO */}
        <section className="animate-fade-up">
          <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:p-8 dark:border-[#1f2a44] dark:bg-[#131c33]">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-100/40 blur-3xl dark:bg-blue-900/20" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <Avatar
                  src={profile?.avatar_url}
                  name={fullName}
                  email={user.email}
                  size="xl"
                  className="ring-4 ring-white shadow-xl shadow-blue-900/10 dark:ring-[#0a0e1a]"
                />

                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
                    Your dashboard
                  </p>
                  <h1 className="mt-1.5 truncate text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-[#f1f5f9]">
                    Welcome back, {firstName}. 👋
                  </h1>
                  <p className="mt-1 truncate text-sm text-slate-600 dark:text-[#94a3b8]">
                    {user.email}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        role === "admin"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {role === "admin" ? "Administrator" : "Student"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      Member since {memberSince}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:border-blue-600 dark:hover:bg-[#1b2742]"
                >
                  ⚙️ Edit profile
                </Link>
                <Link
                  href="/#courses"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {totalLessons === 0 ? "Start learning" : "Continue learning"} →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Lessons started", value: totalLessons, icon: "📚", tone: "blue", delay: 0 },
            { label: "Completed", value: completedLessons, icon: "✅", tone: "emerald", delay: 0.05 },
            { label: "Day streak", value: streak, icon: "🔥", tone: "amber", delay: 0.1 },
            { label: "Certificates", value: certCount ?? 0, icon: "🏆", tone: "purple", delay: 0.15 },
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
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 animate-fade-up dark:border-[#1f2a44] dark:bg-[#131c33] dark:hover:border-blue-700"
                style={{ animationDelay: `${s.delay}s` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                      {s.label}
                    </p>
                    <p className="mt-3 text-4xl font-black text-slate-900 dark:text-[#f1f5f9]">
                      {s.value}
                    </p>
                  </div>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${toneClasses}`}>
                    {s.icon}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* PROGRESS */}
        <section className="mt-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-[#1f2a44] dark:bg-[#131c33]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#f1f5f9]">
                  Overall progress
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
                  Average watch progress across all started lessons
                </p>
              </div>
              <p className="text-3xl font-black text-blue-700 dark:text-blue-400">
                {avgProgress}%
              </p>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-[#0e1526]">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-1000 dark:bg-blue-500"
                style={{ width: `${avgProgress}%` }}
              />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              {[
                { label: "In progress", value: inProgressLessons },
                { label: "Completed", value: completedLessons },
                { label: "Avg %", value: `${avgProgress}%` },
              ].map((x) => (
                <div key={x.label}>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                    {x.label}
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-900 dark:text-[#f1f5f9]">
                    {x.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ACTIVITY + SIDEBAR */}
        <section className="mt-8 grid gap-6 lg:grid-cols-5 animate-fade-up" style={{ animationDelay: "0.25s" }}>
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#f1f5f9]">
                  Recent activity
                </h2>
                {recentActivity.length > 0 && (
                  <Link
                    href="/dashboard/progress"
                    className="text-sm font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View all →
                  </Link>
                )}
              </div>

              {recentActivity.length === 0 ? (
                <div className="mt-6 rounded-xl bg-slate-50 py-10 text-center dark:bg-[#0e1526]">
                  <p className="text-3xl">🎯</p>
                  <p className="mt-3 font-bold text-slate-900 dark:text-[#f1f5f9]">
                    No activity yet.
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
                    Start a lesson to see your progress here.
                  </p>
                </div>
              ) : (
                <ul className="mt-5 divide-y divide-slate-100 dark:divide-[#1f2a44]">
                  {recentActivity.map((p) => {
                    const lesson = Array.isArray(p.lesson) ? p.lesson[0] : p.lesson;
                    const course = lesson?.course
                      ? Array.isArray(lesson.course) ? lesson.course[0] : lesson.course
                      : null;
                    return (
                      <li key={p.id} className="flex items-center gap-4 py-4">
                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black ${course?.color ?? "bg-blue-100 text-blue-700"} dark:bg-[#1b2742] dark:text-blue-300`}>
                          {course?.icon ?? "📘"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
                            {lesson?.title ?? "Lesson"}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-[#94a3b8]">
                            {course?.title ?? "Course"}
                          </p>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#0e1526]">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                p.completed ? "bg-emerald-500" : "bg-blue-600 dark:bg-blue-500"
                              }`}
                              style={{ width: `${p.watched_percent}%` }}
                            />
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-xs font-bold ${p.completed ? "text-emerald-600 dark:text-emerald-400" : "text-blue-700 dark:text-blue-400"}`}>
                            {p.completed ? "✓ Done" : `${p.watched_percent}%`}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#f1f5f9]">
                Recommended for you
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
                Pick a course and start today
              </p>
              <ul className="mt-5 space-y-3">
                {(courses ?? []).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/courses/${c.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 dark:border-[#1f2a44] dark:hover:border-blue-700 dark:hover:bg-[#1b2742]"
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg font-black ${c.color ?? "bg-blue-100 text-blue-700"} dark:bg-[#1b2742] dark:text-blue-300`}>
                        {c.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 group-hover:text-blue-700 dark:text-[#f1f5f9] dark:group-hover:text-blue-400">
                          {c.title}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-[#94a3b8]">
                          {c.category} · {c.lessons_count} lessons
                        </p>
                      </div>
                      <span className="text-blue-700 transition group-hover:translate-x-0.5 dark:text-blue-400">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Account
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                {[
                  ["Name", fullName],
                  ["Email", user.email ?? "—"],
                  ["Role", role],
                  ["Joined", memberSince],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-slate-500 dark:text-[#94a3b8]">{k}</dt>
                    <dd className="truncate font-bold text-slate-900 capitalize dark:text-[#f1f5f9]">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
              <Link
                href="/dashboard/settings"
                className="mt-4 inline-flex font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Manage account →
              </Link>
            </div>
          </div>
        </section>

        {/* EMPTY STATE */}
        {totalLessons === 0 && (
          <section className="mt-8 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <div className="relative overflow-hidden rounded-3xl bg-blue-700 p-10 text-white sm:p-14 dark:bg-blue-700">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[40px] border-white/10" />
              <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
              <div className="relative max-w-2xl">
                <span className="inline-flex rounded-xl bg-white/15 px-4 py-2 text-sm font-bold">
                  Your first step
                </span>
                <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl">
                  You haven&apos;t started a course yet.
                </h2>
                <p className="mt-4 leading-7 text-blue-100">
                  Learning to code starts with a single lesson. Pick one and
                  take that step today — your future self will thank you.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/#courses"
                    className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 font-extrabold text-blue-800 transition hover:-translate-y-0.5 hover:bg-blue-50"
                  >
                    Browse courses →
                  </Link>
                  <Link
                    href="/#how-it-works"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3.5 font-extrabold text-white transition hover:bg-white/10"
                  >
                    How it works
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}