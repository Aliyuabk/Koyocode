"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  read: boolean;
  created_at: string;
  notification: {
    id: string;
    title: string;
    message: string;
    link: string | null;
    link_label: string | null;
    sent_at: string;
  } | null;
};

export default function NotificationsInbox({ initial }: { initial: Item[] }) {
  const supabase = createClient();
  const [items, setItems] = useState<Item[]>(initial);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unread = items.filter((n) => !n.read).length;

  const filtered =
    filter === "unread" ? items.filter((n) => !n.read) : items;

  async function markRead(id: string) {
    setItems((arr) =>
      arr.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await supabase
      .from("user_notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", id);
  }

  async function markAllRead() {
    setItems((arr) => arr.map((n) => ({ ...n, read: true })));
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("user_notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("read", false);
  }

  return (
    <div>
      {/* FILTERS */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-1">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              filter === "all"
                ? "bg-purple-700 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-[#1f2a44] dark:text-[#cbd5e1]"
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              filter === "unread"
                ? "bg-purple-700 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-[#1f2a44] dark:text-[#cbd5e1]"
            }`}
          >
            Unread ({unread})
          </button>
        </div>

        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 dark:text-purple-400"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* LIST */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-[#1f2a44] dark:bg-[#0e1526]">
          <p className="text-5xl">📭</p>
          <p className="mt-4 text-lg font-black text-slate-900 dark:text-[#f1f5f9]">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
            Messages from KoyoCode will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((n) => {
            const nf = n.notification;
            if (!nf) return null;

            const Wrapper: any = nf.link ? Link : "div";
            const wrapperProps = nf.link ? { href: nf.link } : {};

            return (
              <li key={n.id}>
                <Wrapper
                  {...wrapperProps}
                  onClick={() => markRead(n.id)}
                  className={`block rounded-2xl border p-5 transition ${
                    !n.read
                      ? "border-purple-200 bg-purple-50/40 hover:bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#131c33] dark:hover:bg-[#1b2742]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!n.read && (
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-purple-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-[#f1f5f9]">
                        {nf.title}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-[#94a3b8]">
                        {nf.message}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <p className="text-xs text-slate-400 dark:text-[#64748b]">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                        {nf.link && nf.link_label && (
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-400">
                            {nf.link_label} →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Wrapper>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}