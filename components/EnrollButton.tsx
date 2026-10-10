"use client";

import { useActionState } from "react";
import { enrollInCourse, type EnrollState } from "@/app/courses/[slug]/actions";
import Alert from "@/components/ui/Alert";

export default function EnrollButton({
  courseId,
  slug,
  isLoggedIn,
}: {
  courseId: string;
  slug: string;
  isLoggedIn: boolean;
}) {
  const [state, formAction, pending] = useActionState<EnrollState, FormData>(
    enrollInCourse,
    null
  );

  if (!isLoggedIn) {
    return (
      <a
        href={`/login?next=/courses/${slug}`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-4 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
      >
        Log in to enroll →
      </a>
    );
  }

  return (
    <div>
      {state?.error && (
        <div className="mb-4">
          <Alert type="error">{state.error}</Alert>
        </div>
      )}
      <form action={formAction}>
        <input type="hidden" name="course_id" value={courseId} />
        <input type="hidden" name="slug" value={slug} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-4 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          {pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Enrolling…
            </>
          ) : (
            <>Enroll for free →</>
          )}
        </button>
      </form>
    </div>
  );
}