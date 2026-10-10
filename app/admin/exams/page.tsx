import { createClient } from "@/lib/supabase/server";

export default async function AdminExamsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("course_exam_settings")
    .select(
      "course_id, passing_score, question_count, is_enabled, course:courses(title, icon)"
    );

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select(
      "id, score, passed, completed_at, user:profiles(full_name), course:courses(title)"
    )
    .order("completed_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black dark:text-[#f1f5f9]">Exams</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
          Course exam settings and recent attempts
        </p>
      </div>

      {/* SETTINGS */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
        <p className="border-b border-slate-100 px-5 py-4 text-sm font-extrabold dark:border-[#1f2a44] dark:text-[#f1f5f9]">
          Exam settings per course
        </p>
        <ul className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
          {(settings ?? []).map((s: any) => {
            const course = Array.isArray(s.course) ? s.course[0] : s.course;
            return (
              <li key={s.course_id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xl">{course?.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold dark:text-[#f1f5f9]">
                    {course?.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                    {s.question_count} questions · pass {s.passing_score}%
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                    s.is_enabled
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-500 dark:bg-[#1b2742] dark:text-[#94a3b8]"
                  }`}
                >
                  {s.is_enabled ? "Enabled" : "Disabled"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* RECENT ATTEMPTS */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
        <p className="border-b border-slate-100 px-5 py-4 text-sm font-extrabold dark:border-[#1f2a44] dark:text-[#f1f5f9]">
          Recent attempts
        </p>
        <ul className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
          {(attempts ?? []).map((a: any) => {
            const profile = Array.isArray(a.user) ? a.user[0] : a.user;
            const course = Array.isArray(a.course) ? a.course[0] : a.course;
            return (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-base">{a.passed ? "🏆" : "❌"}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold dark:text-[#f1f5f9]">
                    {profile?.full_name ?? "Unnamed"}{" "}
                    <span className="text-slate-500 dark:text-[#94a3b8]">
                      · {course?.title}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                    {new Date(a.completed_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    a.passed
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                  }`}
                >
                  {a.score}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}