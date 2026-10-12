import { createClient } from "@/lib/supabase/server";
import ActivityManager from "@/components/admin/ActivityManager";

export default async function AdminActivityPage() {
  const supabase = await createClient();

  const { data: events, count } = await supabase
    .from("activity_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(500);

  const userIds = Array.from(
    new Set((events ?? []).map((e) => e.user_id).filter(Boolean))
  ) as string[];

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };

  const nameMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  );

  const rows = (events ?? []).map((e) => ({
    id: e.id,
    user_id: e.user_id,
    action: e.action,
    entity_type: e.entity_type,
    entity_id: e.entity_id,
    metadata: e.metadata,
    created_at: e.created_at,
    user_name: e.user_id ? nameMap[e.user_id] ?? null : null,
  }));

  return <ActivityManager events={rows} totalCount={count ?? 0} />;
}