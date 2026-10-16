"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const nav = [
  { href: "/admin", label: "Overview", icon: "📊", exact: true },
  { href: "/admin/courses", label: "Courses", icon: "📚" },
  { href: "/admin/scholarships", label: "Scholarships", icon: "🎓" },
  { href: "/admin/lessons", label: "Lessons", icon: "🎬" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/progress", label: "Progress", icon: "📊" },
  { href: "/admin/enrollments", label: "Enrollments", icon: "✍️" },
  { href: "/admin/exams", label: "Exams", icon: "🎯" },
  { href: "/admin/certificates", label: "Certificates", icon: "🏆" },
  { href: "/admin/revenue", label: "Revenue", icon: "💰" },
  { href: "/admin/notifications", label: "Notifications", icon: "🔔" },
  { href: "/admin/activity", label: "Activity log", icon: "📜" },
];

export default function AdminSidebar({
  userName,
  userEmail,
  userAvatar,
  open = false,
  onClose,
}: {
  userName: string;
  userEmail: string;
  userAvatar: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  // Auto-close on route change (mobile drawer)
  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll while open on mobile
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [open, onClose]);

  const content = (
    <div className="flex h-full flex-col bg-white dark:bg-[#131c33]">
      {/* LOGO */}
      <div className="shrink-0 border-b border-slate-200 px-5 py-5 dark:border-[#1f2a44]">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-700 text-lg font-black text-white shadow-lg shadow-purple-700/25 dark:bg-purple-600">
              K
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900 dark:text-[#f1f5f9]">
                KoyoCode
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                Admin console
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:text-[#94a3b8] dark:hover:bg-[#1b2742] dark:hover:text-[#f1f5f9]"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                active
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:bg-[#1b2742] dark:hover:text-[#f1f5f9]"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="shrink-0 border-t border-slate-200 p-4 dark:border-[#1f2a44]">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-[#0e1526]">
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-600 to-purple-800 text-xs font-black text-white">
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
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900 dark:text-[#f1f5f9]">
              {userName}
            </p>
            <p className="truncate text-[10px] text-slate-500 dark:text-[#94a3b8]">
              {userEmail}
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="mt-3 block rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:text-[#cbd5e1] dark:hover:bg-[#1b2742]"
        >
          ← Back to site
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP — fixed sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 lg:block dark:border-[#1f2a44]">
        {content}
      </aside>

      {/* MOBILE — slide-in drawer with backdrop */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        <div
          className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-slate-200 shadow-2xl transition-transform duration-300 dark:border-[#1f2a44] ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {content}
        </div>
      </div>
    </>
  );
}