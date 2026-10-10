"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageHeader, Btn, Modal, Field, inputCls } from "./ui";

type Course = {
  id: string;
  slug: string;
  title: string;
  category: string;
  level: string;
  duration: string | null;
  icon: string | null;
  color: string | null;
  description: string | null;
  tag: string | null;
  lessons_count: number;
  is_published: boolean;
  sort_order: number;
};

type Settings = { passing_score: number; is_enabled: boolean };

export default function CoursesManager({
  courses,
  settingsMap,
}: {
  courses: Course[];
  settingsMap: Record<string, Settings>;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "Web Development",
    level: "Beginner",
    duration: "",
    icon: "📘",
    color: "bg-blue-100 text-blue-700",
    description: "",
    tag: "Available",
    sort_order: 0,
    is_published: false,
  });

  function openCreate() {
    setEditing(null);
    setForm({
      title: "",
      slug: "",
      category: "Web Development",
      level: "Beginner",
      duration: "",
      icon: "📘",
      color: "bg-blue-100 text-blue-700",
      description: "",
      tag: "Available",
      sort_order: (courses.at(-1)?.sort_order ?? 0) + 1,
      is_published: false,
    });
    setModalOpen(true);
  }

  function openEdit(c: Course) {
    setEditing(c);
    setForm({
      title: c.title,
      slug: c.slug,
      category: c.category,
      level: c.level,
      duration: c.duration ?? "",
      icon: c.icon ?? "📘",
      color: c.color ?? "bg-blue-100 text-blue-700",
      description: c.description ?? "",
      tag: c.tag ?? "Available",
      sort_order: c.sort_order,
      is_published: c.is_published,
    });
    setModalOpen(true);
  }

  function slugify(s: string) {
    return s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async function save() {
    setBusyId("saving");
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
    };

    const { error } = editing
      ? await supabase.from("courses").update(payload).eq("id", editing.id)
      : await supabase.from("courses").insert(payload);

    setBusyId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setModalOpen(false);
    router.refresh();
  }

  async function togglePublish(c: Course) {
    setBusyId(c.id);
    await supabase
      .from("courses")
      .update({ is_published: !c.is_published })
      .eq("id", c.id);
    setBusyId(null);
    router.refresh();
  }

  async function remove(c: Course) {
    if (
      !confirm(
        `Delete "${c.title}"?\n\nThis will also delete all its lessons, progress, and enrollments. This cannot be undone.`
      )
    )
      return;
    setBusyId(c.id);
    await supabase.from("courses").delete().eq("id", c.id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle={`${courses.length} total · ${courses.filter((c) => c.is_published).length} published`}
        action={<Btn onClick={openCreate}>+ New course</Btn>}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => {
          const s = settingsMap[c.id];
          return (
            <div
              key={c.id}
              className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-lg dark:border-[#1f2a44] dark:bg-[#131c33] dark:hover:border-purple-700"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg font-black text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {c.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900 dark:text-[#f1f5f9]">
                    {c.title}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-[#94a3b8]">
                    {c.category} · {c.lessons_count} lessons
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                    c.is_published
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-500 dark:bg-[#1b2742] dark:text-[#94a3b8]"
                  }`}
                >
                  {c.is_published ? "Published" : "Draft"}
                </span>
                {s?.is_enabled && (
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    Exam {s.passing_score}%
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-[#1f2a44]">
                <Link
                  href={`/admin/courses/${c.slug}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
                >
                  Open
                </Link>
                <button
                  onClick={() => openEdit(c)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
                >
                  Edit
                </button>
                <button
                  onClick={() => togglePublish(c)}
                  disabled={busyId === c.id}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
                >
                  {c.is_published ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => remove(c)}
                  disabled={busyId === c.id}
                  className="ml-auto rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit course" : "New course"}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Btn>
            <Btn onClick={save} disabled={busyId === "saving" || !form.title.trim()}>
              {busyId === "saving" ? "Saving…" : editing ? "Save changes" : "Create course"}
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
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
              placeholder="e.g. HTML Fundamentals"
            />
          </Field>

          <Field label="Slug" hint="URL-friendly identifier">
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
              placeholder="html-fundamentals"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <input
                className={inputCls}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </Field>
            <Field label="Level">
              <select
                className={inputCls}
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration">
              <input
                className={inputCls}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="2 weeks"
              />
            </Field>
            <Field label="Icon (emoji)">
              <input
                className={inputCls}
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="📘"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              className={inputCls}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tag">
              <select
                className={inputCls}
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
              >
                <option>Available</option>
                <option>Start here</option>
                <option>Popular</option>
                <option>New</option>
                <option>Coming soon</option>
              </select>
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