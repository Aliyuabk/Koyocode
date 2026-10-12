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

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CoursesManager({
  courses,
  settingsMap,
}: {
  courses: Course[];
  settingsMap: Record<string, Settings>;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "live" | "draft">(
    "all"
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Course | null>(null);

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

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(courses.map((c) => c.category)))],
    [courses]
  );

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCat =
        filterCategory === "all" || c.category === filterCategory;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "live" && c.is_published) ||
        (filterStatus === "draft" && !c.is_published);
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [courses, search, filterCategory, filterStatus]);

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

  async function save() {
    if (!form.title.trim()) {
      toast("Title is required", "err");
      return;
    }
    setBusyId("saving");

    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
    };

    const { error } = editing
      ? await supabase.from("courses").update(payload).eq("id", editing.id)
      : await supabase.from("courses").insert(payload);

    setBusyId(null);
    if (error) return toast(error.message, "err");

    toast(editing ? "Course updated" : "Course created");
    setModalOpen(false);
    router.refresh();
  }

  async function duplicate(c: Course) {
    setBusyId(c.id);
    const newTitle = `${c.title} (Copy)`;
    const newSlug = `${c.slug}-copy-${Date.now().toString(36).slice(-4)}`;
    const { error } = await supabase.from("courses").insert({
      ...c,
      id: undefined,
      title: newTitle,
      slug: newSlug,
      is_published: false,
      sort_order: (courses.at(-1)?.sort_order ?? 0) + 1,
    });
    setBusyId(null);
    if (error) return toast(error.message, "err");
    toast("Course duplicated");
    router.refresh();
  }

  async function togglePublish(c: Course) {
    setBusyId(c.id);
    const { error } = await supabase
      .from("courses")
      .update({ is_published: !c.is_published })
      .eq("id", c.id);
    setBusyId(null);
    if (error) return toast(error.message, "err");
    toast(c.is_published ? "Course unpublished" : "Course published");
    router.refresh();
  }

  async function remove(c: Course) {
    setBusyId(c.id);
    const { error } = await supabase.from("courses").delete().eq("id", c.id);
    setBusyId(null);
    setConfirmDelete(null);
    if (error) return toast(error.message, "err");
    toast("Course deleted");
    router.refresh();
  }

  async function bulkPublish(publish: boolean) {
    if (selected.size === 0) return;
    setBusyId("bulk");
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("courses")
      .update({ is_published: publish })
      .in("id", ids);
    setBusyId(null);
    if (error) return toast(error.message, "err");
    toast(`${ids.length} course${ids.length === 1 ? "" : "s"} updated`);
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
    else setSelected(new Set(filtered.map((c) => c.id)));
  }

  function handleExport() {
    exportCSV(
      "koyocode-courses.csv",
      filtered.map((c) => ({
        title: c.title,
        slug: c.slug,
        category: c.category,
        level: c.level,
        lessons: c.lessons_count,
        exam: settingsMap[c.id]?.is_enabled ? `Yes (${settingsMap[c.id].passing_score}%)` : "No",
        status: c.is_published ? "live" : "draft",
      })),
      [
        { key: "title", label: "Title" },
        { key: "slug", label: "Slug" },
        { key: "category", label: "Category" },
        { key: "level", label: "Level" },
        { key: "lessons", label: "Lessons" },
        { key: "exam", label: "Exam" },
        { key: "status", label: "Status" },
      ]
    );
  }

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle={`${courses.length} total · ${courses.filter((c) => c.is_published).length} published`}
        action={<Btn onClick={openCreate}>+ New course</Btn>}
      />

      {/* FILTERS */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search courses..."
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={inputCls + " !w-auto"}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All categories" : c}
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

      {/* BULK */}
      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 dark:border-purple-800 dark:bg-purple-950/40">
          <p className="text-sm font-bold text-purple-800 dark:text-purple-300">
            {selected.size} selected
          </p>
          <Btn size="sm" variant="success" onClick={() => bulkPublish(true)}>
            Publish
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => bulkPublish(false)}>
            Unpublish
          </Btn>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs font-bold text-purple-700 hover:text-purple-900 dark:text-purple-300"
          >
            Clear
          </button>
        </div>
      )}

      {/* LIST */}
      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="📚"
            title="No courses found"
            description={
              search || filterCategory !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters."
                : "Create your first course to get started."
            }
            action={<Btn onClick={openCreate}>+ New course</Btn>}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const s = settingsMap[c.id];
            return (
              <div
                key={c.id}
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-lg dark:border-[#1f2a44] dark:bg-[#131c33] dark:hover:border-purple-700"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-700"
                  />
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
                  <Badge tone={c.is_published ? "emerald" : "slate"}>
                    {c.is_published ? "Published" : "Draft"}
                  </Badge>
                  {s?.is_enabled && (
                    <Badge tone="purple">Exam {s.passing_score}%</Badge>
                  )}
                  {c.tag && <Badge tone="blue">{c.tag}</Badge>}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-[#1f2a44]">
                  <Link
                    href={`/admin/courses/${c.slug}`}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
                  >
                    Open
                  </Link>
                  <Btn size="sm" variant="ghost" onClick={() => openEdit(c)}>
                    Edit
                  </Btn>
                  <Btn
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePublish(c)}
                    disabled={busyId === c.id}
                  >
                    {c.is_published ? "Unpublish" : "Publish"}
                  </Btn>
                  <Btn
                    size="sm"
                    variant="ghost"
                    onClick={() => duplicate(c)}
                    disabled={busyId === c.id}
                  >
                    Duplicate
                  </Btn>
                  <Btn
                    size="sm"
                    variant="danger"
                    className="ml-auto"
                    onClick={() => setConfirmDelete(c)}
                    disabled={busyId === c.id}
                  >
                    Delete
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit course" : "New course"}
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
                : "Create course"}
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
            />
          </Field>

          <Field label="Slug">
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
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
              onChange={(e) =>
                setForm({ ...form, is_published: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-purple-700"
            />
            Publish immediately
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        title="Delete course?"
        message={`"${confirmDelete?.title}" and all its lessons, enrollments, and progress will be permanently deleted. This cannot be undone.`}
      />
    </div>
  );
}