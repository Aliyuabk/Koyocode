import { createClient } from "@/lib/supabase/server";

export type CourseStat = {
  id: string;
  title: string;
  slug: string;
  icon: string | null;
  color: string | null;
  category: string | null;
  isPremium: boolean;
  certificateEnabled: boolean;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  lastTouchedAt: string | null;
  nextLessonSlug: string | null;
  allDone: boolean;
};

export type UserStats = {
  courses: CourseStat[];
  totalCourses: number;
  totalLessonsCompleted: number;
  totalLessonsAcrossEnrollments: number;
  overallPercent: number;
  streak: number;
};

/* ============================================================
   Returns per-course progress stats for a user, ordered by
   last activity (most recent first).
   ============================================================ */
export async function getCourseStatsForUser(
  userId: string
): Promise<CourseStat[]> {
  const supabase = await createClient();

  // 1) Enrollments + course info
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `id, enrolled_at,
       course:courses (
         id, title, slug, icon, color, category,
         is_premium, certificate_enabled, lessons_count
       )`
    )
    .eq("user_id", userId);

  const enrolledCourses = (enrollments ?? [])
    .map((e) => {
      const c = Array.isArray(e.course) ? e.course[0] : e.course;
      return c ? { ...c, enrolled_at: e.enrolled_at } : null;
    })
    .filter(Boolean) as Array<{
    id: string;
    title: string;
    slug: string;
    icon: string | null;
    color: string | null;
    category: string | null;
    is_premium: boolean;
    certificate_enabled: boolean;
    lessons_count: number;
    enrolled_at: string;
  }>;

  if (enrolledCourses.length === 0) return [];

  const enrolledCourseIds = enrolledCourses.map((c) => c.id);

  // 2) Progress + published lessons (parallel)
  const [progressRes, lessonsRes] = await Promise.all([
    supabase
      .from("progress")
      .select(
        `id, lesson_id, completed, watched_percent, updated_at,
         lesson:lessons ( id, course_id )`
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("lessons")
      .select("id, course_id, slug, sort_order")
      .in("course_id", enrolledCourseIds)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
  ]);

  const progressRows = progressRes.data ?? [];
  const allLessons = (lessonsRes.data ?? []) as Array<{
    id: string;
    course_id: string;
    slug: string;
    sort_order: number;
  }>;

  // 3) Build stats
  const stats: CourseStat[] = enrolledCourses.map((c) => {
    const courseLessons = allLessons
      .filter((l) => l.course_id === c.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const total = courseLessons.length;

    // Completed lesson ids in this course
    const completedSet = new Set(
      progressRows
        .filter((p) => {
          const l = Array.isArray(p.lesson) ? p.lesson[0] : p.lesson;
          return l?.course_id === c.id && p.completed;
        })
        .map((p) => p.lesson_id)
    );

    const courseProgressRows = progressRows.filter((p) => {
      const l = Array.isArray(p.lesson) ? p.lesson[0] : p.lesson;
      return l?.course_id === c.id;
    });

    const lastTouchedAt =
      courseProgressRows[0]?.updated_at ?? c.enrolled_at ?? null;

    const nextLesson = courseLessons.find((l) => !completedSet.has(l.id));
    const completedLessons = completedSet.size;
    const percent = total ? Math.round((completedLessons / total) * 100) : 0;
    const allDone = total > 0 && completedLessons === total;

    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      icon: c.icon,
      color: c.color,
      category: c.category,
      isPremium: c.is_premium,
      certificateEnabled: c.certificate_enabled,
      totalLessons: total,
      completedLessons,
      percent,
      lastTouchedAt,
      nextLessonSlug: nextLesson?.slug ?? null,
      allDone,
    };
  });

  // Order by last activity desc
  stats.sort((a, b) => {
    const at = a.lastTouchedAt ? new Date(a.lastTouchedAt).getTime() : 0;
    const bt = b.lastTouchedAt ? new Date(b.lastTouchedAt).getTime() : 0;
    return bt - at;
  });

  return stats;
}

/* ============================================================
   Aggregate stats + streak.
   ============================================================ */
export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient();

  const courses = await getCourseStatsForUser(userId);

  // Progress rows for completion count + streak
  const { data: progressRows } = await supabase
    .from("progress")
    .select("completed, updated_at")
    .eq("user_id", userId);

  const rows = progressRows ?? [];

  const totalLessonsCompleted = rows.filter((p) => p.completed).length;

  const totalLessonsAcrossEnrollments = courses.reduce(
    (s, c) => s + c.totalLessons,
    0
  );
  const completedAcrossEnrollments = courses.reduce(
    (s, c) => s + c.completedLessons,
    0
  );
  const overallPercent = totalLessonsAcrossEnrollments
    ? Math.round(
        (completedAcrossEnrollments / totalLessonsAcrossEnrollments) * 100
      )
    : 0;

  // Streak
  const days = new Set(
    rows.map((p) => new Date(p.updated_at).toISOString().slice(0, 10))
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toISOString().slice(0, 10))) streak++;
    else if (i > 0) break;
  }

  return {
    courses,
    totalCourses: courses.length,
    totalLessonsCompleted,
    totalLessonsAcrossEnrollments,
    overallPercent,
    streak,
  };
}