"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Question = {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
};

type PreviousAttempt = {
  score: number;
  passed: boolean;
  completed_at: string;
} | null;

export default function ExamRunner({
  courseId,
  courseSlug,
  passingScore,
  previousAttempt,
}: {
  courseId: string;
  courseSlug: string;
  passingScore: number;
  previousAttempt: PreviousAttempt;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [genError, setGenError] = useState<string | null>(null);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correct: number;
    total: number;
  } | null>(null);

  // Generate on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/exams/generate-for-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: courseId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setGenError(data.error ?? "Failed to generate exam");
          setLoading(false);
          return;
        }
        setQuestions(data.questions);
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setGenError(e.message ?? "Failed");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const total = questions.length;
  const q = questions[current];
  const progress = total ? ((current + 1) / total) * 100 : 0;

  function select(i: number) {
    setAnswers((a) => ({ ...a, [current]: i }));
  }

  async function submit() {
    if (Object.keys(answers).length < total) {
      if (!confirm("Some questions are unanswered. Submit anyway?")) return;
    }
    setSubmitting(true);

    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_index) correct++;
    });

    const score = Math.round((correct / total) * 100);
    const passed = score >= passingScore;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    await supabase.from("exam_attempts").upsert(
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

    setResult({ score, passed, correct, total });
    setSubmitting(false);
    router.refresh();
  }

  function retake() {
    setAnswers({});
    setCurrent(0);
    setResult(null);
  }

  // ============ GENERATING ============
  if (loading) {
    return (
      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-12 text-center dark:border-[#1f2a44] dark:bg-[#10182b]">
        <span className="mx-auto flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="mt-6 text-lg font-black text-slate-900 dark:text-[#f1f5f9]">
          Preparing your exam…
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
          AI is building questions from the course curriculum. This takes about
          10–20 seconds.
        </p>
      </div>
    );
  }

  // ============ GENERATION ERROR ============
  if (genError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center dark:border-red-800 dark:bg-red-950/40">
        <p className="text-5xl">⚠</p>
        <p className="mt-4 text-lg font-black text-red-800 dark:text-red-300">
          Could not prepare exam
        </p>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">{genError}</p>
        <button
          onClick={() => location.reload()}
          className="mt-6 rounded-full bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  // ============ RESULT ============
  if (result) {
    return (
      <div
        className={`rounded-3xl border p-10 text-center ${
          result.passed
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
        }`}
      >
        <p className="text-6xl">{result.passed ? "🎉" : "😔"}</p>
        <h2
          className={`mt-4 text-3xl font-black ${
            result.passed
              ? "text-emerald-800 dark:text-emerald-300"
              : "text-red-800 dark:text-red-300"
          }`}
        >
          {result.passed ? "You passed!" : "Not quite yet"}
        </h2>
        <p className="mt-3 text-slate-700 dark:text-[#cbd5e1]">
          You scored <strong>{result.score}%</strong> ({result.correct}/
          {result.total} correct). Passing score is {passingScore}%.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {result.passed ? (
            <Link
              href={`/courses/${courseSlug}/certificate`}
              className="rounded-full bg-emerald-600 px-7 py-3.5 font-bold text-white hover:bg-emerald-700"
            >
              🏆 View your certificate
            </Link>
          ) : (
            <button
              onClick={retake}
              className="rounded-full bg-blue-700 px-7 py-3.5 font-bold text-white hover:bg-blue-800 dark:bg-blue-600"
            >
              Retake exam
            </button>
          )}
          <Link
            href={`/courses/${courseSlug}`}
            className="rounded-full border border-slate-300 bg-white px-7 py-3.5 font-bold text-slate-700 hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
          >
            Back to course
          </Link>
        </div>
      </div>
    );
  }

  // ============ TAKING THE EXAM ============
  return (
    <div>
      {/* progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm font-bold text-slate-600 dark:text-[#94a3b8]">
          <span>
            Question {current + 1} of {total}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-[#0e1526]">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* question card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-[#1f2a44] dark:bg-[#131c33]">
        <p className="text-lg font-black text-slate-900 dark:text-[#f1f5f9]">
          {q.question}
        </p>

        <div className="mt-6 space-y-2">
          {q.options.map((opt, i) => {
            const selected = answers[current] === i;
            return (
              <button
                key={i}
                onClick={() => select(i)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition ${
                  selected
                    ? "border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:border-blue-600"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-black ${
                    selected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-[#1b2742]"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* nav */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
        >
          ← Previous
        </button>

        {current < total - 1 ? (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting}
            className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit exam"}
          </button>
        )}
      </div>

      {/* question dots */}
      <div className="mt-8 flex flex-wrap gap-2">
        {questions.map((_, i) => {
          const answered = answers[i] !== undefined;
          const isCurrent = i === current;
          return (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-9 w-9 rounded-lg text-xs font-black transition ${
                isCurrent
                  ? "bg-blue-700 text-white dark:bg-blue-600"
                  : answered
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-[#1b2742] dark:text-[#94a3b8]"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}