"use client";

import { useEffect, useState } from "react";
import { Field, inputCls, Btn } from "./ui";
import type { AudienceFilter as FilterType } from "@/lib/audience";

type Course = { id: string; title: string; icon: string | null };

export default function AudienceFilter({
  value,
  onChange,
  courses,
}: {
  value: FilterType;
  onChange: (next: FilterType) => void;
  courses: Course[];
}) {
  // Local form state so we don't spam onChange on every keystroke
  const [local, setLocal] = useState(value);

  // Reset local when parent resets
  useEffect(() => {
    setLocal(value);
  }, [value]);

  function patch<K extends keyof any>(key: K, val: any) {
    const next = { ...local, [key]: val } as FilterType;
    setLocal(next);
    onChange(next);
  }

  if (local.mode === "quick") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            { key: "all", label: "All users" },
            { key: "students", label: "Students only" },
            { key: "admins", label: "Admins only" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() =>
              onChange({ mode: "quick", quick: opt.key })
            }
            className={`rounded-xl border p-3 text-left text-sm font-bold transition ${
              local.mode === "quick" && local.quick === opt.key
                ? "border-purple-500 bg-purple-50 text-purple-700 dark:border-purple-500 dark:bg-purple-950/40 dark:text-purple-300"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (local.mode === "user") {
    return (
      <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
        Sending to a specific user. Pick them below.
      </p>
    );
  }

  // ----- Segment mode -----
  return (
    <div className="space-y-4 rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-800 dark:bg-purple-950/20">
      <p className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
        Segment filter
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Course">
          <select
            className={inputCls}
            value={local.courseId ?? ""}
            onChange={(e) => patch("courseId", e.target.value || null)}
          >
            <option value="">Any course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Enrollment rule">
          <select
            className={inputCls}
            value={local.courseRule ?? "enrolled"}
            onChange={(e) =>
              patch("courseRule", e.target.value as "enrolled" | "not_enrolled")
            }
          >
            <option value="enrolled">Enrolled in course</option>
            <option value="not_enrolled">Not enrolled in course</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Enrolled after" hint="Leave blank for no lower bound">
          <input
            type="date"
            className={inputCls}
            value={local.enrolledAfter?.slice(0, 10) ?? ""}
            onChange={(e) =>
              patch(
                "enrolledAfter",
                e.target.value ? `${e.target.value}T00:00:00.000Z` : null
              )
            }
          />
        </Field>
        <Field label="Enrolled before" hint="Leave blank for no upper bound">
          <input
            type="date"
            className={inputCls}
            value={local.enrolledBefore?.slice(0, 10) ?? ""}
            onChange={(e) =>
              patch(
                "enrolledBefore",
                e.target.value ? `${e.target.value}T23:59:59.999Z` : null
              )
            }
          />
        </Field>
      </div>

      <Field label="Progress" hint="Only applies when a course is selected">
        <select
          className={inputCls}
          value={local.progressRule ?? "any"}
          onChange={(e) =>
            patch(
              "progressRule",
              e.target.value as
                | "any"
                | "not_started"
                | "in_progress"
                | "completed"
            )
          }
          disabled={!local.courseId}
        >
          <option value="any">Any progress</option>
          <option value="not_started">Has not started</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </Field>

      <Field label="Role">
        <select
          className={inputCls}
          value={local.role ?? "any"}
          onChange={(e) =>
            patch("role", e.target.value as "any" | "student" | "admin")
          }
        >
          <option value="any">Any role</option>
          <option value="student">Students only</option>
          <option value="admin">Admins only</option>
        </select>
      </Field>

      <Btn
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange({
            mode: "segment",
            courseId: null,
            courseRule: "enrolled",
            enrolledAfter: null,
            enrolledBefore: null,
            progressRule: "any",
            role: "any",
          })
        }
      >
        Reset filters
      </Btn>
    </div>
  );
}