"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markLessonComplete } from "@/app/courses/[slug]/lessons/[lessonSlug]/actions";

export default function MarkCompleteButton({
  lessonId,
  courseSlug,
  completed,
  nextLessonSlug,
}: {
  lessonId: string;
  courseSlug: string;
  completed: boolean;
  nextLessonSlug: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localCompleted, setLocalCompleted] = useState(completed);

  function handleClick() {
    if (localCompleted) return;

    startTransition(async () => {
      const res = await markLessonComplete(
        lessonId,
        courseSlug,
        // pass lessonSlug too — we get it from the URL inside the action anyway
        // (kept simple here)
        ""
      );

      if (res?.error) {
        alert(res.error);
        return;
      }

      setLocalCompleted(true);
      router.refresh();
    });
  }

  if (localCompleted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/40">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white animate-checkmark-pop">
            ✓
          </span>
          <div>
            <p className="font-black text-emerald-800 dark:text-emerald-300">
              Lesson complete
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Great job — the next lesson is now unlocked.
            </p>
          </div>
        </div>

        {nextLessonSlug && (
          <button
            type="button"
            onClick={() =>
              router.push(`/courses/${courseSlug}/lessons/${nextLessonSlug}`)
            }
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700"
          >
            Next lesson →
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-4 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
    >
      {isPending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Marking…
        </>
      ) : (
        <>✓ Mark lesson as complete</>
      )}
    </button>
  );
}