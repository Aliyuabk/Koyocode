"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { adminIssueCertificate } from "@/app/admin/certificates/actions";
import {
  PageHeader,
  Btn,
  SearchBar,
  EmptyState,
  ConfirmDialog,
  toast,
  exportCSV,
} from "./ui";

type Row = {
  id: string;
  issued_at: string;
  verification_code: string;
  user_id: string;
  course_id: string;
  user_name: string | null;
  course_title: string | null;
  course_icon: string | null;
};

type Pending = {
  user_id: string;
  course_id: string;
  user_name: string | null;
  course_title: string | null;
  course_icon: string | null;
  score: number;
  completed_at: string;
};

export default function CertificatesManager({
  rows,
  courses,
  pending,
}: {
  rows: Row[];
  courses: { id: string; title: string }[];
  pending: Pending[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [showPending, setShowPending] = useState(false);
  const [issuing, setIssuing] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch =
        (r.user_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        r.verification_code.toLowerCase().includes(search.toLowerCase());
      const matchesCourse =
        filterCourse === "all" || r.course_id === filterCourse;
      return matchesSearch && matchesCourse;
    });
  }, [rows, search, filterCourse]);

  async function revoke(r: Row) {
    setBusyId(r.id);
    const { error } = await supabase
      .from("certificates")
      .delete()
      .eq("id", r.id);
    setBusyId(null);
    setConfirmDelete(null);
    if (error) return toast(error.message, "err");
    toast("Certificate revoked");
    router.refresh();
  }

  async function issue(p: Pending) {
    const key = `${p.user_id}:${p.course_id}`;
    setIssuing(key);
    const res = await adminIssueCertificate(p.user_id, p.course_id);
    setIssuing(null);
    if (!res.ok) return toast(res.error, "err");
    toast(`Issued: ${res.verification_code.slice(0, 8)}…`);
    router.refresh();
  }

  function handleExport() {
    exportCSV(
      "koyocode-certificates.csv",
      filtered.map((r) => ({
        student: r.user_name ?? "",
        course: r.course_title ?? "",
        code: r.verification_code,
        issued: new Date(r.issued_at).toISOString().slice(0, 10),
      })),
      [
        { key: "student", label: "Student" },
        { key: "course", label: "Course" },
        { key: "code", label: "Verification Code" },
        { key: "issued", label: "Issued" },
      ]
    );
  }

  return (
    <div>
      <PageHeader
        title="Certificates"
        subtitle={`${rows.length} total · showing ${filtered.length}`}
      />

      {/* PENDING BANNER */}
      {pending.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                ⚠ {pending.length} certificate{pending.length === 1 ? "" : "s"}{" "}
                pending
              </p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                These students passed their exam but no certificate was
                issued.
              </p>
            </div>
            <button
              onClick={() => setShowPending(true)}
              className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-600/20 transition hover:bg-amber-700"
            >
              Review & issue →
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or code..."
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

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🏆"
            title="No certificates yet"
            description="Certificates are issued automatically when students pass their final exams."
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
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Issued</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#1b2742]"
                  >
                    <td className="px-5 py-3 font-bold text-slate-900 dark:text-[#f1f5f9]">
                      {r.user_name ?? "Unnamed"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-[#94a3b8]">
                      {r.course_icon} {r.course_title}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700 dark:text-[#cbd5e1]">
                      {r.verification_code}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-[#94a3b8]">
                      {new Date(r.issued_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/verify/${r.verification_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
                        >
                          Verify
                        </a>
                        <Btn
                          size="sm"
                          variant="danger"
                          onClick={() => setConfirmDelete(r)}
                          disabled={busyId === r.id}
                        >
                          Revoke
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

      {/* PENDING MODAL */}
      {showPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1f2a44] dark:bg-[#131c33]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-[#1f2a44]">
              <p className="font-black text-slate-900 dark:text-[#f1f5f9]">
                Pending certificates
              </p>
              <button
                onClick={() => setShowPending(false)}
                className="text-slate-400 transition hover:text-slate-700 dark:hover:text-[#cbd5e1]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6">
              <ul className="space-y-3">
                {pending.map((p) => {
                  const key = `${p.user_id}:${p.course_id}`;
                  const busy = issuing === key;
                  return (
                    <li
                      key={key}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1f2a44] dark:bg-[#0e1526]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
                          {p.user_name ?? "Unnamed"}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-[#94a3b8]">
                          {p.course_icon} {p.course_title} · Scored {p.score}%
                          on{" "}
                          {new Date(p.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Btn
                        size="sm"
                        onClick={() => issue(p)}
                        disabled={busy}
                      >
                        {busy ? "Issuing…" : "Issue certificate"}
                      </Btn>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && revoke(confirmDelete)}
        title="Revoke certificate?"
        message={`The certificate for "${confirmDelete?.user_name}" on "${confirmDelete?.course_title}" will be deleted. The public verify link will stop working.`}
        confirmLabel="Revoke"
      />
    </div>
  );
}