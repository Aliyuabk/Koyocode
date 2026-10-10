"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ExamSettingsForm({
  courseId,
  initial,
}: {
  courseId: string;
  initial: {
    passing_score: number;
    question_count: number;
    is_enabled: boolean;
  } | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [passing, setPassing] = useState(initial?.passing_score ?? 70);
  const [count, setCount] = useState(initial?.question_count ?? 10);
  const [enabled, setEnabled] = useState(initial?.is_enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);

    const { error } = await supabase.from("course_exam_settings").upsert(
      {
        course_id: courseId,
        passing_score: passing,
        question_count: count,
        is_enabled: enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "course_id" }
    );

    setSaving(false);
    if (error) {
      setMsg("⚠ " + error.message);
      return;
    }
    setMsg("✓ Saved");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
      <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
        Final exam settings
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
        When a student finishes all lessons, the exam is generated automatically
        for them using AI.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-bold text-slate-700 dark:text-[#cbd5e1]">
            Passing score (%)
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={passing}
            onChange={(e) => setPassing(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#f1f5f9]"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700 dark:text-[#cbd5e1]">
            Questions per exam
          </label>
          <input
            type="number"
            min={3}
            max={30}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#f1f5f9]"
          />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-slate-700 dark:text-[#cbd5e1]">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-700"
        />
        Enable final exam for this course
      </label>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
        {msg && (
          <span className="text-sm font-bold text-slate-700 dark:text-[#cbd5e1]">
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}