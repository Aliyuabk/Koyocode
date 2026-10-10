"use server";

import { createClient } from "@/lib/supabase/server";

export type ProgressSaveState = { error?: string; success?: boolean } | null;

export async function saveProgress(
  lessonId: string,
  watchedPercent: number,
  completed: boolean
): Promise<ProgressSaveState> {
  if (!lessonId) return { error: "Missing lesson." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not logged in." };

  const safePercent = Math.max(0, Math.min(100, Math.round(watchedPercent)));

  const { error } = await supabase.from("progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      watched_percent: safePercent,
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) {
    console.error("saveProgress error:", error.message);
    return { error: error.message };
  }

  return { success: true };
}