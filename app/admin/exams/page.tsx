import { createClient } from "@/lib/supabase/server";
import ExamsManager from "@/components/admin/ExamsManager";

export default async function AdminExamsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("course_exam_settings")
    .select("course_id, passing_score, question_count, is_enabled");

  const courseIds = (settings ?? []).map((s) => s.course_id);
  const { data: coursesData } = courseIds.length
    ? await supabase
        .from("courses")
        .select("id, title, icon, slug")
        .in("id", courseIds)
    : { data: [] };

  const courseMap = Object.fromEntries(
    (coursesData ?? []).map((c) => [c.id, c])
  );

  const courseExams = (settings ?? []).map((s) => ({
    course_id: s.course_id,
    passing_score: s.passing_score,
    question_count: s.question_count,
    is_enabled: s.is_enabled,
    course_title: courseMap[s.course_id]?.title ?? null,
    course_icon: courseMap[s.course_id]?.icon ?? null,
    course_slug: courseMap[s.course_id]?.slug ?? null,
  }));

  const { data: attemptsData } = await supabase
    .from("exam_attempts")
    .select("id, score, passed, completed_at, user_id, course_id")
    .order("completed_at", { ascending: false })
    .limit(100);

  const attemptUserIds = Array.from(
    new Set((attemptsData ?? []).map((a) => a.user_id))
  );
  const attemptCourseIds = Array.from(
    new Set((attemptsData ?? []).map((a) => a.course_id))
  );

  const { data: profiles } = attemptUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", attemptUserIds)
    : { data: [] };

  const { data: courseTitles } = attemptCourseIds.length
    ? await supabase
        .from("courses")
        .select("id, title")
        .in("id", attemptCourseIds)
    : { data: [] };

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  );
  const courseTitleMap = Object.fromEntries(
    (courseTitles ?? []).map((c) => [c.id, c.title])
  );

  const attempts = (attemptsData ?? []).map((a) => ({
    id: a.id,
    score: a.score,
    passed: a.passed,
    completed_at: a.completed_at,
    user_name: profileMap[a.user_id] ?? null,
    course_title: courseTitleMap[a.course_id] ?? null,
  }));

  return <ExamsManager courseExams={courseExams} attempts={attempts} />;
}