"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

type Lesson = {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  description: string | null;
  youtube_id: string | null;
  duration_minutes: number;
  sort_order: number;
  is_published: boolean;
  course?: { id: string; title: string; slug: string } | null;
};

type CourseOption = { id: string; title: string };

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractYouTubeId(input: string) {
  if (!input) return "";
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  return input;
}

export default function LessonsManager({
  lessons,
  courses,
}: {
  lessons: Lesson[];
  courses: CourseOption[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "live" | "draft">(
    "all"
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Lesson | null>(null);

  const [form, setForm] = useState({
    course_id: "",
    title: "",
    slug: "",
    description: "",
    youtube_id: "",
    duration_minutes: 5,
    sort_order: 0,
    is_published: false,
  });

  const filtered = useMemo(() => {
    return lessons.filter((l) => {
      const matchesSearch =
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        (l.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCourse =
        filterCourse === "all" || l.course_id === filterCourse;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "live" && l.is_published) ||
        (filterStatus === "draft" && !l.is_published);
      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [lessons, search, filterCourse, filterStatus]);

  function openCreate() {
    setEditing(null);
    setForm({
      course_id: courses[0]?.id ?? "",
      title: "",
      slug: "",
      description: "",
      youtube_id: "",
      duration_minutes: 5,
      sort_order: (lessons.at(-1)?.sort_order ?? 0) + 1,
      is_published: false,
    });
    setModalOpen(true);
  }

  function openEdit(l: Lesson) {
    setEditing(l);
    setForm({
      course_id: l.course_id,
      title: l.title,
      slug: l.slug,
      description: l.description ?? "",
      youtube_id: l.youtube_id ?? "",
      duration_minutes: l.duration_minutes,
      sort_order: l.sort_order,
      is_published: l.is_published,
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.course_id || !form.title.trim()) {
      toast("Course and title are required", "err");
      return;
    }
    setBusyId("saving");

    const payload = {
      course_id: form.course_id,
      title: form.title,
      slug: form.slug || slugify(form.title),
      description: form.description || null,
      youtube_id: extractYouTubeId(form.youtube_id) || null,
      duration_minutes: form.duration_minutes,
      sort_order: form.sort_order,
      is_published: form.is_published,
    };

    const { error } = editing
      ? await supabase.from("lessons").update(payload).eq("id", editing.id)
      : await supabase.from("lessons").insert(payload);

    setBusyId(null);
    if (error) {
      toast(error.message, "err");
      return;
    }

    toast(editing ? "Lesson updated" : "Lesson created");
    setModalOpen(false);
    router.refresh();
  }

  async function togglePublish(l: Lesson) {
    setBusyId(l.id);
    const { error } = await supabase
      .from("lessons")
      .update({ is_published: !l.is_published })
      .eq("id", l.id);
    setBusyId(null);
    if (error) return toast(error.message, "err");
    toast(l.is_published ? "Lesson hidden" : "Lesson published");
    router.refresh();
  }

  async function remove(l: Lesson) {
    setBusyId(l.id);
    const { error } = await supabase.from("lessons").delete().eq("id", l.id);
    setBusyId(null);
    setConfirmDelete(null);
    if (error) return toast(error.message, "err");
    toast("Lesson deleted");
    router.refresh();
  }

  async function bulkPublish(publish: boolean) {
    if (selected.size === 0) return;
    setBusyId("bulk");
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("lessons")
      .update({ is_published: publish })
      .in("id", ids);
    setBusyId(null);
    if (error) return toast(error.message, "err");
    toast(`${ids.length} lesson${ids.length === 1 ? "" : "s"} ${
      publish ? "published" : "hidden"
    }`);
    setSelected(new Set());
    router.refresh();
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((l) => l.id)));
  }

  function handleExport() {
    exportCSV(
      "koyocode-lessons.csv",
      filtered.map((l) => ({
        title: l.title,
        course: l.course?.title ?? "",
        slug: l.slug,
        duration: l.duration_minutes,
        youtube_id: l.youtube_id ?? "",
        status: l.is_published ? "live" : "draft",
      })),
      [
        { key: "title", label: "Title" },
        { key: "course", label: "Course" },
        { key: "slug", label: "Slug" },
        { key: "duration", label: "Duration (min)" },
        { key: "youtube_id", label: "YouTube ID" },
        { key: "status", label: "Status" },
      ]
    );
  }

  return (
    <div>
      <PageHeader
        title="Lessons"
        subtitle={`${lessons.length} lessons across ${courses.length} courses`}
        action={<Btn onClick={openCreate}>+ New lesson</Btn>}
      />

      {/* FILTERS */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search lessons..."
          />
        </div>

        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className={inputCls + " !w-auto"}
        >
          <option value="all">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <div className="flex gap-1">
          {(["all", "live", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                filterStatus === s
                  ? "bg-purple-700 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-[#1f2a44] dark:text-[#cbd5e1]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <Btn variant="ghost" size="sm" onClick={handleExport}>
          ⬇ CSV
        </Btn>
      </div>

      {/* BULK ACTIONS */}
      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 dark:border-purple-800 dark:bg-purple-950/40">
          <p className="text-sm font-bold text-purple-800 dark:text-purple-300">
            {selected.size} selected
          </p>
          <Btn size="sm" variant="success" onClick={() => bulkPublish(true)}>
            Publish
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => bulkPublish(false)}>
            Hide
          </Btn>
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
            icon="🎬"
            title="No lessons found"
            description={
              search || filterCourse !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters."
                : "Create your first lesson to get started."
            }
            action={<Btn onClick={openCreate}>+ New lesson</Btn>}
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
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Lesson</th>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Video</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#1b2742]"
                  >
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(l.id)}
                        onChange={() => toggleSelect(l.id)}
                        className="h-4 w-4 rounded border-slate-300 text-purple-700"
                      />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-[#94a3b8]">
                      {String(l.sort_order).padStart(2, "0")}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900 dark:text-[#f1f5f9]">
                        {l.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                        {l.duration_minutes} min
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-[#94a3b8]">
                      {l.course?.title ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      {l.youtube_id ? (
                        <a
                          href={`https://youtu.be/${l.youtube_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-purple-700 hover:underline dark:text-purple-400"
                        >
                          🎬 {l.youtube_id.slice(0, 8)}…
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={l.is_published ? "emerald" : "slate"}>
                        {l.is_published ? "Live" : "Draft"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Btn size="sm" variant="ghost" onClick={() => openEdit(l)}>
                          Edit
                        </Btn>
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePublish(l)}
                          disabled={busyId === l.id}
                        >
                          {l.is_published ? "Hide" : "Publish"}
                        </Btn>
                        <Btn
                          size="sm"
                          variant="danger"
                          onClick={() => setConfirmDelete(l)}
                          disabled={busyId === l.id}
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit lesson" : "New lesson"}
        size="lg"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Btn>
            <Btn onClick={save} disabled={busyId === "saving"}>
              {busyId === "saving"
                ? "Saving…"
                : editing
                ? "Save changes"
                : "Create lesson"}
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Course">
            <select
              className={inputCls}
              value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Title">
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                  slug: editing ? form.slug : slugify(e.target.value),
                })
              }
              placeholder="e.g. What is HTML?"
            />
          </Field>

          <Field label="Slug" hint="URL-friendly identifier">
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) =>
                setForm({ ...form, slug: slugify(e.target.value) })
              }
            />
          </Field>

          <Field
            label="YouTube URL or ID"
            hint="Paste a full YouTube link or just the 11-char ID"
          >
            <input
              className={inputCls}
              value={form.youtube_id}
              onChange={(e) => setForm({ ...form, youtube_id: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </Field>

          <Field label="Description">
            <textarea
              className={inputCls}
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration (minutes)">
              <input
                type="number"
                className={inputCls}
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    duration_minutes: Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                className={inputCls}
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-[#cbd5e1]">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) =>
                setForm({ ...form, is_published: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-purple-700"
            />
            Publish immediately
          </label>
        </div>
      </Modal>

      {/* CONFIRM DELETE */}
      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        title="Delete lesson?"
        message={`"${confirmDelete?.title}" and all its progress records will be permanently deleted. This cannot be undone.`}
      />
    </div>
  );
}