"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Btn,
  Field,
  inputCls,
  SearchBar,
  Badge,
  EmptyState,
  toast,
} from "./ui";
import AudienceFilter from "./AudienceFilter";
import type { AudienceFilter as FilterType } from "@/lib/audience";

type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  audience: string;
  send_email: boolean;
  sent_at: string;
  recipients: number;
};

type UserOption = {
  id: string;
  full_name: string | null;
  role: string;
};

type Course = { id: string; title: string; icon: string | null };

export default function NotificationsComposer({
  recentNotifications,
  users,
  courses,
}: {
  recentNotifications: Notification[];
  users: UserOption[];
  courses: Course[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  // Audience mode: "quick" | "user" | "segment"
  const [audienceMode, setAudienceMode] = useState<
    "quick" | "user" | "segment"
  >("quick");
  const [filter, setFilter] = useState<FilterType>({
    mode: "quick",
    quick: "all",
  });
  const [targetUser, setTargetUser] = useState("");

  // Live recipient count
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const countAbort = useRef<AbortController | null>(null);

  const filteredHistory = useMemo(() => {
    return recentNotifications.filter((n) =>
      n.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [recentNotifications, search]);

  // Debounced live count
  useEffect(() => {
    // Compose the effective filter
    let effectiveFilter: FilterType;
    if (audienceMode === "quick") {
      effectiveFilter = { mode: "quick", quick: (filter as any).quick ?? "all" };
    } else if (audienceMode === "user") {
      if (!targetUser) {
        setCount(0);
        return;
      }
      effectiveFilter = { mode: "user", userId: targetUser };
    } else {
      effectiveFilter = { ...(filter as any), mode: "segment" };
    }

    // Cancel any in-flight request
    countAbort.current?.abort();
    const controller = new AbortController();
    countAbort.current = controller;

    setCounting(true);

    const t = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/notifications/count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filter: effectiveFilter }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (res.ok) setCount(data.count ?? 0);
        else setCount(null);
      } catch (e: any) {
        if (e.name !== "AbortError") setCount(null);
      } finally {
        setCounting(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(t);
      controller.abort();
    };
  }, [audienceMode, filter, targetUser]);

  async function send() {
    if (!title.trim() || !message.trim()) {
      toast("Title and message are required", "err");
      return;
    }

    let effectiveFilter: FilterType;
    if (audienceMode === "quick") {
      effectiveFilter = { mode: "quick", quick: (filter as any).quick ?? "all" };
    } else if (audienceMode === "user") {
      if (!targetUser) {
        toast("Select a user", "err");
        return;
      }
      effectiveFilter = { mode: "user", userId: targetUser };
    } else {
      effectiveFilter = { ...(filter as any), mode: "segment" };
    }

    if (!count || count === 0) {
      toast("No recipients match this filter", "err");
      return;
    }

    // Email volume warning
    if (sendEmail && count >= 100) {
      const ok = confirm(
        `You're about to send ${count} emails. Gmail SMTP has a ~500/day limit. Continue?`
      );
      if (!ok) return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          link: link.trim() || null,
          link_label: linkLabel.trim() || null,
          filter: effectiveFilter,
          send_email: sendEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Failed to send", "err");
        return;
      }

      const parts = [
        `Sent to ${data.recipients} user${data.recipients === 1 ? "" : "s"}`,
      ];
      if (sendEmail && data.email_sent)
        parts.push(`${data.email_sent} emailed`);
      if (sendEmail && data.email_failed)
        parts.push(`${data.email_failed} email failed`);
      toast(parts.join(" · "));

      // Reset
      setTitle("");
      setMessage("");
      setLink("");
      setLinkLabel("");
      setSendEmail(false);
      setTargetUser("");
      router.refresh();
    } catch (e: any) {
      toast(e.message ?? "Failed", "err");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Send in-app messages and emails to your users"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* LEFT: composer */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-3 dark:border-[#1f2a44] dark:bg-[#131c33]">
          <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
            Compose
          </p>

          <Field label="Title">
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New lesson added"
            />
          </Field>

          <Field label="Message">
            <textarea
              className={inputCls}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message…"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Link (optional)" hint="Where clicking should take them">
              <input
                className={inputCls}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/courses/css-web-design"
              />
            </Field>
            <Field label="Button label (optional)">
              <input
                className={inputCls}
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Open course"
              />
            </Field>
          </div>

          {/* AUDIENCE MODE */}
          <Field label="Audience">
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  { key: "quick", label: "Everyone", desc: "All / students / admins" },
                  { key: "segment", label: "Filtered segment", desc: "By course, date, progress" },
                  { key: "user", label: "Specific user", desc: "One person" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setAudienceMode(opt.key);
                    if (opt.key === "quick") {
                      setFilter({ mode: "quick", quick: "all" });
                    } else if (opt.key === "segment") {
                      setFilter({
                        mode: "segment",
                        courseId: null,
                        courseRule: "enrolled",
                        enrolledAfter: null,
                        enrolledBefore: null,
                        progressRule: "any",
                        role: "any",
                      });
                    } else {
                      setFilter({ mode: "user", userId: "" });
                    }
                  }}
                  className={`rounded-xl border p-3 text-left transition ${
                    audienceMode === opt.key
                      ? "border-purple-500 bg-purple-50 dark:border-purple-500 dark:bg-purple-950/40"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526]"
                  }`}
                >
                  <p
                    className={`text-sm font-bold ${
                      audienceMode === opt.key
                        ? "text-purple-700 dark:text-purple-300"
                        : "text-slate-900 dark:text-[#f1f5f9]"
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-[#94a3b8]">
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </Field>

          {/* AUDIENCE DETAILS */}
          {audienceMode === "quick" && (
            <AudienceFilter
              value={filter}
              onChange={setFilter}
              courses={courses}
            />
          )}

          {audienceMode === "segment" && (
            <AudienceFilter
              value={filter}
              onChange={setFilter}
              courses={courses}
            />
          )}

          {audienceMode === "user" && (
            <Field label="Select user">
              <select
                className={inputCls}
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
              >
                <option value="">— Choose a user —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name ?? "Unnamed"} ({u.role})
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* EMAIL OPTION */}
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-[#1f2a44] dark:bg-[#0e1526]">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-purple-700"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
                Also send by email
              </p>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                Users will receive this message in their inbox
              </p>
            </div>
          </label>

          {/* SEND BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-[#1f2a44]">
            <div>
              <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
                {counting ? (
                  <>Counting recipients…</>
                ) : count === null ? (
                  <>Could not count recipients</>
                ) : (
                  <>
                    Will send to{" "}
                    <strong className="text-slate-900 dark:text-[#f1f5f9]">
                      {count}
                    </strong>{" "}
                    recipient{count === 1 ? "" : "s"}
                  </>
                )}
              </p>
              {sendEmail && count !== null && count >= 100 && (
                <p className="mt-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  ⚠ Gmail SMTP has a ~500/day limit
                </p>
              )}
            </div>

            <Btn
              onClick={send}
              disabled={sending || counting || !count || count === 0}
            >
              {sending ? "Sending…" : "Send notification"}
            </Btn>
          </div>
        </div>

        {/* RIGHT: history */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-[#1f2a44]">
              <p className="text-sm font-extrabold text-slate-900 dark:text-[#f1f5f9]">
                Sent history
              </p>
              <span className="text-xs font-bold text-slate-500 dark:text-[#94a3b8]">
                {recentNotifications.length}
              </span>
            </div>

            <div className="border-b border-slate-100 p-3 dark:border-[#1f2a44]">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search sent..."
              />
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {filteredHistory.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon="📨"
                    title="Nothing sent yet"
                    description="Your notification history will appear here."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
                  {filteredHistory.map((n) => (
                    <li
                      key={n.id}
                      className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-[#1b2742]"
                    >
                      <p className="text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
                        {n.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-[#94a3b8]">
                        {n.message}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge tone="purple">{n.audience}</Badge>
                        {n.send_email && <Badge tone="blue">email</Badge>}
                        <span className="text-[10px] font-bold text-slate-500 dark:text-[#94a3b8]">
                          {n.recipients} recipient
                          {n.recipients === 1 ? "" : "s"}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-[#64748b]">
                          {new Date(n.sent_at).toLocaleString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}