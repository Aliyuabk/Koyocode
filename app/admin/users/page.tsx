import { createClient } from "@/lib/supabase/server";
import UsersManager from "@/components/admin/UsersManager";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, created_at")
    .order("created_at", { ascending: false });

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("user_id");

  const { data: progress } = await supabase
    .from("progress")
    .select("user_id, completed");

  const { data: certs } = await supabase
    .from("certificates")
    .select("user_id");

  const enrollCount: Record<string, number> = {};
  (enrollments ?? []).forEach((e) => {
    enrollCount[e.user_id] = (enrollCount[e.user_id] ?? 0) + 1;
  });

  const completedCount: Record<string, number> = {};
  (progress ?? []).forEach((p) => {
    if (p.completed)
      completedCount[p.user_id] = (completedCount[p.user_id] ?? 0) + 1;
  });

  const certCount: Record<string, number> = {};
  (certs ?? []).forEach((c) => {
    certCount[c.user_id] = (certCount[c.user_id] ?? 0) + 1;
  });

  const rows = (users ?? []).map((u) => ({
    id: u.id,
    full_name: u.full_name,
    avatar_url: u.avatar_url,
    role: u.role,
    created_at: u.created_at,
    enrollments: enrollCount[u.id] ?? 0,
    completed: completedCount[u.id] ?? 0,
    certificates: certCount[u.id] ?? 0,
  }));

  return <UsersManager rows={rows} />;
}