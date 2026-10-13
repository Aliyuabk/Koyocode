import { createClient } from "@/lib/supabase/server";
import ScholarshipsManager from "@/components/admin/ScholarshipsManager";

export default async function AdminScholarshipsPage() {
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("scholarship_applications")
    .select("*, course:courses(title, icon)")
    .order("created_at", { ascending: false });

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, is_premium")
    .eq("is_published", true)
    .order("sort_order");

  return (
    <ScholarshipsManager
      applications={(applications ?? []) as any}
      courses={courses ?? []}
    />
  );
}