"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PageHeader,
  Btn,
  SearchBar,
  EmptyState,
  Badge,
  toast,
  exportCSV,
} from "./ui";

type CourseExam = {
  course_id: string;
  passing_score: number;
  question_count: number;
  is_enabled: boolean;
  course_title: string | null;
  course_icon: string | null;
  course_slug: string | null;
};

type Attempt = {
  id: string;
  score: number;
  passed: boolean;
  completed_at: string;
  user_name: string | null;
  course_title: string | null;
};

export default function ExamsManager({
  courseExams,
  attempts,
}: {
  courseExams: CourseExam[];
  attempts: Attempt[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [tab, setTab] = useState<"settings" | "attempts">("settings");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredAttempts = useMemo(() => {
    return attempts.filter(
      (a) =>
        (a.user_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (a.course_title ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [attempts, search]);

  const passRate = attempts.length
    ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100)
    : 0;

  async function toggleEnabled(c: CourseExam) {
    setBusyId(c.course_id);
    const { error } = await supabase
      .from("course_exam_settings")
      .update({ is_enabled: !c.is_enabled })
      .eq("course_id", c.course_id);
    setBusyId(null);
    if (error) return toast(error.message, "err");
    toast(c.is_enabled ? "Exam disabled" : "Exam enabled");
    router.refresh();
  }

  function handleExport() {
    exportCSV(
      "koyocode-exam-attempts.csv",
      filteredAttempts.map((a) => ({
        student: a.user_name ?? "",
        course: a.course_title ?? "",
        score: a.score,
        passed: a.passed ? "Yes" : "No",
        date: new Date(a.completed_at).toISOString().slice(0, 10),
      })),
      [
        { key: "student", label: "Student" },
        { key: "course", label: "Course" },
        { key: "score", label: "Score (%)" },
        { key: "passed", label: "Passed" },
        { key: "date", label: "Date" },
      ]
    );
  }

  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle={`${courseExams.length} courses · ${attempts.length} attempts · ${passRate}% pass rate`}
        action={
          <div className="flex gap-2">
            <Btn
              size="sm"
              variant={tab === "settings" ? "primary" : "ghost"}
              onClick={() => setTab("settings")}
            >
              Settings
            </Btn>
            <Btn
              size="sm"
              variant={tab === "attempts" ? "primary" : "ghost"}
              onClick={() => setTab("attempts")}
            >
              Attempts
            </Btn>
          </div>
        }
      />

      {tab === "settings" && (
        <>
          {courseExams.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon="🎯"
                title="No exam settings yet"
                description="Open any course to configure its final exam."
              />
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left dark:bg-[#0e1526]">
                    <tr className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                      <th className="px-5 py-3">Course</th>
                      <th className="px-5 py-3">Questions</th>
                      <th className="px-5 py-3">Pass score</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
                    {courseExams.map((c) => (
                      <tr
                        key={c.course_id}
                        className="hover:bg-slate-50 dark:hover:bg-[#1b2742]"
                      >
                        <td className="px-5 py-3 font-bold text-slate-900 dark:text-[#f1f5f9]">
                          {c.course_icon} {c.course_title}
                        </td>
                        <td className="px-5 py-3 text-slate-700 dark:text-[#cbd5e1]">
                          {c.question_count}
                        </td>
                        <td className="px-5 py-3 text-slate-700 dark:text-[#cbd5e1]">
                          {c.passing_score}%
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={c.is_enabled ? "emerald" : "slate"}>
                            {c.is_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/courses/${c.course_slug}`}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
                            >
                              Configure
                            </Link>
                            <Btn
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleEnabled(c)}
                              disabled={busyId === c.course_id}
                            >
                              {c.is_enabled ? "Disable" : "Enable"}
                            </Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "attempts" && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="min-w-[220px] flex-1">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by student or course..."
              />
            </div>
            <Btn variant="ghost" size="sm" onClick={handleExport}>
              ⬇ CSV
            </Btn>
          </div>

          {filteredAttempts.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon="📝"
                title="No attempts yet"
                description="Attempts appear here as students take exams."
              />
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left dark:bg-[#0e1526]">
                    <tr className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3">Course</th>
                      <th className="px-5 py-3">Score</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
                    {filteredAttempts.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50 dark:hover:bg-[#1b2742]"
                      >
                        <td className="px-5 py-3 font-bold text-slate-900 dark:text-[#f1f5f9]">
                          {a.user_name ?? "Unnamed"}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-[#94a3b8]">
                          {a.course_title}
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-700 dark:text-[#cbd5e1]">
                          {a.score}%
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={a.passed ? "emerald" : "red"}>
                            {a.passed ? "Passed" : "Failed"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-slate-500 dark:text-[#94a3b8]">
                          {new Date(a.completed_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}