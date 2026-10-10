"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "./ui";

type Row = {
  id: string;
  issued_at: string;
  verification_code: string;
  user: { full_name: string | null } | null;
  course: { title: string; icon: string | null } | null;
};

export default function CertificatesManager({ rows }: { rows: Row[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function revoke(r: Row) {
    if (!confirm("Revoke this certificate? The student will lose access.")) return;
    setBusyId(r.id);
    await supabase.from("certificates").delete().eq("id", r.id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="Certificates" subtitle={`${rows.length} issued`} />

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left dark:bg-[#0e1526]">
              <tr className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Issued</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
              {rows.map((r) => {
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
                    <td className="px-5 py-3 font-mono text-xs dark:text-[#cbd5e1]">
                      {r.verification_code}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-[#94a3b8]">
                      {new Date(r.issued_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/verify/${r.verification_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
                        >
                          Verify
                        </a>
                        <button
                          onClick={() => revoke(r)}
                          disabled={busyId === r.id}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500 dark:text-[#94a3b8]">
                    No certificates yet.
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