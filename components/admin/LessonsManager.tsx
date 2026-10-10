"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, Btn, Modal, Field, inputCls } from "./ui";

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

export default function LessonsManager({
  lessons,
  courses,
}: {
  lessons: Lesson[];
  courses: CourseOption[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState<string>("all");

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

  const filtered = lessons.filter(
    (l) => filterCourse === "all" || l.course_id === filterCourse
  );

  function slugify(s: string) {
    return s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function openCreate() {
    setEditing(null);
    setForm({
      course_id: courses[0]?.id ?? "",
      title: "",
      slug: "",
      description: "",
      youtube_id: "",
      duration_minutes: 5,
      sort_order: 0,
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

  function extractYouTubeId(input: string) {
    if (!input) return "";
    // Accept full URLs or bare IDs
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
    // Already an ID?
    if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
    return input; // Return as-is; admin can fix
  }

  async function save() {
    if (!form.course_id || !form.title.trim()) return;
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
      alert(error.message);
      return;
    }
    setModalOpen(false);
    router.refresh();
  }

  async function togglePublish(l: Lesson) {
    setBusyId(l.id);
    await supabase
      .from("lessons")
      .update({ is_published: !l.is_published })
      .eq("id", l.id);
    setBusyId(null);
    router.refresh();
  }

  async function remove(l: Lesson) {
    if (!confirm(`Delete lesson "${l.title}"?`)) return;
    setBusyId(l.id);
    await supabase.from("lessons").delete().eq("id", l.id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Lessons"
        subtitle={`${lessons.length} lessons across ${courses.length} courses`}
        action={<Btn onClick={openCreate}>+ New lesson</Btn>}
      />

      {/* FILTER */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
          Filter by course:
        </span>
        <button
          onClick={() => setFilterCourse("all")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
            filterCourse === "all"
              ? "bg-purple-700 text-white"
              : "border border-slate-200 text-slate-600 dark:border-[#1f2a44] dark:text-[#cbd5e1]"
          }`}
        >
          All
        </button>
        {courses.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterCourse(c.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filterCourse === c.id
                ? "bg-purple-700 text-white"
                : "border border-slate-200 text-slate-600 dark:border-[#1f2a44] dark:text-[#cbd5e1]"
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left dark:bg-[#0e1526]">
              <tr className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
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
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-[#1b2742]">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-[#94a3b8]">
                    {String(l.sort_order).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-3 font-bold dark:text-[#f1f5f9]">{l.title}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-[#94a3b8]">
                    {l.course?.title ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    {l.youtube_id ? (
                      <a
                        href={`https://youtu.be/${l.youtube_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-700 hover:underline dark:text-purple-400"
                      >
                        🎬 {l.youtube_id.slice(0, 8)}…
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                        l.is_published
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-500 dark:bg-[#1b2742] dark:text-[#94a3b8]"
                      }`}
                    >
                      {l.is_published ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(l)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => togglePublish(l)}
                        disabled={busyId === l.id}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
                      >
                        {l.is_published ? "Hide" : "Publish"}
                      </button>
                      <button
                        onClick={() => remove(l)}
                        disabled={busyId === l.id}
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
                    No lessons here yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit lesson" : "New lesson"}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Btn>
            <Btn onClick={save} disabled={busyId === "saving"}>
              {busyId === "saving" ? "Saving…" : editing ? "Save changes" : "Create lesson"}
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

          <Field label="Slug">
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            />
          </Field>

          <Field
            label="YouTube URL or ID"
            hint="Paste a full YouTube link or just the video ID"
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
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration (minutes)">
              <input
                type="number"
                className={inputCls}
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: Number(e.target.value) })
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
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-purple-700"
            />
            Publish immediately
          </label>
        </div>
      </Modal>
    </div>
  );
}