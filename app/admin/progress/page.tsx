import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import ProgressManager from "@/components/admin/ProgressManager";
import { getEnrollmentProgress } from "@/lib/progress-helpers";

export const dynamic = "force-dynamic";

export default async function AdminProgressPage() {
  const userSupabase = await createClient();
  const {
    data: { user },
  } = await userSupabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/progress");

  const { data: profile } = await userSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: enrollments } = await admin
    .from("enrollments")
    .select(
      "user_id, course_id, enrolled_at, course:courses(id, title, slug, icon)"
    )
    .order("enrolled_at", { ascending: false });

  const allEnrollments = enrollments ?? [];

  const userIds = [...new Set(allEnrollments.map((e) => e.user_id))];
  const profileMap = new Map<
    string,
    { name: string | null; email: string | null }
  >();

  if (userIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    for (const p of profiles ?? []) {
      profileMap.set(p.id, { name: p.full_name, email: null });
    }

    for (const uid of userIds) {
      try {
        const { data } = await admin.auth.admin.getUserById(uid);
        const email = data?.user?.email ?? null;
        const existing = profileMap.get(uid) ?? { name: null, email: null };
        profileMap.set(uid, { ...existing, email });
      } catch {
        // ignore
      }
    }
  }

  const rows = await Promise.all(
    allEnrollments.map(async (e) => {
      const progress = await getEnrollmentProgress(
        admin,
        e.user_id,
        e.course_id
      );
      if (!progress) return null;

      const prof = profileMap.get(e.user_id);

      return {
        userId: e.user_id,
        userName: prof?.name ?? null,
        userEmail: prof?.email ?? null,
        courseId: e.course_id,
        courseTitle: progress.courseTitle,
        courseSlug: progress.courseSlug,
        courseIcon: progress.courseIcon,
        totalLessons: progress.totalLessons,
        completedLessons: progress.completedLessons,
        percent: progress.percent,
        state: progress.state,
        nextLessonTitle: progress.nextLessonTitle,
        lastActivityAt: progress.lastActivityAt,
        enrolledAt: progress.enrolledAt,
        stalled: progress.stalled,
      };
    })
  );

  const cleanRows = rows.filter(
    (r): r is NonNullable<typeof r> => r !== null
  );

  const { data: courses } = await admin
    .from("courses")
    .select("id, title")
    .eq("is_published", true)
    .order("sort_order");

  return <ProgressManager rows={cleanRows} courses={courses ?? []} />;
}