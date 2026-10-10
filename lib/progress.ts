import { saveProgress } from "@/app/courses/[slug]/lessons/[lessonSlug]/actions";

/**
 * Fire-and-forget progress save. Called from the player.
 * Debounced by the caller.
 */
export async function persistProgress(
  lessonId: string,
  watchedPercent: number,
  completed: boolean
) {
  try {
    await saveProgress(lessonId, watchedPercent, completed);
  } catch (err) {
    console.error("persistProgress failed:", err);
  }
}