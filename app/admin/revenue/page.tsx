import { createClient } from "@/lib/supabase/server";
import RevenueManager from "@/components/admin/RevenueManager";

export default async function AdminRevenuePage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, reference, amount_kobo, status, type, created_at, paid_at, user_id")
    .order("created_at", { ascending: false })
    .limit(100);

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

  // Summary stats
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

  return (
    <RevenueManager
      settings={settings as any}
      payments={(payments ?? []).map((p) => ({
        ...p,
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