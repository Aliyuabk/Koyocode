import { createClient } from "@/lib/supabase/server";
import CoursesManager from "@/components/admin/CoursesManager";

export default async function AdminCoursesPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("sort_order");

  const { data: settings } = await supabase
    .from("course_exam_settings")
    .select("course_id, passing_score, is_enabled");

  const sMap = Object.fromEntries((settings ?? []).map((s) => [s.course_id, s]));

  return <CoursesManager courses={courses ?? []} settingsMap={sMap} />;
}