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

type LessonConcept = {
  icon: string;
  title: string;
  body: string;
  code?: string;
};

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
  concepts: LessonConcept[] | null;
  exercise_type: "none" | "html" | "javascript";
  exercise_prompt: string | null;
  exercise_starter: string | null;
  exercise_solution: string | null;
  exercise_hint: string | null;
  quick_check_question: string | null;
  quick_check_options: string[] | null;
  quick_check_correct_index: number | null;
  quick_check_explanation: string | null;
  course?: { id: string; title: string; slug: string } | null;
};

type CourseOption = { id: string; title: string };

/* ============================================================
   HELPERS
   ============================================================ */
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

const emptyConcept = (): LessonConcept => ({
  icon: "💡",
  title: "",
  body: "",
  code: "",
});

/* ============================================================
   MAIN
   ============================================================ */
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
  const [generating, setGenerating] = useState<
    null | "quick_check" | "exercise"
  >(null);
  const [tab, setTab] = useState<
    "basics" | "concepts" | "exercise" | "quickcheck"
  >("basics");

  const [form, setForm] = useState({
    course_id: "",
    title: "",
    slug: "",
    description: "",
    youtube_id: "",
    duration_minutes: 5,
    sort_order: 0,
    is_published: false,
    concepts: [] as LessonConcept[],
    exercise_type: "none" as "none" | "html" | "javascript",
    exercise_prompt: "",
    exercise_starter: "",
    exercise_solution: "",
    exercise_hint: "",
    quick_check_question: "",
    quick_check_options: ["", "", "", ""],
    quick_check_correct_index: 0,
    quick_check_explanation: "",
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

  /* ============================================================
     OPEN / EDIT
     ============================================================ */
  function openCreate() {
    setEditing(null);
    setTab("basics");
    setForm({
      course_id: courses[0]?.id ?? "",
      title: "",
      slug: "",
      description: "",
      youtube_id: "",
      duration_minutes: 5,
      sort_order: (lessons.at(-1)?.sort_order ?? 0) + 1,
      is_published: false,
      concepts: [emptyConcept()],
      exercise_type: "none",
      exercise_prompt: "",
      exercise_starter: "",
      exercise_solution: "",
      exercise_hint: "",
      quick_check_question: "",
      quick_check_options: ["", "", "", ""],
      quick_check_correct_index: 0,
      quick_check_explanation: "",
    });
    setModalOpen(true);
  }

  function openEdit(l: Lesson) {
    setEditing(l);
    setTab("basics");
    setForm({
      course_id: l.course_id,
      title: l.title,
      slug: l.slug,
      description: l.description ?? "",
      youtube_id: l.youtube_id ?? "",
      duration_minutes: l.duration_minutes,
      sort_order: l.sort_order,
      is_published: l.is_published,
      concepts: l.concepts ?? [],
      exercise_type: l.exercise_type,
      exercise_prompt: l.exercise_prompt ?? "",
      exercise_starter: l.exercise_starter ?? "",
      exercise_solution: l.exercise_solution ?? "",
      exercise_hint: l.exercise_hint ?? "",
      quick_check_question: l.quick_check_question ?? "",
      quick_check_options:
        l.quick_check_options && l.quick_check_options.length === 4
          ? l.quick_check_options
          : ["", "", "", ""],
      quick_check_correct_index: l.quick_check_correct_index ?? 0,
      quick_check_explanation: l.quick_check_explanation ?? "",
    });
    setModalOpen(true);
  }

  /* ============================================================
     SAVE
     ============================================================ */
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
      concepts: form.concepts.filter(
        (c) => c.title.trim() && c.body.trim()
      ),
      exercise_type: form.exercise_type,
      exercise_prompt: form.exercise_prompt || null,
      exercise_starter: form.exercise_starter || null,
      exercise_solution: form.exercise_solution || null,
      exercise_hint: form.exercise_hint || null,
      quick_check_question: form.quick_check_question || null,
      quick_check_options: form.quick_check_question
        ? form.quick_check_options.map((o) => o.trim()).filter(Boolean)
        : null,
      quick_check_correct_index: form.quick_check_question
        ? form.quick_check_correct_index
        : null,
      quick_check_explanation: form.quick_check_explanation || null,
    };

    const { error } = editing
      ? await supabase.from("lessons").update(payload).eq("id", editing.id)
      : await supabase.from("lessons").insert(payload);

    setBusyId(null);
    if (error) return toast(error.message, "err");

    toast(editing ? "Lesson updated" : "Lesson created");
    setModalOpen(false);
    router.refresh();
  }

  /* ============================================================
     AI GENERATION
     ============================================================ */
  async function generate(kind: "quick_check" | "exercise") {
    const validConcepts = form.concepts.filter(
      (c) => c.title.trim() && c.body.trim()
    );
    if (validConcepts.length === 0) {
      toast("Add at least one concept card first", "err");
      setTab("concepts");
      return;
    }

    setGenerating(kind);

    try {
      const res = await fetch("/api/admin/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          lesson_title: form.title || "Untitled lesson",
          concepts: validConcepts,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Generation failed", "err");
        setGenerating(null);
        return;
      }

      if (kind === "quick_check") {
        const d = data.data;
        setForm((f) => ({
          ...f,
          quick_check_question: d.question,
          quick_check_options: d.options,
          quick_check_correct_index: d.correct_index,
          quick_check_explanation: d.explanation ?? "",
        }));
        toast("Quick check drafted — review and approve");
      } else {
        const d = data.data;
        setForm((f) => ({
          ...f,
          exercise_type: d.language === "javascript" ? "javascript" : "html",
          exercise_prompt: d.prompt,
          exercise_starter: d.starter,
          exercise_solution: d.solution,
          exercise_hint: d.hint ?? "",
        }));
        toast("Exercise drafted — review and approve");
      }
    } catch (e: any) {
      toast(e.message ?? "Network error", "err");
    } finally {
      setGenerating(null);
    }
  }

  /* ============================================================
     OTHER ACTIONS
     ============================================================ */
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

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
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
        concepts: l.concepts?.length ?? 0,
        exercise: l.exercise_type,
        quick_check: l.quick_check_question ? "Yes" : "No",
        status: l.is_published ? "live" : "draft",
      })),
      [
        { key: "title", label: "Title" },
        { key: "course", label: "Course" },
        { key: "slug", label: "Slug" },
        { key: "duration", label: "Duration" },
        { key: "youtube_id", label: "YouTube ID" },
        { key: "concepts", label: "Concepts" },
        { key: "exercise", label: "Exercise" },
        { key: "quick_check", label: "Quick check" },
        { key: "status", label: "Status" },
      ]
    );
  }

  function bulkPublish(arg0: boolean): void {
    throw new Error("Function not implemented.");
  }

  /* ============================================================
     RENDER
     ============================================================ */
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
            description="Try adjusting your filters or create a new lesson."
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
                  <th className="px-5 py-3">Content</th>
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
                        {l.youtube_id ? " · 🎬" : ""}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-[#94a3b8]">
                      {l.course?.title ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          {l.concepts?.length ?? 0} concepts
                        </span>
                        {l.exercise_type !== "none" && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-black text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                            exercise
                          </span>
                        )}
                        {l.quick_check_question && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                            QC
                          </span>
                        )}
                      </div>
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

      {/* ============================================================
          EDITOR MODAL
          ============================================================ */}
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
        {/* TAB BAR */}
        <div className="mb-5 flex flex-wrap gap-1 border-b border-slate-200 dark:border-[#1f2a44]">
          {(
            [
              ["basics", "Basics"],
              ["concepts", `Concepts (${form.concepts.length})`],
              ["exercise", "Exercise"],
              ["quickcheck", "Quick check"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`relative px-3 py-2 text-sm font-bold transition ${
                tab === key
                  ? "text-purple-700 dark:text-purple-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-[#94a3b8]"
              }`}
            >
              {label}
              {tab === key && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-purple-700" />
              )}
            </button>
          ))}
        </div>

        {/* ============ BASICS ============ */}
        {tab === "basics" && (
          <div className="space-y-4">
            <Field label="Course">
              <select
                className={inputCls}
                value={form.course_id}
                onChange={(e) =>
                  setForm({ ...form, course_id: e.target.value })
                }
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
                onChange={(e) =>
                  setForm({ ...form, slug: slugify(e.target.value) })
                }
              />
            </Field>

            <Field
              label="YouTube URL or ID"
              hint="Short intro video — pass full URL or just the 11-char ID"
            >
              <input
                className={inputCls}
                value={form.youtube_id}
                onChange={(e) =>
                  setForm({ ...form, youtube_id: e.target.value })
                }
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
        )}

        {/* ============ CONCEPTS ============ */}
        {tab === "concepts" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
              Each concept is a small card. Aim for 2–4 cards per lesson.
            </p>

            {form.concepts.map((c, i) => (
              <div
                key={i}
                className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1f2a44] dark:bg-[#0e1526]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    Concept {i + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        concepts: f.concepts.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="text-xs font-bold text-red-600 hover:text-red-800 dark:text-red-400"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-[80px_1fr] gap-3">
                  <Field label="Icon">
                    <input
                      className={inputCls + " text-center text-xl"}
                      value={c.icon}
                      onChange={(e) =>
                        setForm((f) => {
                          const copy = [...f.concepts];
                          copy[i] = { ...copy[i], icon: e.target.value };
                          return { ...f, concepts: copy };
                        })
                      }
                    />
                  </Field>
                  <Field label="Title">
                    <input
                      className={inputCls}
                      value={c.title}
                      onChange={(e) =>
                        setForm((f) => {
                          const copy = [...f.concepts];
                          copy[i] = { ...copy[i], title: e.target.value };
                          return { ...f, concepts: copy };
                        })
                      }
                    />
                  </Field>
                </div>

                <Field label="Body">
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={c.body}
                    onChange={(e) =>
                      setForm((f) => {
                        const copy = [...f.concepts];
                        copy[i] = { ...copy[i], body: e.target.value };
                        return { ...f, concepts: copy };
                      })
                    }
                  />
                </Field>

                <Field label="Code (optional)">
                  <textarea
                    className={inputCls + " font-mono"}
                    rows={3}
                    value={c.code ?? ""}
                    onChange={(e) =>
                      setForm((f) => {
                        const copy = [...f.concepts];
                        copy[i] = { ...copy[i], code: e.target.value };
                        return { ...f, concepts: copy };
                      })
                    }
                  />
                </Field>
              </div>
            ))}

            <Btn
              variant="ghost"
              size="sm"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  concepts: [...f.concepts, emptyConcept()],
                }))
              }
            >
              + Add concept
            </Btn>
          </div>
        )}

        {/* ============ EXERCISE ============ */}
        {tab === "exercise" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
                Optional in-browser code challenge.
              </p>
              <button
                type="button"
                onClick={() => generate("exercise")}
                disabled={generating === "exercise"}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-purple-800 disabled:opacity-60"
              >
                {generating === "exercise" ? "Generating…" : "✨ Generate with AI"}
              </button>
            </div>

            <Field label="Exercise type">
              <select
                className={inputCls}
                value={form.exercise_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    exercise_type: e.target.value as
                      | "none"
                      | "html"
                      | "javascript",
                  })
                }
              >
                <option value="none">None</option>
                <option value="html">HTML</option>
                <option value="javascript">JavaScript</option>
              </select>
            </Field>

            {form.exercise_type !== "none" && (
              <>
                <Field label="Prompt">
                  <input
                    className={inputCls}
                    value={form.exercise_prompt}
                    onChange={(e) =>
                      setForm({ ...form, exercise_prompt: e.target.value })
                    }
                    placeholder="Write an <h1> with your name inside."
                  />
                </Field>

                <Field label="Hint">
                  <input
                    className={inputCls}
                    value={form.exercise_hint}
                    onChange={(e) =>
                      setForm({ ...form, exercise_hint: e.target.value })
                    }
                    placeholder="Use <h1>...</h1>"
                  />
                </Field>

                <Field label="Starter code">
                  <textarea
                    className={inputCls + " font-mono"}
                    rows={4}
                    value={form.exercise_starter}
                    onChange={(e) =>
                      setForm({ ...form, exercise_starter: e.target.value })
                    }
                  />
                </Field>

                <Field label="Solution">
                  <textarea
                    className={inputCls + " font-mono"}
                    rows={4}
                    value={form.exercise_solution}
                    onChange={(e) =>
                      setForm({ ...form, exercise_solution: e.target.value })
                    }
                  />
                </Field>
              </>
            )}
          </div>
        )}

        {/* ============ QUICK CHECK ============ */}
        {tab === "quickcheck" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
                One question with 4 options. Shown at the end of the lesson.
              </p>
              <button
                type="button"
                onClick={() => generate("quick_check")}
                disabled={generating === "quick_check"}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-purple-800 disabled:opacity-60"
              >
                {generating === "quick_check"
                  ? "Generating…"
                  : "✨ Generate with AI"}
              </button>
            </div>

            <Field label="Question">
              <input
                className={inputCls}
                value={form.quick_check_question}
                onChange={(e) =>
                  setForm({ ...form, quick_check_question: e.target.value })
                }
                placeholder="Which tag creates the largest heading?"
              />
            </Field>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-[#cbd5e1]">
                Options — click the circle to mark correct
              </p>

              {form.quick_check_options.map((opt, i) => {
                const isCorrect = form.quick_check_correct_index === i;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({ ...form, quick_check_correct_index: i })
                      }
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        isCorrect
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 text-slate-400 hover:border-emerald-300 dark:border-[#1f2a44]"
                      }`}
                      aria-label={`Mark option ${i + 1} as correct`}
                    >
                      {isCorrect ? "✓" : String.fromCharCode(65 + i)}
                    </button>
                    <input
                      className={inputCls}
                      value={opt}
                      onChange={(e) =>
                        setForm((f) => {
                          const opts = [...f.quick_check_options];
                          opts[i] = e.target.value;
                          return { ...f, quick_check_options: opts };
                        })
                      }
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    />
                  </div>
                );
              })}
            </div>

            <Field label="Explanation">
              <textarea
                className={inputCls}
                rows={3}
                value={form.quick_check_explanation}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quick_check_explanation: e.target.value,
                  })
                }
                placeholder="Why is this the correct answer?"
              />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        title="Delete lesson?"
        message={`"${confirmDelete?.title}" and all its progress records will be permanently deleted.`}
      />
    </div>
  );
}

/* Bulk publish — helper at bottom */
async function bulkPublishHelper(publish: boolean, ids: string[]) {
  const supabase = (await import("@/lib/supabase/client")).createClient();
  return supabase
    .from("lessons")
    .update({ is_published: publish })
    .in("id", ids);
}