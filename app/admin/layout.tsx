import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0a0e1a]">
      <AdminSidebar
        userName={profile?.full_name ?? "Admin"}
        userEmail={user.email ?? ""}
        userAvatar={profile?.avatar_url ?? ""}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar
          userName={profile?.full_name ?? "Admin"}
          userEmail={user.email ?? ""}
          userAvatar={profile?.avatar_url ?? ""}
        />
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}