import { createClient as createUserClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import ScholarshipsManager from "@/components/admin/ScholarshipsManager";

export const dynamic = "force-dynamic";

export default async function AdminScholarshipsPage() {
  // Auth check
  const userSupabase = await createUserClient();
  const {
    data: { user },
  } = await userSupabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/scholarships");

  const { data: profile } = await userSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  // Use service role to bypass any RLS quirk
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: applications, error } = await admin
    .from("scholarship_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/scholarships] load error:", error.message);
  }

  const { data: courses } = await admin
    .from("courses")
    .select("id, title, is_premium")
    .eq("is_published", true)
    .order("sort_order");

  // Attach course info manually
  const courseMap = Object.fromEntries(
    (courses ?? []).map((c) => [c.id, c])
  );

  const enriched = (applications ?? []).map((a) => ({
    ...a,
    course: a.course_id ? courseMap[a.course_id] ?? null : null,
  }));

  return (
    <ScholarshipsManager
      applications={enriched as any}
      courses={courses ?? []}
    />
  );
}