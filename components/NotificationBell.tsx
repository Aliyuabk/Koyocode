"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Notif = {
  id: string;
  read: boolean;
  created_at: string;
  notification: {
    id: string;
    title: string;
    message: string;
    link: string | null;
    link_label: string | null;
  };
};

export default function NotificationBell() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read).length;

  // Load user + notifications
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await supabase
        .from("user_notifications")
        .select(
          "id, read, created_at, notification:notifications(id, title, message, link, link_label)"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setItems((data ?? []) as any);
      setLoading(false);
    };

    load();

    // Realtime subscribe to new notifications
    const channel = supabase
      .channel("notif-bell")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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
    if (!user) return;
    setItems((arr) => arr.map((n) => ({ ...n, read: true })));
    await supabase
      .from("user_notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("read", false);
  }

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-[#94a3b8] dark:hover:bg-[#1b2742] dark:hover:text-[#f1f5f9]"
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-slide-down dark:border-[#1f2a44] dark:bg-[#131c33]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-[#1f2a44]">
            <p className="text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
              Notifications
            </p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 dark:text-purple-400"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-3 px-4 py-6 text-sm text-slate-500 dark:text-[#94a3b8]">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-3xl">📭</p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
                  No notifications
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-[#94a3b8]">
                  You&apos;re all caught up.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
                {items.map((n) => {
                  const nf = Array.isArray(n.notification)
                    ? n.notification[0]
                    : n.notification;
                  if (!nf) return null;

                  const Wrapper: any = nf.link ? Link : "div";
                  const wrapperProps = nf.link
                    ? {
                        href: nf.link,
                        onClick: () => {
                          markRead(n.id);
                          setOpen(false);
                        },
                      }
                    : {
                        onClick: () => markRead(n.id),
                      };

                  return (
                    <li key={n.id}>
                      <Wrapper
                        {...wrapperProps}
                        className={`block cursor-pointer px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-[#1b2742] ${
                          !n.read ? "bg-purple-50/40 dark:bg-purple-950/20" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {!n.read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-purple-600" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
                              {nf.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-[#94a3b8]">
                              {nf.message}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400 dark:text-[#64748b]">
                              {new Date(n.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Wrapper>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-bold text-purple-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:text-purple-400 dark:hover:bg-[#1b2742]"
          >
            View all →
          </Link>
        </div>
      )}
    </div>
  );
}