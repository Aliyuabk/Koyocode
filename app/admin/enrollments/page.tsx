import { createClient } from "@/lib/supabase/server";
import EnrollmentsManager from "@/components/admin/EnrollmentsManager";

export default async function AdminEnrollmentsPage() {
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, enrolled_at, user_id, course_id")
    .order("enrolled_at", { ascending: false });

  const userIds = Array.from(
    new Set((enrollments ?? []).map((e) => e.user_id))
  );
  const courseIds = Array.from(
    new Set((enrollments ?? []).map((e) => e.course_id))
  );

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

  const rows = (enrollments ?? []).map((e) => ({
    id: e.id,
    enrolled_at: e.enrolled_at,
    user_id: e.user_id,
    course_id: e.course_id,
    user_name: profileMap[e.user_id] ?? null,
    course_title: courseMap[e.course_id]?.title ?? null,
    course_icon: courseMap[e.course_id]?.icon ?? null,
  }));

  return <EnrollmentsManager rows={rows} courses={allCourses ?? []} />;
}