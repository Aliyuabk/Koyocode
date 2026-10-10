import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverview() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: courseCount },
    { count: lessonCount },
    { count: enrollmentCount },
    { count: certCount },
    { count: examAttemptCount },
    { count: passedCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("enrollments").select("*", { count: "exact", head: true }),
    supabase.from("certificates").select("*", { count: "exact", head: true }),
    supabase.from("exam_attempts").select("*", { count: "exact", head: true }),
    supabase
      .from("exam_attempts")
      .select("*", { count: "exact", head: true })
      .eq("passed", true),
  ]);

  // Recent activity
  const { data: recent } = await supabase
    .from("activity_log")
    .select("id, action, entity_type, metadata, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(10);

  // Recent signups
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const passRate = examAttemptCount
    ? Math.round(((passedCount ?? 0) / examAttemptCount) * 100)
    : 0;

  const stats = [
    { label: "Users", value: userCount ?? 0, icon: "👥", tone: "blue", href: "/admin/users" },
    { label: "Courses", value: courseCount ?? 0, icon: "📚", tone: "purple", href: "/admin/courses" },
    { label: "Lessons", value: lessonCount ?? 0, icon: "🎬", tone: "emerald", href: "/admin/lessons" },
    { label: "Enrollments", value: enrollmentCount ?? 0, icon: "✍️", tone: "amber", href: "/admin/enrollments" },
    { label: "Certificates", value: certCount ?? 0, icon: "🏆", tone: "purple", href: "/admin/certificates" },
    { label: "Exam attempts", value: examAttemptCount ?? 0, icon: "🎯", tone: "blue", href: "/admin/exams" },
    { label: "Pass rate", value: `${passRate}%`, icon: "✅", tone: "emerald", href: "/admin/exams" },
  ];

  const toneClass: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
          Everything happening on KoyoCode at a glance.
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-lg dark:border-[#1f2a44] dark:bg-[#131c33] dark:hover:border-purple-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                  {s.label}
                </p>
                <p className="mt-2 text-3xl font-black text-slate-900 dark:text-[#f1f5f9]">
                  {s.value}
                </p>
              </div>
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${toneClass[s.tone]}`}>
                {s.icon}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* TWO COLUMNS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* RECENT ACTIVITY */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-[#1f2a44]">
            <p className="text-sm font-extrabold text-slate-900 dark:text-[#f1f5f9]">
              Recent activity
            </p>
            <Link
              href="/admin/activity"
              className="text-xs font-bold text-purple-700 hover:text-purple-900 dark:text-purple-400"
            >
              View all →
            </Link>
          </div>
          {!recent || recent.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-[#94a3b8]">
              No activity yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-base">
                    {r.action === "signup" && "👤"}
                    {r.action === "enroll" && "✍️"}
                    {r.action === "lesson_complete" && "✅"}
                    {r.action === "exam_pass" && "🏆"}
                    {r.action === "exam_fail" && "❌"}
                    {!["signup", "enroll", "lesson_complete", "exam_pass", "exam_fail"].includes(r.action) && "📌"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
                      {r.action.replace(/_/g, " ")}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-[#94a3b8]">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* RECENT SIGNUPS */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-[#1f2a44]">
            <p className="text-sm font-extrabold text-slate-900 dark:text-[#f1f5f9]">
              Newest users
            </p>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-purple-700 hover:text-purple-900 dark:text-purple-400"
            >
              View all →
            </Link>
          </div>
          {!recentUsers || recentUsers.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-[#94a3b8]">
              No users yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-xs font-black text-white">
                    {(u.full_name ?? "U")
                      .split(" ")
                      .map((s: any[]) => s[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
                      {u.full_name || "Unnamed"}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-[#94a3b8]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {u.role === "admin" && (
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                      admin
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
        <p className="text-sm font-extrabold text-slate-900 dark:text-[#f1f5f9]">
          Quick actions
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/courses"
            className="rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-purple-800 dark:bg-purple-600"
          >
            📚 Manage courses
          </Link>
          <Link
            href="/admin/users"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:bg-[#1b2742]"
          >
            👥 Manage users
          </Link>
          <Link
            href="/admin/activity"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:bg-[#1b2742]"
          >
            📜 Activity log
          </Link>
        </div>
      </div>
    </div>
  );
}