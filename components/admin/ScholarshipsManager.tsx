"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PageHeader,
  Btn,
  SearchBar,
  Badge,
  EmptyState,
  Modal,
  toast,
  exportCSV,
} from "./ui";

type Application = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  age_range: string | null;
  background: string | null;
  motivation: string;
  course_id: string | null;
  status: string;
  user_id: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  course: { title: string; icon: string | null } | null;
};

type Course = { id: string; title: string; is_premium: boolean };

export default function ScholarshipsManager({
  applications,
  courses,
}: {
  applications: Application[];
  courses: Course[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "waitlisted"
  >("pending");
  const [selected, setSelected] = useState<Application | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      const matchesSearch =
        a.full_name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || a.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [applications, search, filter]);

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    waitlisted: applications.filter((a) => a.status === "waitlisted").length,
  };

  async function approve(app: Application) {
    if (!app.course_id) {
      toast("No course attached to this application", "err");
      return;
    }

    setBusyId(app.id);

    try {
      // Call our API to create the user, enroll them, and grant access
      const res = await fetch("/api/admin/scholarship/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: app.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Approval failed", "err");
        setBusyId(null);
        return;
      }

      toast(`Approved. Login sent to ${app.email}`);
      setSelected(null);
      router.refresh();
    } catch (e: any) {
      toast(e.message ?? "Failed", "err");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(app: Application) {
    setBusyId(app.id);
    const { error } = await supabase
      .from("scholarship_applications")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", app.id);
    setBusyId(null);
    if (error) return toast(error.message, "err");
    toast("Application rejected");
    setSelected(null);
    router.refresh();
  }

  async function waitlist(app: Application) {
    setBusyId(app.id);
    const { error } = await supabase
      .from("scholarship_applications")
      .update({
        status: "waitlisted",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", app.id);
    setBusyId(null);
    if (error) return toast(error.message, "err");
    toast("Moved to waitlist");
    setSelected(null);
    router.refresh();
  }

  function handleExport() {
    exportCSV(
      "koyocode-scholarships.csv",
      filtered.map((a) => ({
        name: a.full_name,
        email: a.email,
        phone: a.phone ?? "",
        city: a.city ?? "",
        age: a.age_range ?? "",
        background: a.background ?? "",
        course: a.course?.title ?? "",
        status: a.status,
        applied: new Date(a.created_at).toISOString().slice(0, 10),
      })),
      [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "city", label: "City" },
        { key: "age", label: "Age" },
        { key: "background", label: "Background" },
        { key: "course", label: "Requested Course" },
        { key: "status", label: "Status" },
        { key: "applied", label: "Applied" },
      ]
    );
  }

  return (
    <div>
      <PageHeader
        title="Scholarships"
        subtitle={`${counts.pending} pending · ${counts.approved} approved · ${counts.rejected} rejected`}
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
            placeholder="Search by name or email..."
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {(["pending", "approved", "waitlisted", "rejected", "all"] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                  filter === f
                    ? "bg-purple-700 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-[#1f2a44] dark:text-[#cbd5e1]"
                }`}
              >
                {f} ({counts[f]})
              </button>
            )
          )}
        </div>
      </div>

      {/* LIST */}
      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🎓"
            title={`No ${filter} applications`}
            description={
              filter === "pending"
                ? "New applications will appear here."
                : "Try a different filter."
            }
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
          <ul className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
            {filtered.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-[#1b2742]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-black text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {a.full_name
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-bold text-slate-900 dark:text-[#f1f5f9]">
                      {a.full_name}
                    </p>
                    <Badge
                      tone={
                        a.status === "approved"
                          ? "emerald"
                          : a.status === "pending"
                          ? "amber"
                          : a.status === "waitlisted"
                          ? "blue"
                          : "red"
                      }
                    >
                      {a.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-[#94a3b8]">
                    {a.email} · {a.city ?? "—"} ·{" "}
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-[#cbd5e1]">
                    {a.motivation}
                  </p>
                  {a.course && (
                    <p className="mt-2 text-xs font-bold text-blue-700 dark:text-blue-400">
                      Requested: {a.course.icon} {a.course.title}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  {a.status === "pending" && (
                    <>
                      <Btn
                        size="sm"
                        variant="success"
                        onClick={() => approve(a)}
                        disabled={busyId === a.id}
                      >
                        Approve
                      </Btn>
                      <Btn
                        size="sm"
                        variant="ghost"
                        onClick={() => waitlist(a)}
                        disabled={busyId === a.id}
                      >
                        Waitlist
                      </Btn>
                      <Btn
                        size="sm"
                        variant="danger"
                        onClick={() => reject(a)}
                        disabled={busyId === a.id}
                      >
                        Reject
                      </Btn>
                    </>
                  )}
                  <Btn
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelected(a)}
                  >
                    View
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* DETAIL MODAL */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.full_name ?? ""}
        size="lg"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                  Email
                </p>
                <p className="mt-1 text-slate-900 dark:text-[#f1f5f9]">
                  {selected.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                  Phone
                </p>
                <p className="mt-1 text-slate-900 dark:text-[#f1f5f9]">
                  {selected.phone ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                  City
                </p>
                <p className="mt-1 text-slate-900 dark:text-[#f1f5f9]">
                  {selected.city ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                  Age range
                </p>
                <p className="mt-1 text-slate-900 dark:text-[#f1f5f9]">
                  {selected.age_range ?? "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                Background
              </p>
              <p className="mt-1 text-slate-900 dark:text-[#f1f5f9]">
                {selected.background ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                Requested course
              </p>
              <p className="mt-1 text-slate-900 dark:text-[#f1f5f9]">
                {selected.course?.icon} {selected.course?.title ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                Motivation
              </p>
              <p className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-slate-700 dark:bg-[#0e1526] dark:text-[#cbd5e1]">
                {selected.motivation}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}