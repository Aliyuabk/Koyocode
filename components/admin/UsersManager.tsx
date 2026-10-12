"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PageHeader,
  Btn,
  Modal,
  Field,
  inputCls,
  SearchBar,
  Badge,
  EmptyState,
  ConfirmDialog,
  toast,
  exportCSV,
} from "./ui";

type Row = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  enrollments: number;
  completed: number;
  certificates: number;
};

type SortKey = "name" | "role" | "enrollments" | "completed" | "joined";

export default function UsersManager({ rows }: { rows: Row[] }) {
  const supabase = createClient();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "student" | "admin">("all");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    avatar_url: "",
    role: "student",
  });

  const filtered = useMemo(() => {
    const list = rows.filter((r) => {
      const matchesSearch = (r.full_name ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter = filter === "all" || r.role === filter;
      return matchesSearch && matchesFilter;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return (a.full_name ?? "").localeCompare(b.full_name ?? "") * dir;
        case "role":
          return a.role.localeCompare(b.role) * dir;
        case "enrollments":
          return (a.enrollments - b.enrollments) * dir;
        case "completed":
          return (a.completed - b.completed) * dir;
        case "joined":
        default:
          return (
            (new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()) *
            dir
          );
      }
    });
  }, [rows, search, filter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir(key === "name" || key === "role" ? "asc" : "desc");
    }
  }

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
    if (error) return toast(error.message, "err");
    toast("User updated");
    setEditing(null);
    router.refresh();
  }

  async function toggleRole(r: Row) {
    setBusyId(r.id);
    const newRole = r.role === "admin" ? "student" : "admin";
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", r.id);
    setBusyId(null);
    if (error) return toast(error.message, "err");
    toast(newRole === "admin" ? "Promoted to admin" : "Demoted to student");
    router.refresh();
  }

  async function remove(r: Row) {
    setBusyId(r.id);
    // Try the RPC first (cascades to auth.users)
    const { error: rpcErr } = await supabase.rpc("admin_delete_user", {
      user_id: r.id,
    });
    if (rpcErr) {
      // Fallback — remove the profile only
      await supabase.from("profiles").delete().eq("id", r.id);
    }
    setBusyId(null);
    setConfirmDelete(null);
    toast("User deleted");
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
      "koyocode-users.csv",
      filtered.map((r) => ({
        name: r.full_name ?? "",
        role: r.role,
        enrollments: r.enrollments,
        completed: r.completed,
        certificates: r.certificates,
        joined: new Date(r.created_at).toISOString().slice(0, 10),
      })),
      [
        { key: "name", label: "Name" },
        { key: "role", label: "Role" },
        { key: "enrollments", label: "Enrollments" },
        { key: "completed", label: "Lessons Completed" },
        { key: "certificates", label: "Certificates" },
        { key: "joined", label: "Joined" },
      ]
    );
  }

  function SortHeader({
    label,
    k,
    align = "left",
  }: {
    label: string;
    k: SortKey;
    align?: "left" | "right";
  }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => toggleSort(k)}
        className={`flex items-center gap-1 text-xs font-black uppercase tracking-wider transition hover:text-purple-600 dark:hover:text-purple-400 ${
          active ? "text-purple-700 dark:text-purple-300" : ""
        } ${align === "right" ? "ml-auto" : ""}`}
      >
        {label}
        {active && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
      </button>
    );
  }

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${rows.length} registered · ${
          rows.filter((r) => r.role === "admin").length
        } admin`}
      />

      {/* FILTERS */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name..."
          />
        </div>

        <div className="flex gap-1">
          {(["all", "student", "admin"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                filter === f
                  ? "bg-purple-700 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-[#1f2a44] dark:text-[#cbd5e1]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

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
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs font-bold text-purple-700 hover:text-purple-900 dark:text-purple-300"
          >
            Clear
          </button>
        </div>
      )}

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="👥"
            title="No users found"
            description="Try adjusting your search or filter."
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
                  <th className="px-5 py-3">
                    <SortHeader label="User" k="name" />
                  </th>
                  <th className="px-5 py-3">
                    <SortHeader label="Role" k="role" />
                  </th>
                  <th className="px-5 py-3">
                    <SortHeader label="Enrollments" k="enrollments" />
                  </th>
                  <th className="px-5 py-3">
                    <SortHeader label="Completed" k="completed" />
                  </th>
                  <th className="px-5 py-3">Certs</th>
                  <th className="px-5 py-3">
                    <SortHeader label="Joined" k="joined" />
                  </th>
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
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-xs font-black text-white">
                          {r.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.avatar_url}
                              alt={r.full_name ?? ""}
                              className="h-full w-full object-cover"
                            />
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
                    <td className="px-5 py-3">
                      <Badge tone={r.role === "admin" ? "purple" : "emerald"}>
                        {r.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-[#cbd5e1]">
                      {r.enrollments}
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-[#cbd5e1]">
                      {r.completed}
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-[#cbd5e1]">
                      {r.certificates}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-[#94a3b8]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Btn size="sm" variant="ghost" onClick={() => openEdit(r)}>
                          Edit
                        </Btn>
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleRole(r)}
                          disabled={busyId === r.id}
                        >
                          {r.role === "admin" ? "Demote" : "Promote"}
                        </Btn>
                        <Btn
                          size="sm"
                          variant="danger"
                          onClick={() => setConfirmDelete(r)}
                          disabled={busyId === r.id}
                        >
                          Delete
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

      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        title="Delete user?"
        message={`"${confirmDelete?.full_name ?? "Unnamed"}" will be permanently removed along with all their enrollments, progress, and certificates. This cannot be undone.`}
      />
    </div>
  );
}