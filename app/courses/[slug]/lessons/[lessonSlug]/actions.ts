"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markLessonComplete(
  lessonId: string,
  courseSlug: string,
  lessonSlug: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not logged in" };

  const { error } = await supabase.from("progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      watched_percent: 100,
      completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/courses/${courseSlug}/lessons/${lessonSlug}`);
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath(`/dashboard`);

  return { success: true };
}