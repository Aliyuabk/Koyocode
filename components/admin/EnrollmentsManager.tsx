"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "./ui";

type Row = {
  id: string;
  enrolled_at: string;
  user: { full_name: string | null } | null;
  course: { title: string; icon: string | null } | null;
};

export default function EnrollmentsManager({ rows }: { rows: Row[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = rows.filter((r) => {
    const name = Array.isArray(r.user) ? r.user[0]?.full_name : r.user?.full_name;
    return (name ?? "").toLowerCase().includes(search.toLowerCase());
  });

  async function remove(r: Row) {
    if (!confirm("Remove this enrollment?")) return;
    setBusyId(r.id);
    await supabase.from("enrollments").delete().eq("id", r.id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="Enrollments" subtitle={`${rows.length} total`} />

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
        <div className="border-b border-slate-100 p-4 dark:border-[#1f2a44]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name..."
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#f1f5f9]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left dark:bg-[#0e1526]">
              <tr className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Enrolled</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
              {filtered.map((r) => {
                const profile = Array.isArray(r.user) ? r.user[0] : r.user;
                const course = Array.isArray(r.course) ? r.course[0] : r.course;
                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-[#1b2742]">
                    <td className="px-5 py-3 font-bold dark:text-[#f1f5f9]">
                      {profile?.full_name ?? "Unnamed"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-[#94a3b8]">
                      {course?.icon} {course?.title}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-[#94a3b8]">
                      {new Date(r.enrolled_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => remove(r)}
                        disabled={busyId === r.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-500 dark:text-[#94a3b8]">
                    No enrollments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}