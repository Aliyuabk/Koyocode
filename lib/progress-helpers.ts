import { SupabaseClient } from "@supabase/supabase-js";

export type ProgressState = "not_started" | "in_progress" | "completed";

export type EnrollmentProgress = {
  userId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  courseIcon: string | null;
  totalLessons: number;
  completedLessons: number;
  touchedLessons: number;
  percent: number;
  state: ProgressState;
  nextLessonSlug: string | null;
  nextLessonTitle: string | null;
  lastActivityAt: string | null;
  enrolledAt: string;
  stalled: boolean;
};

const STALLED_AFTER_DAYS = 14;

export async function getEnrollmentProgress(
  admin: SupabaseClient,
  userId: string,
  courseId: string
): Promise<EnrollmentProgress | null> {
  const [{ data: course }, { data: lessons }] = await Promise.all([
    admin
      .from("courses")
      .select("id, slug, title, icon")
      .eq("id", courseId)
      .maybeSingle(),
    admin
      .from("lessons")
      .select("id, slug, title, sort_order")
      .eq("course_id", courseId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (!course) return null;

  const { data: enrollment } = await admin
    .from("enrollments")
    .select("enrolled_at")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  const enrolledAt = enrollment?.enrolled_at ?? new Date().toISOString();
  const courseLessons = lessons ?? [];
  const total = courseLessons.length;
  const lessonIds = courseLessons.map((l) => l.id);

  const { data: progressRows } = lessonIds.length
    ? await admin
        .from("progress")
        .select("lesson_id, completed, updated_at")
        .eq("user_id", userId)
        .in("lesson_id", lessonIds)
    : { data: [] as any[] };

  const rows = progressRows ?? [];
  const completedSet = new Set(
    rows.filter((r) => r.completed).map((r) => r.lesson_id)
  );
  const touchedSet = new Set(rows.map((r) => r.lesson_id));

  const completedLessons = completedSet.size;
  const touchedLessons = touchedSet.size;

  const next = courseLessons.find((l) => !completedSet.has(l.id)) ?? null;

  let lastActivityAt: string | null = null;
  for (const r of rows) {
    if (!r.updated_at) continue;
    if (!lastActivityAt || r.updated_at > lastActivityAt) {
      lastActivityAt = r.updated_at;
    }
  }

  const percent = total ? Math.round((completedLessons / total) * 100) : 0;

  let state: ProgressState;
  if (completedLessons === total && total > 0) state = "completed";
  else if (touchedLessons === 0) state = "not_started";
  else state = "in_progress";

  let stalled = false;
  if (state === "in_progress" && lastActivityAt) {
    const days =
      (Date.now() - new Date(lastActivityAt).getTime()) /
      (1000 * 60 * 60 * 24);
    stalled = days >= STALLED_AFTER_DAYS;
  }

  return {
    userId,
    courseId,
    courseSlug: course.slug,
    courseTitle: course.title,
    courseIcon: course.icon,
    totalLessons: total,
    completedLessons,
    touchedLessons,
    percent,
    state,
    nextLessonSlug: next?.slug ?? null,
    nextLessonTitle: next?.title ?? null,
    lastActivityAt,
    enrolledAt,
    stalled,
  };
}

export function buildNudgeContent(p: EnrollmentProgress) {
  const link =
    p.state === "completed"
      ? `/courses/${p.courseSlug}/certificate`
      : p.nextLessonSlug
      ? `/courses/${p.courseSlug}/lessons/${p.nextLessonSlug}`
      : `/courses/${p.courseSlug}`;

  if (p.state === "not_started") {
    return {
      title: `Start ${p.courseTitle}`,
      message: `You're enrolled in ${p.courseTitle} — take the first lesson whenever you're ready. It takes about 8 minutes and will show you the path ahead.\n\nNo rush. Your progress is saved as you go.`,
      link,
      linkLabel: "Start first lesson →",
    };
  }

  if (p.state === "completed") {
    return {
      title: `You finished ${p.courseTitle} 🎉`,
      message: `Great work — you completed every lesson.\n\nYour certificate is ready. Take a look and share it.`,
      link,
      linkLabel: "View certificate →",
    };
  }

  const next = p.nextLessonTitle
    ? `Your next lesson is "${p.nextLessonTitle}".`
    : `You have ${p.totalLessons - p.completedLessons} lesson${
        p.totalLessons - p.completedLessons === 1 ? "" : "s"
      } left.`;

  return {
    title: `Continue ${p.courseTitle}`,
    message: `${next}\n\nEven 15 minutes today keeps the momentum going. Pick up where you left off.`,
    link,
    linkLabel: "Continue lesson →",
  };
}