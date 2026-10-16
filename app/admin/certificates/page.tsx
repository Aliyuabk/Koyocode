import { createClient } from "@/lib/supabase/server";
import CertificatesManager from "@/components/admin/CertificatesManager";

export default async function AdminCertificatesPage() {
  const supabase = await createClient();

  // 1) Issued certificates
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

  // 2) Pending — passed exam but no certificate row
  const issuedKeys = new Set(
    (certs ?? []).map((c) => `${c.user_id}:${c.course_id}`)
  );

  const { data: passedAttempts } = await supabase
    .from("exam_attempts")
    .select("user_id, course_id, score, completed_at")
    .eq("passed", true)
    .order("completed_at", { ascending: false });

  const pendingRows = (passedAttempts ?? []).filter(
    (a) => !issuedKeys.has(`${a.user_id}:${a.course_id}`)
  );

  const pendingUserIds = Array.from(
    new Set(pendingRows.map((a) => a.user_id))
  );
  const pendingCourseIds = Array.from(
    new Set(pendingRows.map((a) => a.course_id))
  );

  const { data: pendingProfiles } = pendingUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", pendingUserIds)
    : { data: [] };

  const { data: pendingCourses } = pendingCourseIds.length
    ? await supabase
        .from("courses")
        .select("id, title, icon, certificate_enabled")
        .in("id", pendingCourseIds)
    : { data: [] };

  const pendingProfileMap = Object.fromEntries(
    (pendingProfiles ?? []).map((p) => [p.id, p.full_name])
  );
  const pendingCourseMap = Object.fromEntries(
    (pendingCourses ?? []).map((c) => [c.id, c])
  );

  const pending = pendingRows
    // Only show pending for courses where certificates are enabled
    .filter(
      (a) => pendingCourseMap[a.course_id]?.certificate_enabled === true
    )
    .map((a) => ({
      user_id: a.user_id,
      course_id: a.course_id,
      user_name: pendingProfileMap[a.user_id] ?? null,
      course_title: pendingCourseMap[a.course_id]?.title ?? null,
      course_icon: pendingCourseMap[a.course_id]?.icon ?? null,
      score: a.score,
      completed_at: a.completed_at,
    }));

  return (
    <CertificatesManager
      rows={rows}
      courses={allCourses ?? []}
      pending={pending}
    />
  );
}