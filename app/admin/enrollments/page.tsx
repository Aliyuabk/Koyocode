import { createClient } from "@/lib/supabase/server";
import EnrollmentsManager from "@/components/admin/EnrollmentsManager";

export default async function AdminEnrollmentsPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("enrollments")
    .select(
      "id, enrolled_at, user:profiles(full_name), course:courses(title, icon)"
    )
    .order("enrolled_at", { ascending: false });

  return <EnrollmentsManager rows={(rows ?? []) as any} />;
}