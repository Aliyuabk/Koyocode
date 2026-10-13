import { createClient } from "@/lib/supabase/server";
import RevenueManager from "@/components/admin/RevenueManager";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage() {
  const supabase = await createClient();

  // ------------------------------------------------------------
  // 1. Auth + admin check
  // ------------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-20 text-center sm:px-8">
          <p className="text-5xl">🔒</p>
          <h1 className="mt-4 text-2xl font-black dark:text-[#f1f5f9]">
            Please log in
          </h1>
          <p className="mt-3 text-slate-600 dark:text-[#94a3b8]">
            You need an admin account to view this page.
          </p>
        </main>
      </>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-20 text-center sm:px-8">
          <p className="text-5xl">🚫</p>
          <h1 className="mt-4 text-2xl font-black dark:text-[#f1f5f9]">
            Admin only
          </h1>
          <p className="mt-3 text-slate-600 dark:text-[#94a3b8]">
            This page is restricted to administrators.
          </p>
        </main>
      </>
    );
  }

  // ------------------------------------------------------------
  // 2. Load settings
  // ------------------------------------------------------------
  const { data: settings, error: settingsErr } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (settingsErr) {
    console.error("[admin/revenue] settings error:", settingsErr.message);
  }

  if (!settings) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-20 text-center sm:px-8">
          <p className="text-5xl">⚠️</p>
          <h1 className="mt-4 text-2xl font-black dark:text-[#f1f5f9]">
            Settings not found
          </h1>
          <p className="mt-3 text-slate-600 dark:text-[#94a3b8]">
            The <code>platform_settings</code> row is missing.
          </p>
          <pre className="mx-auto mt-4 max-w-lg overflow-x-auto rounded-xl bg-slate-100 p-4 text-left text-xs dark:bg-[#0e1526]">
{`Run this in Supabase SQL Editor:

insert into public.platform_settings (id)
values (1)
on conflict (id) do nothing;`}
          </pre>
          <p className="mt-3 text-xs text-slate-500 dark:text-[#94a3b8]">
            {settingsErr?.message ?? "No row with id = 1"}
          </p>
        </main>
      </>
    );
  }

  // ------------------------------------------------------------
  // 3. Load recent payments
  // ------------------------------------------------------------
  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, reference, amount_kobo, status, type, created_at, paid_at, user_id"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  // ------------------------------------------------------------
  // 4. Join user names
  // ------------------------------------------------------------
  const userIds = Array.from(
    new Set((payments ?? []).map((p) => p.user_id))
  );

  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds)
    : { data: [] };

  const nameMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  );

  // ------------------------------------------------------------
  // 5. Compute stats
  // ------------------------------------------------------------
  const success = (payments ?? []).filter((p) => p.status === "success");
  const totalRevenue = success.reduce((s, p) => s + p.amount_kobo, 0);
  const certCount = success.filter((p) => p.type === "certificate").length;
  const courseCount = success.filter((p) => p.type === "course").length;

  const last30 = success.filter(
    (p) =>
      p.paid_at &&
      Date.now() - new Date(p.paid_at).getTime() < 30 * 24 * 60 * 60 * 1000
  );
  const revenue30 = last30.reduce((s, p) => s + p.amount_kobo, 0);

  // ------------------------------------------------------------
  // 6. Pass to client
  // ------------------------------------------------------------
  return (
    <RevenueManager
      settings={{
        payments_enabled: settings.payments_enabled ?? false,
        paystack_public_key: settings.paystack_public_key ?? null,
        currency: settings.currency ?? "NGN",
        certificate_enabled: settings.certificate_enabled ?? false,
        certificate_default_price_kobo:
          settings.certificate_default_price_kobo ?? 50000,
        certificate_require_payment:
          settings.certificate_require_payment ?? true,
        certificate_auto_issue_on_pass:
          settings.certificate_auto_issue_on_pass ?? false,
        premium_courses_enabled: settings.premium_courses_enabled ?? false,
        premium_default_preview_lessons:
          settings.premium_default_preview_lessons ?? 2,
        ads_enabled: settings.ads_enabled ?? false,
        ads_provider: settings.ads_provider ?? "adsense",
        ads_client_id: settings.ads_client_id ?? null,
        ads_slots: settings.ads_slots ?? {},
        ads_skip_for_admins: settings.ads_skip_for_admins ?? true,
        ads_skip_on_exam: settings.ads_skip_on_exam ?? true,
        ads_skip_on_checkout: settings.ads_skip_on_checkout ?? true,
        scholarship_enabled: settings.scholarship_enabled ?? false,
        scholarship_title:
          settings.scholarship_title ??
          "KoyoCode Scholarship Program",
        scholarship_description:
          settings.scholarship_description ??
          "Free access to one premium course + a verified certificate.",
        scholarship_max_seats: settings.scholarship_max_seats ?? 30,
      }}
      payments={(payments ?? []).map((p) => ({
        id: p.id,
        reference: p.reference,
        amount_kobo: p.amount_kobo,
        status: p.status,
        type: p.type,
        created_at: p.created_at,
        paid_at: p.paid_at,
        user_name: nameMap[p.user_id] ?? null,
      }))}
      stats={{
        totalRevenue,
        revenue30,
        certCount,
        courseCount,
        totalPayments: success.length,
      }}
    />
  );
}