"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PageHeader,
  Btn,
  SearchBar,
  EmptyState,
  ConfirmDialog,
  toast,
  exportCSV,
  Badge,
} from "./ui";

type Row = {
  id: string;
  enrolled_at: string;
  user_id: string;
  course_id: string;
  user_name: string | null;
  course_title: string | null;
  course_icon: string | null;
};

export default function EnrollmentsManager({
  rows,
  courses,
}: {
  rows: Row[];
  courses: { id: string; title: string }[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch = (r.user_name ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCourse =
        filterCourse === "all" || r.course_id === filterCourse;
      return matchesSearch && matchesCourse;
    });
  }, [rows, search, filterCourse]);

  async function remove(r: Row) {
    setBusyId(r.id);
    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", r.id);
    setBusyId(null);
    setConfirmDelete(null);
    if (error) return toast(error.message, "err");
    toast("Enrollment removed");
    router.refresh();
  }

  async function bulkRemove() {
    if (selected.size === 0) return;
    setBusyId("bulk");
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("enrollments")
      .delete()
      .in("id", ids);
    setBusyId(null);
    if (error) return toast(error.message, "err");
    toast(`${ids.length} enrollment${ids.length === 1 ? "" : "s"} removed`);
    setSelected(new Set());
    router.refresh();
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  }

  function handleExport() {
    exportCSV(
      "koyocode-enrollments.csv",
      filtered.map((r) => ({
        student: r.user_name ?? "",
        course: r.course_title ?? "",
        enrolled: new Date(r.enrolled_at).toISOString().slice(0, 10),
      })),
      [
        { key: "student", label: "Student" },
        { key: "course", label: "Course" },
        { key: "enrolled", label: "Enrolled" },
      ]
    );
  }

  return (
    <div>
      <PageHeader
        title="Enrollments"
        subtitle={`${rows.length} total · showing ${filtered.length}`}
      />

      {/* FILTERS */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by student..."
          />
        </div>

        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#f1f5f9]"
        >
          <option value="all">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <Btn variant="ghost" size="sm" onClick={handleExport}>
          ⬇ CSV
        </Btn>
      </div>

      {/* BULK */}
      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 dark:border-purple-800 dark:bg-purple-950/40">
          <p className="text-sm font-bold text-purple-800 dark:text-purple-300">
            {selected.size} selected
          </p>
          <Btn size="sm" variant="danger" onClick={bulkRemove}>
            Remove
          </Btn>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs font-bold text-purple-700 hover:text-purple-900 dark:text-purple-300"
          >
            Clear
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="✍️"
            title="No enrollments"
            description="When students enroll in courses, they'll appear here."
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
                        selected.size > 0 && selected.size === filtered.length
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-purple-700"
                    />
                  </th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Enrolled</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#1b2742]"
                  >
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="h-4 w-4 rounded border-slate-300 text-purple-700"
                      />
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900 dark:text-[#f1f5f9]">
                      {r.user_name ?? "Unnamed"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-[#94a3b8]">
                      {r.course_icon} {r.course_title}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-[#94a3b8]">
                      {new Date(r.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Btn
                        size="sm"
                        variant="danger"
                        onClick={() => setConfirmDelete(r)}
                        disabled={busyId === r.id}
                      >
                        Remove
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        title="Remove enrollment?"
        message={`Remove "${confirmDelete?.user_name}" from "${confirmDelete?.course_title}"? Their progress on this course will remain but they won't see it as enrolled.`}
        confirmLabel="Remove"
      />
    </div>
  );
}