import { createClient } from "@/lib/supabase/server";

export default async function AdminActivityPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("activity_log")
    .select("id, action, entity_type, metadata, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(200);

  const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id))).filter(Boolean) as string[];

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null }[] };

  const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div>
      <h2 className="text-2xl font-black dark:text-[#f1f5f9]">Activity log</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
        Latest 200 events
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
        <ul className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
          {(rows ?? []).map((r) => (
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
                <p className="truncate text-sm font-bold dark:text-[#f1f5f9]">
                  {r.user_id && nameMap[r.user_id]
                    ? nameMap[r.user_id]
                    : "System"}{" "}
                  <span className="text-slate-500 dark:text-[#94a3b8]">
                    · {r.action.replace(/_/g, " ")}
                  </span>
                </p>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
          {(!rows || rows.length === 0) && (
            <li className="px-5 py-10 text-center text-sm text-slate-500 dark:text-[#94a3b8]">
              No activity yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}