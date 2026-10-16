import { SupabaseClient } from "@supabase/supabase-js";

export type AudienceFilter =
  | { mode: "quick"; quick: "all" | "students" | "admins" }
  | { mode: "user"; userId: string }
  | {
      mode: "segment";
      courseId?: string | null;
      courseRule?: "enrolled" | "not_enrolled";
      enrolledAfter?: string | null;
      enrolledBefore?: string | null;
      progressRule?: "any" | "not_started" | "in_progress" | "completed";
      role?: "any" | "student" | "admin";
    };

/* ============================================================
   RESOLVE RECIPIENTS
   ============================================================ */
export async function resolveRecipients(
  admin: SupabaseClient,
  filter: AudienceFilter
): Promise<{ ok: true; userIds: string[] } | { ok: false; error: string }> {
  if (filter.mode === "quick") {
    let query = admin.from("profiles").select("id, role");
    if (filter.quick === "students") query = query.eq("role", "student");
    if (filter.quick === "admins") query = query.eq("role", "admin");

    const { data, error } = await query;
    if (error) return { ok: false, error: error.message };
    return { ok: true, userIds: (data ?? []).map((p) => p.id) };
  }

  if (filter.mode === "user") {
    if (!filter.userId) return { ok: false, error: "Missing user id" };
    return { ok: true, userIds: [filter.userId] };
  }

  return resolveSegment(admin, filter);
}

/* ============================================================
   SEGMENT RESOLVER
   ============================================================ */
async function resolveSegment(
  admin: SupabaseClient,
  filter: Extract<AudienceFilter, { mode: "segment" }>
): Promise<{ ok: true; userIds: string[] } | { ok: false; error: string }> {
  const {
    courseId,
    courseRule = "enrolled",
    enrolledAfter,
    enrolledBefore,
    progressRule = "any",
    role = "any",
  } = filter;

  let profileQuery = admin.from("profiles").select("id, role");
  if (role !== "any") profileQuery = profileQuery.eq("role", role);

  const { data: profiles, error: profileErr } = await profileQuery;
  if (profileErr) return { ok: false, error: profileErr.message };

  let candidateIds = new Set((profiles ?? []).map((p) => p.id));

  if (candidateIds.size === 0) return { ok: true, userIds: [] };

  if (courseId || enrolledAfter || enrolledBefore) {
    let enrollQuery = admin
      .from("enrollments")
      .select("user_id, course_id, enrolled_at");

    if (courseId) enrollQuery = enrollQuery.eq("course_id", courseId);
    if (enrolledAfter)
      enrollQuery = enrollQuery.gte("enrolled_at", enrolledAfter);
    if (enrolledBefore)
      enrollQuery = enrollQuery.lte("enrolled_at", enrolledBefore);

    const { data: enrollments, error: enrollErr } = await enrollQuery;
    if (enrollErr) return { ok: false, error: enrollErr.message };

    const enrolledUserIds = new Set(
      (enrollments ?? []).map((e) => e.user_id)
    );

    if (courseRule === "enrolled") {
      candidateIds = new Set(
        [...candidateIds].filter((id) => enrolledUserIds.has(id))
      );
    } else {
      candidateIds = new Set(
        [...candidateIds].filter((id) => !enrolledUserIds.has(id))
      );
    }
  }

  if (candidateIds.size === 0) return { ok: true, userIds: [] };

  if (progressRule !== "any" && courseId) {
    const { data: lessons } = await admin
      .from("lessons")
      .select("id")
      .eq("course_id", courseId)
      .eq("is_published", true);

    const totalLessons = (lessons ?? []).length;
    const lessonIds = new Set((lessons ?? []).map((l) => l.id));

    const { data: progressRows } = await admin
      .from("progress")
      .select("user_id, lesson_id, completed")
      .in("user_id", [...candidateIds]);

    const completedCount = new Map<string, number>();
    const touchedCount = new Map<string, number>();

    for (const row of progressRows ?? []) {
      if (!lessonIds.has(row.lesson_id)) continue;
      touchedCount.set(
        row.user_id,
        (touchedCount.get(row.user_id) ?? 0) + 1
      );
      if (row.completed) {
        completedCount.set(
          row.user_id,
          (completedCount.get(row.user_id) ?? 0) + 1
        );
      }
    }

    const filtered = new Set<string>();
    for (const uid of candidateIds) {
      const done = completedCount.get(uid) ?? 0;
      const touched = touchedCount.get(uid) ?? 0;

      const match =
        (progressRule === "not_started" && touched === 0) ||
        (progressRule === "in_progress" &&
          touched > 0 &&
          done < totalLessons) ||
        (progressRule === "completed" &&
          totalLessons > 0 &&
          done === totalLessons);

      if (match) filtered.add(uid);
    }

    candidateIds = filtered;
  }

  return { ok: true, userIds: [...candidateIds] };
}

/* ============================================================
   COUNT — convenience wrapper for the count endpoint
   ============================================================ */
export async function countRecipients(
  admin: SupabaseClient,
  filter: AudienceFilter
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const res = await resolveRecipients(admin, filter);
  if (!res.ok) return res;
  return { ok: true, count: res.userIds.length };
}