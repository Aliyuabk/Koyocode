import { createClient } from "@/lib/supabase/server";
import LessonsManager from "@/components/admin/LessonsManager";

export default async function AdminLessonsPage() {
  const supabase = await createClient();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*, course:courses(id, title, slug)")
    .order("course_id")
    .order("sort_order");

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .order("sort_order");

  return (
    <LessonsManager
      lessons={(lessons ?? []) as any}
      courses={courses ?? []}
    />
  );
}