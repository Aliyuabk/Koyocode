import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import { ToastHost } from "@/components/admin/ui";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const userName = profile?.full_name ?? "Admin";
  const userEmail = user.email ?? "";
  const userAvatar = profile?.avatar_url ?? "";

  return (
    <>
      <AdminShell
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
      >
        {children}
      </AdminShell>
      <ToastHost />
    </>
  );
}