"use client";

import { useMemo, useState } from "react";
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

export default function NotificationsComposer({
  recentNotifications,
  users,
}: {
  recentNotifications: Notification[];
  users: UserOption[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [audience, setAudience] = useState<
    "all" | "students" | "admins" | "user"
  >("all");
  const [targetUser, setTargetUser] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  const filteredHistory = useMemo(() => {
    return recentNotifications.filter((n) =>
      n.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [recentNotifications, search]);

  function audienceCount() {
    if (audience === "all") return users.length;
    if (audience === "students")
      return users.filter((u) => u.role === "student").length;
    if (audience === "admins")
      return users.filter((u) => u.role === "admin").length;
    return targetUser ? 1 : 0;
  }

  async function send() {
    if (!title.trim() || !message.trim()) {
      toast("Title and message are required", "err");
      return;
    }
    if (audience === "user" && !targetUser) {
      toast("Select a user", "err");
      return;
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
          audience,
          target_user: audience === "user" ? targetUser : null,
          send_email: sendEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to send", "err");
        setSending(false);
        return;
      }

      const parts = [`Sent to ${data.recipients} user${data.recipients === 1 ? "" : "s"}`];
      if (sendEmail && data.email_sent) parts.push(`${data.email_sent} emailed`);
      toast(parts.join(" · "));

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

          <Field label="Audience">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { key: "all", label: `All users (${users.length})` },
                {
                  key: "students",
                  label: `Students only (${users.filter((u) => u.role === "student").length})`,
                },
                {
                  key: "admins",
                  label: `Admins only (${users.filter((u) => u.role === "admin").length})`,
                },
                { key: "user", label: "Specific user" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setAudience(opt.key as any)}
                  className={`rounded-xl border p-3 text-left text-sm font-bold transition ${
                    audience === opt.key
                      ? "border-purple-500 bg-purple-50 text-purple-700 dark:border-purple-500 dark:bg-purple-950/40 dark:text-purple-300"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          {audience === "user" && (
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-[#1f2a44]">
            <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
              Will send to <strong>{audienceCount()}</strong> recipient
              {audienceCount() === 1 ? "" : "s"}
            </p>
            <Btn onClick={send} disabled={sending || audienceCount() === 0}>
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