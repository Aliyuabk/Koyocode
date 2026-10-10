"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, Btn, Modal, Field, inputCls } from "./ui";

type Row = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  enrollments: number;
  completed: number;
};

export default function UsersManager({ rows }: { rows: Row[] }) {
  const supabase = createClient();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "student" | "admin">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    avatar_url: "",
    role: "student",
  });

  const filtered = rows.filter((r) => {
    const matchesSearch = (r.full_name ?? "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilter = filter === "all" || r.role === filter;
    return matchesSearch && matchesFilter;
  });

  function openEdit(r: Row) {
    setEditing(r);
    setForm({
      full_name: r.full_name ?? "",
      avatar_url: r.avatar_url ?? "",
      role: r.role,
    });
  }

  async function save() {
    if (!editing) return;
    setBusyId("saving");
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        avatar_url: form.avatar_url || null,
        role: form.role,
      })
      .eq("id", editing.id);
    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function toggleRole(r: Row) {
    setBusyId(r.id);
    const newRole = r.role === "admin" ? "student" : "admin";
    await supabase.from("profiles").update({ role: newRole }).eq("id", r.id);
    setBusyId(null);
    router.refresh();
  }

  async function remove(r: Row) {
    if (
      !confirm(
        `Delete user "${r.full_name ?? "Unnamed"}"?\n\nThis removes their account, enrollments, progress, and certificates. Cannot be undone.`
      )
    )
      return;
    setBusyId(r.id);
    // Deleting from auth.users cascades to profiles
    const { error } = await supabase.rpc("admin_delete_user", { user_id: r.id });
    if (error) {
      // Fallback — delete the profile only (auth user remains)
      await supabase.from("profiles").delete().eq("id", r.id);
    }
    setBusyId(null);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${rows.length} registered · ${rows.filter((r) => r.role === "admin").length} admin`}
      />

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 dark:border-[#1f2a44]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#f1f5f9]"
          />
          {(["all", "student", "admin"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition ${
                filter === f
                  ? "bg-purple-700 text-white"
                  : "border border-slate-200 text-slate-600 hover:border-purple-200 dark:border-[#1f2a44] dark:text-[#cbd5e1]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left dark:bg-[#0e1526]">
              <tr className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Enrollments</th>
                <th className="px-5 py-3">Completed</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-[#1b2742]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-xs font-black text-white">
                        {r.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.avatar_url} alt={r.full_name ?? ""} className="h-full w-full object-cover" />
                        ) : (
                          (r.full_name ?? "U")
                            .split(" ")
                            .map((s) => s[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()
                        )}
                      </span>
                      <span className="truncate font-bold text-slate-900 dark:text-[#f1f5f9]">
                        {r.full_name || "Unnamed"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                        r.role === "admin"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      {r.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-700 dark:text-[#cbd5e1]">
                    {r.enrollments}
                  </td>
                  <td className="px-5 py-4 text-slate-700 dark:text-[#cbd5e1]">
                    {r.completed}
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-[#94a3b8]">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleRole(r)}
                        disabled={busyId === r.id}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
                      >
                        {r.role === "admin" ? "Demote" : "Promote"}
                      </button>
                      <button
                        onClick={() => remove(r)}
                        disabled={busyId === r.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500 dark:text-[#94a3b8]">
                    No users match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit user"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Btn>
            <Btn onClick={save} disabled={busyId === "saving"}>
              {busyId === "saving" ? "Saving…" : "Save changes"}
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full name">
            <input
              className={inputCls}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </Field>

          <Field label="Avatar URL">
            <input
              className={inputCls}
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              placeholder="https://example.com/photo.jpg"
            />
          </Field>

          <Field label="Role">
            <select
              className={inputCls}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}