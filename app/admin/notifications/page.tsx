import { createClient } from "@/lib/supabase/server";
import NotificationsComposer from "@/components/admin/NotificationsComposer";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();

  const { data: recent } = await supabase
    .from("notifications")
    .select("id, title, message, link, audience, send_email, sent_at, recipients")
    .order("sent_at", { ascending: false })
    .limit(50);

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name");

  return (
    <NotificationsComposer
      recentNotifications={recent ?? []}
      users={users ?? []}
    />
  );
}