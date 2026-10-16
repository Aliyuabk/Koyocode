"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitExamAttempt } from "@/app/courses/[slug]/exam/actions";

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

const QUESTION_TIME_SECONDS = 120; // 2 minutes per question (as a budget)

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
  const router = useRouter();

  // If they already passed, we still allow a retake from the result screen.
  const [hasPassed] = useState(previousAttempt?.passed === true);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(!hasPassed);
  const [genError, setGenError] = useState<string | null>(null);
  const [genDetail, setGenDetail] = useState<string | null>(null);
  const [modelsTried, setModelsTried] = useState<string[] | null>(null);

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correct: number;
    total: number;
    certificateCode: string | null;
  } | null>(
    hasPassed && previousAttempt
      ? {
          score: previousAttempt.score,
          passed: true,
          correct: Math.round((previousAttempt.score / 100) * 10),
          total: 10,
          certificateCode: null,
        }
      : null
  );

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // ============================================================
  // GENERATE QUESTIONS ON MOUNT
  // ============================================================
  useEffect(() => {
    if (hasPassed) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setGenError(null);
      setGenDetail(null);
      setModelsTried(null);

      try {
        const res = await fetch("/api/exams/generate-for-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: courseId }),
        });

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (cancelled) return;

        if (!res.ok) {
          setGenError(data?.error ?? `Request failed (${res.status})`);
          setGenDetail(data?.detail ?? null);
          setModelsTried(data?.models_attempted ?? null);
          setLoading(false);
          return;
        }

        if (!data?.questions || !Array.isArray(data.questions)) {
          setGenError("AI returned no questions");
          setGenDetail(JSON.stringify(data).slice(0, 400));
          setLoading(false);
          return;
        }

        setQuestions(data.questions);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setGenError(e?.message ?? "Network error");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, hasPassed]);

  // ============================================================
  // TIMER — total budget = 2 min × question count
  // Starts when questions finish loading, stops on submit / error.
  // ============================================================
  useEffect(() => {
    if (loading || genError || result || questions.length === 0) return;
    if (secondsLeft !== null) return; // already initialised

    setSecondsLeft(questions.length * QUESTION_TIME_SECONDS);
  }, [loading, genError, result, questions.length, secondsLeft]);

  // Tick
  useEffect(() => {
    if (secondsLeft === null) return;
    if (result || submitting) return;

    if (secondsLeft <= 0) {
      // Hard stop → submit with whatever is answered
      handleTimeoutSubmit();
      return;
    }

    const t = window.setTimeout(() => {
      setSecondsLeft((s) => (s === null ? null : s - 1));
    }, 1000);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, result, submitting]);

  async function handleTimeoutSubmit() {
    if (submitting || result) return;
    setTimedOut(true);
    await submit();
  }

  // ============================================================
  // SUBMIT
  // ============================================================
  async function submit(manual = true) {
    if (submitting) return;

    const answeredCount = Object.keys(answers).length;
    const total = questions.length;

    if (manual && answeredCount < total) {
      const ok = confirm(
        `You have answered ${answeredCount} of ${total} questions. Submit anyway?`
      );
      if (!ok) return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const res = await submitExamAttempt(courseId, answers, questions);

    if (!res.ok) {
      setSubmitError(res.error);
      setSubmitting(false);
      // If it was a timeout submit and the server rejected, put the timer
      // back so the user isn't stuck — but they can retry manually.
      if (timedOut) setSecondsLeft(60);
      return;
    }

    setResult({
      score: res.score,
      passed: res.passed,
      correct: res.correct,
      total: res.total,
      certificateCode: res.certificate?.verification_code ?? null,
    });
    setSubmitting(false);
    router.refresh();
  }

  function retake() {
    setAnswers({});
    setResult(null);
    setSubmitError(null);
    setTimedOut(false);
    setSecondsLeft(null);
    location.reload();
  }

  // ============================================================
  // LOADING
  // ============================================================
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

  // ============================================================
  // GENERATION ERROR
  // ============================================================
  if (genError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center dark:border-red-800 dark:bg-red-950/40">
        <p className="text-5xl">⚠</p>
        <p className="mt-4 text-lg font-black text-red-800 dark:text-red-300">
          Could not prepare exam
        </p>
        <p className="mt-2 text-sm font-bold text-red-700 dark:text-red-300">
          {genError}
        </p>

        {genDetail && (
          <pre className="mx-auto mt-4 max-w-2xl overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-red-100 p-3 text-left text-xs text-red-900 dark:bg-red-900/40 dark:text-red-200">
            {genDetail}
          </pre>
        )}

        {modelsTried && modelsTried.length > 0 && (
          <p className="mt-3 text-xs text-red-700 dark:text-red-300">
            Models tried: {modelsTried.join(", ")}
          </p>
        )}

        <button
          onClick={() => location.reload()}
          className="mt-6 rounded-full bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  // ============================================================
  // RESULT
  // ============================================================
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
          You scored <strong>{result.score}%</strong>. Passing score is{" "}
          {passingScore}%.
        </p>

        {timedOut && (
          <p className="mx-auto mt-3 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            ⏱ Time expired — the exam was submitted automatically.
          </p>
        )}

        {result.passed && (
          <p className="mx-auto mt-4 max-w-md text-sm text-emerald-700 dark:text-emerald-300">
            {result.certificateCode
              ? "🏆 Your certificate has been issued."
              : "🏆 Your certificate will be issued shortly."}
          </p>
        )}

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

  // ============================================================
  // MAIN EXAM — ALL QUESTIONS ON ONE PAGE
  // ============================================================
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = total ? (answeredCount / total) * 100 : 0;

  const timeDisplay = formatTime(secondsLeft);
  const timeTone: "ok" | "warn" | "danger" =
    secondsLeft === null
      ? "ok"
      : secondsLeft <= 30
      ? "danger"
      : secondsLeft <= 120
      ? "warn"
      : "ok";

  return (
    <div className="relative">
      {/* ============================================================
          STICKY STATUS PILL — count, timer, submit
          Small, top-right, floats above the question list.
          ============================================================ */}
      <div className="pointer-events-none sticky top-4 z-30 flex justify-end">
        <div
          className="pointer-events-auto flex items-center gap-2 rounded-full border bg-white/95 px-2 py-1.5 shadow-lg shadow-slate-900/10 backdrop-blur-md dark:border-[#1f2a44] dark:bg-[#131c33]/95 sm:gap-3 sm:px-3 sm:py-2"
          style={{ borderColor: "rgba(148,163,184,0.35)" }}
        >
          {/* Answered count */}
          <div className="flex items-center gap-2 px-2">
            <span
              className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]"
              aria-hidden
            >
              Progress
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-[#f1f5f9]">
              {answeredCount}/{total}
            </span>
          </div>

          {/* Divider */}
          <span className="h-6 w-px bg-slate-200 dark:bg-[#1f2a44]" aria-hidden />

          {/* Timer pill */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-black tabular-nums transition ${
              timeTone === "danger"
                ? "bg-red-100 text-red-700 motion-safe:animate-pulse dark:bg-red-950/60 dark:text-red-300"
                : timeTone === "warn"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            <span aria-hidden>⏱</span>
            <span>{timeDisplay}</span>
          </div>

          {/* Submit */}
          <button
            onClick={() => submit(true)}
            disabled={submitting}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60 sm:px-5 sm:py-2 sm:text-sm"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>

      {/* ============================================================
          INTRO STRIP — small helper text above the question list
          ============================================================ */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-[#1f2a44] dark:bg-[#131c33]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-[#f1f5f9]">
              {total} questions · passing score {passingScore}%
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-[#94a3b8]">
              You have {formatTime(total * QUESTION_TIME_SECONDS)} total. Answer
              every question you can — the exam submits automatically when time
              runs out.
            </p>
          </div>
          <div className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-slate-100 dark:bg-[#0e1526]">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {submitError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          ⚠ {submitError}
        </div>
      )}

      {/* ============================================================
          QUESTION LIST — one card per question, stacked.
          ============================================================ */}
      <ol className="mt-6 space-y-5">
        {questions.map((q, qi) => {
          const selected = answers[qi];
          const isAnswered = selected !== undefined;

          return (
            <li
              key={qi}
              id={`question-${qi + 1}`}
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 dark:border-[#1f2a44] dark:bg-[#131c33] dark:hover:border-blue-700 sm:p-6"
            >
              {/* Question header */}
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black transition ${
                    isAnswered
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "bg-slate-100 text-slate-500 dark:bg-[#1b2742] dark:text-[#94a3b8]"
                  }`}
                >
                  {qi + 1}
                </span>
                <p className="flex-1 pt-1 text-base font-black leading-snug text-slate-900 dark:text-[#f1f5f9] sm:text-lg">
                  {q.question}
                </p>
              </div>

              {/* Options */}
              <div className="mt-4 space-y-2 pl-11">
                {q.options.map((opt, oi) => {
                  const isSelected = selected === oi;
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() =>
                        setAnswers((a) => ({ ...a, [qi]: oi }))
                      }
                      className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:border-blue-600"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-black ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 dark:bg-[#1b2742]"
                        }`}
                      >
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {/* ============================================================
          BOTTOM SUBMIT — big, obvious, after the last question.
          ============================================================ */}
      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1f2a44] dark:bg-[#131c33] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900 dark:text-[#f1f5f9]">
            {answeredCount === total
              ? "All questions answered ✓"
              : `${answeredCount} of ${total} answered`}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-[#94a3b8]">
            Time remaining:{" "}
            <span className="font-bold tabular-nums">{timeDisplay}</span>
          </p>
        </div>

        <button
          onClick={() => submit(true)}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-3.5 font-black text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Submitting…
            </>
          ) : (
            <>Submit exam →</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Helpers
   ============================================================ */
function formatTime(seconds: number | null): string {
  if (seconds === null || seconds < 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}