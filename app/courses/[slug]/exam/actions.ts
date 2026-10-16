"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { issueCertificateForUser } from "@/lib/certificates";

type ExamQuestion = {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
};

export type SubmitExamResult =
  | {
      ok: true;
      score: number;
      passed: boolean;
      correct: number;
      total: number;
      certificate: { id: string; verification_code: string } | null;
    }
  | { ok: false; error: string };

/**
 * Scores an exam attempt on the server so the client can't forge
 * pass/fail. Auto-issues a certificate if:
 *   - the attempt passed
 *   - platform_settings.certificate_enabled = true
 *   - platform_settings.certificate_auto_issue_on_pass = true
 */
export async function submitExamAttempt(
  courseId: string,
  answers: Record<number, number>,
  questions: ExamQuestion[]
): Promise<SubmitExamResult> {
  if (!courseId) return { ok: false, error: "Missing course id." };
  if (!Array.isArray(questions) || questions.length === 0) {
    return { ok: false, error: "Missing questions." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not logged in." };

  // 1) Verify enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (!enrollment) return { ok: false, error: "Not enrolled in this course." };

  // 2) Verify exam is enabled + fetch passing score
  const { data: settings } = await supabase
    .from("course_exam_settings")
    .select("passing_score, is_enabled")
    .eq("course_id", courseId)
    .maybeSingle();
  if (!settings?.is_enabled) {
    return { ok: false, error: "Exam is not enabled for this course." };
  }

  // 3) Score on the server
  const total = questions.length;
  let correct = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correct_index) correct++;
  });
  const score = total ? Math.round((correct / total) * 100) : 0;
  const passed = score >= settings.passing_score;

  // 4) Upsert the attempt
  const { error: attemptErr } = await supabase
    .from("exam_attempts")
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        questions,
        answers,
        score,
        passed,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id" }
    );

  if (attemptErr) return { ok: false, error: attemptErr.message };

  // 5) Auto-issue certificate if passed AND enabled
  let certificate: { id: string; verification_code: string } | null = null;

  if (passed) {
    const { data: platform } = await supabase
      .from("platform_settings")
      .select("certificate_enabled, certificate_auto_issue_on_pass")
      .eq("id", 1)
      .maybeSingle();

    if (
      platform?.certificate_enabled &&
      platform?.certificate_auto_issue_on_pass
    ) {
      const res = await issueCertificateForUser(user.id, courseId);
      if (res.ok) certificate = res.cert;
      else console.error("[submitExamAttempt] issue failed:", res.reason);
    }
  }

  // 6) Revalidate affected pages
  const { data: course } = await supabase
    .from("courses")
    .select("slug")
    .eq("id", courseId)
    .maybeSingle();

  if (course?.slug) {
    revalidatePath(`/courses/${course.slug}`);
    revalidatePath(`/courses/${course.slug}/exam`);
    revalidatePath(`/courses/${course.slug}/certificate`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/progress");
  revalidatePath("/dashboard/certificates");

  return { ok: true, score, passed, correct, total, certificate };
}