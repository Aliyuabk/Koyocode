"use client";

import Link from "next/link";
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminMobileHeader({
  userName,
  userEmail,
  userAvatar,
}: {
  userName: string;
  userEmail: string;
  userAvatar: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* STICKY MOBILE HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-[#1f2a44] dark:bg-[#131c33]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:text-[#cbd5e1] dark:hover:bg-[#1b2742]"
          aria-label="Open menu"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-700 text-sm font-black text-white dark:bg-purple-600">
            K
          </span>
          <div className="text-left">
            <p className="text-xs font-black leading-tight text-slate-900 dark:text-[#f1f5f9]">
              KoyoCode
            </p>
            <p className="text-[9px] font-bold uppercase leading-tight tracking-wider text-purple-700 dark:text-purple-400">
              Admin
            </p>
          </div>
        </Link>

        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-600 to-purple-800 text-[10px] font-black text-white">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt={userName}
              className="h-full w-full object-cover"
            />
          ) : (
            userName
              .split(" ")
              .map((s) => s[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          )}
        </span>
      </header>

      {/* DRAWER (controlled by header) */}
      <AdminSidebar
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}