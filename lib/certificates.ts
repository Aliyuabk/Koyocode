import { createClient } from "@/lib/supabase/server";

export type IssuedCert = {
  id: string;
  verification_code: string;
};

export type IssueResult =
  | { ok: true; cert: IssuedCert; created: boolean }
  | { ok: false; reason: string };

/**
 * Idempotently issues a certificate for a user + course.
 * - Returns the existing cert if one already exists.
 * - Returns { ok: false, reason } if the course has certificates disabled
 *   or if the insert fails for a non-race reason.
 * - Safe to call from server actions, route handlers, or cron jobs.
 */
export async function issueCertificateForUser(
  userId: string,
  courseId: string
): Promise<IssueResult> {
  const supabase = await createClient();

  // 1) Already exists?
  const { data: existing } = await supabase
    .from("certificates")
    .select("id, verification_code")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing) return { ok: true, cert: existing, created: false };

  // 2) Course has certificates enabled?
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("id, certificate_enabled")
    .eq("id", courseId)
    .maybeSingle();

  if (courseErr || !course) {
    return { ok: false, reason: courseErr?.message ?? "course_not_found" };
  }

  if (!course.certificate_enabled) {
    return { ok: false, reason: "certificate_disabled_for_course" };
  }

  // 3) Insert. verification_code has a DEFAULT in schema — omit it.
  const { data: created, error } = await supabase
    .from("certificates")
    .insert({ user_id: userId, course_id: courseId })
    .select("id, verification_code")
    .single();

  if (error) {
    // Race: another request created it between our check and insert
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("certificates")
        .select("id, verification_code")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single();
      if (retry) return { ok: true, cert: retry, created: false };
    }
    return { ok: false, reason: error.message };
  }

  return { ok: true, cert: created, created: true };
}