"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type EnrollState = { error?: string; success?: string } | null;

export async function enrollInCourse(
  _prev: EnrollState,
  formData: FormData
): Promise<EnrollState> {
  const courseId = String(formData.get("course_id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  if (!courseId) return { error: "Invalid course." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in to enroll." };

  // Already enrolled?
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing) {
    revalidatePath(`/courses/${slug}`);
    return { success: "You're already enrolled." };
  }

  const { error } = await supabase.from("enrollments").insert({
    user_id: user.id,
    course_id: courseId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/courses/${slug}`);
  return { success: "Enrolled successfully." };
}