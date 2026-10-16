"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/* ============================================================
   saveProgress — auto-saved by the video player.
   Records how far the student watched. Does NOT force
   `completed: true` — that only happens when the student
   clicks "Mark complete", or when they finish the video.
   ============================================================ */
export async function saveProgress(
  lessonId: string,
  watchedPercent: number,
  completed: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not logged in" };

  // Clamp the percentage to valid range
  const safePercent = Math.max(0, Math.min(100, Math.round(watchedPercent)));

  // Only mark completed_at if this write actually completes it
  const nowIso = new Date().toISOString();

  const { error } = await supabase.from("progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      watched_percent: safePercent,
      completed,
      completed_at: completed ? nowIso : null,
      updated_at: nowIso,
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) return { error: error.message };

  // We do NOT revalidate on every progress tick — too noisy.
  // The Mark Complete action handles revalidation when the
  // state actually changes.
  return { success: true };
}

/* ============================================================
   markLessonComplete — explicit "Mark as complete" button.
   Forces 100% + completed = true, then revalidates.
   ============================================================ */
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

  const nowIso = new Date().toISOString();

  const { error } = await supabase.from("progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      watched_percent: 100,
      completed: true,
      completed_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/courses/${courseSlug}/lessons/${lessonSlug}`);
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath(`/dashboard`);

  return { success: true };
}