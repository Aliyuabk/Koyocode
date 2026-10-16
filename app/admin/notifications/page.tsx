import { createClient } from "@/lib/supabase/server";
import NotificationsComposer from "@/components/admin/NotificationsComposer";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();

  const [recentRes, usersRes, coursesRes] = await Promise.all([
    supabase
      .from("notifications")
      .select(
        "id, title, message, link, audience, send_email, sent_at, recipients"
      )
      .order("sent_at", { ascending: false })
      .limit(50),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name"),
    supabase
      .from("courses")
      .select("id, title, icon")
      .eq("is_published", true)
      .order("sort_order"),
  ]);

  return (
    <NotificationsComposer
      recentNotifications={recentRes.data ?? []}
      users={usersRes.data ?? []}
      courses={coursesRes.data ?? []}
    />
  );
}