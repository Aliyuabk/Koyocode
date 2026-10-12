"use client";

import { useMemo, useState } from "react";
import {
  PageHeader,
  Btn,
  SearchBar,
  EmptyState,
  Badge,
  toast,
  exportCSV,
} from "./ui";

type Event = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
  user_name: string | null;
};

const ACTION_ICONS: Record<string, string> = {
  signup: "👤",
  login: "🔑",
  enroll: "✍️",
  lesson_start: "▶️",
  lesson_complete: "✅",
  exam_start: "📝",
  exam_pass: "🏆",
  exam_fail: "❌",
  certificate_issued: "🎓",
  course_published: "🚀",
  course_unpublished: "📦",
  user_promoted: "⭐",
  user_deleted: "🗑️",
  password_reset: "🔒",
};

const FILTERS = [
  "all",
  "signup",
  "enroll",
  "lesson_complete",
  "exam_pass",
  "exam_fail",
  "certificate_issued",
];

export default function ActivityManager({
  events,
  totalCount,
}: {
  events: Event[];
  totalCount: number;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(100);

  const filtered = useMemo(() => {
    return events
      .filter((e) => {
        const matchesSearch =
          (e.user_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          e.action.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "all" || e.action === filter;
        return matchesSearch && matchesFilter;
      })
      .slice(0, limit);
  }, [events, search, filter, limit]);

  function handleExport() {
    exportCSV(
      "koyocode-activity.csv",
      filtered.map((e) => ({
        user: e.user_name ?? "System",
        action: e.action,
        entity: e.entity_type ?? "",
        date: new Date(e.created_at).toISOString(),
      })),
      [
        { key: "user", label: "User" },
        { key: "action", label: "Action" },
        { key: "entity", label: "Entity" },
        { key: "date", label: "Timestamp" },
      ]
    );
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  }

  return (
    <div>
      <PageHeader
        title="Activity log"
        subtitle={`${totalCount} total events · showing ${filtered.length}`}
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
            placeholder="Search by user or action..."
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-purple-500 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#f1f5f9]"
        >
          {FILTERS.map((f) => (
            <option key={f} value={f}>
              {f === "all" ? "All events" : f.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* TIMELINE */}
      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="📜"
            title="No activity yet"
            description="Events will appear here as users interact with the platform."
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
          <ul className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
            {filtered.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-[#1b2742]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-[#1b2742]">
                  {ACTION_ICONS[e.action] ?? "📌"}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
                      {e.user_name ?? "System"}
                    </p>
                    <Badge tone="purple">{e.action.replace(/_/g, " ")}</Badge>
                    {e.entity_type && (
                      <Badge tone="slate">{e.entity_type}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-[#94a3b8]">
                    {formatTime(e.created_at)} ·{" "}
                    {new Date(e.created_at).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {filtered.length >= limit && limit < events.length && (
            <div className="border-t border-slate-100 p-4 text-center dark:border-[#1f2a44]">
              <Btn variant="ghost" size="sm" onClick={() => setLimit(limit + 100)}>
                Show more
              </Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}