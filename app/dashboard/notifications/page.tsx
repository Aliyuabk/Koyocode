import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotificationsInbox from "@/components/NotificationsInbox";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/notifications");

  const { data } = await supabase
    .from("user_notifications")
    .select(
      "id, read, created_at, notification:notifications(id, title, message, link, link_label, sent_at)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href="/dashboard"
          className="text-sm font-bold text-purple-700 hover:text-purple-900 dark:text-purple-400"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-4 animate-fade-up">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
            Notifications
          </h1>
          <p className="mt-2 text-slate-600 dark:text-[#94a3b8]">
            Messages from KoyoCode
          </p>
        </div>

        <div className="mt-8">
          <NotificationsInbox initial={(data ?? []) as any} />
        </div>
      </main>
      <Footer />
    </>
  );
}