import { createClient } from "@/lib/supabase/server";
import CertificatesManager from "@/components/admin/CertificatesManager";

export default async function AdminCertificatesPage() {
  const supabase = await createClient();

  const { data: certs } = await supabase
    .from("certificates")
    .select("id, issued_at, verification_code, user_id, course_id")
    .order("issued_at", { ascending: false });

  const userIds = Array.from(new Set((certs ?? []).map((c) => c.user_id)));
  const courseIds = Array.from(new Set((certs ?? []).map((c) => c.course_id)));

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };

  const { data: coursesData } = courseIds.length
    ? await supabase
        .from("courses")
        .select("id, title, icon")
        .in("id", courseIds)
    : { data: [] };

  const { data: allCourses } = await supabase
    .from("courses")
    .select("id, title")
    .order("sort_order");

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  );
  const courseMap = Object.fromEntries(
    (coursesData ?? []).map((c) => [c.id, c])
  );

  const rows = (certs ?? []).map((c) => ({
    id: c.id,
    issued_at: c.issued_at,
    verification_code: c.verification_code,
    user_id: c.user_id,
    course_id: c.course_id,
    user_name: profileMap[c.user_id] ?? null,
    course_title: courseMap[c.course_id]?.title ?? null,
    course_icon: courseMap[c.course_id]?.icon ?? null,
  }));

  return <CertificatesManager rows={rows} courses={allCourses ?? []} />;
}