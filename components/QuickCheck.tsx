"use client";

import { useState } from "react";

type Props = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string | null;
  onAnswered?: (correct: boolean) => void;
};

export default function QuickCheck({
  question,
  options,
  correctIndex,
  explanation,
  onAnswered,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const isCorrect = selected === correctIndex;

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
    setAttempts((a) => a + 1);
    onAnswered?.(selected === correctIndex);
  }

  function handleTryAgain() {
    setSelected(null);
    setSubmitted(false);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
          ❓ Quick check
        </h2>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
          Ungraded
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
        <p className="text-base font-bold leading-7 text-slate-900 dark:text-[#f1f5f9]">
          {question}
        </p>

        <div className="mt-5 space-y-2">
          {options.map((opt, i) => {
            const chosen = selected === i;
            const isRight = i === correctIndex;
            const showRight = submitted && isRight;
            const showWrong = submitted && chosen && !isRight;

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (submitted && isRight) return; // don't un-select a correct answer
                  setSelected(i);
                  if (submitted) setSubmitted(false);
                }}
                disabled={submitted && isRight}
                className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition ${
                  showRight
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : showWrong
                    ? "border-red-500 bg-red-50 text-red-800 dark:border-red-500 dark:bg-red-950/40 dark:text-red-300"
                    : chosen
                    ? "border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:border-blue-600"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-black ${
                    showRight
                      ? "bg-emerald-600 text-white"
                      : showWrong
                      ? "bg-red-600 text-white"
                      : chosen
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-[#1b2742]"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
                {showRight && <span className="text-emerald-600">✓</span>}
                {showWrong && <span className="text-red-600">✕</span>}
              </button>
            );
          })}
        </div>

        {/* ACTIONS */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {!submitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selected === null}
              className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              Check answer
            </button>
          ) : isCorrect ? (
            <div className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              ✓ Correct!
            </div>
          ) : (
            <>
              <div className="flex-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                ✗ Not quite. Try again.
              </div>
              <button
                type="button"
                onClick={handleTryAgain}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
              >
                Try again
              </button>
            </>
          )}
        </div>

        {/* EXPLANATION — shown after correct or after 3 attempts */}
        {submitted && (isCorrect || attempts >= 3) && explanation && (
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-[#1f2a44] dark:bg-[#10182b]">
            <p className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Why
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-[#cbd5e1]">
              {explanation}
            </p>
          </div>
        )}

        {/* After 3 wrong attempts, show the correct answer */}
        {submitted && !isCorrect && attempts >= 3 && (
          <p className="mt-3 text-center text-xs text-slate-500 dark:text-[#94a3b8]">
            The correct answer is{" "}
            <strong>{String.fromCharCode(65 + correctIndex)}</strong>.
          </p>
        )}
      </div>
    </section>
  );
}