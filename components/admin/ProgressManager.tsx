"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Btn,
  SearchBar,
  Badge,
  EmptyState,
  toast,
  exportCSV,
  inputCls,
} from "./ui";
import NudgeModal from "./NudgeModal";
import { sendBulkNudge } from "@/app/admin/progress/actions";

type Row = {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseIcon: string | null;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  state: "not_started" | "in_progress" | "completed";
  nextLessonTitle: string | null;
  lastActivityAt: string | null;
  enrolledAt: string;
  stalled: boolean;
};

type StateFilter =
  | "all"
  | "not_started"
  | "in_progress"
  | "completed"
  | "stalled";

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

export default function ProgressManager({
  rows,
  courses,
}: {
  rows: Row[];
  courses: { id: string; title: string }[];
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StateFilter>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [nudgeTarget, setNudgeTarget] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (r.userName ?? "").toLowerCase().includes(q) ||
        (r.userEmail ?? "").toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q);

      const matchesFilter =
        filter === "all"
          ? true
          : filter === "stalled"
          ? r.stalled
          : r.state === filter;

      const matchesCourse =
        courseFilter === "all" || r.courseId === courseFilter;

      return matchesSearch && matchesFilter && matchesCourse;
    });
  }, [rows, search, filter, courseFilter]);

  const counts = useMemo(() => {
    return {
      all: rows.length,
      not_started: rows.filter((r) => r.state === "not_started").length,
      in_progress: rows.filter((r) => r.state === "in_progress").length,
      completed: rows.filter((r) => r.state === "completed").length,
      stalled: rows.filter((r) => r.stalled).length,
    };
  }, [rows]);

  function rowKey(r: Row) {
    return `${r.userId}:${r.courseId}`;
  }

  function toggleSelect(key: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(rowKey)));
  }

  async function runBulk() {
    const targets = filtered
      .filter((r) => selected.has(rowKey(r)))
      .filter((r) => r.state !== "completed") // skip completed
      .map((r) => ({ userId: r.userId, courseId: r.courseId }));

    if (targets.length === 0) {
      toast("Nothing to nudge (completed students are skipped)", "err");
      return;
    }

    setBulkBusy(true);
    const res = await sendBulkNudge({ targets, sendEmail: false });
    setBulkBusy(false);

    if (!res.ok) {
      toast(res.error ?? "Bulk send failed", "err");
      return;
    }

    toast(`Sent ${res.sent} nudge${res.sent === 1 ? "" : "s"}${res.failed ? ` · ${res.failed} failed` : ""}`);
    setSelected(new Set());
    setBulkOpen(false);
    router.refresh();
  }

  function handleExport() {
    exportCSV(
      "koyocode-progress.csv",
      filtered.map((r) => ({
        name: r.userName ?? "",
        email: r.userEmail ?? "",
        course: r.courseTitle,
        completed: r.completedLessons,
        total: r.totalLessons,
        percent: `${r.percent}%`,
        state: r.state,
        stalled: r.stalled ? "yes" : "",
        next_lesson: r.nextLessonTitle ?? "",
        last_activity: r.lastActivityAt ?? "",
      })),
      [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "course", label: "Course" },
        { key: "completed", label: "Completed" },
        { key: "total", label: "Total" },
        { key: "percent", label: "Percent" },
        { key: "state", label: "State" },
        { key: "stalled", label: "Stalled" },
        { key: "next_lesson", label: "Next lesson" },
        { key: "last_activity", label: "Last activity" },
      ]
    );
  }

  return (
    <div>
      <PageHeader
        title="Progress"
        subtitle={`${counts.all} enrollments · ${counts.in_progress} in progress · ${counts.stalled} stalled · ${counts.completed} completed`}
        action={
          <Btn variant="ghost" size="sm" onClick={handleExport}>
            ⬇ CSV
          </Btn>
        }
      />

      {/* FILTERS */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by student, email, or course..."
          />
        </div>

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className={inputCls + " !w-auto"}
        >
          <option value="all">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-1">
          {(
            [
              ["all", "All"],
              ["in_progress", "In progress"],
              ["stalled", "Stalled"],
              ["not_started", "Not started"],
              ["completed", "Completed"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key as StateFilter)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filter === key
                  ? "bg-purple-700 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-[#1f2a44] dark:text-[#cbd5e1]"
              }`}
            >
              {label} ({counts[key as keyof typeof counts]})
            </button>
          ))}
        </div>
      </div>

      {/* BULK BAR */}
      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 dark:border-purple-800 dark:bg-purple-950/40">
          <p className="text-sm font-bold text-purple-800 dark:text-purple-300">
            {selected.size} selected
          </p>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 dark:text-purple-300"
          >
            Clear
          </button>
          <div className="ml-auto">
            <Btn size="sm" onClick={() => setBulkOpen(true)} disabled={bulkBusy}>
              {bulkBusy ? "Sending…" : `Nudge selected (${selected.size})`}
            </Btn>
          </div>
        </div>
      )}

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="📊"
            title="No progress found"
            description="Adjust the filters to see student progress."
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left dark:bg-[#0e1526]">
                <tr className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                  <th className="w-10 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={
                        selected.size > 0 &&
                        selected.size === filtered.length
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-purple-700"
                    />
                  </th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">State</th>
                  <th className="px-5 py-3">Last active</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
                {filtered.map((r) => {
                  const key = rowKey(r);
                  const isSelected = selected.has(key);
                  const isCompleted = r.state === "completed";

                  return (
                    <tr
                      key={key}
                      className="hover:bg-slate-50 dark:hover:bg-[#1b2742]"
                    >
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(key)}
                          className="h-4 w-4 rounded border-slate-300 text-purple-700"
                        />
                      </td>

                      <td className="px-5 py-3">
                        <p className="truncate font-bold text-slate-900 dark:text-[#f1f5f9]">
                          {r.userName ?? "Unnamed"}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-[#94a3b8]">
                          {r.userEmail ?? "—"}
                        </p>
                      </td>

                      <td className="px-5 py-3">
                        <p className="truncate text-slate-700 dark:text-[#cbd5e1]">
                          {r.courseIcon} {r.courseTitle}
                        </p>
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-[#0e1526]">
                            <div
                              className={`h-full rounded-full ${
                                isCompleted
                                  ? "bg-emerald-500"
                                  : "bg-purple-600"
                              }`}
                              style={{ width: `${r.percent}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-xs font-bold text-slate-700 dark:text-[#cbd5e1]">
                            {r.completedLessons}/{r.totalLessons}
                          </span>
                        </div>
                        {r.nextLessonTitle && (
                          <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-[#94a3b8]">
                            Next: {r.nextLessonTitle}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        {r.stalled ? (
                          <Badge tone="amber">⚠ stalled</Badge>
                        ) : r.state === "completed" ? (
                          <Badge tone="emerald">✓ completed</Badge>
                        ) : r.state === "in_progress" ? (
                          <Badge tone="purple">in progress</Badge>
                        ) : (
                          <Badge tone="blue">not started</Badge>
                        )}
                      </td>

                      <td className="px-5 py-3 text-slate-500 dark:text-[#94a3b8]">
                        {timeAgo(r.lastActivityAt)}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <Btn
                          size="sm"
                          variant={isCompleted ? "ghost" : "success"}
                          onClick={() => setNudgeTarget(r)}
                          disabled={isCompleted && !r.nextLessonTitle}
                        >
                          {isCompleted ? "Congratulate" : "Nudge"}
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NUDGE MODAL */}
      <NudgeModal
        open={!!nudgeTarget}
        onClose={() => setNudgeTarget(null)}
        onSent={() => router.refresh()}
        userId={nudgeTarget?.userId ?? null}
        courseId={nudgeTarget?.courseId ?? null}
        userName={nudgeTarget?.userName ?? null}
        courseTitle={nudgeTarget?.courseTitle ?? null}
      />

      {/* BULK MODAL */}
      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#1f2a44] dark:bg-[#131c33]">
            <p className="text-lg font-black text-slate-900 dark:text-[#f1f5f9]">
              Nudge {selected.size} students?
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
              Each student gets a message with their <strong>own</strong> next
              lesson link. Completed students are skipped.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setBulkOpen(false)}>
                Cancel
              </Btn>
              <Btn onClick={runBulk} disabled={bulkBusy}>
                {bulkBusy ? "Sending…" : "Send nudges"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}